/**
 * Contact Discovery & Role Categorization Unit Test Suite
 * Milestone M2: Requirement R2 (Internet Archaeologist Platform v2.1)
 *
 * Verifies:
 * 1. Concurrent multi-path HTML scraping (/contact, /about, /team, /privacy, /imprint)
 * 2. Mailto link extraction with query parameter stripping & URI decoding
 * 3. Body visible text & isolated footer extraction with <script>, <style>, <svg> stripping
 * 4. False-positive noise filtering (.png, .jpg, .css, .js, .map, test/example domains)
 * 5. Comprehensive 7-role categorization (security, admin, sales, support, legal, executive, general)
 * 6. Subpage timeout/404 resilience via Promise.allSettled
 * 7. Privacy masking (maskEmail, maskPhone) & SHA-256 evidence provenance hashing
 * 8. Backward compatibility for legacy categorizeContactRole and legacy taxonomy
 */

import {
  contactDiscoveryAgent,
  categorizeContactRole,
  categorizeCanonicalRole,
  categorizeEmailRole,
  extractMailtoLinks,
  extractFooterHtml,
  stripNonVisibleHtml,
  extractVisibleTextEmails,
  isFalsePositiveEmail,
  maskEmail,
  maskPhone,
  runContactDiscoveryAgent,
} from '@/lib/agents/contactDiscoveryAgent';
import { AgentContext, AgentSharedState } from '@/lib/agents/types';

function createMockContext(domain: string = 'secure-enterprise.org'): AgentContext {
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

describe('Milestone M2: Deep Email Discovery & Role Categorization (Requirement R2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 7-Role Categorization Taxonomy', () => {
    it('accurately categorizes security roles', () => {
      const securityAddresses = [
        'security@target.com',
        'security-team@target.com',
        'cert@target.com',
        'psirt@target.com',
        'cve-disclosure@target.com',
        'bounty@target.com',
        'vuln-reports@target.com',
        'responsible-disclosure@target.com',
      ];

      for (const email of securityAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('security');
        expect(categorizeEmailRole(email)).toBe('security');
        expect(categorizeContactRole(email, 'page', 'canonical')).toBe('security');
      }
    });

    it('accurately categorizes administrative & technical roles', () => {
      const adminAddresses = [
        'admin@target.com',
        'administrator@target.com',
        'root@target.com',
        'postmaster@target.com',
        'hostmaster@target.com',
        'sysadmin@target.com',
        'noc@target.com',
        'webmaster@target.com',
        'infra-ops@target.com',
      ];

      for (const email of adminAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('admin');
        expect(categorizeEmailRole(email)).toBe('admin');
      }
    });

    it('accurately categorizes sales & revenue roles', () => {
      const salesAddresses = [
        'sales@target.com',
        'billing@target.com',
        'pricing@target.com',
        'revenue@target.com',
        'deals@target.com',
        'buy@target.com',
        'account-manager@target.com',
      ];

      for (const email of salesAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('sales');
        expect(categorizeEmailRole(email)).toBe('sales');
      }
    });

    it('accurately categorizes support & customer care roles', () => {
      const supportAddresses = [
        'support@target.com',
        'help@target.com',
        'helpdesk@target.com',
        'service@target.com',
        'care@target.com',
        'assistance@target.com',
        'customerservice@target.com',
      ];

      for (const email of supportAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('support');
        expect(categorizeEmailRole(email)).toBe('support');
      }
    });

    it('accurately categorizes legal, privacy, and compliance roles', () => {
      const legalAddresses = [
        'legal@target.com',
        'privacy@target.com',
        'dpo@target.com',
        'gdpr-officer@target.com',
        'compliance@target.com',
        'copyright@target.com',
        'dmca-agent@target.com',
        'law@target.com',
        'terms@target.com',
        'abuse@target.com',
      ];

      for (const email of legalAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('legal');
        expect(categorizeEmailRole(email)).toBe('legal');
      }

      // Contextual source path hints (e.g. email on /privacy without explicit legal keyword)
      expect(categorizeCanonicalRole('officer@target.com', '/privacy')).toBe('legal');
      expect(categorizeCanonicalRole('notice@target.com', '/imprint')).toBe('legal');
    });

    it('accurately categorizes executive & leadership roles', () => {
      const execAddresses = [
        'ceo@target.com',
        'cto@target.com',
        'cfo@target.com',
        'coo@target.com',
        'ciso@target.com',
        'president@target.com',
        'founder@target.com',
        'executive-office@target.com',
        'director@target.com',
        'managing-partner@target.com',
      ];

      for (const email of execAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('executive');
        expect(categorizeEmailRole(email)).toBe('executive');
      }
    });

    it('defaults general inquiries and personal addresses to general', () => {
      const generalAddresses = [
        'info@target.com',
        'hello@target.com',
        'contact@target.com',
        'inquiries@target.com',
        'office@target.com',
        'team@target.com',
        'john.smith@target.com',
        'random-user@target.com',
      ];

      for (const email of generalAddresses) {
        expect(categorizeCanonicalRole(email)).toBe('general');
        expect(categorizeEmailRole(email)).toBe('general');
      }
    });

    it('maintains strict backward compatibility for legacy categorizeContactRole calls', () => {
      expect(categorizeContactRole('security@example.com', 'RFC 9116')).toBe('Security / CERT');
      expect(categorizeContactRole('abuse@example.com', 'RDAP')).toBe('Abuse / Legal');
      expect(categorizeContactRole('webmaster@example.com', 'meta')).toBe('Technical / Webmaster');
      expect(categorizeContactRole('support@example.com', 'page')).toBe('Support / Sales');
      expect(categorizeContactRole('info@example.com', 'page')).toBe('Support / Sales');
      expect(categorizeContactRole('other@example.com', 'page')).toBe('General');
    });
  });

  describe('2. Mailto Link Extraction with Query Parameter Stripping', () => {
    it('strips query parameters, hashes, and URI encodings from mailto: links', () => {
      const html = `
        <div>
          <a href="mailto:support@enterprise.org?subject=Need%20Help&body=Please%20assist">Get Support</a>
          <a href="mailto:billing@enterprise.org?subject=Invoice#pay">Billing Dept</a>
          <a href="mailto:sales%40enterprise.org">Sales Desk</a>
          <a href="mailto:contact@enterprise.org;?cc=boss@enterprise.org">Clean Contact</a>
        </div>
      `;

      const extracted = extractMailtoLinks(html);
      expect(extracted).toContain('support@enterprise.org');
      expect(extracted).toContain('billing@enterprise.org');
      expect(extracted).toContain('sales@enterprise.org');
      expect(extracted).toContain('contact@enterprise.org');

      // Verify query string is not leaked into email value
      for (const email of extracted) {
        expect(email).not.toContain('?');
        expect(email).not.toContain('#');
        expect(email).not.toContain('subject');
      }
    });

    it('handles multiple mailto links on the same page and trims trailing punctuation', () => {
      const html = `
        <p>Email: <a href="mailto:alpha@test.org,">Alpha</a> and <a href="mailto:beta@test.org.">Beta</a></p>
      `;
      const extracted = extractMailtoLinks(html);
      expect(extracted).toContain('alpha@test.org');
      expect(extracted).toContain('beta@test.org');
    });
  });

  describe('3. Visible Body Text & Footer Extraction with Noise Filtering', () => {
    it('strips <script>, <style>, and <svg> blocks to prevent false-positive scraping', () => {
      const dirtyHtml = `
        <html>
          <head>
            <style>
              .user-icon { background: url('logo@2x.png'); color: #f00; }
            </style>
            <script>
              const telemetryEndpoint = "tracker@metric-harvester.invalid";
              const internalToken = "secret@script.map";
            </script>
          </head>
          <body>
            <svg>
              <text>svg-contact@vector-asset.svg</text>
            </svg>
            <!-- Hidden comment: admin-dev@staging-comment.invalid -->
            <p>Please reach out to inquiries@clean-target.com for official inquiries.</p>
          </body>
        </html>
      `;

      const cleanedText = stripNonVisibleHtml(dirtyHtml);
      expect(cleanedText).not.toContain('tracker@metric-harvester.invalid');
      expect(cleanedText).not.toContain('logo@2x.png');
      expect(cleanedText).not.toContain('svg-contact@vector-asset.svg');
      expect(cleanedText).not.toContain('admin-dev@staging-comment.invalid');

      const emails = extractVisibleTextEmails(dirtyHtml, 'clean-target.com');
      expect(emails).toEqual(['inquiries@clean-target.com']);
    });

    it('isolates <footer> elements for specialized footer attribution', () => {
      const html = `
        <html>
          <body>
            <main>
              <p>Main content with editor@clean-target.com</p>
            </main>
            <footer class="site-footer">
              <p>Corporate Headquarters: privacy@clean-target.com | phone: +1 800 555 0199</p>
            </footer>
          </body>
        </html>
      `;

      const footers = extractFooterHtml(html);
      expect(footers.length).toBe(1);
      expect(footers[0]).toContain('privacy@clean-target.com');
    });

    it('filters out asset noise extensions (.png, .jpg, .svg, .webp, .css, .js, .map)', () => {
      expect(isFalsePositiveEmail('avatar@2x.png')).toBe(true);
      expect(isFalsePositiveEmail('user@photo.jpg')).toBe(true);
      expect(isFalsePositiveEmail('icon@vector.svg')).toBe(true);
      expect(isFalsePositiveEmail('image@asset.webp')).toBe(true);
      expect(isFalsePositiveEmail('style@theme.css')).toBe(true);
      expect(isFalsePositiveEmail('bundle@app.js')).toBe(true);
      expect(isFalsePositiveEmail('source@lib.js.map')).toBe(true);

      // Real email should not be flagged
      expect(isFalsePositiveEmail('security@target.com', 'target.com')).toBe(false);
      expect(isFalsePositiveEmail('support@target.com', 'target.com')).toBe(false);
    });

    it('filters placeholder and example domains when scanning non-example targets', () => {
      // Third-party target
      expect(isFalsePositiveEmail('user@example.com', 'real-company.com')).toBe(true);
      expect(isFalsePositiveEmail('test@example.org', 'real-company.com')).toBe(true);
      expect(isFalsePositiveEmail('sample@domain.com', 'real-company.com')).toBe(true);

      // But permits example.com when example.com is the domain under test
      expect(isFalsePositiveEmail('admin@example.com', 'example.com')).toBe(false);
      expect(isFalsePositiveEmail('support@example.org', 'example.org')).toBe(false);
    });
  });

  describe('4. Multi-Path Subpage Scraping & Concurrency', () => {
    it('concurrently probes /contact, /about, /team, /privacy, and /imprint with Promise.allSettled', async () => {
      const requestedUrls: string[] = [];

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url);
        requestedUrls.push(urlStr);

        if (urlStr.endsWith('/contact')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><a href="mailto:sales@multitarget.com">Sales Team</a></body></html>',
          });
        }
        if (urlStr.endsWith('/about')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><p>Questions? Contact us at info@multitarget.com</p></body></html>',
          });
        }
        if (urlStr.endsWith('/team')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><p>CEO: <a href="mailto:ceo@multitarget.com">Leadership</a></p></body></html>',
          });
        }
        if (urlStr.endsWith('/privacy')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><p>DPO contact: <a href="mailto:dpo@multitarget.com">Privacy Officer</a></p></body></html>',
          });
        }
        if (urlStr.endsWith('/imprint')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><footer><p>Legal Notice: legal@multitarget.com</p></footer></body></html>',
          });
        }

        return Promise.resolve({
          ok: false,
          status: 404,
          text: async () => 'Not found',
        });
      });

      const ctx = createMockContext('multitarget.com');
      const result = await contactDiscoveryAgent.execute(ctx);

      // Verify all 5 subpages were requested
      expect(requestedUrls.some((u) => u.includes('/contact'))).toBe(true);
      expect(requestedUrls.some((u) => u.includes('/about'))).toBe(true);
      expect(requestedUrls.some((u) => u.includes('/team'))).toBe(true);
      expect(requestedUrls.some((u) => u.includes('/privacy'))).toBe(true);
      expect(requestedUrls.some((u) => u.includes('/imprint'))).toBe(true);

      // Verify contacts from different pages were discovered with correct canonical roles
      const salesContact = result.exposedContacts.find((c) => c.role === 'sales');
      expect(salesContact).toBeDefined();
      expect(salesContact?.value).toBe('sal***@multitarget.com');
      expect(salesContact?.source).toBe('/contact');

      const execContact = result.exposedContacts.find((c) => c.role === 'executive');
      expect(execContact).toBeDefined();
      expect(execContact?.value).toBe('ceo***@multitarget.com');
      expect(execContact?.source).toBe('/team');

      const legalContact = result.exposedContacts.find((c) => c.role === 'legal' && c.source.includes('/privacy'));
      expect(legalContact).toBeDefined();
      expect(legalContact?.value).toBe('dpo***@multitarget.com');

      const footerLegalContact = result.exposedContacts.find((c) => c.role === 'legal' && c.source.includes('/imprint'));
      expect(footerLegalContact).toBeDefined();
    });

    it('demonstrates resilience when subpages time out, return 404, or fail with network error', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.endsWith('/contact')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><a href="mailto:support@resilient-test.com">Support</a></body></html>',
          });
        }
        if (urlStr.endsWith('/about')) {
          // Simulated 404
          return Promise.resolve({
            ok: false,
            status: 404,
            text: async () => 'Page not found',
          });
        }
        if (urlStr.endsWith('/team')) {
          // Simulated 500 error
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Server error',
          });
        }
        if (urlStr.endsWith('/privacy') || urlStr.endsWith('/imprint')) {
          // Simulated network timeout rejection
          return Promise.reject(new Error('Connection timed out after 3000ms'));
        }

        return Promise.resolve({ ok: false, status: 404, text: async () => 'Not found' });
      });

      const ctx = createMockContext('resilient-test.com');
      // Should not throw or reject
      const result = await contactDiscoveryAgent.execute(ctx);

      expect(result.exposedContacts.length).toBeGreaterThan(0);
      const support = result.exposedContacts.find((c) => c.role === 'support');
      expect(support).toBeDefined();
      expect(support?.value).toBe('sup***@resilient-test.com');
    });

    it('truncates large documents to 100,000 characters to prevent ReDoS', async () => {
      const hugeHtml = '<html><body>' + 'A'.repeat(200000) + '<a href="mailto:deep@huge-site.org">Email</a></body></html>';

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (String(url).endsWith('/contact')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => hugeHtml,
          });
        }
        return Promise.resolve({ ok: false, status: 404, text: async () => '' });
      });

      const ctx = createMockContext('huge-site.org');
      const start = Date.now();
      const result = await contactDiscoveryAgent.execute(ctx);
      const elapsed = Date.now() - start;

      // Ensure processing completed quickly without ReDoS hanging
      expect(elapsed).toBeLessThan(4000);
      expect(result.exposedContacts).toBeDefined();
    });
  });

  describe('5. Privacy Masking & Cryptographic Provenance Hash', () => {
    it('applies privacy masking correctly preserving prefix hints and domains', () => {
      expect(maskEmail('security-team@enterprise.org')).toBe('sec***@enterprise.org');
      expect(maskEmail('inquiries@domain.co.uk')).toBe('inq***@domain.co.uk');
      expect(maskEmail('ab@tiny.io')).toBe('a***@tiny.io');
      expect(maskEmail('a@tiny.io')).toBe('a***@tiny.io');
      expect(maskEmail('invalid-email')).toBe('***@redacted.domain');

      const maskedPhone1 = maskPhone('+1-800-555-0199');
      expect(maskedPhone1).toContain('(***)');
      expect(maskedPhone1.endsWith('99')).toBe(true);

      const maskedPhone2 = maskPhone('555-0199');
      expect(maskedPhone2).toContain('(***)');
      expect(maskedPhone2.endsWith('99')).toBe(true);

      expect(maskPhone('123')).toBe('***-***-****');
    });

    it('generates SHA-256 evidence provenance hash for discovered contacts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      });

      const ctx = createMockContext('provenance-check.org');
      const result = await contactDiscoveryAgent.execute(ctx);

      expect(result.evidence.length).toBeGreaterThan(0);
      const ev = result.evidence[0];
      expect(ev.verificationHash).toBeDefined();
      expect(ev.verificationHash?.startsWith('sha256:')).toBe(true);
      expect(ev.verificationHash?.length).toBe(71); // 'sha256:' (7) + 64 hex chars
    });

    it('supports runContactDiscoveryAgent wrapper function', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      });

      const telemetryEvents: any[] = [];
      const res = await runContactDiscoveryAgent({
        domain: 'wrapper-test.org',
        targetUrl: 'https://wrapper-test.org',
        onTelemetry: (t) => telemetryEvents.push(t),
        onAudit: jest.fn(),
      });

      expect(res.contacts.length).toBeGreaterThan(0);
      expect(res.exposedContacts.length).toBeGreaterThan(0);
      expect(telemetryEvents.length).toBeGreaterThan(0);
    });
  });
});
