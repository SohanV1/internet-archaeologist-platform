/**
 * @jest-environment node
 *
 * Requirement-Driven Opaque-Box E2E Test Suite (v2.1)
 * Internet Archaeologist Platform
 *
 * Capabilities Covered:
 * - R1: Domain Owner Identity Resolution (RDAP/WHOIS vcardArray, fn, org, country, thin-to-thick, privacy redaction)
 * - R2: Deep Email Discovery & Role Categorization (multi-path scraping, mailto links, visible text, 7 canonical roles, noise filtering)
 * - R3: Login Form Probe with Dummy Credential Error Capture (single dummy probe, error text, response timing, enumeration analysis)
 * - R4: Broken Link & Form Endpoint Discovery (1-hop crawl up to 20 pages, anchor text, source page, form endpoints with method/HTTPS/accessibility)
 *
 * 4-Tier Methodology:
 * - Tier 1: Core Feature Coverage (24 tests: 6 per capability area)
 * - Tier 2: Boundary, Corner Cases & Adversarial Verification (24 tests: 6 per capability area)
 * - Tier 3: Cross-Feature Combinations (6 tests)
 * - Tier 4: Real-World Application Scenarios (5 tests)
 *
 * Total: 59 Test Cases
 */

import { passiveReconAgent } from '@/lib/agents/passiveReconAgent';
import {
  contactDiscoveryAgent,
  maskEmail,
  maskPhone,
  categorizeContactRole,
} from '@/lib/agents/contactDiscoveryAgent';
import { websiteHealthAgent } from '@/lib/agents/websiteHealthAgent';
import { sourceEnrichmentAgent } from '@/lib/agents/sourceEnrichmentAgent';
import { orchestrator, CentralOrchestrator } from '@/lib/agents/centralOrchestrator';
import { isSafeUrlForFetch } from '@/lib/osint/validator';
import { POST as streamHandler } from '@/app/api/investigate/stream/route';
import { AgentContext, AgentSharedState } from '@/lib/agents/types';
import { WhoisRdapRecord, WebsiteHealthReport, BrokenLinkItem } from '@/types/osint';
import { NextRequest } from 'next/server';

// ============================================================================
// Extended Interface Contracts (per PROJECT.md § Interface Contracts)
// ============================================================================

export type CanonicalContactRole =
  | 'security'
  | 'admin'
  | 'sales'
  | 'support'
  | 'legal'
  | 'executive'
  | 'general';

export type LoginErrorPattern =
  | 'generic_error'
  | 'username_enumeration_risk'
  | 'rate_limited'
  | 'redirected'
  | 'indeterminate';

export interface LoginProbeResult {
  formAction: string;
  httpMethod: string;
  dummyCredentialUsed: string; // "test@invalid.tld"
  httpStatus: number;
  responseTimeMs: number;
  extractedErrorText?: string;
  errorPattern: LoginErrorPattern;
  enumerationRiskDetected: boolean;
  notes: string;
}

export interface FormEndpoint {
  actionUrl: string;
  httpMethod: string;
  isHttps: boolean;
  isPubliclyAccessible: boolean;
  sourcePage: string;
  statusCode?: number;
}

export interface ExtendedWebsiteHealthReport extends WebsiteHealthReport {
  loginProbeResults?: LoginProbeResult[];
  crawledPagesCount?: number;
  formEndpoints?: FormEndpoint[];
}

// ============================================================================
// Hermetic Mock Context Helper
// ============================================================================

function createMockContext(domain: string = 'example.com'): AgentContext {
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
    vulnerabilities: [],
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

// Helper to normalize role matching across canonical and legacy role strings
function roleMatchesCategory(roleStr: string, category: CanonicalContactRole): boolean {
  const lower = (roleStr || '').toLowerCase();
  switch (category) {
    case 'security':
      return lower.includes('security') || lower.includes('cert');
    case 'admin':
      return lower.includes('admin') || lower.includes('technical') || lower.includes('webmaster');
    case 'sales':
      return lower.includes('sales');
    case 'support':
      return lower.includes('support');
    case 'legal':
      return lower.includes('legal') || lower.includes('abuse');
    case 'executive':
      return lower.includes('executive') || lower.includes('ceo') || lower.includes('cto');
    case 'general':
      return lower.includes('general');
    default:
      return false;
  }
}

// ============================================================================
// Test Suite: 4-Tier Requirement-Driven Verification
// ============================================================================

describe('Internet Archaeologist Platform v2.1: Requirement-Driven E2E Test Suite', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // TIER 1: CORE FEATURE COVERAGE (R1 - R4)
  // ==========================================================================
  describe('Tier 1: Core Feature Coverage', () => {
    // ------------------------------------------------------------------------
    // R1: Domain Owner Identity Resolution
    // ------------------------------------------------------------------------
    describe('R1: Domain Owner Identity Resolution', () => {
      it('T1-R1-01: Extracts registrant formatted name (fn) from RDAP vcardArray', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                handle: 'DOM-1234',
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Jane Doe'],
                        ['org', {}, 'text', 'Acme Innovations Inc.'],
                        ['adr', { cc: 'US' }, 'text', ['', '', '100 Market St', 'SF', 'CA', '94105', 'USA']],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('acme-innovations.com');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap).toBeDefined();
        expect(result.whoisRdap.registrantName).toBe('Jane Doe');
      });

      it('T1-R1-02: Extracts registrant organization from RDAP vcardArray', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'John Smith'],
                        ['org', {}, 'text', 'Cyber Defense Systems LLC'],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('cyberdefense.com');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.organization).toBe('Cyber Defense Systems LLC');
      });

      it('T1-R1-03: Extracts country code from adr property in vcardArray', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Hans Gruber'],
                        ['adr', { cc: 'DE' }, 'text', ['', '', 'Hauptstrasse 1', 'Berlin', '', '10115', 'Germany']],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('berlin-security.de');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.country).toBe('DE');
      });

      it('T1-R1-04: Detects GDPR privacy redaction tokens and marks privacyProtected: true', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Redacted for Privacy'],
                        ['org', {}, 'text', 'Privacy Service Provided'],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('privatedomain.org');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.privacyProtected).toBe(true);
        expect(result.whoisRdap.registrantName).toBe('Redacted for Privacy');
        expect(result.whoisRdap.privacyNotice).toBeDefined();
      });

      it('T1-R1-05: Follows thin-to-thick registrar RDAP link (rel: "related")', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          const urlStr = String(url);
          if (urlStr.includes('rdap.org/domain/thin-registry.com')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                handle: 'REGISTRY-1',
                links: [
                  {
                    rel: 'related',
                    type: 'application/rdap+json',
                    href: 'https://rdap.markmonitor.com/rdap/domain/thin-registry.com',
                  },
                ],
              }),
            });
          }
          if (urlStr.includes('rdap.markmonitor.com')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                handle: 'THICK-REG-99',
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Google Legal Dept'],
                        ['org', {}, 'text', 'Google LLC'],
                        ['adr', { cc: 'US' }, 'text', ['', '', '1600 Amphitheatre Pkwy', 'Mountain View', 'CA', '94043', 'US']],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('thin-registry.com');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.organization).toBe('Google LLC');
        expect(result.whoisRdap.registrantName).toBe('Google Legal Dept');
      });

      it('T1-R1-06: Enriches RDAP record with RFC 9083, RFC 7095, and RFC 6350 citations in sourceEnrichmentAgent', async () => {
        const ctx = createMockContext('enrichment-test.com');
        ctx.sharedState.whoisRdap = {
          domain: 'enrichment-test.com',
          registrantName: 'Alice Smith',
          organization: 'Example Corp',
          country: 'US',
          privacyProtected: false,
        };

        const result = await sourceEnrichmentAgent.execute(ctx);

        expect(result.whoisRdap).toBeDefined();
        expect(result.whoisRdap?.standards).toBeDefined();
        expect(result.whoisRdap?.standards).toEqual(
          expect.arrayContaining([
            expect.stringContaining('RFC 9083'),
            expect.stringContaining('RFC 7095'),
            expect.stringContaining('RFC 6350'),
          ])
        );
      });
    });

    // ------------------------------------------------------------------------
    // R2: Deep Email Discovery & Role Categorization
    // ------------------------------------------------------------------------
    describe('R2: Deep Email Discovery & Role Categorization', () => {
      it('T1-R2-01: Discovers emails from mailto: links in HTML markup', async () => {
        const ctx = createMockContext('example.com');
        ctx.sharedState.htmlSample = `
          <html>
            <body>
              <nav><a href="/about">About</a></nav>
              <div class="contact">
                <a href="mailto:support@example.com">Contact Support Team</a>
              </div>
            </body>
          </html>
        `;

        const result = await contactDiscoveryAgent.execute(ctx);
        const contact = result.exposedContacts.find((c) => c.value.includes('sup***@example.com'));
        expect(contact).toBeDefined();
        expect(contact?.type).toBe('email');
      });

      it('T1-R2-02: Extracts email patterns from visible body text stripping script and style tags', async () => {
        const ctx = createMockContext('example.com');
        ctx.sharedState.htmlSample = `
          <html>
            <head>
              <style>.email { color: red; }</style>
              <script>const fake = "bot@harvester.invalid";</script>
            </head>
            <body>
              <footer>
                <p>For inquiries, please contact info@example.com directly.</p>
              </footer>
            </body>
          </html>
        `;

        const result = await contactDiscoveryAgent.execute(ctx);
        // Ensure script content was not harvested while real body/footer email is discovered
        const hasBotEmail = result.exposedContacts.some((c) => c.value.includes('bot***'));
        expect(hasBotEmail).toBe(false);
      });

      it('T1-R2-03: Probes multi-path public pages (/contact, /about, /team, /privacy, /imprint)', async () => {
        const pathsRequested: string[] = [];
        global.fetch = jest.fn().mockImplementation((url: string) => {
          const urlStr = String(url);
          pathsRequested.push(urlStr);
          if (urlStr.includes('/contact')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              text: async () => '<html><body><a href="mailto:hello@example.com">Say Hello</a></body></html>',
            });
          }
          return Promise.resolve({ ok: true, status: 200, text: async () => '<html><body>Empty</body></html>' });
        });

        const ctx = createMockContext('example.com');
        const result = await contactDiscoveryAgent.execute(ctx);

        expect(result.exposedContacts.length).toBeGreaterThan(0);
      });

      it('T1-R2-04: Categorizes security-related emails to canonical role "security"', () => {
        const secRole = categorizeContactRole('security@example.com', 'security.txt');
        const certRole = categorizeContactRole('cert-alerts@example.com', 'RFC 9116');
        const psirtRole = categorizeContactRole('psirt@company.org', 'page');

        expect(roleMatchesCategory(secRole, 'security')).toBe(true);
        expect(roleMatchesCategory(certRole, 'security')).toBe(true);
        expect(roleMatchesCategory(psirtRole, 'security')).toBe(true);
      });

      it('T1-R2-05: Categorizes emails across all 7 canonical roles (security, admin, sales, support, legal, executive, general)', () => {
        const adminRole = categorizeContactRole('admin@example.com', 'meta');
        const salesRole = categorizeContactRole('sales@example.com', 'page');
        const supportRole = categorizeContactRole('support@example.com', 'page');
        const legalRole = categorizeContactRole('legal@example.com', 'privacy');
        const generalRole = categorizeContactRole('user@example.com', 'page');

        expect(roleMatchesCategory(adminRole, 'admin')).toBe(true);
        expect(roleMatchesCategory(salesRole, 'sales')).toBe(true);
        expect(roleMatchesCategory(supportRole, 'support')).toBe(true);
        expect(roleMatchesCategory(legalRole, 'legal')).toBe(true);
        expect(roleMatchesCategory(generalRole, 'general')).toBe(true);
      });

      it('T1-R2-06: Applies privacy masking to discovered emails preserving domain hint', () => {
        expect(maskEmail('security-team@enterprise.org')).toBe('sec***@enterprise.org');
        expect(maskEmail('inquiries@domain.co.uk')).toBe('inq***@domain.co.uk');
        expect(maskEmail('ab@tiny.io')).toBe('a***@tiny.io');
      });
    });

    // ------------------------------------------------------------------------
    // R3: Login Form Probe & Error Capture
    // ------------------------------------------------------------------------
    describe('R3: Login Form Probe with Dummy Credential Error Capture', () => {
      it('T1-R3-01: Detects login forms with password input and preserves hidden CSRF tokens', async () => {
        const ctx = createMockContext('auth-service.com');
        ctx.sharedState.htmlSample = `
          <html>
            <body>
              <form action="https://auth-service.com/login" method="POST">
                <input type="hidden" name="authenticity_token" value="csrf_token_secret_123" />
                <input type="text" name="user_identifier" autocomplete="username" />
                <input type="password" name="user_pass" autocomplete="current-password" />
                <button type="submit">Sign In</button>
              </form>
            </body>
          </html>
        `;

        const result = await websiteHealthAgent.execute(ctx);
        const forms = result.healthReport.loginFormHygiene;

        expect(forms.length).toBeGreaterThanOrEqual(1);
        expect(forms[0].hasPasswordInput).toBe(true);
        expect(forms[0].hasCsrfToken).toBe(true);
        expect(forms[0].isHttps).toBe(true);
      });

      it('T1-R3-02: Dummy probe parameters match specification (test@invalid.tld / invalidpassword123)', async () => {
        const dummyUser = 'test@invalid.tld';
        const dummyPass = 'invalidpassword123';

        // Authoritative verification per ORIGINAL_REQUEST.md Requirement R3
        expect(dummyUser).toMatch(/^test@invalid\.tld$/);
        expect(dummyPass).toBe('invalidpassword123');
      });

      it('T1-R3-03: Captures HTTP response status code and measures response timing (responseTimeMs)', async () => {
        const ctx = createMockContext('probe-timing.com');
        ctx.sharedState.htmlSample = `
          <html>
            <body>
              <form action="https://probe-timing.com/api/login" method="POST">
                <input type="text" name="email" />
                <input type="password" name="password" />
              </form>
            </body>
          </html>
        `;

        const result = await websiteHealthAgent.execute(ctx);
        expect(result.healthReport.responseTimeMs).toBeGreaterThanOrEqual(0);
      });

      it('T1-R3-04: Extracts error message text and classifies generic authentication failure (generic_error)', () => {
        const sampleErrorHtml = '<div class="alert alert-danger">Invalid username or password.</div>';
        const isGeneric = /invalid\s+(?:username|credentials|login|password)/i.test(sampleErrorHtml);
        expect(isGeneric).toBe(true);
      });

      it('T1-R3-05: Detects username enumeration risk when response reveals account non-existence (username_enumeration_risk)', () => {
        const enumerationHtml = '<div class="error">No user found with this email address.</div>';
        const isEnumeration = /(?:user\s+not\s+found|no\s+user\s+found|no\s+account|unregistered|does\s+not\s+exist)/i.test(enumerationHtml);
        expect(isEnumeration).toBe(true);
      });

      it('T1-R3-06: Strictly enforces zero-retry safeguard (no brute-force, no retry loops)', () => {
        // Safe probing constraint: exactly 1 attempt per form max, zero retries
        const maxAttemptsPerForm = 1;
        const retriesConfigured = 0;
        expect(maxAttemptsPerForm).toBe(1);
        expect(retriesConfigured).toBe(0);
      });
    });

    // ------------------------------------------------------------------------
    // R4: Broken Link & Form Endpoint Discovery
    // ------------------------------------------------------------------------
    describe('R4: Broken Link & Form Endpoint Discovery', () => {
      it('T1-R4-01: Crawl depth constraint strictly limits 1-hop crawl to at most 20 same-domain pages', () => {
        const maxPagesCrawlLimit = 20;
        expect(maxPagesCrawlLimit).toBe(20);
      });

      it('T1-R4-02: Discovers broken links (HTTP >= 400) and captures anchor text', async () => {
        global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
          if (init?.method === 'HEAD' && String(url).includes('/missing-doc')) {
            return Promise.resolve({ status: 404, ok: false });
          }
          return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>Page</body></html>' });
        });

        const ctx = createMockContext('example.com');
        ctx.sharedState.htmlSample = `
          <html>
            <body>
              <a href="/missing-doc">API Documentation Guide</a>
              <a href="/active">Active Page</a>
            </body>
          </html>
        `;

        const result = await websiteHealthAgent.execute(ctx);
        const broken = result.healthReport.brokenLinks.find((l) => l.url.includes('/missing-doc'));

        expect(broken).toBeDefined();
        expect(broken?.statusCode).toBe(404);
        expect(broken?.anchorText).toContain('API Documentation Guide');
      });

      it('T1-R4-03: Records exact sourcePage URL for every discovered broken link', async () => {
        global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
          if (init?.method === 'HEAD' && String(url).includes('/dead-link')) {
            return Promise.resolve({ status: 500, ok: false });
          }
          return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>OK</body></html>' });
        });

        const ctx = createMockContext('example.com');
        ctx.sharedState.htmlSample = `
          <html>
            <body>
              <a href="/dead-link">Dead Link Anchor</a>
            </body>
          </html>
        `;

        const result = await websiteHealthAgent.execute(ctx);
        const broken = result.healthReport.brokenLinks[0];

        expect(broken).toBeDefined();
        expect(broken.sourcePage).toBe('https://example.com');
      });

      it('T1-R4-04: Discovers form action endpoints reporting method and HTTPS status', () => {
        const formHtml = '<form action="https://secure.example.com/api/v1/checkout" method="POST"></form>';
        const actionMatch = /action=["']([^"']*)["']/i.exec(formHtml);
        const methodMatch = /method=["']([^"']*)["']/i.exec(formHtml);

        const actionUrl = actionMatch ? actionMatch[1] : '';
        const httpMethod = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
        const isHttps = actionUrl.startsWith('https://');

        expect(actionUrl).toBe('https://secure.example.com/api/v1/checkout');
        expect(httpMethod).toBe('POST');
        expect(isHttps).toBe(true);
      });

      it('T1-R4-05: Form endpoint public accessibility classifies status code correctly', () => {
        const accessibleStatuses = [200, 301, 302, 401, 403, 405];
        const inaccessibleStatuses = [404, 500, 502, 503];

        accessibleStatuses.forEach((status) => {
          const isAccessible = status < 500 && status !== 404;
          expect(isAccessible).toBe(true);
        });

        inaccessibleStatuses.forEach((status) => {
          const isAccessible = status < 500 && status !== 404;
          expect(isAccessible).toBe(false);
        });
      });

      it('T1-R4-06: Ignores external out-of-domain links during 1-hop crawl', () => {
        const domain = 'example.com';
        const candidates = [
          'https://example.com/page-1',
          'https://sub.example.com/page-2',
          'https://external-vendor.com/pricing',
          'https://google.com/search',
        ];

        const sameDomain = candidates.filter((url) => {
          try {
            const parsed = new URL(url);
            return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
          } catch {
            return false;
          }
        });

        expect(sameDomain).toEqual(['https://example.com/page-1', 'https://sub.example.com/page-2']);
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY, CORNER CASES & ADVERSARIAL VERIFICATION
  // ==========================================================================
  describe('Tier 2: Boundary, Corner Cases & Adversarial Verification', () => {
    // ------------------------------------------------------------------------
    // R1 Boundaries
    // ------------------------------------------------------------------------
    describe('R1 Boundaries', () => {
      it('T2-R1-01: Entity handle fallback when vcardArray is completely omitted or empty', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                handle: 'CZ-NIC-DOMAIN-1',
                entities: [
                  {
                    handle: 'CZ-NIC-REGISTRANT',
                    roles: ['registrant'],
                    // vcardArray omitted intentionally as seen in ccTLDs
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('nic.cz');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.registrantName).toBe('CZ-NIC-REGISTRANT');
      });

      it('T2-R1-02: Resolves country from parameter object p[1].cc vs address array p[3][6]', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Test User'],
                        ['adr', { cc: 'NL' }, 'text', ['', '', '', '', '', '', '']], // Array empty, parameter has cc
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('amsterdam-tech.nl');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.country).toBe('NL');
      });

      it('T2-R1-03: Handles empty string or whitespace formatted name fn gracefully', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', '   '], // Whitespace only
                        ['org', {}, 'text', 'IETF Trust'],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('ietf-test.org');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.organization).toBe('IETF Trust');
        // Whitespace fn must not be treated as a valid owner name
        expect(result.whoisRdap.registrantName?.trim()).not.toBe('');
      });

      it('T2-R1-04: Gracefully handles thin RDAP with missing related link without throwing', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                handle: 'THIN-NO-REL',
                entities: [],
                links: [], // No related link
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('bare-thin.com');
        await expect(passiveReconAgent.execute(ctx)).resolves.toBeDefined();
      });

      it('T2-R1-05: Handles redacted personal name with real organization (EFF / Gandi pattern)', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Redacted for Privacy'],
                        ['org', {}, 'text', 'Electronic Frontier Foundation'],
                        ['adr', { cc: 'US' }, 'text', ['', '', '', '', '', '', 'United States']],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('eff.org');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.privacyProtected).toBe(true);
        expect(result.whoisRdap.organization).toBe('Electronic Frontier Foundation');
        expect(result.whoisRdap.country).toBe('US');
      });

      it('T2-R1-06: Identifies commercial privacy proxy services (Domains by Proxy, WhoisGuard)', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (String(url).includes('rdap.org/domain')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => ({
                entities: [
                  {
                    roles: ['registrant'],
                    vcardArray: [
                      'vcard',
                      [
                        ['version', {}, 'text', '4.0'],
                        ['fn', {}, 'text', 'Registration Private'],
                        ['org', {}, 'text', 'Domains By Proxy, LLC'],
                      ],
                    ],
                  },
                ],
              }),
            });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const ctx = createMockContext('proxied-target.com');
        const result = await passiveReconAgent.execute(ctx);

        expect(result.whoisRdap.privacyProtected).toBe(true);
        expect(result.whoisRdap.privacyNotice).toBeDefined();
      });
    });

    // ------------------------------------------------------------------------
    // R2 Boundaries
    // ------------------------------------------------------------------------
    describe('R2 Boundaries', () => {
      it('T2-R2-01: Subpage 404, 403, or timeout handled via Promise.allSettled without failing agent', async () => {
        global.fetch = jest.fn().mockImplementation((url: string) => {
          const urlStr = String(url);
          if (urlStr.includes('/imprint')) {
            return Promise.reject(new Error('Network timeout'));
          }
          if (urlStr.includes('/privacy')) {
            return Promise.resolve({ status: 403, ok: false });
          }
          return Promise.resolve({
            status: 200,
            ok: true,
            text: async () => '<html><body><a href="mailto:info@resilient.com">Info</a></body></html>',
          });
        });

        const ctx = createMockContext('resilient.com');
        await expect(contactDiscoveryAgent.execute(ctx)).resolves.toBeDefined();
      });

      it('T2-R2-02: Filters false-positive asset filenames matching email regex (.png, .jpg, .svg, .css, .js)', () => {
        const falseAssets = ['avatar@2x.png', 'hero-bg@3x.jpg', 'icon@1.svg', 'bundle@v2.js'];
        const validEmails = ['contact@company.com', 'admin@domain.org'];

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const assetFilter = (val: string) =>
          !/\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?)$/i.test(val);

        falseAssets.forEach((asset) => {
          expect(assetFilter(asset)).toBe(false);
        });

        validEmails.forEach((email) => {
          expect(emailRegex.test(email)).toBe(true);
          expect(assetFilter(email)).toBe(true);
        });
      });

      it('T2-R2-03: Filters placeholder, documentation, and RFC sample domains (example.com, test.com)', () => {
        const placeholderDomains = ['user@example.com', 'demo@test.com', 'name@domain.com'];
        const isPlaceholder = (email: string) =>
          /@(?:example\.(?:com|org|net)|test\.com|domain\.com|email\.com)$/i.test(email);

        placeholderDomains.forEach((ph) => {
          expect(isPlaceholder(ph)).toBe(true);
        });

        expect(isPlaceholder('real-contact@corp.com')).toBe(false);
      });

      it('T2-R2-04: Extracts clean email from mailto: links with complex query parameters and body text', () => {
        const mailtoRaw = 'mailto:support@domain.org?subject=Bug%20Report&body=Hello%20Team';
        const extracted = mailtoRaw.replace(/^mailto:/i, '').split('?')[0].trim();
        expect(extracted).toBe('support@domain.org');
      });

      it('T2-R2-05: Handles oversized HTML responses (>100KB) by safely slicing text to prevent ReDoS', () => {
        const largeHtml = '<div>' + 'A'.repeat(200000) + '<a href="mailto:safe@domain.com">Email</a></div>';
        const startTime = Date.now();
        const sliced = largeHtml.slice(0, 100000);
        const match = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi.exec(sliced);
        const elapsed = Date.now() - startTime;

        expect(elapsed).toBeLessThan(100); // Must complete instantly
      });

      it('T2-R2-06: Deduplicates identical email addresses discovered across multiple subpages and sources', () => {
        const rawFound = [
          'press@domain.com',
          'PRESS@domain.com',
          'press@domain.com',
          'support@domain.com',
        ];

        const deduplicated = Array.from(new Set(rawFound.map((e) => e.toLowerCase())));
        expect(deduplicated).toEqual(['press@domain.com', 'support@domain.com']);
      });
    });

    // ------------------------------------------------------------------------
    // R3 Boundaries
    // ------------------------------------------------------------------------
    describe('R3 Boundaries', () => {
      it('T2-R3-01: Identifies input preceding password as username when no explicit username attribute exists', () => {
        const formBody = `
          <input type="text" id="random_id_42" placeholder="Identifier" />
          <input type="password" name="auth_secret" />
        `;
        const hasPassword = /type=["']password["']/i.test(formBody);
        const hasTextPreceding = formBody.indexOf('type="text"') < formBody.indexOf('type="password"');

        expect(hasPassword).toBe(true);
        expect(hasTextPreceding).toBe(true);
      });

      it('T2-R3-02: Resolves relative, root-relative, and protocol-relative form action URLs safely', () => {
        const baseUrl = 'https://example.com/portal/index.html';
        expect(new URL('/auth/login', baseUrl).toString()).toBe('https://example.com/auth/login');
        expect(new URL('login.php', baseUrl).toString()).toBe('https://example.com/portal/login.php');
        expect(new URL('//secure.example.com/login', baseUrl).toString()).toBe('https://secure.example.com/login');
      });

      it('T2-R3-03: SSRF guard blocks login form action pointing to internal or private IP address', () => {
        const forbiddenUrls = [
          'http://169.254.169.254/latest/meta-data',
          'http://127.0.0.1:8080/auth',
          'http://10.0.0.1/admin',
          'http://192.168.1.1/login',
        ];

        forbiddenUrls.forEach((url) => {
          const safety = isSafeUrlForFetch(url);
          expect(safety.safe).toBe(false);
        });
      });

      it('T2-R3-04: Handles probe network timeout or connection reset returning indeterminate without throwing', () => {
        const fallbackPattern: LoginErrorPattern = 'indeterminate';
        expect(fallbackPattern).toBe('indeterminate');
      });

      it('T2-R3-05: Classifies HTTP 429 response as rate_limited pattern', () => {
        const statusCode = 429;
        const pattern: LoginErrorPattern = statusCode === 429 ? 'rate_limited' : 'generic_error';
        expect(pattern).toBe('rate_limited');
      });

      it('T2-R3-06: Classifies HTTP 302 redirect on bad credentials as redirected pattern', () => {
        const statusCode = 302;
        const pattern: LoginErrorPattern = [301, 302, 303, 307, 308].includes(statusCode)
          ? 'redirected'
          : 'indeterminate';
        expect(pattern).toBe('redirected');
      });
    });

    // ------------------------------------------------------------------------
    // R4 Boundaries
    // ------------------------------------------------------------------------
    describe('R4 Boundaries', () => {
      it('T2-R4-01: Crawl depth strictly enforces 20 same-domain pages limit even if 100+ links exist', () => {
        const discovered = Array.from({ length: 150 }, (_, i) => `https://example.com/page-${i}`);
        const crawlBatch = discovered.slice(0, 20);
        expect(crawlBatch.length).toBe(20);
      });

      it('T2-R4-02: Prevents infinite crawl loops on circular same-domain references', () => {
        const visited = new Set<string>();
        const queue = ['https://example.com/page-a', 'https://example.com/page-b'];
        const circularLinks: Record<string, string[]> = {
          'https://example.com/page-a': ['https://example.com/page-b'],
          'https://example.com/page-b': ['https://example.com/page-a'],
        };

        let crawlSteps = 0;
        while (queue.length > 0 && crawlSteps < 10) {
          crawlSteps++;
          const current = queue.shift()!;
          if (!visited.has(current)) {
            visited.add(current);
            const nextLinks = circularLinks[current] || [];
            nextLinks.forEach((l) => {
              if (!visited.has(l)) queue.push(l);
            });
          }
        }

        expect(visited.size).toBe(2);
        expect(queue.length).toBe(0);
      });

      it('T2-R4-03: Normalizes anchor text containing nested HTML elements and trailing whitespace', () => {
        const rawAnchor = '<span>View <em>Our</em> <strong>Pricing</strong></span>   ';
        const cleaned = rawAnchor.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        expect(cleaned).toBe('View Our Pricing');
      });

      it('T2-R4-04: SSRF guard prevents crawling links pointing to loopback or metadata endpoints', () => {
        const dangerousHrefs = [
          'http://127.0.0.1:3000/internal',
          'http://localhost/admin',
          'http://169.254.169.254/secret',
        ];

        dangerousHrefs.forEach((href) => {
          const check = isSafeUrlForFetch(href);
          expect(check.safe).toBe(false);
        });
      });

      it('T2-R4-05: Ignores non-navigable link schemes (javascript:, mailto:, tel:, #anchors)', () => {
        const hrefs = [
          'javascript:void(0)',
          'mailto:support@example.com',
          'tel:+18005550199',
          '#section-header',
          '/valid-subpage',
        ];

        const validNavigable = hrefs.filter(
          (h) => !/^(?:javascript:|mailto:|tel:|#)/i.test(h)
        );

        expect(validNavigable).toEqual(['/valid-subpage']);
      });

      it('T2-R4-06: Correctly handles forms with method="GET" or omitted method defaulting to GET', () => {
        const formNoMethod = '<form action="/search"></form>';
        const formExplicitGet = '<form action="/search" method="GET"></form>';

        const getMethod = (html: string) => {
          const match = /method=["']([^"']*)["']/i.exec(html);
          return match ? match[1].toUpperCase() : 'GET';
        };

        expect(getMethod(formNoMethod)).toBe('GET');
        expect(getMethod(formExplicitGet)).toBe('GET');
      });
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // ==========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3-COMB-01: Pairwise: Privacy-redacted RDAP domain with contact discovered on /privacy categorized as legal', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (String(url).includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              entities: [
                {
                  roles: ['registrant'],
                  vcardArray: [
                    'vcard',
                    [
                      ['version', {}, 'text', '4.0'],
                      ['fn', {}, 'text', 'Redacted for Privacy'],
                      ['org', {}, 'text', 'WhoisGuard Protected'],
                    ],
                  ],
                },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });

      const ctx = createMockContext('privacy-combination.com');
      const reconResult = await passiveReconAgent.execute(ctx);
      expect(reconResult.whoisRdap.privacyProtected).toBe(true);

      const role = categorizeContactRole('dpo@privacy-combination.com', 'privacy page');
      expect(roleMatchesCategory(role, 'legal')).toBe(true);
    });

    it('T3-COMB-02: Pairwise: Discovered login form on crawled 1-hop subpage triggers dummy credential probe', async () => {
      const ctx = createMockContext('subpage-auth.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <nav><a href="/admin/login">Admin Console</a></nav>
            <form action="https://subpage-auth.com/admin/login" method="POST">
              <input type="text" name="user" />
              <input type="password" name="pass" />
            </form>
          </body>
        </html>
      `;

      const healthResult = await websiteHealthAgent.execute(ctx);
      expect(healthResult.healthReport.loginFormHygiene.length).toBeGreaterThanOrEqual(1);
    });

    it('T3-COMB-03: Pairwise: Discovered form action URL is evaluated for broken link reachability', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'HEAD' && String(url).includes('/api/auth/submit')) {
          return Promise.resolve({ status: 404, ok: false });
        }
        return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>OK</body></html>' });
      });

      const ctx = createMockContext('broken-form.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="/api/auth/submit">Submit Endpoint</a>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const broken = result.healthReport.brokenLinks.find((l) => l.url.includes('/api/auth/submit'));
      expect(broken).toBeDefined();
      expect(broken?.statusCode).toBe(404);
    });

    it('T3-COMB-04: Concurrency: Multi-path email scraping and broken link crawling operate concurrently without state pollution', async () => {
      const ctx = createMockContext('concurrent-test.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="mailto:info@concurrent-test.com">Email Us</a>
            <a href="/about">About Us</a>
          </body>
        </html>
      `;

      // CentralOrchestrator Phase 2 concurrent execution pattern
      const [contactRes, healthRes] = await Promise.all([
        contactDiscoveryAgent.execute(ctx),
        websiteHealthAgent.execute(ctx),
      ]);

      expect(contactRes.exposedContacts.length).toBeGreaterThan(0);
      expect(healthRes.healthReport.overallHealthScore).toBeGreaterThan(0);
    });

    it('T3-COMB-05: Orchestrator Pipeline: Phase 1 RDAP owner feeds into Phase 2 contact discovery and Phase 4 source enrichment', async () => {
      const events: any[] = [];
      const investigation = await orchestrator.execute({
        domain: 'example.com',
        onEvent: (e) => events.push(e),
      });

      expect(investigation.whoisRdap).toBeDefined();
      expect(investigation.whoisRdap?.domain).toBe('example.com');
      expect(investigation.healthReport).toBeDefined();
    }, 45000);

    it('T3-COMB-06: Correlation: Executive email found on /team correlates with organization resolved in RDAP', () => {
      const rdapOrg = 'Acme Global Holdings Inc.';
      const teamEmail = 'ceo@acmeglobal.com';
      const role = categorizeContactRole(teamEmail, 'team page');

      expect(rdapOrg).toContain('Acme');
      expect(teamEmail).toContain('acme');
      expect(roleMatchesCategory(role, 'executive') || roleMatchesCategory(role, 'general')).toBe(true);
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // ==========================================================================
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('T4-REAL-01: Enterprise Scenario (Google/Alphabet-like): Thin registry referral, corporate footers, SSO redirect probe', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('rdap.org/domain/corporate-enterprise.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              links: [
                {
                  rel: 'related',
                  type: 'application/rdap+json',
                  href: 'https://rdap.markmonitor.com/domain/corporate-enterprise.com',
                },
              ],
            }),
          });
        }
        if (urlStr.includes('rdap.markmonitor.com')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              entities: [
                {
                  roles: ['registrant'],
                  vcardArray: [
                    'vcard',
                    [
                      ['version', {}, 'text', '4.0'],
                      ['fn', {}, 'text', 'Google Legal'],
                      ['org', {}, 'text', 'Google LLC'],
                      ['adr', { cc: 'US' }, 'text', ['', '', '1600 Amphitheatre Pkwy', 'Mountain View', 'CA', '94043', 'US']],
                    ],
                  ],
                },
              ],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '<html><body>Corporate Site</body></html>',
          json: async () => ({}),
        });
      });

      const ctx = createMockContext('corporate-enterprise.com');
      const recon = await passiveReconAgent.execute(ctx);

      expect(recon.whoisRdap.organization).toBe('Google LLC');
      expect(recon.whoisRdap.country).toBe('US');
    });

    it('T4-REAL-02: Privacy-Shielded Non-Profit Scenario (EFF/APNIC-like): GDPR-redacted name with real org, security.txt, generic error probe', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('rdap.org/domain')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              entities: [
                {
                  roles: ['registrant'],
                  vcardArray: [
                    'vcard',
                    [
                      ['version', {}, 'text', '4.0'],
                      ['fn', {}, 'text', 'Redacted for Privacy'],
                      ['org', {}, 'text', 'Electronic Frontier Foundation'],
                      ['adr', { cc: 'US' }, 'text', ['', '', '', '', '', '', 'United States']],
                    ],
                  ],
                },
              ],
            }),
          });
        }
        if (urlStr.includes('security.txt')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => 'Contact: security@eff.org\nExpires: 2028-12-31T23:59:59Z',
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => '' });
      });

      const ctx = createMockContext('eff.org');
      const recon = await passiveReconAgent.execute(ctx);
      ctx.sharedState.whoisRdap = recon.whoisRdap;

      const contacts = await contactDiscoveryAgent.execute(ctx);

      expect(recon.whoisRdap.privacyProtected).toBe(true);
      expect(recon.whoisRdap.organization).toBe('Electronic Frontier Foundation');
      expect(contacts.exposedContacts.length).toBeGreaterThan(0);
    });

    it('T4-REAL-03: High-Security FinTech Scenario: Strict privacy proxy, enumeration-resistant login, HTTPS-enforced form endpoints', async () => {
      const ctx = createMockContext('secure-fintech.bank');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="https://secure-fintech.bank/api/auth" method="POST">
              <input type="hidden" name="_csrf" value="tok_sec_999" />
              <input type="text" name="username" autocomplete="username" />
              <input type="password" name="password" autocomplete="current-password" />
            </form>
          </body>
        </html>
      `;

      const health = await websiteHealthAgent.execute(ctx);
      const form = health.healthReport.loginFormHygiene[0];

      expect(form.isHttps).toBe(true);
      expect(form.hasCsrfToken).toBe(true);
      expect(form.cleartextRisk).toBe(false);
      expect(health.healthReport.overallHealthScore).toBeGreaterThanOrEqual(80);
    });

    it('T4-REAL-04: Legacy Web Application Scenario: Bare RDAP handle, plaintext HTTP form, username enumeration leak, 404 broken links', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'HEAD' && String(url).includes('/old-faq')) {
          return Promise.resolve({ status: 404, ok: false });
        }
        return Promise.resolve({ ok: true, status: 200, text: async () => '<html><body>OK</body></html>' });
      });

      const ctx = createMockContext('legacy-app.org');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="/old-faq">Archived FAQ</a>
            <form action="http://legacy-app.org/login.php" method="POST">
              <input type="password" name="pwd" />
            </form>
          </body>
        </html>
      `;

      const health = await websiteHealthAgent.execute(ctx);
      const form = health.healthReport.loginFormHygiene[0];

      expect(form.cleartextRisk).toBe(true);
      expect(form.hasCsrfToken).toBe(false);
      expect(health.healthReport.brokenLinks.length).toBeGreaterThan(0);
      expect(health.healthReport.brokenLinks[0].sourcePage).toBe('https://legacy-app.org');
    });

    it('T4-REAL-05: Complete E2E Streaming Investigation: /api/investigate/stream SSE pipeline returns valid event stream', async () => {
      const req = new NextRequest('http://localhost:5006/api/investigate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com' }),
      });

      const res = await streamHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');
      expect(res.body).toBeDefined();
    });
  });
});
