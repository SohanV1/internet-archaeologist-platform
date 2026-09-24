/**
 * @jest-environment node
 *
 * Multi-Agent Subsystem Unit & Integration Tests
 * Version 2.0 - Internet Archaeologist Platform
 */

import { passiveReconAgent } from '@/lib/agents/passiveReconAgent';
import { techHostingAgent } from '@/lib/agents/techHostingAgent';
import { snapshotHistoryAgent } from '@/lib/agents/snapshotHistoryAgent';
import {
  contactDiscoveryAgent,
  maskEmail,
  maskPhone,
  categorizeContactRole,
} from '@/lib/agents/contactDiscoveryAgent';
import { websiteHealthAgent } from '@/lib/agents/websiteHealthAgent';
import { safeVulnerabilityAgent } from '@/lib/agents/safeVulnerabilityAgent';
import { sourceEnrichmentAgent } from '@/lib/agents/sourceEnrichmentAgent';
import { reportingAgent } from '@/lib/agents/reportingAgent';
import { orchestrator, CentralOrchestrator } from '@/lib/agents/centralOrchestrator';
import { AgentContext, AgentSharedState } from '@/lib/agents/types';
import { POST as streamHandler } from '@/app/api/investigate/stream/route';
import { NextRequest } from 'next/server';

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

describe('Multi-Agent Subsystem: Specialized Worker Agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const urlStr = String(url || '');
      if (urlStr.includes('web.archive.org/cdx')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            ['timestamp', 'original', 'mimetype', 'statuscode', 'length'],
            ['20180101120000', 'example.com', 'text/html', '200', '1200'],
            ['20220601120000', 'example.com', 'text/html', '200', '2500'],
          ],
        });
      }
      if (urlStr.includes('cloudflare-dns.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            Status: 0,
            Answer: [{ name: 'example.com', type: 1, TTL: 300, data: '93.184.216.34' }],
          }),
        });
      }
      if (urlStr.includes('crt.sh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 123456,
              logged_at: '2024-01-01',
              not_before: '2024-01-01T00:00:00',
              not_after: '2025-01-01T00:00:00',
              name_value: 'example.com\nwww.example.com\napi.example.com',
              issuer_name: 'C=US, O=DigiCert Inc, CN=DigiCert Global Root CA',
            },
          ],
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html',
          'server': 'cloudflare',
          'strict-transport-security': 'max-age=31536000',
        }),
        text: async () =>
          '<!DOCTYPE html><html><head><title>Example</title></head><body><h1>Hello</h1></body></html>',
        json: async () => ({}),
      });
    });
  });
  describe('contactDiscoveryAgent & Privacy Masking Safeguards', () => {
    it('masks emails preserving privacy while retaining domain and prefix hint', () => {
      expect(maskEmail('security@example.com')).toBe('sec***@example.com');
      expect(maskEmail('hi@example.com')).toBe('h***@example.com');
      expect(maskEmail('contact-us@sub.domain.org')).toBe('con***@sub.domain.org');
    });

    it('masks phone numbers preserving country code and trailing digits', () => {
      const masked = maskPhone('+1-800-555-0199');
      expect(masked).toContain('(***)');
      expect(masked.endsWith('99')).toBe(true);
    });

    it('categorizes contact roles accurately according to standard taxonomy', () => {
      expect(categorizeContactRole('security@example.com', 'RFC 9116')).toBe('Security / CERT');
      expect(categorizeContactRole('abuse@example.com', 'RDAP')).toBe('Abuse / Legal');
      expect(categorizeContactRole('webmaster@example.com', 'meta')).toBe('Technical / Webmaster');
      expect(categorizeContactRole('support@example.com', 'page')).toBe('Support / Sales');
      expect(categorizeContactRole('info@example.com', 'page')).toBe('Support / Sales');
      expect(categorizeContactRole('other@example.com', 'page')).toBe('General');
    });

    it('executes contact discovery and redacts contacts without intrusive probing', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.whoisRdap = {
        domain: 'example.com',
        abuseContactEmail: 'abuse-complaints@example.com',
        abuseContactPhone: '+1-555-987-6543',
        privacyProtected: true,
      };

      const result = await contactDiscoveryAgent.execute(ctx);
      expect(result.exposedContacts.length).toBeGreaterThan(0);
      result.exposedContacts.forEach((contact) => {
        expect(contact.value).toContain('***');
        expect(contact.role).toBeDefined();
        expect(contact.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('passiveReconAgent', () => {
    it('resolves DNS records and queries certificate transparency logs', async () => {
      const ctx = createMockContext('example.com');
      const result = await passiveReconAgent.execute(ctx);

      expect(result.dnsRecords.length).toBeGreaterThan(0);
      expect(result.certificates.length).toBeGreaterThan(0);
      expect(result.subdomains.length).toBeGreaterThan(0);
      expect(result.whoisRdap).toBeDefined();
      expect(result.whoisRdap.domain).toBe('example.com');
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(ctx.sharedState.dnsRecords.length).toBeGreaterThan(0);
    }, 25000);
  });

  describe('techHostingAgent', () => {
    it('detects mail providers, evaluates SPF/DMARC policies and classifies ASNs', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.dnsRecords = [
        { type: 'MX', value: 'aspmx.l.google.com', priority: 1 },
        { type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all' },
      ];
      ctx.sharedState.ipAddresses = ['104.21.32.1'];
      ctx.sharedState.rawResponseHeaders = 'server: cloudflare\ncf-ray: 888888\nx-vercel-id: iad1::';

      const result = await techHostingAgent.execute(ctx);
      expect(result.mailProvider.provider).toBe('Google Workspace');
      expect(result.mailProvider.spfStatus).toBe('SoftFail (~all)');
      expect(result.hostingFingerprint.hostingType).toBe('Container / PaaS');
      expect(result.hostingFingerprint.asn).toBeDefined();
      expect(result.asnInfo.length).toBeGreaterThan(0);
    });
  });

  describe('snapshotHistoryAgent', () => {
    it('fetches snapshots, generates comparisons and historical diff', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.subdomains = [
        { subdomain: 'api', fullDomain: 'api.example.com', source: 'Certificate Transparency', status: 'active' },
      ];

      const result = await snapshotHistoryAgent.execute(ctx);
      expect(result.snapshots.length).toBeGreaterThan(0);
      expect(result.historicalDiff).toBeDefined();
      expect(result.historicalDiff.domain).toBe('example.com');
      expect(result.historicalDiff.netScoreDelta).toBeDefined();
    }, 35000);
  });

  describe('websiteHealthAgent', () => {
    it('performs non-destructive checks on redirect chain, mixed content, and forms', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="/about">About Us</a>
            <img src="http://insecure.example.com/logo.png" />
            <form action="https://example.com/login" method="POST">
              <input type="hidden" name="csrf_token" value="abc123xyz" />
              <input type="text" name="username" autocomplete="username" />
              <input type="password" name="password" autocomplete="current-password" />
              <button type="submit">Login</button>
            </form>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      expect(result.healthReport).toBeDefined();
      expect(result.healthReport.overallHealthScore).toBeGreaterThan(0);
      expect(result.healthReport.mixedContentIssues.length).toBeGreaterThan(0);
      expect(result.healthReport.loginFormHygiene.length).toBe(1);
      expect(result.healthReport.loginFormHygiene[0].hasCsrfToken).toBe(true);
      expect(result.healthReport.loginFormHygiene[0].cleartextRisk).toBe(false);
    });
  });

  describe('safeVulnerabilityAgent & CVSS Scoring', () => {
    it('evaluates security headers and flags missing HSTS, CSP, and SPF', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.rawResponseHeaders = 'server: Apache\ncontent-type: text/html';
      ctx.sharedState.certificates = [
        {
          id: 'c1',
          issuer: 'Test CA',
          commonName: 'example.com',
          notBefore: '2023-01-01',
          notAfter: '2027-01-01',
          status: 'active',
          sans: ['example.com'],
        },
      ];
      ctx.sharedState.mailProvider = {
        provider: 'Custom / Self-Hosted MTA',
        mxHosts: ['mail.example.com'],
        spfStatus: 'Missing',
        dmarcPolicy: 'missing',
        dkimSelectorHints: [],
        securityScore: 20,
      };

      const result = await safeVulnerabilityAgent.execute(ctx);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);

      const hstsVuln = result.vulnerabilities.find((v) => v.id.includes('hsts'));
      expect(hstsVuln).toBeDefined();
      expect(hstsVuln?.cvssScore).toBeGreaterThan(0);
      expect(hstsVuln?.severity).toBeDefined();
      expect(hstsVuln?.remediationSteps.length).toBeGreaterThan(0);

      const spfVuln = result.vulnerabilities.find((v) => v.id.includes('spf'));
      expect(spfVuln).toBeDefined();
      expect(spfVuln?.category).toBe('Email Authentication');
    });
  });

  describe('sourceEnrichmentAgent', () => {
    it('enriches findings with authoritative OWASP, NIST, CISA, and RFC standards', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.vulnerabilities = [
        {
          id: 'vuln-test',
          title: 'Missing HSTS',
          severity: 'MEDIUM',
          cvssScore: 4.8,
          category: 'Transport Security',
          status: 'CONFIRMED',
          affectedAsset: 'https://example.com',
          evidence: 'No HSTS',
          likelyImpact: 'MITM vulnerability',
          remediationSteps: ['Add HSTS'],
          references: [],
        },
      ];
      ctx.sharedState.technologies = [
        {
          id: 't-react',
          name: 'React',
          category: 'JavaScript Framework',
          confidence: 90,
          evidence: 'Component bundle',
        },
      ];

      const result = await sourceEnrichmentAgent.execute(ctx);
      expect(result.vulnerabilities[0].references.length).toBeGreaterThan(0);

      const standards = result.vulnerabilities[0].references.map((r) => r.standard);
      expect(standards).toContain('OWASP');
      expect(standards).toContain('NIST');
      expect(standards).toContain('RFC');
    });
  });

  describe('reportingAgent', () => {
    it('synthesizes executive summary, quantitative risk score, and prioritized remediation roadmap', async () => {
      const ctx = createMockContext('example.com');
      ctx.sharedState.vulnerabilities = [
        {
          id: 'v1',
          title: 'Missing HSTS',
          severity: 'HIGH',
          cvssScore: 7.5,
          category: 'Transport Security',
          status: 'CONFIRMED',
          affectedAsset: 'example.com',
          evidence: 'No header',
          likelyImpact: 'Downgrade attacks',
          remediationSteps: ['Deploy HSTS'],
          references: [],
        },
      ];
      ctx.sharedState.snapshots = [
        {
          id: 's1',
          timestamp: '2020-01-01T00:00:00Z',
          archiveUrl: 'http://archive.org',
          statusCode: 200,
          contentLength: 10000,
          title: 'Example',
          detectedTech: [],
        },
      ];

      const result = await reportingAgent.execute(ctx);
      expect(result.investigation).toBeDefined();
      expect(result.investigation.version).toBe('2.0.0');
      expect(result.investigation.riskAssessment).toBeDefined();
      expect(result.investigation.summary.totalYearsActive).toBeGreaterThanOrEqual(1);
      expect(result.remediationRoadmap.length).toBe(1);
      expect(result.remediationRoadmap[0].priority).toBe('P0 - Immediate');
    });
  });

  describe('CentralOrchestrator End-to-End Execution', () => {
    it('executes full DAG, enforces authorization, and yields telemetries', async () => {
      const events: any[] = [];
      const investigation = await orchestrator.execute({
        domain: 'example.com',
        onEvent: (event) => events.push(event),
      });

      expect(investigation).toBeDefined();
      expect(investigation.domain).toBe('example.com');
      expect(investigation.version).toBe('2.0.0');
      expect(investigation.whoisRdap).toBeDefined();
      expect(investigation.mailProvider).toBeDefined();
      expect(investigation.healthReport).toBeDefined();
      expect(investigation.vulnerabilities).toBeDefined();

      // Check stream events were dispatched
      expect(events.length).toBeGreaterThan(0);
      const auditEvents = events.filter((e) => e.type === 'audit');
      expect(auditEvents.length).toBeGreaterThanOrEqual(2);
      expect(auditEvents[0].payload.auditEntry.action).toBe('SCAN_INITIATED');
    }, 45000);

    it('rejects target domain mismatch when authorization record is manipulated', () => {
      expect(() => {
        new CentralOrchestrator({
          domain: 'attacker.com',
          authorization: {
            targetDomain: 'target.com',
            scope: 'authorized_defensive',
            authorizedBy: 'Operator',
            timestamp: new Date().toISOString(),
            disclaimerAccepted: true,
            auditSignatureHash: 'hash',
          },
        });
      }).toThrow();
    });
  });

  describe('SSE Streaming Route /api/investigate/stream', () => {
    it('returns a valid text/event-stream Response for a domain request', async () => {
      const req = new NextRequest('http://localhost:5006/api/investigate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com' }),
      });

      const res = await streamHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');
      expect(res.headers.get('cache-control')).toContain('no-cache');
      expect(res.body).toBeDefined();
    });

    it('returns 400 Bad Request if domain parameter is missing or empty', async () => {
      const req = new NextRequest('http://localhost:5006/api/investigate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: '' }),
      });

      const res = await streamHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('blocks SSRF and private IP target inputs', async () => {
      const req = new NextRequest('http://localhost:5006/api/investigate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: '169.254.169.254' }),
      });

      const res = await streamHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Access denied');
    });
  });
});
