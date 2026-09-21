import { evaluateRiskPosture } from '@/lib/osint/riskAssessment';
import { DnsRecord, CertificateRecord, SubdomainRecord, Technology } from '@/types/osint';

describe('Risk Assessment Engine (evaluateRiskPosture)', () => {
  const dummyDns: DnsRecord[] = [
    { type: 'A', value: '1.1.1.1' },
    { type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all' },
    { type: 'TXT', value: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com' },
  ];

  const dummyCerts: CertificateRecord[] = [
    {
      id: 'cert-1',
      issuer: "Let's Encrypt Authority X3",
      commonName: 'example.com',
      sans: ['example.com', 'www.example.com'],
      notBefore: '2025-01-01T00:00:00Z',
      notAfter: '2027-01-01T00:00:00Z', // Far future
      serialNumber: '123456789',
      status: 'active',
    },
  ];

  const dummySubdomains: SubdomainRecord[] = [
    {
      subdomain: 'api',
      fullDomain: 'api.example.com',
      source: 'Certificate Transparency',
      status: 'active',
    },
  ];

  const dummyTech: Technology[] = [
    {
      id: 'tech-react',
      name: 'React',
      category: 'JavaScript Framework',
      confidence: 95,
      evidence: 'Script src',
    },
  ];

  it('assigns Grade A+ or A for fully fortified baseline', () => {
    const rawHeaders =
      'Strict-Transport-Security: max-age=31536000\nContent-Security-Policy: default-src self';
    const assessment = evaluateRiskPosture({
      domain: 'example.com',
      dnsRecords: dummyDns,
      certificates: dummyCerts,
      subdomains: dummySubdomains,
      technologies: dummyTech,
      rawHeaders,
    });

    expect(assessment.riskLevel).toBe('LOW');
    expect(assessment.grade).toMatch(/^A/);
    expect(assessment.overallScore).toBeLessThanOrEqual(15);
  });

  it('flags missing SPF and DMARC as high risk email hygiene flaw', () => {
    const dnsWithoutEmailAuth: DnsRecord[] = [{ type: 'A', value: '1.2.3.4' }];
    const assessment = evaluateRiskPosture({
      domain: 'vulnerable-domain.com',
      dnsRecords: dnsWithoutEmailAuth,
      certificates: dummyCerts,
      subdomains: dummySubdomains,
      technologies: dummyTech,
    });

    const spfFinding = assessment.findings.find((f) => f.id === 'risk-email-spf-missing');
    const dmarcFinding = assessment.findings.find((f) => f.id === 'risk-email-dmarc-missing');

    expect(spfFinding).toBeDefined();
    expect(spfFinding?.severity).toBe('HIGH');
    expect(dmarcFinding).toBeDefined();
    expect(dmarcFinding?.severity).toBe('HIGH');
  });

  it('detects expiring TLS certificates', () => {
    const nearExpiryCert: CertificateRecord[] = [
      {
        id: 'cert-near',
        issuer: 'DigiCert Global Root CA',
        commonName: 'expiring.org',
        sans: ['expiring.org'],
        notBefore: '2024-01-01T00:00:00Z',
        notAfter: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days left
        serialNumber: '999888',
        status: 'active',
      },
    ];

    const assessment = evaluateRiskPosture({
      domain: 'expiring.org',
      dnsRecords: dummyDns,
      certificates: nearExpiryCert,
      subdomains: dummySubdomains,
      technologies: dummyTech,
    });

    const expFinding = assessment.findings.find((f) => f.id === 'risk-tls-expiring-soon');
    expect(expFinding).toBeDefined();
    expect(expFinding?.severity).toBe('MEDIUM');
  });

  it('flags subdomain sprawl when more than 50 subdomains are discovered', () => {
    const massiveSubdomains: SubdomainRecord[] = Array.from({ length: 55 }, (_, i) => ({
      subdomain: `sub${i}`,
      fullDomain: `sub${i}.example.com`,
      source: 'Certificate Transparency',
      status: 'active',
    }));

    const assessment = evaluateRiskPosture({
      domain: 'example.com',
      dnsRecords: dummyDns,
      certificates: dummyCerts,
      subdomains: massiveSubdomains,
      technologies: dummyTech,
    });

    const sprawlFinding = assessment.findings.find((f) => f.id === 'risk-subdomain-sprawl');
    expect(sprawlFinding).toBeDefined();
    expect(sprawlFinding?.severity).toBe('MEDIUM');
  });
});
