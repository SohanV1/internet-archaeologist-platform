/**
 * Empirical Adversarial Challenge Suite for Milestone M2:
 * Deep Email Discovery & Role Categorization (Scraping Resilience & Negative Cases)
 * Internet Archaeologist Platform v2.1 - Requirement R2
 *
 * Challenger 2 Scope:
 * 1. Malformed/huge HTML documents (1MB+) testing ReDoS resilience & parser safety.
 * 2. Subpages returning HTTP 404, 500, network timeouts, empty strings, and whitespace.
 * 3. Noise filtering: ensuring image files (.png, .jpg, .svg, .webp), styles (.css),
 *    scripts (.js), sourcemaps (.map), and placeholder domains (example.com, test.com)
 *    are strictly rejected.
 * 4. Mailto links with encoded characters (%20, %40), query strings (?subject=...),
 *    fragment hashes, multiple separate links, and multi-recipient comma characterization.
 */

import {
  contactDiscoveryAgent,
  categorizeCanonicalRole,
  categorizeEmailRole,
  categorizeContactRole,
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

function createMockContext(domain: string = 'adversarial-resilience.io'): AgentContext {
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

describe('Challenger 2 Adversarial Suite: Scraping Resilience & Negative Cases (M2 / R2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Malformed & Huge (1MB+) HTML Documents & ReDoS Resilience
  // =========================================================================
  describe('1. Malformed & Huge HTML Documents (1MB+) & ReDoS Resilience', () => {
    it('processes a 1.5MB HTML document with 40,000 nested tags in under 2000ms', async () => {
      // Create a 1.5MB+ HTML payload with extreme tag nesting
      const nestedTags = '<section><div class="deep-wrapper"><p>Content</p>'.repeat(40000);
      const largeHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Oversized Document</title></head>
          <body>
            ${nestedTags}
            <a href="mailto:security-response@adversarial-resilience.io?subject=Vulnerability">Security Contact</a>
            <footer>
              <p>Legal enquiries: legal-notice@adversarial-resilience.io</p>
            </footer>
          </body>
        </html>
      `;

      expect(largeHtml.length).toBeGreaterThan(1500000); // 1.5MB+

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const u = String(url);
        if (u.endsWith('/contact')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => largeHtml,
          });
        }
        return Promise.resolve({ ok: false, status: 404, text: async () => '' });
      });

      const ctx = createMockContext('adversarial-resilience.io');
      const start = Date.now();
      const result = await contactDiscoveryAgent.execute(ctx);
      const durationMs = Date.now() - start;

      // Ensure execution completes rapidly without ReDoS or memory blowout
      expect(durationMs).toBeLessThan(2000);
      expect(result.exposedContacts).toBeDefined();
      expect(result.exposedContacts.length).toBeGreaterThan(0);

      // Verify discovered contact is properly categorized and masked
      const secContact = result.exposedContacts.find((c) => c.role === 'security');
      expect(secContact).toBeDefined();
      expect(secContact?.value).toBe('sec***@adversarial-resilience.io');
    });

    it('survives pathological ReDoS payloads against script stripping and text regexes in <100ms', () => {
      // Pathological regex backtracking attack patterns
      const attackPatterns = [
        // Alternating whitespace and script tags
        '<script ' + 'type="text/javascript" '.repeat(5000) + 'src="exploit.js"></script>',
        // Repetitive partial email prefix pattern
        'a'.repeat(30000) + '@' + 'b'.repeat(30000) + '.com',
        // Repetitive dots in domain
        'user@' + 'sub.'.repeat(10000) + 'domain.com',
        // Repetitive comment delimiters
        '<!-- ' + '------------------------'.repeat(2000) + ' -->',
        // Repetitive nested SVG text
        '<svg>' + '<text font-size="12">'.repeat(5000) + 'user@vector.svg' + '</text>'.repeat(5000) + '</svg>',
        // Mailto repeated percent-encoded tokens
        'mailto:' + '%20'.repeat(10000) + 'user@target.org',
      ];

      for (const pattern of attackPatterns) {
        const start = Date.now();
        const cleaned = stripNonVisibleHtml(pattern);
        const emails = extractVisibleTextEmails(pattern, 'adversarial-resilience.io');
        const mailtos = extractMailtoLinks(pattern);
        const elapsed = Date.now() - start;

        // Sub-100ms evaluation confirms zero catastrophic backtracking
        expect(elapsed).toBeLessThan(100);
        expect(typeof cleaned).toBe('string');
        expect(Array.isArray(emails)).toBe(true);
        expect(Array.isArray(mailtos)).toBe(true);
      }
    });

    it('handles severely malformed HTML with unclosed quotes, broken attributes, and null bytes', () => {
      const corruptHtml = `
        <a href="mailto:admin@corrupt.org
        <a href='mailto:support@corrupt.org"
        <a href=mailto:sales@corrupt.org>
        <p>Unclosed <div class="broken" <span text> Stray brackets ceo@corrupt.org > </p>
        <a href="mailto:\0user@corrupt.org">Null byte in mailto</a>
        <a href="mailto:">Empty mailto</a>
        <a href="mailto:noatsign.com">No at sign</a>
        <<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>
      `;

      const mailtos = extractMailtoLinks(corruptHtml);
      const visible = extractVisibleTextEmails(corruptHtml, 'corrupt.org');

      expect(visible).toContain('ceo@corrupt.org');
      expect(mailtos).not.toContain('');
      expect(mailtos).not.toContain('noatsign.com');
      // All extracted mailto items must have valid @ sign
      for (const m of mailtos) {
        expect(m).toContain('@');
      }
    });
  });

  // =========================================================================
  // 2. Subpage HTTP Failures, Timeouts, and Negative Network Responses
  // =========================================================================
  describe('2. Subpage HTTP Failures, Timeouts, and Negative Network Responses', () => {
    it('gracefully handles complete failure of all subpages with 404, 500, timeouts, and empty responses', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const u = String(url);
        if (u.endsWith('/contact')) {
          // 404 Not Found
          return Promise.resolve({ ok: false, status: 404, text: async () => 'Not Found' });
        }
        if (u.endsWith('/about')) {
          // 500 Internal Server Error
          return Promise.resolve({ ok: false, status: 500, text: async () => '500 Server Error' });
        }
        if (u.endsWith('/team')) {
          // Network connection timeout rejection
          return Promise.reject(new Error('ETIMEDOUT: Connection timed out after 3000ms'));
        }
        if (u.endsWith('/privacy')) {
          // 200 OK but completely empty response body
          return Promise.resolve({ ok: true, status: 200, text: async () => '' });
        }
        if (u.endsWith('/imprint')) {
          // 200 OK but whitespace-only body
          return Promise.resolve({ ok: true, status: 200, text: async () => '   \r\n\t   ' });
        }
        return Promise.resolve({ ok: false, status: 404, text: async () => '' });
      });

      const ctx = createMockContext('all-fail.com');
      const result = await contactDiscoveryAgent.execute(ctx);

      // Must complete without throwing and provide baseline fallback contacts
      expect(result).toBeDefined();
      expect(result.exposedContacts.length).toBe(2);
      expect(result.exposedContacts[0].value).toBe('sec***@all-fail.com');
      expect(result.exposedContacts[0].role).toBe('security');
      expect(result.exposedContacts[1].value).toBe('abu***@all-fail.com');
      expect(result.exposedContacts[1].role).toBe('legal');

      // Evidence provenance must be intact
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence[0].verificationHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('extracts security.txt contact channels when all HTML subpages return HTTP 503 errors', async () => {
      const securityTxt = `
Contact: mailto:security-lead@hardened-target.com
Contact: +1-800-555-0199
Expires: 2027-12-31T23:59:59.000Z
Canonical: https://hardened-target.com/.well-known/security.txt
Policy: https://hardened-target.com/disclosure
      `.trim();

      global.fetch = jest.fn().mockImplementation((url: string) => {
        const u = String(url);
        if (u.includes('.well-known/security.txt')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => securityTxt,
          });
        }
        return Promise.resolve({ ok: false, status: 503, text: async () => 'Service Unavailable' });
      });

      const ctx = createMockContext('hardened-target.com');
      const result = await contactDiscoveryAgent.execute(ctx);

      expect(result.securityTxtContent).toBeDefined();
      expect(result.securityTxtContent).toContain('security-lead@hardened-target.com');

      const emailContact = result.exposedContacts.find((c) => c.type === 'email');
      const phoneContact = result.exposedContacts.find((c) => c.type === 'phone');
      expect(emailContact).toBeDefined();
      expect(emailContact?.value).toBe('sec***@hardened-target.com');
      expect(phoneContact).toBeDefined();
      expect(phoneContact?.value).toContain('(***)');
    });
  });

  // =========================================================================
  // 3. Noise Filtering & False-Positive Rejection
  // =========================================================================
  describe('3. Noise Filtering & False-Positive Rejection', () => {
    it('strictly discards asset filenames resembling emails (.png, .jpg, .svg, .webp, .css, .js, .map)', () => {
      const assetNoise = [
        'avatar@2x.png',
        'user-photo@header.jpg',
        'hero@banner.jpeg',
        'icon@vector-logo.svg',
        'compressed@image.webp',
        'styles@theme.css',
        'application@bundle.min.js',
        'sourcemap@library.js.map',
        'loader@spinner.gif',
        'favicon@site.ico',
        'fontawesome@font.woff',
        'webfont@icons.woff2',
        'custom@typography.ttf',
        'legacy@font.eot',
      ];

      for (const asset of assetNoise) {
        expect(isFalsePositiveEmail(asset, 'enterprise.com')).toBe(true);
      }
    });

    it('preserves valid corporate emails that happen to contain extension characters in local-parts', () => {
      const validEmails = [
        'pnguyen@enterprise.com',
        'jsmith@enterprise.com',
        'svg-lead@enterprise.com',
        'css-admin@enterprise.com',
        'map-dev@enterprise.com',
        'support@css-tricks.org',
        'admin@svg-format.net',
      ];

      for (const email of validEmails) {
        expect(isFalsePositiveEmail(email, 'enterprise.com')).toBe(false);
      }
    });

    it('rejects sample and documentation placeholder domains unless auditing that specific domain', () => {
      const placeholders = [
        'john.doe@example.com',
        'alice@example.org',
        'bob@example.net',
        'test-user@domain.com',
        'qa@test.com',
        'dev@internal.invalid',
      ];

      for (const email of placeholders) {
        // Discarded when analyzing real corporate target
        expect(isFalsePositiveEmail(email, 'corporate-target.com')).toBe(true);
      }

      // Permitted when auditing example.com itself
      expect(isFalsePositiveEmail('admin@example.com', 'example.com')).toBe(false);
      expect(isFalsePositiveEmail('support@sub.example.com', 'example.com')).toBe(false);
    });

    it('strips <script>, <style>, <svg>, and comments to prevent harvesting internal asset tokens', () => {
      const rawHtml = `
        <html>
          <head>
            <style>
              .user-avatar { background-image: url('avatar@2x.png'); color: #333; }
              @font-face { font-family: 'font@asset.woff2'; }
            </style>
            <script>
              var sentryDsn = "https://public@sentry-collector.invalid/123";
              var telemetryEmail = "tracker@metric-harvester.invalid";
              var cdnAsset = "app@3.2.1.bundle.js";
            </script>
          </head>
          <body>
            <svg viewBox="0 0 100 100">
              <text>vector@drawing-layer.svg</text>
            </svg>
            <!-- Staging developer: staging-dev@internal-comment.invalid -->
            <main>
              <h1>Contact Us</h1>
              <p>For sales inquiries, contact sales@corporate-target.com.</p>
              <img src="badge@retina.jpg" alt="Partner Badge" />
            </main>
          </body>
        </html>
      `;

      const emails = extractVisibleTextEmails(rawHtml, 'corporate-target.com');
      expect(emails).toEqual(['sales@corporate-target.com']);
      expect(emails).not.toContain('avatar@2x.png');
      expect(emails).not.toContain('tracker@metric-harvester.invalid');
      expect(emails).not.toContain('app@3.2.1.bundle.js');
      expect(emails).not.toContain('vector@drawing-layer.svg');
      expect(emails).not.toContain('staging-dev@internal-comment.invalid');
      expect(emails).not.toContain('badge@retina.jpg');
    });
  });

  // =========================================================================
  // 4. Mailto Link Edge Cases (Encoded Characters, Query Strings, Multiple Recipients)
  // =========================================================================
  describe('4. Mailto Link Edge Cases (Encoded Characters, Query Strings, Multiple Recipients)', () => {
    it('extracts emails from mailto links with complex query strings, URL encoding, and whitespace', () => {
      const html = `
        <div>
          <!-- Query string with multiple params -->
          <a href="mailto:support@resilience.org?subject=Help%20Request&body=Details%0AHere&cc=audit@resilience.org">Get Support</a>
          <!-- Encoded at-sign %40 -->
          <a href="mailto:billing%40resilience.org?subject=Invoice">Billing</a>
          <!-- URL encoded spaces %20 around email -->
          <a href="mailto:%20inquiries@resilience.org%20">General Inquiries</a>
          <!-- Trailing punctuation and closing brackets -->
          <p>Direct line: (<a href="mailto:press@resilience.org.">press@resilience.org.</a>)</p>
          <!-- URL fragment hash -->
          <a href="mailto:security@resilience.org#cve-report">Report CVE</a>
        </div>
      `;

      const extracted = extractMailtoLinks(html);
      expect(extracted).toContain('support@resilience.org');
      expect(extracted).toContain('billing@resilience.org');
      expect(extracted).toContain('inquiries@resilience.org');
      expect(extracted).toContain('press@resilience.org');
      expect(extracted).toContain('security@resilience.org');

      // Verify no leaked characters
      for (const email of extracted) {
        expect(email).not.toContain('?');
        expect(email).not.toContain('#');
        expect(email).not.toContain('%20');
        expect(email).not.toContain('%40');
      }
    });

    it('extracts multiple separate mailto links on the same page correctly', () => {
      const html = `
        <div>
          <a href="mailto:admin@multi-link.org">Admin Team</a>
          <a href="mailto:sales@multi-link.org">Sales Desk</a>
          <a href="mailto:support@multi-link.org">Support Center</a>
        </div>
      `;

      const extracted = extractMailtoLinks(html);
      expect(extracted).toHaveLength(3);
      expect(extracted).toContain('admin@multi-link.org');
      expect(extracted).toContain('sales@multi-link.org');
      expect(extracted).toContain('support@multi-link.org');
    });

    it('empirically characterizes multiple comma-separated recipients in a single mailto: attribute', () => {
      // RFC 6068 defines multiple recipients separated by commas: mailto:addr1,addr2
      const htmlComma = `<a href="mailto:primary@target.com,secondary@target.com">Dual Team</a>`;
      const extracted = extractMailtoLinks(htmlComma);

      // The raw regex captures the attribute value as a single token
      expect(extracted).toEqual(['primary@target.com,secondary@target.com']);

      // Consequently, isFalsePositiveEmail detects multiple '@' signs and flags as false positive
      const isFiltered = isFalsePositiveEmail(extracted[0], 'target.com');
      expect(isFiltered).toBe(true);

      // However, if multiple emails appear in body text, extractVisibleTextEmails finds each independently
      const bodyHtml = `<p>Contact primary@target.com or secondary@target.com for assistance.</p>`;
      const visibleEmails = extractVisibleTextEmails(bodyHtml, 'target.com');
      expect(visibleEmails).toContain('primary@target.com');
      expect(visibleEmails).toContain('secondary@target.com');
    });
  });

  // =========================================================================
  // 5. 7-Role Categorization Taxonomy & Privacy Masking
  // =========================================================================
  describe('5. 7-Role Categorization Taxonomy & Privacy Masking', () => {
    it('verifies all 7 canonical roles are accurately resolved and mapped', () => {
      const roleMapping: Record<string, string> = {
        'security@target.com': 'security',
        'cve-alert@target.com': 'security',
        'admin@target.com': 'admin',
        'sysadmin@target.com': 'admin',
        'sales@target.com': 'sales',
        'billing@target.com': 'sales',
        'support@target.com': 'support',
        'helpdesk@target.com': 'support',
        'legal@target.com': 'legal',
        'privacy@target.com': 'legal',
        'ceo@target.com': 'executive',
        'founder@target.com': 'executive',
        'info@target.com': 'general',
        'contact@target.com': 'general',
      };

      for (const [email, expectedRole] of Object.entries(roleMapping)) {
        expect(categorizeCanonicalRole(email)).toBe(expectedRole);
        expect(categorizeEmailRole(email)).toBe(expectedRole);
      }
    });

    it('applies privacy masking correctly without corrupting domain names', () => {
      expect(maskEmail('security-team@enterprise.org')).toBe('sec***@enterprise.org');
      expect(maskEmail('billing@sub.enterprise.co.uk')).toBe('bil***@sub.enterprise.co.uk');
      expect(maskEmail('me@tiny.io')).toBe('m***@tiny.io');
      expect(maskEmail('a@tiny.io')).toBe('a***@tiny.io');
      expect(maskEmail('invalid-string')).toBe('***@redacted.domain');

      expect(maskPhone('+1-800-555-0199')).toBe('+18 (***) ***-**99');
      expect(maskPhone('555-0199')).toBe('(***) ***-**99');
      expect(maskPhone('123')).toBe('***-***-****');
    });
  });
});
