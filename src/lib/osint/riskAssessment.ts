/**
 * Risk Assessment & Security Posture Engine
 * Evaluates passive OSINT intelligence to identify hygiene flaws,
 * missing defensive controls, configuration drift, and attack surface expansion.
 */

import {
  DnsRecord,
  CertificateRecord,
  SubdomainRecord,
  Technology,
  RiskAssessment,
  RiskFinding,
  RiskSeverity,
} from '@/types/osint';

export function evaluateRiskPosture(params: {
  domain: string;
  dnsRecords: DnsRecord[];
  certificates: CertificateRecord[];
  subdomains: SubdomainRecord[];
  technologies: Technology[];
  rawHeaders?: string;
}): RiskAssessment {
  const { domain, dnsRecords, certificates, subdomains, technologies, rawHeaders = '' } = params;
  const findings: RiskFinding[] = [];
  let totalChecks = 0;
  let passedChecks = 0;
  let accumulatedRiskPenalty = 0;

  const headersLower = rawHeaders.toLowerCase();

  // 1. SSL/TLS Hygiene & Expiration Analysis
  totalChecks++;
  if (certificates.length === 0) {
    accumulatedRiskPenalty += 20;
    findings.push({
      id: 'risk-tls-none',
      category: 'SSL/TLS',
      severity: 'HIGH',
      title: 'No Certificate Transparency Records Found',
      description: `No public SSL/TLS certificates were indexed via Certificate Transparency logs for ${domain}.`,
      recommendation: 'Ensure all web properties possess active, authenticated TLS certificates issued by trusted CAs.',
      impactScore: 20,
    });
  } else {
    // Check for expired or soon-to-expire certificates
    const nowMs = Date.now();
    const expiredCerts = certificates.filter((c) => {
      const exp = new Date(c.notAfter).getTime();
      return !isNaN(exp) && exp < nowMs;
    });
    const expiringSoonCerts = certificates.filter((c) => {
      const exp = new Date(c.notAfter).getTime();
      return !isNaN(exp) && exp > nowMs && exp < nowMs + 30 * 24 * 60 * 60 * 1000;
    });

    if (expiringSoonCerts.length > 0) {
      accumulatedRiskPenalty += 10;
      findings.push({
        id: 'risk-tls-expiring-soon',
        category: 'SSL/TLS',
        severity: 'MEDIUM',
        title: 'Active TLS Certificate Expiring Within 30 Days',
        description: `Certificate (${expiringSoonCerts[0].issuer}) expires in less than 30 days (${new Date(expiringSoonCerts[0].notAfter).toLocaleDateString()}).`,
        recommendation: 'Initiate automated ACME renewal to prevent unexpected service outages or browser warning screens.',
        impactScore: 10,
      });
    } else {
      passedChecks++;
    }
  }

  // 2. Email Spoofing Defense (SPF & DMARC in DNS TXT)
  totalChecks++;
  const txtRecords = dnsRecords.filter((r) => r.type === 'TXT').map((r) => r.value.toLowerCase());
  const hasSpf = txtRecords.some((val) => val.includes('v=spf1'));
  const hasDmarc = txtRecords.some((val) => val.includes('v=dmarc1'));

  if (!hasSpf) {
    accumulatedRiskPenalty += 15;
    findings.push({
      id: 'risk-email-spf-missing',
      category: 'DNS & Email',
      severity: 'HIGH',
      title: 'Sender Policy Framework (SPF) Record Missing',
      description: `Domain has no authoritative 'v=spf1' TXT record, rendering it vulnerable to email spoofing and phishing abuse.`,
      recommendation: 'Publish an SPF TXT record specifying authorized mail transfer agents (MTAs) and fail policy (-all or ~all).',
      impactScore: 15,
    });
  } else {
    passedChecks++;
  }

  totalChecks++;
  if (!hasDmarc) {
    accumulatedRiskPenalty += 15;
    findings.push({
      id: 'risk-email-dmarc-missing',
      category: 'DNS & Email',
      severity: 'HIGH',
      title: 'DMARC Policy Enforcement Missing',
      description: 'Domain lacks a DMARC policy record (RFC 7489) to enforce SPF/DKIM alignment and receive spoofing telemetry.',
      recommendation: "Deploy a '_dmarc' TXT record with at least 'p=none' for reporting, progressing to 'p=quarantine' or 'p=reject'.",
      impactScore: 15,
    });
  } else {
    passedChecks++;
  }

  // 3. HTTP Security Headers (HSTS, CSP, X-Frame-Options)
  totalChecks++;
  const hasHsts = headersLower.includes('strict-transport-security');
  if (!hasHsts) {
    accumulatedRiskPenalty += 10;
    findings.push({
      id: 'risk-hdr-hsts-missing',
      category: 'Transport Security',
      severity: 'MEDIUM',
      title: 'Strict-Transport-Security (HSTS) Header Absent',
      description: 'The web server does not broadcast HSTS directives, permitting potential SSL stripping attacks over plaintext HTTP.',
      recommendation: "Emit 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' on all production HTTPS responses.",
      impactScore: 10,
    });
  } else {
    passedChecks++;
  }

  totalChecks++;
  const hasCsp = headersLower.includes('content-security-policy');
  if (!hasCsp) {
    accumulatedRiskPenalty += 8;
    findings.push({
      id: 'risk-hdr-csp-missing',
      category: 'Transport Security',
      severity: 'LOW',
      title: 'Content-Security-Policy (CSP) Undefined',
      description: 'The server did not send a Content-Security-Policy header to restrict resource loading and mitigate XSS vectors.',
      recommendation: "Implement a tailored Content-Security-Policy header restricting script-src, object-src, and frame-ancestors.",
      impactScore: 8,
    });
  } else {
    passedChecks++;
  }

  // 4. Server Version Fingerprinting & Information Disclosure
  totalChecks++;
  const serverHeaderMatch = rawHeaders.match(/server:\s*(.+)/i);
  const xPoweredByMatch = rawHeaders.match(/x-powered-by:\s*(.+)/i);

  if (xPoweredByMatch || (serverHeaderMatch && /\d+\.\d+/.test(serverHeaderMatch[1]))) {
    accumulatedRiskPenalty += 5;
    findings.push({
      id: 'risk-info-disclosure',
      category: 'Information Disclosure',
      severity: 'LOW',
      title: 'Server Banner & Technology Version Disclosure',
      description: `Response headers disclose explicit technology fingerprints (${xPoweredByMatch ? xPoweredByMatch[0] : serverHeaderMatch?.[0]}), aiding threat actors during target profiling.`,
      recommendation: 'Strip or genericize identifying banners (e.g. disable X-Powered-By and set Server tokens to Prod).',
      impactScore: 5,
    });
  } else {
    passedChecks++;
  }

  // 5. Subdomain Attack Surface Expansion
  totalChecks++;
  if (subdomains.length > 50) {
    accumulatedRiskPenalty += 12;
    findings.push({
      id: 'risk-subdomain-sprawl',
      category: 'Subdomain Surface',
      severity: 'MEDIUM',
      title: `Subdomain Surface Sprawl (${subdomains.length} Discovered)`,
      description: `Large exposed subdomain footprint (${subdomains.length} hostnames) increases the probability of dangling CNAME records and subdomain takeover.`,
      recommendation: 'Periodically audit DNS zone entries and decommission orphaned CNAME pointers pointing to abandoned cloud buckets or SaaS endpoints.',
      impactScore: 12,
    });
  } else {
    passedChecks++;
  }

  // Normalize final risk score: 0 (pristine/minimal risk) to 100 (maximum risk)
  const overallScore = Math.min(100, Math.max(0, accumulatedRiskPenalty));

  // Determine Grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
  let riskLevel: RiskSeverity = 'LOW';

  if (overallScore === 0) {
    grade = 'A+';
    riskLevel = 'LOW';
  } else if (overallScore <= 15) {
    grade = 'A';
    riskLevel = 'LOW';
  } else if (overallScore <= 35) {
    grade = 'B';
    riskLevel = 'MEDIUM';
  } else if (overallScore <= 55) {
    grade = 'C';
    riskLevel = 'MEDIUM';
  } else if (overallScore <= 75) {
    grade = 'D';
    riskLevel = 'HIGH';
  } else {
    grade = 'F';
    riskLevel = 'CRITICAL';
  }

  const postureSummary =
    overallScore <= 20
      ? `Strong defensive posture. ${passedChecks} of ${totalChecks} analyzed security baselines are properly configured with minimal risk exposure.`
      : overallScore <= 50
        ? `Moderate defensive posture. ${findings.length} hygiene and policy gaps identified that warrant proactive remediation.`
        : `Elevated attack surface risk. Multiple critical controls (such as email authentication or transport headers) are missing or misconfigured.`;

  return {
    overallScore,
    grade,
    riskLevel,
    findings,
    passedChecksCount: passedChecks,
    totalChecksCount: totalChecks,
    postureSummary,
    generatedAt: new Date().toISOString(),
  };
}
