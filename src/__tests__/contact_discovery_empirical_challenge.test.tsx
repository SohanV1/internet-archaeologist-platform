/**
 * @jest-environment jsdom
 *
 * Empirical Challenge Suite for Milestone M2 (Requirement R2)
 * Deep Email Discovery & 7-Role Categorization
 * Internet Archaeologist Platform v2.1
 *
 * Objectives:
 * 1. Empirically verify and stress-test the 7-role categorization logic:
 *    - All 7 roles: security, admin, sales, support, legal, executive, general
 *    - Ambiguous patterns & precedence (billing-support@, legal-exec@, security-admin@, etc.)
 *    - Uppercase, mixed-case, tagged (plus-addressed), and unusual email formats
 *    - Privacy masking domain preservation and boundary safety
 * 2. Source-aware role resolution (/privacy, /imprint, /impressum, /contact, footers)
 * 3. Mailto & text extraction noise filtering (ReDoS safety, asset rejection, query stripping)
 * 4. UI Component rendering in DomainIntelligenceView for all 7 role badge styles
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  categorizeCanonicalRole,
  categorizeEmailRole,
  categorizeContactRole,
  maskEmail,
  maskPhone,
  isFalsePositiveEmail,
  extractMailtoLinks,
  extractFooterHtml,
  stripNonVisibleHtml,
  extractVisibleTextEmails,
  contactDiscoveryAgent,
  runContactDiscoveryAgent,
  CanonicalContactRole,
} from '@/lib/agents/contactDiscoveryAgent';
import { AgentContext, AgentSharedState } from '@/lib/agents/types';
import { DomainIntelligenceView } from '@/components/DomainIntelligenceView';
import { Investigation } from '@/types/osint';

function createMockContext(domain: string = 'challenge-target.com'): AgentContext {
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

function createMockInvestigation(contacts: any[] = []): Investigation {
  return {
    id: 'inv-test-m2',
    domain: 'challenge-target.com',
    targetUrl: 'https://challenge-target.com',
    createdAt: '2026-09-25T07:50:00.000Z',
    lastUpdated: '2026-09-25T07:50:00.000Z',
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
    exposedContacts: contacts,
    whoisRdap: {
      domain: 'challenge-target.com',
      registrantName: 'Ops Director',
      organization: 'Challenge Security Labs',
      country: 'US',
      privacyProtected: false,
    },
  };
}

describe('Empirical Challenge: Milestone M2 (Requirement R2) Deep Email Discovery & 7-Role Categorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Comprehensive 7-Role Categorization Matrix
  // =========================================================================
  describe('1. 7-Role Categorization Matrix (All Canonical Roles)', () => {
    const roleTestMatrix: Record<CanonicalContactRole, string[]> = {
      security: [
        'security@target.com',
        'security-team@target.com',
        'cert@target.com',
        'psirt@target.com',
        'cve-alert@target.com',
        'bounty@target.com',
        'vuln-reports@target.com',
        'disclosure@target.com',
        'responsible-disclosure@target.com',
        'bugbounty-program@target.com',
      ],
      admin: [
        'admin@target.com',
        'administrator@target.com',
        'root@target.com',
        'postmaster@target.com',
        'hostmaster@target.com',
        'sysadmin@target.com',
        'noc@target.com',
        'webmaster@target.com',
        'infra@target.com',
        'infra-ops@target.com',
      ],
      sales: [
        'sales@target.com',
        'billing@target.com',
        'pricing@target.com',
        'revenue@target.com',
        'deals@target.com',
        'buy@target.com',
        'account-manager@target.com',
      ],
      support: [
        'support@target.com',
        'help@target.com',
        'helpdesk@target.com',
        'service@target.com',
        'care@target.com',
        'assistance@target.com',
        'customerservice@target.com',
      ],
      legal: [
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
      ],
      executive: [
        'ceo@target.com',
        'cto@target.com',
        'cfo@target.com',
        'coo@target.com',
        'ciso@target.com',
        'president@target.com',
        'founder@target.com',
        'executive@target.com',
        'director@target.com',
        'partner@target.com',
      ],
      general: [
        'info@target.com',
        'hello@target.com',
        'contact@target.com',
        'inquiries@target.com',
        'office@target.com',
        'team@target.com',
        'press@target.com',
        'media@target.com',
        'feedback@target.com',
        'alex.turner@target.com',
      ],
    };

    for (const [role, emailList] of Object.entries(roleTestMatrix) as [CanonicalContactRole, string[]][]) {
      it(`reliably categorizes canonical role: ${role} across ${emailList.length} variations`, () => {
        for (const email of emailList) {
          const categorized = categorizeCanonicalRole(email);
          expect(categorized).toBe(role);
          // Confirm alias produces identical output
          expect(categorizeEmailRole(email)).toBe(role);
          // Confirm canonical mode in backward-compatible wrapper
          expect(categorizeContactRole(email, 'page', 'canonical')).toBe(role);
        }
      });
    }
  });

  // =========================================================================
  // 2. Ambiguous Composite Patterns & Rule Precedence Stress-Testing
  // =========================================================================
  describe('2. Ambiguous Composite Patterns & Precedence Hierarchy', () => {
    it('verifies precedence for ambiguous patterns explicitly requested by caller', () => {
      // 1. billing-support@ has 'billing' (sales, priority 5) and 'support' (support, priority 6)
      // Rule 5 (sales) triggers before Rule 6 (support)
      expect(categorizeCanonicalRole('billing-support@target.com')).toBe('sales');

      // 2. legal-exec@ has 'legal' (legal, priority 3) and 'exec' (executive, priority 4)
      // Rule 3 (legal) triggers before Rule 4 (executive)
      expect(categorizeCanonicalRole('legal-exec@target.com')).toBe('legal');

      // 3. security-admin@ has 'security' (security, priority 1) and 'admin' (admin, priority 2)
      // Rule 1 (security) triggers before Rule 2 (admin)
      expect(categorizeCanonicalRole('security-admin@target.com')).toBe('security');
    });

    it('verifies deterministic precedence across multi-role combinations', () => {
      // Security > Admin > Legal > Executive > Sales > Support > General

      // Security vs Support -> Security
      expect(categorizeCanonicalRole('security-support@target.com')).toBe('security');

      // Security vs Executive (ciso) -> Security
      expect(categorizeCanonicalRole('ciso-security@target.com')).toBe('security');

      // Admin vs Support -> Admin
      expect(categorizeCanonicalRole('admin-support@target.com')).toBe('admin');

      // Admin vs Legal (abuse) -> Admin
      expect(categorizeCanonicalRole('postmaster-abuse@target.com')).toBe('admin');

      // Legal vs Sales -> Legal
      expect(categorizeCanonicalRole('legal-sales@target.com')).toBe('legal');

      // Legal vs Support -> Legal
      expect(categorizeCanonicalRole('privacy-helpdesk@target.com')).toBe('legal');

      // Executive vs Sales -> Executive
      expect(categorizeCanonicalRole('founder-sales@target.com')).toBe('executive');

      // Executive vs Support -> Executive
      expect(categorizeCanonicalRole('cto-assistance@target.com')).toBe('executive');

      // Sales vs Support -> Sales
      expect(categorizeCanonicalRole('pricing-support@target.com')).toBe('sales');
      expect(categorizeCanonicalRole('revenue-help@target.com')).toBe('sales');
    });
  });

  // =========================================================================
  // 3. Uppercase, Mixed-Case & Odd Format Stress-Testing
  // =========================================================================
  describe('3. Uppercase, Mixed-Case & Odd Format Robustness', () => {
    it('accurately categorizes all-uppercase email addresses', () => {
      expect(categorizeCanonicalRole('SECURITY@TARGET.COM')).toBe('security');
      expect(categorizeCanonicalRole('ADMINISTRATOR@TARGET.COM')).toBe('admin');
      expect(categorizeCanonicalRole('BILLING@TARGET.COM')).toBe('sales');
      expect(categorizeCanonicalRole('SUPPORT@TARGET.COM')).toBe('support');
      expect(categorizeCanonicalRole('LEGAL@TARGET.COM')).toBe('legal');
      expect(categorizeCanonicalRole('CEO@TARGET.COM')).toBe('executive');
      expect(categorizeCanonicalRole('INFO@TARGET.COM')).toBe('general');
    });

    it('accurately categorizes mixed-case and camelCase addresses', () => {
      expect(categorizeCanonicalRole('SecurityOps@Target.Com')).toBe('security');
      expect(categorizeCanonicalRole('SysAdmin_Alert@Target.Org')).toBe('admin');
      expect(categorizeCanonicalRole('CustomerCare@Target.Net')).toBe('support');
      expect(categorizeCanonicalRole('SalesDepartment@Target.Io')).toBe('sales');
      expect(categorizeCanonicalRole('PrivacyOffice@Target.De')).toBe('legal');
      expect(categorizeCanonicalRole('ManagingDirector@Target.Co.Uk')).toBe('executive');
    });

    it('handles plus-addressing (subaddressing/tags) across all categories', () => {
      expect(categorizeCanonicalRole('security+bounty-2026@target.com')).toBe('security');
      expect(categorizeCanonicalRole('admin+cluster01@target.com')).toBe('admin');
      expect(categorizeCanonicalRole('billing+invoices@target.com')).toBe('sales');
      expect(categorizeCanonicalRole('support+ticket-88219@target.com')).toBe('support');
      expect(categorizeCanonicalRole('legal+dmca-claims@target.com')).toBe('legal');
      expect(categorizeCanonicalRole('cfo+board-deck@target.com')).toBe('executive');
      expect(categorizeCanonicalRole('newsletter+subscribe@target.com')).toBe('general');
    });

    it('handles leading and trailing whitespace safely', () => {
      expect(categorizeCanonicalRole('   security@target.com   ')).toBe('security');
      expect(categorizeCanonicalRole('\tadmin@target.com\n')).toBe('admin');
      expect(categorizeCanonicalRole('  sales@target.com ')).toBe('sales');
      expect(categorizeCanonicalRole(' support@target.com')).toBe('support');
    });

    it('handles deep subdomains and special TLD structures', () => {
      expect(categorizeCanonicalRole('security@sec-ops.corp.internal.target.co.uk')).toBe('security');
      expect(categorizeCanonicalRole('admin@cloud.node01.infra.target.io')).toBe('admin');
      expect(categorizeCanonicalRole('legal@compliance.eu.target.swiss')).toBe('legal');
    });

    it('handles edge and empty strings gracefully without throwing', () => {
      expect(categorizeCanonicalRole('')).toBe('general');
      expect(categorizeCanonicalRole('   ')).toBe('general');
      expect(categorizeCanonicalRole('@')).toBe('general');
      expect(categorizeCanonicalRole('not-an-email')).toBe('general');
      expect(categorizeCanonicalRole('security-text-without-at-sign')).toBe('security');
    });
  });

  // =========================================================================
  // 4. Privacy Masking Domain Preservation & Redaction Integrity
  // =========================================================================
  describe('4. Privacy Masking & Domain Preservation', () => {
    it('masks standard emails while strictly preserving the entire domain structure', () => {
      const cases = [
        { input: 'security@target.com', expected: 'sec***@target.com' },
        { input: 'administrator@target.com', expected: 'adm***@target.com' },
        { input: 'sales@sub.target.co.uk', expected: 'sal***@sub.target.co.uk' },
        { input: 'support@cloud.infra.corp.target.io', expected: 'sup***@cloud.infra.corp.target.io' },
        { input: 'officer@organization.international', expected: 'off***@organization.international' },
        { input: 'legal@target.museum', expected: 'leg***@target.museum' },
      ];

      for (const { input, expected } of cases) {
        const masked = maskEmail(input);
        expect(masked).toBe(expected);
        // Explicit check: domain portion after @ must match exactly
        const domainOriginal = input.split('@')[1];
        const domainMasked = masked.split('@')[1];
        expect(domainMasked).toBe(domainOriginal);
      }
    });

    it('masks short usernames correctly without corrupting domain', () => {
      // 1 char user
      expect(maskEmail('a@tiny.com')).toBe('a***@tiny.com');
      // 2 char user
      expect(maskEmail('hi@tiny.com')).toBe('h***@tiny.com');
      expect(maskEmail('hr@tiny.com')).toBe('h***@tiny.com');
      // 3 char user
      expect(maskEmail('ops@tiny.com')).toBe('ops***@tiny.com');
      // 0 char user
      expect(maskEmail('@tiny.com')).toBe('x***@tiny.com');
    });

    it('strips mailto: prefix before masking email', () => {
      expect(maskEmail('mailto:security@target.com')).toBe('sec***@target.com');
      expect(maskEmail('MAILTO:contact@target.com')).toBe('con***@target.com');
    });

    it('falls back to redacted token on malformed email structures', () => {
      expect(maskEmail('no-at-sign')).toBe('***@redacted.domain');
      expect(maskEmail('too@many@at@signs.com')).toBe('***@redacted.domain');
      expect(maskEmail('')).toBe('***@redacted.domain');
    });

    it('masks phone numbers preserving international prefix and trailing 2 digits', () => {
      const p1 = maskPhone('+1-800-555-0199');
      expect(p1).toMatch(/^\+18\s*\((\*{3})\)\s*(\*{3})-(\*{2})99$/);
      expect(p1.endsWith('99')).toBe(true);

      const p2 = maskPhone('+44 20 7946 0958');
      expect(p2.endsWith('58')).toBe(true);

      const p3 = maskPhone('555-0123');
      expect(p3).toBe('(***) ***-**23');

      // Too short
      expect(maskPhone('123')).toBe('***-***-****');
    });
  });

  // =========================================================================
  // 5. Source-Aware Role Resolution & Contextual Escalation
  // =========================================================================
  describe('5. Source-Aware Role Resolution & Contextual Escalation', () => {
    it('elevates non-explicit emails on legal/privacy/imprint subpages to legal role', () => {
      // If contact on /privacy doesn't have "legal" in the email, the source URL provides context
      expect(categorizeCanonicalRole('officer@target.com', '/privacy')).toBe('legal');
      expect(categorizeCanonicalRole('questions@target.com', '/privacy-policy')).toBe('legal');
      expect(categorizeCanonicalRole('notice@target.com', '/imprint')).toBe('legal');
      expect(categorizeCanonicalRole('angaben@target.de', '/impressum')).toBe('legal');
    });

    it('retains email-specific role even if discovered on a different subpage', () => {
      // Security email found on /about page remains security
      expect(categorizeCanonicalRole('security@target.com', '/about')).toBe('security');
      // Sales email found on /team page remains sales
      expect(categorizeCanonicalRole('sales@target.com', '/team')).toBe('sales');
      // Admin email found on /contact page remains admin
      expect(categorizeCanonicalRole('admin@target.com', '/contact')).toBe('admin');
    });

    it('attributes footer contacts appropriately', () => {
      expect(categorizeCanonicalRole('inquiries@target.com', 'Footer')).toBe('general');
      expect(categorizeCanonicalRole('privacy@target.com', '/about (Footer)')).toBe('legal');
    });
  });

  // =========================================================================
  // 6. Extraction, Scraping & Asset Noise Filtering Stress Tests
  // =========================================================================
  describe('6. HTML Email & Mailto Link Extraction Stress Tests', () => {
    it('decodes URI-encoded mailto links and discards trailing punctuation and queries', () => {
      const html = `
        <div>
          <a href="mailto:support%40target.com?subject=Help%20Needed&amp;body=Issue#ref">Support</a>
          <a href="mailto:<security@target.com>">Sec Team</a>
          <a href="mailto:legal@target.com,">Legal Counsel</a>
          <a href="mailto:admin@target.com;?cc=boss@target.com">Admin</a>
        </div>
      `;
      const extracted = extractMailtoLinks(html);
      expect(extracted).toContain('support@target.com');
      expect(extracted).toContain('security@target.com');
      expect(extracted).toContain('legal@target.com');
      expect(extracted).toContain('admin@target.com');

      for (const email of extracted) {
        expect(email).not.toContain('?');
        expect(email).not.toContain('#');
        expect(email).not.toContain('<');
        expect(email).not.toContain('>');
      }
    });

    it('rejects asset extensions (.png, .jpg, .svg, .webp, .css, .js, .map, .woff)', () => {
      const noisyCandidates = [
        'user@2x.png',
        'avatar@hd.jpg',
        'photo@preview.jpeg',
        'icon@vector.svg',
        'banner@compress.webp',
        'theme@main.css',
        'app@bundle.js',
        'sourcemap@lib.js.map',
        'font@bold.woff',
        'font@medium.woff2',
      ];

      for (const candidate of noisyCandidates) {
        expect(isFalsePositiveEmail(candidate, 'target.com')).toBe(true);
      }
    });

    it('strips <script>, <style>, <svg>, and comments to prevent harvesting internal tokens', () => {
      const dirtyHtml = `
        <head>
          <style>@font-face { src: url('font@bold.woff'); }</style>
          <script>const apiKey = "user@token.js";</script>
        </head>
        <body>
          <svg><text>draw@vector.svg</text></svg>
          <!-- dev comment: test-admin@staging.invalid -->
          <p>Please contact hello@target.com for information.</p>
        </body>
      `;

      const emails = extractVisibleTextEmails(dirtyHtml, 'target.com');
      expect(emails).toEqual(['hello@target.com']);
    });

    it('handles ReDoS attack strings efficiently with character truncation defense', () => {
      // Create a payload with repeated characters designed to trigger regex catastrophic backtracking
      const malformedPayload = 'a'.repeat(50000) + '@' + 'b'.repeat(50000) + '.com';
      const start = Date.now();
      const emails = extractVisibleTextEmails(malformedPayload.slice(0, 100000), 'target.com');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1500);
      expect(Array.isArray(emails)).toBe(true);
    });
  });

  // =========================================================================
  // 7. DomainIntelligenceView UI Role Badges Empirical Verification
  // =========================================================================
  describe('7. DomainIntelligenceView UI Badge Rendering for All 7 Roles', () => {
    it('renders distinct role badges for all 7 canonical roles without warnings', () => {
      const contacts = [
        { id: 'c-1', type: 'email' as const, value: 'sec***@target.com', role: 'security' as const, source: 'security.txt', confidence: 100 },
        { id: 'c-2', type: 'email' as const, value: 'adm***@target.com', role: 'admin' as const, source: '/contact', confidence: 90 },
        { id: 'c-3', type: 'email' as const, value: 'sal***@target.com', role: 'sales' as const, source: '/contact', confidence: 90 },
        { id: 'c-4', type: 'email' as const, value: 'sup***@target.com', role: 'support' as const, source: '/contact', confidence: 85 },
        { id: 'c-5', type: 'email' as const, value: 'leg***@target.com', role: 'legal' as const, source: '/privacy', confidence: 95 },
        { id: 'c-6', type: 'email' as const, value: 'ceo***@target.com', role: 'executive' as const, source: '/team', confidence: 90 },
        { id: 'c-7', type: 'email' as const, value: 'inf***@target.com', role: 'general' as const, source: '/about', confidence: 80 },
      ];

      const investigation = createMockInvestigation(contacts);
      const { container } = render(<DomainIntelligenceView investigation={investigation} />);

      // Verify contact count badge
      expect(screen.getByText('7 Contacts Discovered')).toBeInTheDocument();

      // Verify each role label appears in the rendered DOM
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('sales')).toBeInTheDocument();
      expect(screen.getByText('support')).toBeInTheDocument();
      expect(screen.getByText('legal')).toBeInTheDocument();
      expect(screen.getByText('executive')).toBeInTheDocument();
      expect(screen.getByText('general')).toBeInTheDocument();

      // Verify masked values are displayed
      expect(screen.getByText('sec***@target.com')).toBeInTheDocument();
      expect(screen.getByText('adm***@target.com')).toBeInTheDocument();
      expect(screen.getByText('sal***@target.com')).toBeInTheDocument();
      expect(screen.getByText('sup***@target.com')).toBeInTheDocument();
      expect(screen.getByText('leg***@target.com')).toBeInTheDocument();
      expect(screen.getByText('ceo***@target.com')).toBeInTheDocument();
      expect(screen.getByText('inf***@target.com')).toBeInTheDocument();
    });

    it('falls back safely to general badge styling when encountering unknown role string', () => {
      const contacts = [
        { id: 'c-custom', type: 'email' as const, value: 'cus***@target.com', role: 'unrecognized_custom_role' as any, source: 'custom', confidence: 70 },
      ];

      const investigation = createMockInvestigation(contacts);
      render(<DomainIntelligenceView investigation={investigation} />);

      expect(screen.getByText('unrecognized_custom_role')).toBeInTheDocument();
      expect(screen.getByText('cus***@target.com')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 8. End-to-End Agent Execution with Subpage Simulation
  // =========================================================================
  describe('8. End-to-End Agent Execution & Evidence Hashing', () => {
    it('executes full pipeline discovering contacts across security.txt, RDAP, and subpages', async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        const u = String(url);
        if (u.includes('security.txt')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => 'Contact: security@full-e2e.org\nExpires: 2027-01-01T00:00:00Z',
          });
        }
        if (u.endsWith('/contact')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><a href="mailto:billing-support@full-e2e.org">Billing &amp; Support</a></body></html>',
          });
        }
        if (u.endsWith('/about')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><p>Founder: founder@full-e2e.org</p></body></html>',
          });
        }
        if (u.endsWith('/team')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><p>Ops Admin: sysadmin@full-e2e.org</p></body></html>',
          });
        }
        if (u.endsWith('/privacy')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><a href="mailto:privacy-compliance@full-e2e.org">DPO</a></body></html>',
          });
        }
        if (u.endsWith('/imprint')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => '<html><body><footer><p>Legal desk: desk@full-e2e.org</p></footer></body></html>',
          });
        }
        return Promise.resolve({ ok: false, status: 404, text: async () => '' });
      });

      const ctx = createMockContext('full-e2e.org');
      ctx.sharedState.whoisRdap = {
        domain: 'full-e2e.org',
        abuseContactEmail: 'abuse@full-e2e.org',
        abuseContactPhone: '+1-800-555-0100',
        privacyProtected: true,
      };

      const result = await contactDiscoveryAgent.execute(ctx);

      expect(result.exposedContacts.length).toBeGreaterThan(0);

      // Verify roles discovered:
      const rolesDiscovered = new Set(result.exposedContacts.map((c) => c.role));
      expect(rolesDiscovered.has('security')).toBe(true);
      expect(rolesDiscovered.has('sales')).toBe(true); // billing-support@ resolved to sales
      expect(rolesDiscovered.has('executive')).toBe(true); // founder@ resolved to executive
      expect(rolesDiscovered.has('admin')).toBe(true); // sysadmin@ resolved to admin
      expect(rolesDiscovered.has('legal')).toBe(true); // abuse@ and privacy-compliance@ resolved to legal

      // Verify cryptographic verification hash
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence[0].verificationHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });
});
