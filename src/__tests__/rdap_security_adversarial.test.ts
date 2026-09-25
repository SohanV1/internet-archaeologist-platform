/**
 * @jest-environment node
 *
 * Security & Adversarial Challenge Suite for Milestone M1 (Domain Owner Identity Resolution)
 * Internet Archaeologist Platform v2.1 — Challenger 2 Verification
 *
 * Targeted empirical objectives:
 * 1. SSRF resilience in RDAP related links (127.0.0.1, 169.254.169.254, private ranges, cloud metadata, protocols)
 * 2. Truncated, corrupted, and malformed JSON responses across primary and registrar RDAP endpoints
 * 3. ReDoS resistance and oversized vcardArray / entity tree processing limits
 */

import {
  passiveReconAgent,
  parseRdapPayload,
  isPrivacyToken,
  PRIVACY_TOKENS_REGEX,
  collectAllEntities,
} from '@/lib/agents/passiveReconAgent';
import { sourceEnrichmentAgent } from '@/lib/agents/sourceEnrichmentAgent';
import { isSafeUrlForFetch } from '@/lib/osint/validator';
import { AgentContext, AgentSharedState, WhoisRdapRecord } from '@/lib/agents/types';
import { performance } from 'perf_hooks';

function createMockContext(domain: string): AgentContext {
  const sharedState: AgentSharedState = {
    domain,
    targetUrl: `https://${domain}`,
    dnsRecords: [],
    ipAddresses: [],
    subdomains: [],
    certificates: [],
    asnInfo: [],
    snapshots: [],
    technologies: [],
    evidence: [],
  };

  return {
    domain,
    targetUrl: `https://${domain}`,
    sharedState,
    emitTelemetry: jest.fn(),
    emitFinding: jest.fn(),
    emitAudit: jest.fn(),
  };
}

describe('Challenger 2 Empirical Verification: Milestone M1 Security Resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // OBJECTIVE 1: SSRF Resilience in Related Links
  // =========================================================================
  describe('Objective 1: Outbound SSRF Guard & Related Link Traversal Resilience', () => {
    const SSRF_PAYLOADS = [
      // Loopback addresses
      { name: 'IPv4 Loopback 127.0.0.1', url: 'http://127.0.0.1/rdap' },
      { name: 'IPv4 Loopback with custom port', url: 'http://127.0.0.1:8080/admin' },
      { name: 'Short loopback 127.1', url: 'http://127.1/rdap' },
      { name: 'Secondary loopback 127.0.0.2', url: 'http://127.0.0.2/' },

      // Cloud Metadata Endpoints
      { name: 'AWS/OpenStack IMDSv1 169.254.169.254', url: 'http://169.254.169.254/latest/meta-data/' },
      { name: 'GCP Metadata hostname', url: 'http://metadata.google.internal/computeMetadata/v1/' },
      { name: 'AWS EC2 instance-data', url: 'http://instance-data/latest/meta-data/' },

      // Private RFC 1918 CIDR blocks
      { name: 'Class A Private 10.0.0.1', url: 'http://10.0.0.1/rdap/domain' },
      { name: 'Class B Private 172.16.0.1', url: 'http://172.16.0.1/status' },
      { name: 'Class B Private 172.31.255.255', url: 'http://172.31.255.255/api' },
      { name: 'Class C Private 192.168.1.1', url: 'http://192.168.1.1/secret' },
      { name: 'Carrier-Grade NAT 100.64.0.1', url: 'http://100.64.0.1/admin' },

      // Localhost aliases & non-routable TLDs
      { name: 'Localhost alias', url: 'http://localhost:3000/rdap' },
      { name: 'Subdomain localhost', url: 'http://service.localhost/rdap' },
      { name: 'mDNS .local TLD', url: 'http://device.local/rdap' },
      { name: 'Internal .internal TLD', url: 'http://auth.internal/rdap' },
      { name: 'Home .lan TLD', url: 'http://router.lan/status' },
      { name: 'Corporate .corp TLD', url: 'http://ldap.corp/rdap' },

      // IPv6 representations
      { name: 'IPv6 Loopback [::1]', url: 'http://[::1]/secret' },

      // Alternative IP encodings
      { name: 'Decimal IP notation (127.0.0.1)', url: 'http://2130706433/' },
      { name: 'Octal dotted notation (127.0.0.1)', url: 'http://0177.0.0.1/' },
      { name: 'Hex dotted notation (127.0.0.1)', url: 'http://0x7f.0.0.1/' },

      // Dangerous non-HTTP protocols
      { name: 'Local file scheme', url: 'file:///etc/passwd' },
      { name: 'Gopher exploitation scheme', url: 'gopher://127.0.0.1:6379/_' },
      { name: 'FTP scheme', url: 'ftp://127.0.0.1/data' },
      { name: 'JavaScript URI', url: 'javascript:alert(1)' },

      // Malformed / Non-URL structures
      { name: 'Protocol-relative scheme', url: '//127.0.0.1/evil' },
      { name: 'Relative path without host', url: '/api/v1/internal' },
      { name: 'Control characters in URL', url: 'http://127.0.0.1%00/' },
      { name: 'Empty string', url: '' },
    ];

    it.each(SSRF_PAYLOADS)('isSafeUrlForFetch strictly blocks: $name ($url)', ({ url }) => {
      const result = isSafeUrlForFetch(url);
      expect(result.safe).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('passiveReconAgent NEVER issues fetch to malicious related links', async () => {
      const domain = 'malicious-related-links.org';
      const ctx = createMockContext(domain);

      const maliciousLinks = SSRF_PAYLOADS.map((p) => ({
        rel: 'related',
        href: p.url,
        type: 'application/rdap+json',
      }));

      const primaryRdapWithMaliciousLinks = {
        objectClassName: 'domain',
        ldhName: domain,
        links: maliciousLinks,
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Safe Registrar Ltd',
          },
        ],
      };

      const fetchedUrls: string[] = [];
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        fetchedUrls.push(urlStr);

        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => primaryRdapWithMaliciousLinks,
          });
        }
        if (urlStr.includes('cloudflare-dns.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ Status: 0, Answer: [] }),
          });
        }
        if (urlStr.includes('crt.sh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [],
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({}),
        });
      });

      const result = await passiveReconAgent.execute(ctx);

      // Verify passiveReconAgent completed cleanly
      expect(result.whoisRdap).toBeDefined();
      expect(result.whoisRdap.registrar).toBe('Safe Registrar Ltd');

      // Verify none of the SSRF payloads were ever passed to fetch()
      for (const p of SSRF_PAYLOADS) {
        if (p.url) {
          const called = fetchedUrls.some((calledUrl) => calledUrl === p.url || calledUrl.includes(p.url));
          expect(called).toBe(false);
        }
      }
    });

    it('ignores non-string, missing, or non-RDAP related links', async () => {
      const domain = 'non-rdap-links.com';
      const ctx = createMockContext(domain);

      const rdapWithBogusLinks = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          null,
          undefined,
          12345,
          'not-an-object',
          { rel: 'related' }, // missing href and type
          { rel: 'related', href: null, type: 'application/rdap+json' },
          { rel: 'related', href: 9999, type: 'application/rdap+json' },
          { rel: 'related', href: 'https://example.com/doc.pdf', type: 'application/pdf' },
          { rel: 'alternate', href: 'https://example.com/rdap', type: 'application/rdap+json' },
          { rel: 'about', href: 'https://example.com/about.html', type: 'text/html' },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Normal Registrar Inc.',
          },
        ],
      };

      const fetchedUrls: string[] = [];
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        fetchedUrls.push(urlStr);
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => rdapWithBogusLinks,
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({}),
        });
      });

      const res = await passiveReconAgent.execute(ctx);
      expect(res.whoisRdap.registrar).toBe('Normal Registrar Inc.');
      // Should not have fetched any related links since none had valid RDAP media type & string href
      expect(fetchedUrls.some((u) => u.includes('example.com'))).toBe(false);
    });
  });

  // =========================================================================
  // OBJECTIVE 2: Truncated or Malformed JSON Responses
  // =========================================================================
  describe('Objective 2: Truncated or Malformed JSON Resilience', () => {
    it('gracefully handles truncated JSON from primary RDAP endpoint', async () => {
      const domain = 'truncated-primary.org';
      const ctx = createMockContext(domain);

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            // Truncated JSON stream
            json: async () => {
              throw new SyntaxError('Unexpected end of JSON input');
            },
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({}),
        });
      });

      const result = await passiveReconAgent.execute(ctx);

      // Must not crash, should fall back to baseline
      expect(result.whoisRdap).toBeDefined();
      expect(result.whoisRdap.domain).toBe(domain);
      expect(result.whoisRdap.registrar).toBe('Public Interest Registry');
      expect(result.whoisRdap.privacyProtected).toBe(true);
      expect(result.whoisRdap.registrantName).toBe('Redacted for Privacy');
    });

    it('gracefully handles HTTP 500 HTML error page from primary RDAP endpoint', async () => {
      const domain = 'error-500.com';
      const ctx = createMockContext(domain);

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => '<html><body>500 Internal Server Error</body></html>',
            json: async () => {
              throw new SyntaxError('Unexpected token < in JSON at position 0');
            },
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({}),
        });
      });

      const result = await passiveReconAgent.execute(ctx);
      expect(result.whoisRdap).toBeDefined();
      expect(result.whoisRdap.domain).toBe(domain);
      expect(result.whoisRdap.registrar).toContain('MarkMonitor');
    });

    it('gracefully handles truncated JSON from thick registrar RDAP endpoint', async () => {
      const domain = 'truncated-registrar.com';
      const ctx = createMockContext(domain);

      const primaryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: 'https://rdap.safe-registrar.com/domain/truncated-registrar.com',
            type: 'application/rdap+json',
          },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Verisign Thin Registry',
          },
        ],
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => primaryRdap,
          });
        }
        if (urlStr.includes('safe-registrar.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('Unexpected end of JSON input at byte 1024');
            },
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({}),
        });
      });

      const result = await passiveReconAgent.execute(ctx);

      // Preserves primary registry registrar name, doesn't crash on broken registrar JSON
      expect(result.whoisRdap).toBeDefined();
      expect(result.whoisRdap.registrar).toBe('Verisign Thin Registry');
    });

    it('parseRdapPayload tolerates primitive, null, or corrupted roots', () => {
      const record: WhoisRdapRecord = { domain: 'corrupted-root.com', privacyProtected: false };

      expect(() => parseRdapPayload(null, record)).not.toThrow();
      expect(() => parseRdapPayload(undefined, record)).not.toThrow();
      expect(() => parseRdapPayload('just-a-string', record)).not.toThrow();
      expect(() => parseRdapPayload(12345, record)).not.toThrow();
      expect(() => parseRdapPayload(true, record)).not.toThrow();
      expect(() => parseRdapPayload([], record)).not.toThrow();
      expect(() => parseRdapPayload({}, record)).not.toThrow();
    });

    it('parseRdapPayload tolerates wildly malformed vcardArray variations without throwing', () => {
      const record: WhoisRdapRecord = { domain: 'malformed-vcard.com', privacyProtected: false };

      const malformedPayloads = [
        // vcardArray is primitive
        { entities: [{ roles: ['registrant'], vcardArray: 'invalid-string' }] },
        { entities: [{ roles: ['registrant'], vcardArray: 12345 }] },
        { entities: [{ roles: ['registrant'], vcardArray: null }] },
        { entities: [{ roles: ['registrant'], vcardArray: {} }] },

        // vcardArray has no properties container
        { entities: [{ roles: ['registrant'], vcardArray: [] }] },
        { entities: [{ roles: ['registrant'], vcardArray: ['vcard'] }] },
        { entities: [{ roles: ['registrant'], vcardArray: ['vcard', null] }] },
        { entities: [{ roles: ['registrant'], vcardArray: ['vcard', 'not-an-array'] }] },
        { entities: [{ roles: ['registrant'], vcardArray: ['vcard', 42] }] },

        // vcardArray contains corrupted property rows
        {
          entities: [
            {
              roles: ['registrant'],
              vcardArray: ['vcard', [null, undefined, 'string', 123, [], {}, ['fn'], ['fn', null]]],
            },
          ],
        },

        // fn prop with strange data types
        {
          entities: [
            {
              roles: ['registrant'],
              vcardArray: [
                'vcard',
                [
                  ['fn', {}, 'text', null],
                  ['fn', {}, 'text', undefined],
                  ['fn', {}, 'text', 12345],
                  ['fn', {}, 'text', {}],
                  ['fn', {}, 'text', [null, undefined, 42, {}]],
                ],
              ],
            },
          ],
        },

        // org prop with strange data types
        {
          entities: [
            {
              roles: ['registrant'],
              vcardArray: [
                'vcard',
                [
                  ['org', {}, 'text', null],
                  ['org', {}, 'text', undefined],
                  ['org', {}, 'text', 999],
                  ['org', {}, 'text', {}],
                  ['org', {}, 'text', [null, undefined, true, {}]],
                ],
              ],
            },
          ],
        },

        // adr prop with strange data types
        {
          entities: [
            {
              roles: ['registrant'],
              vcardArray: [
                'vcard',
                [
                  ['adr', null, 'text', null],
                  ['adr', { cc: null }, 'text', undefined],
                  ['adr', { cc: 12345 }, 'text', 999],
                  ['adr', {}, 'text', 'not-an-array'],
                  ['adr', {}, 'text', []],
                  ['adr', {}, 'text', [null, null, null, null, null, null, null]],
                  ['adr', {}, 'text', ['', '', '', '', '', '', 12345]],
                ],
              ],
            },
          ],
        },

        // remarks and notices with strange data types
        {
          entities: [
            {
              roles: ['registrant'],
              remarks: [null, undefined, 'not-object', { title: null, description: null }, { description: 123 }],
            },
          ],
          remarks: [null, undefined, 'invalid', { title: 456, description: [] }],
          notices: [null, undefined, { description: null }],
        },

        // events with corrupted objects
        {
          events: [null, undefined, 'registration', 123, { eventAction: null, eventDate: null }],
        },
      ];

      for (const payload of malformedPayloads) {
        expect(() => parseRdapPayload(payload, record)).not.toThrow();
      }
    });

    it('collectAllEntities safely handles malformed entities collections', () => {
      expect(collectAllEntities(null as any)).toEqual([]);
      expect(collectAllEntities(undefined as any)).toEqual([]);
      expect(collectAllEntities('string' as any)).toEqual([]);
      expect(collectAllEntities(123 as any)).toEqual([]);
      expect(collectAllEntities({} as any)).toEqual([]);
      expect(collectAllEntities([null, undefined, 42, 'str', { handle: 'REG-1' }, { roles: ['registrant'] }])).toHaveLength(2);
    });
  });

  // =========================================================================
  // OBJECTIVE 3: ReDoS & Oversized Structures Stress Harness
  // =========================================================================
  describe('Objective 3: ReDoS & Oversized Structures Stress Harness', () => {
    it('isPrivacyToken & PRIVACY_TOKENS_REGEX resist ReDoS on 1,000,000 char strings', () => {
      // 1. Million non-matching characters
      const millionChars = 'x'.repeat(1_000_000);
      const start1 = performance.now();
      const match1 = isPrivacyToken(millionChars);
      const duration1 = performance.now() - start1;

      expect(match1).toBe(false);
      expect(duration1).toBeLessThan(50); // Linear DFA match: < 50ms

      // 2. Repetitive near-match prefixes that could trigger exponential backtracking in poor regexes
      const repetitiveNearMatch = 'privacy-private-withheld-proxy-'.repeat(25_000);
      const start2 = performance.now();
      const match2 = isPrivacyToken(repetitiveNearMatch);
      const duration2 = performance.now() - start2;

      expect(match2).toBe(true);
      expect(duration2).toBeLessThan(50);

      // 3. Worst-case alternating non-match ending in mismatch
      const alternatingPrefixes = ('redacted '.repeat(5000) + 'nonmatching').repeat(10);
      const start3 = performance.now();
      const match3 = isPrivacyToken(alternatingPrefixes);
      const duration3 = performance.now() - start3;

      expect(match3).toBe(true);
      expect(duration3).toBeLessThan(50);
    });

    it('processes massive vcardArray (10,000 properties) efficiently without memory exhaustion', () => {
      const record: WhoisRdapRecord = { domain: 'massive-vcard.com', privacyProtected: false };

      const giantVcardProps: any[] = [];
      // Generate 10,000 dummy vcard properties
      for (let i = 0; i < 10_000; i++) {
        giantVcardProps.push([`custom-field-${i}`, {}, 'text', `dummy-value-${i}`]);
      }
      // Insert authentic target registrant properties at the end
      giantVcardProps.push(['fn', {}, 'text', 'Cyberdyne Systems Admin']);
      giantVcardProps.push(['org', {}, 'text', 'Cyberdyne Systems Corporation']);
      giantVcardProps.push(['adr', { cc: 'US' }, 'text', ['', '', 'Sunnyvale', 'CA', '', '', 'US']]);

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: ['vcard', giantVcardProps],
          },
        ],
      };

      const start = performance.now();
      parseRdapPayload(payload, record);
      const elapsed = performance.now() - start;

      expect(record.registrantName).toBe('Cyberdyne Systems Admin');
      expect(record.organization).toBe('Cyberdyne Systems Corporation');
      expect(record.country).toBe('US');
      expect(elapsed).toBeLessThan(200); // Must parse 10,000 properties in < 200ms
    });

    it('processes deeply nested entity hierarchies (150 levels) without stack overflow', () => {
      const record: WhoisRdapRecord = { domain: 'deep-stack.com', privacyProtected: false };

      // Build a 150-level deep entity tree
      const rootEntities: any[] = [];
      let currentLevel: any = {
        roles: ['intermediary-0'],
        entities: [],
      };
      rootEntities.push(currentLevel);

      for (let i = 1; i <= 150; i++) {
        const nextLevel = {
          roles: i === 150 ? ['registrant'] : [`intermediary-${i}`],
          entities: [],
          ...(i === 150
            ? {
                vcardArray: [
                  'vcard',
                  [
                    ['fn', {}, 'text', 'Deep Leaf Operator'],
                    ['org', {}, 'text', 'Subterranean Deep Net LLC'],
                    ['adr', { cc: 'NL' }, 'text', ['', '', '', 'Amsterdam', '', '', 'NL']],
                  ],
                ],
              }
            : {}),
        };
        currentLevel.entities.push(nextLevel);
        currentLevel = nextLevel;
      }

      const payload = { entities: rootEntities };

      const start = performance.now();
      expect(() => parseRdapPayload(payload, record)).not.toThrow();
      const elapsed = performance.now() - start;

      expect(record.registrantName).toBe('Deep Leaf Operator');
      expect(record.organization).toBe('Subterranean Deep Net LLC');
      expect(record.country).toBe('NL');
      expect(elapsed).toBeLessThan(100);
    });

    it('processes wide entity hierarchy (5,000 entities) in linear time', () => {
      const record: WhoisRdapRecord = { domain: 'wide-entities.com', privacyProtected: false };

      const wideEntities: any[] = [];
      for (let i = 0; i < 5000; i++) {
        wideEntities.push({
          roles: ['technical'],
          handle: `TECH-${i}`,
          vcardArray: ['vcard', [['fn', {}, 'text', `Tech Person ${i}`]]],
        });
      }
      // Add registrant entity at the very end
      wideEntities.push({
        roles: ['registrant'],
        vcardArray: [
          'vcard',
          [
            ['fn', {}, 'text', 'Scale Master'],
            ['org', {}, 'text', 'Scale Infrastructure Inc.'],
            ['adr', { cc: 'DE' }, 'text', ['', '', '', 'Berlin', '', '', 'DE']],
          ],
        ],
      });

      const payload = { entities: wideEntities };

      const start = performance.now();
      parseRdapPayload(payload, record);
      const elapsed = performance.now() - start;

      expect(record.registrantName).toBe('Scale Master');
      expect(record.organization).toBe('Scale Infrastructure Inc.');
      expect(record.country).toBe('DE');
      expect(elapsed).toBeLessThan(200);
    });

    it('sourceEnrichmentAgent processes extreme inputs without degradation', async () => {
      const domain = 'extreme-enrichment.com';
      const ctx = createMockContext(domain);

      ctx.sharedState.whoisRdap = {
        domain,
        privacyProtected: true,
        registrantName: 'Redacted for Privacy',
        organization: 'A'.repeat(5000), // Huge org string
        country: 'us', // lowercase
        privacyNotice: 'B'.repeat(5000), // Huge notice string
      };

      const start = performance.now();
      const res = await sourceEnrichmentAgent.execute(ctx);
      const elapsed = performance.now() - start;

      expect(res.whoisRdap).toBeDefined();
      expect(res.whoisRdap?.country).toBe('United States');
      expect(res.whoisRdap?.standards).toHaveLength(3);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
