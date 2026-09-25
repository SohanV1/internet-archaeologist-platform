/**
 * @jest-environment node
 *
 * Domain Owner Identity Resolution (Milestone M1 / Requirement R1) Test Suite
 * Internet Archaeologist Platform v2.1
 */

import { passiveReconAgent, parseRdapPayload, isPrivacyToken } from '@/lib/agents/passiveReconAgent';
import { sourceEnrichmentAgent } from '@/lib/agents/sourceEnrichmentAgent';
import { AgentContext, AgentSharedState, WhoisRdapRecord } from '@/lib/agents/types';

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

describe('M1: Domain Owner Identity Resolution (RDAP & vCard 4.0)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Standard Registrant Identity Extraction', () => {
    it('extracts registrant name, organization, and country from vcardArray', async () => {
      const domain = 'corporate-example.com';
      const ctx = createMockContext(domain);

      const mockRdapResponse = {
        objectClassName: 'domain',
        handle: 'DOM-12345',
        ldhName: domain,
        events: [
          { eventAction: 'registration', eventDate: '2020-05-10T10:00:00Z' },
          { eventAction: 'expiration', eventDate: '2030-05-10T10:00:00Z' },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'MarkMonitor Inc.',
          },
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Jane Doe'],
                ['org', {}, 'text', 'Acme Corporation'],
                ['adr', { cc: 'US' }, 'text', ['', '', '100 Main St', 'Anytown', 'CA', '90210', 'United States']],
              ],
            ],
          },
          {
            roles: ['abuse'],
            vcardArray: [
              'vcard',
              [
                ['email', {}, 'text', 'abuse@markmonitor.com'],
                ['tel', {}, 'uri', 'tel:+1.2083895740'],
              ],
            ],
          },
        ],
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockRdapResponse,
          });
        }
        if (urlStr.includes('cloudflare-dns.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              Status: 0,
              Answer: [{ name: domain, type: 1, TTL: 300, data: '93.184.216.34' }],
            }),
          });
        }
        if (urlStr.includes('crt.sh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 111,
                logged_at: '2024-01-01',
                not_before: '2024-01-01T00:00:00',
                not_after: '2025-01-01T00:00:00',
                name_value: domain,
                issuer_name: 'C=US, O=DigiCert Inc',
              },
            ],
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '<html></html>',
          json: async () => ({}),
        });
      });

      const reconResult = await passiveReconAgent.execute(ctx);

      expect(reconResult.whoisRdap).toBeDefined();
      expect(reconResult.whoisRdap.domain).toBe(domain);
      expect(reconResult.whoisRdap.registrantName).toBe('Jane Doe');
      expect(reconResult.whoisRdap.organization).toBe('Acme Corporation');
      expect(reconResult.whoisRdap.country).toBe('US');
      expect(reconResult.whoisRdap.registrar).toBe('MarkMonitor Inc.');
      expect(reconResult.whoisRdap.privacyProtected).toBe(false);
      expect(reconResult.whoisRdap.privacyNotice).toBeUndefined();

      // Now run sourceEnrichmentAgent to test normative RFC standards and ISO country mapping
      ctx.sharedState.whoisRdap = reconResult.whoisRdap;
      const enrichmentResult = await sourceEnrichmentAgent.execute(ctx);

      expect(enrichmentResult.whoisRdap).toBeDefined();
      expect(enrichmentResult.whoisRdap?.country).toBe('United States');
      expect(enrichmentResult.whoisRdap?.standards).toBeDefined();
      expect(enrichmentResult.whoisRdap?.standards?.some((s) => s.includes('RFC 9083'))).toBe(true);
      expect(enrichmentResult.whoisRdap?.standards?.some((s) => s.includes('RFC 7095'))).toBe(true);
      expect(enrichmentResult.whoisRdap?.standards?.some((s) => s.includes('RFC 6350'))).toBe(true);

      const rdapEvidence = enrichmentResult.evidence.find((e) => e.id.includes('ev-rdap-enrichment'));
      expect(rdapEvidence).toBeDefined();
      expect(rdapEvidence?.source).toContain('RFC Standards');
      expect(rdapEvidence?.notes).toContain('United States');
    });
  });

  describe('Privacy Proxy & Redacted Registrant Detection', () => {
    it('detects Domains by Proxy service and populates privacyNotice', async () => {
      const record: WhoisRdapRecord = {
        domain: 'godaddy-client.com',
        privacyProtected: false,
      };

      const rdapPayload = {
        entities: [
          {
            roles: ['registrar'],
            legalName: 'GoDaddy.com, LLC',
          },
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Registration Private'],
                ['org', {}, 'text', 'Domains By Proxy, LLC'],
                ['adr', { cc: 'US' }, 'text', ['', '', '2155 E Warner Rd', 'Tempe', 'AZ', '85284', 'United States']],
              ],
            ],
            remarks: [
              {
                title: 'REDACTED FOR PRIVACY',
                description: ['Personal data withheld in compliance with privacy regulations.'],
              },
            ],
          },
        ],
      };

      parseRdapPayload(rdapPayload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.organization).toBe('Domains By Proxy, LLC');
      expect(record.country).toBe('US');
      expect(record.privacyNotice).toBeDefined();
      expect(record.privacyNotice).toMatch(/privacy|domains by proxy|redacted/i);
    });

    it('detects WhoisGuard / Namecheap privacy proxy service', async () => {
      const record: WhoisRdapRecord = {
        domain: 'namecheap-client.com',
        privacyProtected: false,
      };

      const rdapPayload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'WhoisGuard Protected'],
                ['org', {}, 'text', 'WhoisGuard, Inc.'],
                ['adr', {}, 'text', ['', '', 'P.O. Box 0823-03411', 'Panama', '', '', 'PA']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(rdapPayload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.organization).toBe('WhoisGuard, Inc.');
      expect(record.country).toBe('PA');
      expect(record.privacyNotice).toMatch(/whoisguard|privacy/i);
    });

    it('handles GDPR redacted personal name while preserving authentic organization (e.g., EFF / Gandi)', async () => {
      const record: WhoisRdapRecord = {
        domain: 'eff.org',
        privacyProtected: false,
      };

      const rdapPayload = {
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Gandi SAS',
          },
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Redacted for Privacy'],
                ['org', {}, 'text', 'Electronic Frontier Foundation'],
                ['adr', { cc: 'US' }, 'text', ['', '', '815 Eddy Street', 'San Francisco', 'CA', '94109', 'US']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(rdapPayload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.registrantName).toBe('Redacted for Privacy');
      expect(record.organization).toBe('Electronic Frontier Foundation');
      expect(record.country).toBe('US');
      expect(record.privacyNotice).toBeDefined();
    });
  });

  describe('Thin Registry Traversal & Entity Handle Fallbacks', () => {
    it('traverses rel: "related" link from thin registry (Verisign/PIR) to fetch thick registrar RDAP', async () => {
      const domain = 'thin-registry-test.com';
      const ctx = createMockContext(domain);

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: `https://rdap.markmonitor.com/rdap/domain/${domain}`,
            type: 'application/rdap+json',
          },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'MarkMonitor Inc.',
          },
        ],
      };

      const registrarRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Alice Wonder'],
                ['org', {}, 'text', ['Wonderland Industries', 'Digital Division']],
                ['adr', {}, 'text', ['', '', '', 'Amsterdam', '', '', 'NL']],
              ],
            ],
          },
        ],
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => registryRdap,
          });
        }
        if (urlStr.includes('rdap.markmonitor.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => registrarRdap,
          });
        }
        if (urlStr.includes('cloudflare-dns.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              Status: 0,
              Answer: [{ name: domain, type: 1, TTL: 300, data: '1.2.3.4' }],
            }),
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
          text: async () => '<html></html>',
          json: async () => ({}),
        });
      });

      const res = await passiveReconAgent.execute(ctx);

      expect(res.whoisRdap).toBeDefined();
      expect(res.whoisRdap.registrantName).toBe('Alice Wonder');
      expect(res.whoisRdap.organization).toBe('Wonderland Industries - Digital Division');
      expect(res.whoisRdap.country).toBe('NL');
      expect(res.whoisRdap.privacyProtected).toBe(false);

      // Verify sourceEnrichmentAgent maps NL to Netherlands
      ctx.sharedState.whoisRdap = res.whoisRdap;
      const enriched = await sourceEnrichmentAgent.execute(ctx);
      expect(enriched.whoisRdap?.country).toBe('Netherlands');
    });

    it('falls back to entity.handle when vcardArray is omitted', async () => {
      const record: WhoisRdapRecord = {
        domain: 'cc-tld-example.cz',
        privacyProtected: false,
      };

      const rdapPayload = {
        entities: [
          {
            roles: ['registrant'],
            handle: 'CZ-NIC-ORG-9988',
          },
        ],
      };

      parseRdapPayload(rdapPayload, record);

      expect(record.registrantName).toBe('CZ-NIC-ORG-9988');
      expect(record.privacyProtected).toBe(false);
    });

    it('classifies generic redaction handles as privacy protected', async () => {
      const record: WhoisRdapRecord = {
        domain: 'redacted-handle.de',
        privacyProtected: false,
      };

      const rdapPayload = {
        entities: [
          {
            roles: ['registrant'],
            handle: 'REDACTED',
          },
        ],
      };

      parseRdapPayload(rdapPayload, record);

      expect(record.registrantName).toBe('Redacted for Privacy');
      expect(record.privacyProtected).toBe(true);
      expect(record.privacyNotice).toBeDefined();
    });

    it('blocks SSRF attempt when rel: "related" link targets internal or private IP', async () => {
      const domain = 'ssrf-attempt.com';
      const ctx = createMockContext(domain);

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: 'http://169.254.169.254/latest/meta-data/',
            type: 'application/rdap+json',
          },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Evil Registrar',
          },
        ],
      };

      const fetchSpy = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => registryRdap,
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
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({}),
        });
      });

      global.fetch = fetchSpy;

      await passiveReconAgent.execute(ctx);

      // Verify fetch was never called with the metadata IP
      const calledWithMetadata = fetchSpy.mock.calls.some(([calledUrl]: [string]) =>
        String(calledUrl).includes('169.254.169.254')
      );
      expect(calledWithMetadata).toBe(false);
    });
  });

  describe('isPrivacyToken Utility', () => {
    it('correctly matches privacy keywords and case variations', () => {
      expect(isPrivacyToken('REDACTED FOR PRIVACY')).toBe(true);
      expect(isPrivacyToken('Domains By Proxy, LLC')).toBe(true);
      expect(isPrivacyToken('WhoisGuard Protected')).toBe(true);
      expect(isPrivacyToken('Contact Privacy Inc.')).toBe(true);
      expect(isPrivacyToken('Withheld for Privacy Purpose')).toBe(true);
      expect(isPrivacyToken('GDPR Masked')).toBe(true);
      expect(isPrivacyToken('Jane Doe')).toBe(false);
      expect(isPrivacyToken('Acme Corporation')).toBe(false);
      expect(isPrivacyToken('')).toBe(false);
      expect(isPrivacyToken(undefined)).toBe(false);
    });
  });
});
