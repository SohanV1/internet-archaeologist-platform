import {
  generateHtmlReport,
  exportDnsToCsv,
  exportSubdomainsToCsv,
  exportContactsToCsv,
  exportChangesToCsv,
} from '@/lib/osint/export';
import { Investigation } from '@/types/osint';

function createMockInvestigation(overrides: Partial<Investigation> = {}): Investigation {
  return {
    id: 'inv-test-123',
    domain: 'example.com',
    targetUrl: 'https://example.com',
    createdAt: '2026-09-25T12:00:00.000Z',
    lastUpdated: '2026-09-25T12:05:00.000Z',
    status: 'completed',
    summary: {
      headline: 'Established Domain with Strong Posture',
      narrative: 'A long-standing test domain with standard web stack.',
      firstRecordedDate: '2001-01-01',
      totalYearsActive: 25,
      primaryFrameworkEvolution: 'HTML -> Next.js',
      subdomainsCount: 2,
      majorRedesignsCount: 3,
      securityRating: 'High',
    },
    milestones: [],
    subdomains: [
      {
        subdomain: 'api',
        fullDomain: 'api.example.com',
        source: 'Certificate Transparency',
        status: 'active',
        firstSeen: '2020-01-01',
      },
    ],
    ipAddresses: ['93.184.216.34'],
    dnsRecords: [
      {
        type: 'A',
        value: '93.184.216.34',
        ttl: 3600,
      },
    ],
    technologies: [
      {
        id: 'tech-1',
        name: 'React',
        category: 'JavaScript Framework',
        confidence: 95,
        version: '19.2',
        evidence: 'Detected via script tag',
      },
    ],
    snapshots: [],
    changes: [
      {
        id: 'ch-1',
        timestamp: '2026-01-01T00:00:00Z',
        category: 'Tech Added',
        severity: 'low',
        description: 'Added "Next.js" framework support.',
      },
    ],
    relationships: { nodes: [], edges: [] },
    evidence: [
      {
        id: 'ev-1',
        timestamp: '2026-09-25T12:00:00Z',
        source: 'Cloudflare DoH RFC 8484',
        evidenceType: 'DNS',
        rawData: '93.184.216.34',
        confidence: 'HIGH',
        collectionMethod: 'DNS DoH query',
        observationNature: 'OBSERVED',
        verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    ],
    ...overrides,
  };
}

describe('OSINT Export Subsystem (v2.1)', () => {
  describe('generateHtmlReport', () => {
    it('generates a full standalone HTML report with v2.1 footer badge', () => {
      const inv = createMockInvestigation();
      const html = generateHtmlReport(inv);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Forensic OSINT Intelligence Report: example.com');
      expect(html).toContain('Internet Archaeologist Platform v2.1 • Cryptographically Verified Forensic Artifact');
      expect(html).toContain('93.184.216.34');
      expect(html).toContain('React');
      expect(html).toContain('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('renders RDAP ownership and contact sections when v2.1 fields are present', () => {
      const inv = createMockInvestigation({
        whoisRdap: {
          domain: 'example.com',
          registrantName: 'Jane Doe',
          organization: 'Example Org',
          country: 'US',
          privacyProtected: false,
        },
        exposedContacts: [
          {
            id: 'c-1',
            type: 'email',
            value: 'sec***@example.com',
            role: 'security',
            source: 'security.txt (RFC 9116)',
            confidence: 90,
          },
        ],
      });

      const html = generateHtmlReport(inv);

      expect(html).toContain('Domain Registration & RDAP Identity');
      expect(html).toContain('Jane Doe');
      expect(html).toContain('Example Org');
      expect(html).toContain('Discovered Public Contacts & Personnel');
      expect(html).toContain('sec***@example.com');
      expect(html).toContain('security.txt (RFC 9116)');
    });

    it('handles privacy-redacted RDAP data gracefully', () => {
      const inv = createMockInvestigation({
        whoisRdap: {
          domain: 'example.com',
          privacyProtected: true,
        },
      });

      const html = generateHtmlReport(inv);

      expect(html).toContain('Domain Registration & RDAP Identity');
      expect(html).toContain('Redacted for Privacy');
      expect(html).toContain('Protected');
    });

    it('omits RDAP and contact sections when fields are absent or empty', () => {
      const inv = createMockInvestigation({
        whoisRdap: undefined,
        exposedContacts: [],
      });

      const html = generateHtmlReport(inv);

      expect(html).not.toContain('Domain Registration & RDAP Identity');
      expect(html).not.toContain('Discovered Public Contacts & Personnel');
    });
  });

  describe('exportContactsToCsv', () => {
    it('returns standard CSV headers when contacts list is empty', () => {
      const inv = createMockInvestigation({ exposedContacts: [] });
      const csv = exportContactsToCsv(inv);

      expect(csv).toBe('Type,Value,Role,Source,Confidence');
    });

    it('correctly exports and escapes contact records', () => {
      const inv = createMockInvestigation({
        exposedContacts: [
          {
            id: 'c-1',
            type: 'email',
            value: 'security@example.com',
            role: 'security',
            source: '/security',
            confidence: 95,
          },
          {
            id: 'c-2',
            type: 'email',
            value: 'hello@"special".com',
            role: 'general',
            source: 'Footer "Contact Us"',
            confidence: 80,
          },
        ],
      });

      const csv = exportContactsToCsv(inv);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('Type,Value,Role,Source,Confidence');
      expect(lines[1]).toBe('"email","security@example.com","security","/security",95%');
      expect(lines[2]).toBe('"email","hello@""special"".com","general","Footer ""Contact Us""",80%');
    });
  });

  describe('exportDnsToCsv, exportSubdomainsToCsv, exportChangesToCsv', () => {
    it('exports DNS records with quotes and TTL fallback', () => {
      const inv = createMockInvestigation();
      const csv = exportDnsToCsv(inv);

      expect(csv).toContain('Type,Value,TTL');
      expect(csv).toContain('A,"93.184.216.34",3600');
    });

    it('exports subdomains correctly with quotes', () => {
      const inv = createMockInvestigation();
      const csv = exportSubdomainsToCsv(inv);

      expect(csv).toContain('Subdomain,Root Domain,Source,Status');
      expect(csv).toContain('"api","api.example.com","Certificate Transparency",active');
    });

    it('exports changes with quoted description and category', () => {
      const inv = createMockInvestigation();
      const csv = exportChangesToCsv(inv);

      expect(csv).toContain('Timestamp,Category,Severity,Description');
      expect(csv).toContain('"Tech Added"');
      expect(csv).toContain('Added ""Next.js"" framework support.');
    });
  });
});
