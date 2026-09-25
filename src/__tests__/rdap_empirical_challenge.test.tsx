/**
 * @jest-environment jsdom
 *
 * Empirical Challenge Suite for Milestone M1 (Domain Owner Identity Resolution)
 * Internet Archaeologist Platform v2.1
 *
 * Stress-testing:
 * 1. Nested vcardArray and recursive entity structures
 * 2. Empty fn with non-empty org
 * 3. Handle fallback when vcardArray is missing or malformed
 * 4. Thin-to-thick traversal redirect loops, missing related links, malformed responses
 * 5. Privacy proxy variants (WhoisGuard, Domains by Proxy, Contact Privacy Inc., etc.)
 * 6. UI Component rendering in DomainIntelligenceView for identity and privacy states
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  passiveReconAgent,
  parseRdapPayload,
  isPrivacyToken,
  collectAllEntities,
} from '@/lib/agents/passiveReconAgent';
import { sourceEnrichmentAgent } from '@/lib/agents/sourceEnrichmentAgent';
import { AgentContext, AgentSharedState, WhoisRdapRecord } from '@/lib/agents/types';
import { DomainIntelligenceView } from '@/components/DomainIntelligenceView';
import { Investigation } from '@/types/osint';

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

function createMockInvestigation(whoisRdap?: WhoisRdapRecord): Investigation {
  return {
    id: 'inv-test-m1',
    domain: 'test-challenge.com',
    targetUrl: 'https://test-challenge.com',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: 'completed',
    summary: {
      headline: 'Executive Summary',
      narrative: 'Summary of domain intelligence findings',
      firstRecordedDate: '2020-01-01',
      totalYearsActive: 5,
      primaryFrameworkEvolution: 'Next.js',
      subdomainsCount: 2,
      majorRedesignsCount: 1,
      securityRating: 'High',
    },
    milestones: [],
    subdomains: [],
    ipAddresses: ['1.2.3.4'],
    dnsRecords: [],
    technologies: [],
    snapshots: [],
    changes: [],
    relationships: { nodes: [], edges: [] },
    evidence: [],
    whoisRdap,
  };
}

describe('Empirical Challenge: Milestone M1 (Domain Owner Identity Resolution)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Area 1: Nested vcardArray & Deep Entity Hierarchies', () => {
    it('successfully extracts registrant from deeply nested entities (3+ levels deep)', () => {
      const record: WhoisRdapRecord = {
        domain: 'deep-nesting.com',
        privacyProtected: false,
      };

      // Top-level registrar contains reseller, which contains registrant entity
      const deepRdapPayload = {
        objectClassName: 'domain',
        entities: [
          {
            roles: ['registrar'],
            handle: 'REG-1',
            entities: [
              {
                roles: ['reseller'],
                handle: 'RESELL-1',
                entities: [
                  {
                    roles: ['technical'],
                    handle: 'TECH-1',
                  },
                  {
                    roles: ['registrant'],
                    handle: 'CUST-8832',
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Dr. Evelyn Reed'],
                        ['org', {}, 'text', 'Quantum Horizon Labs'],
                        ['adr', { cc: 'GB' }, 'text', ['', '', '10 Innovation Way', 'Cambridge', '', 'CB2 1TN', 'UK']],
                      ],
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      parseRdapPayload(deepRdapPayload, record);

      expect(record.registrantName).toBe('Dr. Evelyn Reed');
      expect(record.organization).toBe('Quantum Horizon Labs');
      expect(record.country).toBe('GB');
      expect(record.privacyProtected).toBe(false);
    });

    it('handles malformed, irregular or non-array vcardArray properties without crashing', () => {
      const record: WhoisRdapRecord = {
        domain: 'corrupted-vcard.com',
        privacyProtected: false,
      };

      const corruptedPayload = {
        entities: [
          {
            roles: ['registrant'],
            // vcardArray with corrupted sub-items (nulls, primitives, unexpected shapes)
            vcardArray: [
              'vcard',
              [
                null,
                undefined,
                'invalid-item',
                123,
                [],
                ['fn'], // missing index 3
                ['fn', null, 'text', null],
                ['org', {}, 'text', undefined],
                ['adr', 'corrupted-params', 'text', 'not-an-array'],
              ],
            ],
          },
        ],
      };

      expect(() => parseRdapPayload(corruptedPayload, record)).not.toThrow();
      expect(record.registrantName).toBeUndefined();
      expect(record.organization).toBeUndefined();
      expect(record.country).toBeUndefined();
    });

    it('extracts multi-part string array for org and fn in vcardArray', () => {
      const record: WhoisRdapRecord = {
        domain: 'multipart-vcard.org',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['owner'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', ['Sir', 'Arthur', 'Conan', 'Doyle']],
                ['org', {}, 'text', ['Baker Street Trust', 'Literary Estate', 'UK Branch']],
                ['adr', {}, 'text', ['', '', '221B Baker St', 'London', '', '', 'GB']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.registrantName).toBe('Sir Arthur Conan Doyle');
      expect(record.organization).toBe('Baker Street Trust - Literary Estate - UK Branch');
      expect(record.country).toBe('GB');
    });

    it('extracts country code from adr array component when param cc is omitted', () => {
      const record: WhoisRdapRecord = {
        domain: 'adr-fallback.de',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Hans Gruber'],
                ['adr', {}, 'text', ['', '', 'Nakatomi Plaza', 'Los Angeles', 'CA', '90067', 'DE']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);
      expect(record.country).toBe('DE');
    });
  });

  describe('Area 2: Empty fn with Non-Empty org', () => {
    it('correctly handles empty or whitespace fn while capturing authentic organization', () => {
      const record: WhoisRdapRecord = {
        domain: 'org-only.org',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', '   '], // whitespace only
                ['org', {}, 'text', 'Mozilla Foundation'],
                ['adr', { cc: 'US' }, 'text', ['', '', 'Mountain View', 'CA', '', '', 'US']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.organization).toBe('Mozilla Foundation');
      expect(record.country).toBe('US');
      expect(record.registrantName).toBeUndefined();
    });

    it('falls back registrantName to organization in passiveReconAgent execution when fn is missing or empty', async () => {
      const domain = 'mozilla-foundation.org';
      const ctx = createMockContext(domain);

      const rdapResponse = {
        objectClassName: 'domain',
        ldhName: domain,
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
                ['fn', {}, 'text', ''], // empty string fn
                ['org', {}, 'text', 'Mozilla Foundation'],
                ['adr', { cc: 'US' }, 'text', ['', '', '', '', '', '', 'US']],
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
            json: async () => rdapResponse,
          });
        }
        if (urlStr.includes('cloudflare-dns.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ Status: 0, Answer: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => [],
        });
      });

      const res = await passiveReconAgent.execute(ctx);

      expect(res.whoisRdap.organization).toBe('Mozilla Foundation');
      expect(res.whoisRdap.registrantName).toBe('Mozilla Foundation');
      expect(res.whoisRdap.privacyProtected).toBe(false);
    });
  });

  describe('Area 3: Handle Fallback When vcardArray is Missing', () => {
    it('uses entity.handle when vcardArray is completely absent', () => {
      const record: WhoisRdapRecord = {
        domain: 'handle-only.jp',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            handle: 'JPNIC-HNDL-77441',
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.registrantName).toBe('JPNIC-HNDL-77441');
      expect(record.privacyProtected).toBe(false);
    });

    it('classifies various generic redaction handles as privacy protected', () => {
      const testCases = [
        { handle: 'REDACTED', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: 'Withheld', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: 'Private', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: 'privacy', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: 'none', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: 'Not Applicable', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: 'N/A', expectedProtected: true, expectedName: 'Redacted for Privacy' },
        { handle: '-', expectedProtected: true, expectedName: 'Redacted for Privacy' },
      ];

      for (const tc of testCases) {
        const record: WhoisRdapRecord = {
          domain: 'redaction-test.de',
          privacyProtected: false,
        };

        const payload = {
          entities: [
            {
              roles: ['registrant'],
              handle: tc.handle,
            },
          ],
        };

        parseRdapPayload(payload, record);

        expect(record.privacyProtected).toBe(tc.expectedProtected);
        expect(record.registrantName).toBe(tc.expectedName);
        expect(record.privacyNotice).toBeDefined();
      }
    });

    it('gracefully handles missing vcardArray AND missing handle', () => {
      const record: WhoisRdapRecord = {
        domain: 'empty-entity.com',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            // no vcardArray, no handle
          },
        ],
      };

      expect(() => parseRdapPayload(payload, record)).not.toThrow();
      expect(record.registrantName).toBeUndefined();
    });
  });

  describe('Area 4: Thin-to-Thick Traversal, Redirect Loops & Missing Related Links', () => {
    it('handles RDAP response with missing or empty links array without error', async () => {
      const domain = 'no-links.com';
      const ctx = createMockContext(domain);

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Standalone Registry Inc.',
          },
          {
            roles: ['registrant'],
            handle: 'DIRECT-REG-1',
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
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => [],
        });
      });

      const res = await passiveReconAgent.execute(ctx);
      expect(res.whoisRdap.registrar).toBe('Standalone Registry Inc.');
      expect(res.whoisRdap.registrantName).toBe('DIRECT-REG-1');
    });

    it('handles related link pointing to non-RDAP or non-JSON content type by ignoring it', async () => {
      const domain = 'html-link.com';
      const ctx = createMockContext(domain);

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: 'https://whois.example.com/web-lookup',
            type: 'text/html', // Not rdap+json
          },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Legacy Registrar',
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
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => [],
        });
      });

      global.fetch = fetchSpy;

      await passiveReconAgent.execute(ctx);

      const calledWebLookup = fetchSpy.mock.calls.some(([calledUrl]: [string]) =>
        String(calledUrl).includes('web-lookup')
      );
      expect(calledWebLookup).toBe(false);
    });

    it('prevents traversal loops: related link pointing back to registry or looping is bounded to exactly 1 hop', async () => {
      const domain = 'loop-test.com';
      const ctx = createMockContext(domain);

      const registryUrl = `https://rdap.org/domain/${domain}`;
      const registrarUrl = `https://rdap.registrar.com/domain/${domain}`;

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: registrarUrl,
            type: 'application/rdap+json',
          },
        ],
        entities: [{ roles: ['registrar'], legalName: 'Loop Registrar' }],
      };

      const registrarRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: registryUrl, // Loop back!
            type: 'application/rdap+json',
          },
        ],
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Loop Resolver'],
              ],
            ],
          },
        ],
      };

      const fetchCalls: string[] = [];
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url || '');
        fetchCalls.push(urlStr);
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => registryRdap,
          });
        }
        if (urlStr.includes('rdap.registrar.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => registrarRdap,
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => [],
        });
      });

      const res = await passiveReconAgent.execute(ctx);

      expect(res.whoisRdap.registrantName).toBe('Loop Resolver');
      const registrarCallCount = fetchCalls.filter((u) => u.includes('rdap.registrar.com')).length;
      const registryCallCount = fetchCalls.filter((u) => u.includes('rdap.org/domain')).length;
      expect(registrarCallCount).toBe(1);
      expect(registryCallCount).toBe(1);
    });

    it('gracefully handles registrar 500 error or network timeout without crashing', async () => {
      const domain = 'failing-registrar.com';
      const ctx = createMockContext(domain);

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: 'https://broken-registrar.example/rdap/domain/test',
            type: 'application/rdap+json',
          },
        ],
        entities: [
          {
            roles: ['registrar'],
            legalName: 'Thin Registry Ltd.',
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
        if (urlStr.includes('broken-registrar.example')) {
          return Promise.resolve({
            ok: false,
            status: 502,
            statusText: 'Bad Gateway',
            text: async () => '502 Bad Gateway',
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => [],
        });
      });

      const res = await passiveReconAgent.execute(ctx);

      expect(res.whoisRdap).toBeDefined();
      expect(res.whoisRdap.registrar).toBe('Thin Registry Ltd.');
    });

    it('blocks dangerous URL schemes in rel: "related" link (SSRF guard)', async () => {
      const domain = 'malicious-scheme.com';
      const ctx = createMockContext(domain);

      const registryRdap = {
        objectClassName: 'domain',
        ldhName: domain,
        links: [
          {
            rel: 'related',
            href: 'file:///etc/passwd',
            type: 'application/rdap+json',
          },
        ],
        entities: [{ roles: ['registrar'], legalName: 'Malicious Registrar' }],
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
        return Promise.resolve({ ok: true, status: 200, text: async () => '', json: async () => [] });
      });

      global.fetch = fetchSpy;

      await passiveReconAgent.execute(ctx);

      const calledFileScheme = fetchSpy.mock.calls.some(([calledUrl]: [string]) =>
        String(calledUrl).startsWith('file:')
      );
      expect(calledFileScheme).toBe(false);
    });
  });

  describe('Area 5: Privacy Proxy Variants', () => {
    it('detects Contact Privacy Inc. (Google Domains / Squarespace proxy)', () => {
      const record: WhoisRdapRecord = {
        domain: 'google-domains-proxy.com',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Contact Privacy Inc. Customer 71511221'],
                ['org', {}, 'text', 'Contact Privacy Inc. Customer 71511221'],
                ['adr', { cc: 'CA' }, 'text', ['', '', '96 Mowat Ave', 'Toronto', 'ON', 'M6K 3M1', 'Canada']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.privacyNotice).toBeDefined();
      expect(record.privacyNotice).toMatch(/contact privacy|privacy/i);
      expect(record.organization).toBe('Contact Privacy Inc. Customer 71511221');
      expect(record.country).toBe('CA');
    });

    it('detects Privacy Protect, LLC (Hostinger / LogicBoxes proxy)', () => {
      const record: WhoisRdapRecord = {
        domain: 'hostinger-proxy.com',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Privacy Protect, LLC (PrivacyProtect.org)'],
                ['org', {}, 'text', 'Privacy Protect, LLC'],
                ['adr', {}, 'text', ['', '', '10 Corporate Dr', 'Burlington', 'MA', '', 'US']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.privacyNotice).toMatch(/privacy protect|privacy/i);
    });

    it('detects Withheld for Privacy Purposes (Namecheap privacy provider)', () => {
      const record: WhoisRdapRecord = {
        domain: 'namecheap-withheld.com',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            vcardArray: [
              'vcard',
              [
                ['version', {}, 'text', '4.0'],
                ['fn', {}, 'text', 'Withheld for Privacy Purposes'],
                ['org', {}, 'text', 'Privacy service provided by Withheld for Privacy ehf'],
                ['adr', { cc: 'IS' }, 'text', ['', '', 'Kalkofnsvegur 2', 'Reykjavik', '', '101', 'Iceland']],
              ],
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.registrantName).toBe('Withheld for Privacy Purposes');
      expect(record.country).toBe('IS');
      expect(record.privacyNotice).toMatch(/withheld|privacy/i);
    });

    it('detects PrivacyHero / Anonymize / Data Protected variations in remarks', () => {
      const record: WhoisRdapRecord = {
        domain: 'remarks-privacy.com',
        privacyProtected: false,
      };

      const payload = {
        entities: [
          {
            roles: ['registrant'],
            handle: 'DATA-REDACTED',
            remarks: [
              {
                title: 'Data Protected',
                description: ['Registrant details are withheld pursuant to ICANN Temp Spec.'],
              },
            ],
          },
        ],
      };

      parseRdapPayload(payload, record);

      expect(record.privacyProtected).toBe(true);
      expect(record.privacyNotice).toMatch(/data protected|withheld/i);
    });
  });

  describe('Area 6: UI Component Rendering in DomainIntelligenceView', () => {
    it('renders authentic registrant identity and Standard Registration badge when public', () => {
      const investigation = createMockInvestigation({
        domain: 'public-org.org',
        registrantName: 'Dr. Gregory House',
        organization: 'Princeton-Plainsboro Teaching Hospital',
        country: 'United States',
        registrar: 'MarkMonitor Inc.',
        createdDate: '2010-06-15T00:00:00Z',
        registryExpiry: '2030-06-15T00:00:00Z',
        privacyProtected: false,
      });

      render(<DomainIntelligenceView investigation={investigation} />);

      expect(screen.getByText('Standard Registration')).toBeInTheDocument();
      expect(screen.getByText('Dr. Gregory House')).toBeInTheDocument();
      expect(screen.getByText('Princeton-Plainsboro Teaching Hospital')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('MarkMonitor Inc.')).toBeInTheDocument();
    });

    it('renders Privacy Shield Active badge and amber Privacy Notice banner when privacy proxy is detected', () => {
      const investigation = createMockInvestigation({
        domain: 'private-domain.com',
        registrantName: 'Redacted for Privacy',
        organization: 'Domains By Proxy, LLC',
        country: 'US',
        registrar: 'GoDaddy.com, LLC',
        privacyProtected: true,
        privacyNotice: 'Redacted for Privacy by GoDaddy Domains By Proxy',
      });

      render(<DomainIntelligenceView investigation={investigation} />);

      expect(screen.getByText('Privacy Shield Active')).toBeInTheDocument();
      expect(screen.getByText('Redacted for Privacy')).toBeInTheDocument();
      expect(screen.getByText('Domains By Proxy, LLC')).toBeInTheDocument();
      expect(screen.getByText('Redacted for Privacy by GoDaddy Domains By Proxy')).toBeInTheDocument();
    });

    it('handles undefined whoisRdap gracefully without rendering errors', () => {
      const investigation = createMockInvestigation(undefined);

      expect(() => render(<DomainIntelligenceView investigation={investigation} />)).not.toThrow();
      expect(screen.getByText('Standard Registration')).toBeInTheDocument();
      expect(screen.getByText('Not Disclosed')).toBeInTheDocument();
      expect(screen.getByText('Private Registrant')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });
});
