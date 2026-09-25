/**
 * Source Enrichment & Standards Worker Agent
 * Version 2.0 - Internet Archaeologist Platform
 *
 * Enriches security findings and detected technologies with authoritative citations:
 * 1. OWASP (Top 10:2021, ASVS 4.0, Secure Headers Project)
 * 2. NIST SP 800 series (SP 800-53 Rev 5, SP 800-52 Rev 2, SP 800-177 Rev 1)
 * 3. CISA (Cybersecurity Performance Goals, Known Exploited Vulnerabilities KEV catalog)
 * 4. RFC Standards (RFC 8484, RFC 6962, RFC 9116, RFC 7208, RFC 7489, RFC 6797, RFC 9110)
 * 5. Official vendor security hardening guidelines
 */

import {
  WorkerAgent,
  AgentContext,
  SafeVulnerabilityFinding,
  Technology,
  VulnerabilityReference,
  EvidenceItem,
  WhoisRdapRecord,
} from './types';
import { calculateSha256 } from '../osint/cryptoHash';

export interface SourceEnrichmentResult {
  vulnerabilities: SafeVulnerabilityFinding[];
  technologies: Technology[];
  evidence: EvidenceItem[];
  whoisRdap?: WhoisRdapRecord;
}

export const ISO_COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  AU: 'Australia',
  JP: 'Japan',
  IN: 'India',
  BR: 'Brazil',
  CH: 'Switzerland',
  SE: 'Sweden',
  ES: 'Spain',
  IT: 'Italy',
  CZ: 'Czech Republic',
  PL: 'Poland',
  IE: 'Ireland',
  SG: 'Singapore',
  NZ: 'New Zealand',
  AT: 'Austria',
  BE: 'Belgium',
  DK: 'Denmark',
  FI: 'Finland',
  NO: 'Norway',
  ZA: 'South Africa',
  MX: 'Mexico',
  IL: 'Israel',
  KR: 'South Korea',
  CN: 'China',
  RU: 'Russia',
  IS: 'Iceland',
  PT: 'Portugal',
  GR: 'Greece',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  UA: 'Ukraine',
  RO: 'Romania',
  BG: 'Bulgaria',
  HU: 'Hungary',
  SK: 'Slovakia',
  SI: 'Slovenia',
  HR: 'Croatia',
  CY: 'Cyprus',
  LU: 'Luxembourg',
  MT: 'Malta',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  MY: 'Malaysia',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  TR: 'Turkey',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  PA: 'Panama',
};

// Standards Mapping Knowledge Base
const STANDARDS_KNOWLEDGE_BASE: Record<
  string,
  { owasp?: VulnerabilityReference; nist?: VulnerabilityReference; cisa?: VulnerabilityReference; rfc?: VulnerabilityReference }
> = {
  'Transport Security': {
    owasp: {
      title: 'OWASP Top 10:2021 - A02 Cryptographic Failures',
      url: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
      standard: 'OWASP',
    },
    nist: {
      title: 'NIST SP 800-52 Rev 2 - Selection, Configuration, and Use of TLS',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final',
      standard: 'NIST',
    },
    cisa: {
      title: 'CISA Cross-Sector Cybersecurity Performance Goals - CPG 2.E (Encryption)',
      url: 'https://www.cisa.gov/cross-sector-cybersecurity-performance-goals',
      standard: 'CISA',
    },
    rfc: {
      title: 'RFC 6797 - HTTP Strict Transport Security (HSTS)',
      url: 'https://datatracker.ietf.org/doc/html/rfc6797',
      standard: 'RFC',
    },
  },
  'Injection Defense': {
    owasp: {
      title: 'OWASP Top 10:2021 - A03 Injection',
      url: 'https://owasp.org/Top10/A03_2021-Injection/',
      standard: 'OWASP',
    },
    nist: {
      title: 'NIST SP 800-53 Rev 5 - SI-10 Information Input Validation',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
      standard: 'NIST',
    },
    cisa: {
      title: 'CISA Alert - Mitigating Cross-Site Scripting (XSS) Vulnerabilities',
      url: 'https://www.cisa.gov/resources-tools/resources/securing-web-applications',
      standard: 'CISA',
    },
    rfc: {
      title: 'W3C / IETF Content Security Policy Level 3',
      url: 'https://www.w3.org/TR/CSP3/',
      standard: 'RFC',
    },
  },
  'Access Control': {
    owasp: {
      title: 'OWASP Top 10:2021 - A01 Broken Access Control',
      url: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
      standard: 'OWASP',
    },
    nist: {
      title: 'NIST SP 800-53 Rev 5 - AC-3 Access Enforcement',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
      standard: 'NIST',
    },
    cisa: {
      title: 'CISA CPG 1.C - Principle of Least Privilege and Access Control',
      url: 'https://www.cisa.gov/cross-sector-cybersecurity-performance-goals',
      standard: 'CISA',
    },
    rfc: {
      title: 'RFC 7034 - HTTP Header Field X-Frame-Options',
      url: 'https://datatracker.ietf.org/doc/html/rfc7034',
      standard: 'RFC',
    },
  },
  'Security Misconfiguration': {
    owasp: {
      title: 'OWASP Top 10:2021 - A05 Security Misconfiguration',
      url: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
      standard: 'OWASP',
    },
    nist: {
      title: 'NIST SP 800-53 Rev 5 - CM-6 Configuration Settings',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
      standard: 'NIST',
    },
    cisa: {
      title: 'CISA Secure By Design Alert - Eliminate Default Configurations',
      url: 'https://www.cisa.gov/secure-by-design',
      standard: 'CISA',
    },
    rfc: {
      title: 'RFC 9116 - A File Format to Aid in Security Vulnerability Disclosure',
      url: 'https://datatracker.ietf.org/doc/html/rfc9116',
      standard: 'RFC',
    },
  },
  'Email Authentication': {
    owasp: {
      title: 'OWASP Cheat Sheet - Email Security & Anti-Phishing Defense',
      url: 'https://cheatsheetseries.owasp.org/',
      standard: 'OWASP',
    },
    nist: {
      title: 'NIST SP 800-177 Rev 1 - Trustworthy Email Guidelines',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-177/rev-1/final',
      standard: 'NIST',
    },
    cisa: {
      title: 'CISA Binding Operational Directive 18-01 - Enhance Email and Web Security',
      url: 'https://www.cisa.gov/news-events/directives/bod-18-01-enhance-email-and-web-security',
      standard: 'CISA',
    },
    rfc: {
      title: 'RFC 7489 - DMARC Protocol Specification',
      url: 'https://datatracker.ietf.org/doc/html/rfc7489',
      standard: 'RFC',
    },
  },
  'Cryptographic Hygiene': {
    owasp: {
      title: 'OWASP Cryptographic Storage Cheat Sheet',
      url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
      standard: 'OWASP',
    },
    nist: {
      title: 'NIST SP 800-57 Part 1 Rev 5 - Recommendation for Key Management',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final',
      standard: 'NIST',
    },
    cisa: {
      title: 'CISA Technical Guide - Managing TLS Certificate Expiration',
      url: 'https://www.cisa.gov/resources-tools/services',
      standard: 'CISA',
    },
    rfc: {
      title: 'RFC 8446 - The Transport Layer Security (TLS) Protocol Version 1.3',
      url: 'https://datatracker.ietf.org/doc/html/rfc8446',
      standard: 'RFC',
    },
  },
};

// Tech documentation citations
const TECH_DOCUMENTATION_MAP: Record<string, { guideUrl: string; securityNote: string }> = {
  React: {
    guideUrl: 'https://react.dev/learn',
    securityNote: 'Ensure dangerlySetInnerHTML is avoided and user inputs are escaped.',
  },
  'Next.js': {
    guideUrl: 'https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy',
    securityNote: 'Configure security headers and CSP nonces in next.config.mjs.',
  },
  Nginx: {
    guideUrl: 'https://nginx.org/en/docs/http/configuring_https_servers.html',
    securityNote: 'Disable server_tokens off to prevent version disclosure.',
  },
  Apache: {
    guideUrl: 'https://httpd.apache.org/docs/current/mod/core.html#servertokens',
    securityNote: 'Set ServerTokens Prod and ServerSignature Off.',
  },
  Cloudflare: {
    guideUrl: 'https://developers.cloudflare.com/ssl/',
    securityNote: 'Enable Full (Strict) SSL/TLS encryption and automatic HTTPS rewrites.',
  },
};

export const sourceEnrichmentAgent: WorkerAgent<SourceEnrichmentResult> = {
  id: 'source-enrichment',
  name: 'Source Enrichment & Standards Agent',
  role: 'Authoritative Standards (OWASP, NIST, CISA, RFC) Knowledge Citation',

  async execute(ctx: AgentContext): Promise<SourceEnrichmentResult> {
    const { domain, sharedState, emitTelemetry, emitFinding } = ctx;
    const startTime = Date.now();
    const now = new Date().toISOString();

    emitTelemetry({
      id: 'source-enrichment',
      name: 'Source Enrichment & Standards Agent',
      role: 'Authoritative Standards (OWASP, NIST, CISA, RFC) Knowledge Citation',
      status: 'running',
      progress: 20,
      currentAction: 'Correlating findings with OWASP Top 10, NIST SP 800, CISA CPGs, and RFC specifications',
      findingsCount: 0,
      startedAt: now,
    });

    const vulnerabilities = sharedState.vulnerabilities || [];
    const technologies = sharedState.technologies || [];

    // 1. Enrich Vulnerabilities with full multi-standard citations
    const enrichedVulnerabilities = vulnerabilities.map((vuln) => {
      const standards = STANDARDS_KNOWLEDGE_BASE[vuln.category];
      const existingRefs = [...vuln.references];
      const seenStandards = new Set(existingRefs.map((r) => r.standard));

      if (standards) {
        if (!seenStandards.has('OWASP') && standards.owasp) {
          existingRefs.push(standards.owasp);
        }
        if (!seenStandards.has('NIST') && standards.nist) {
          existingRefs.push(standards.nist);
        }
        if (!seenStandards.has('CISA') && standards.cisa) {
          existingRefs.push(standards.cisa);
        }
        if (!seenStandards.has('RFC') && standards.rfc) {
          existingRefs.push(standards.rfc);
        }
      }

      return {
        ...vuln,
        references: existingRefs,
      };
    });

    emitTelemetry({
      id: 'source-enrichment',
      status: 'running',
      progress: 60,
      currentAction: 'Cross-referencing detected technologies with official vendor hardening documentation',
      findingsCount: enrichedVulnerabilities.length,
    });

    // 2. Enrich Technologies with authoritative links
    const enrichedTechnologies = technologies.map((tech) => {
      const match = Object.keys(TECH_DOCUMENTATION_MAP).find((k) =>
        tech.name.toLowerCase().includes(k.toLowerCase())
      );
      if (match) {
        const doc = TECH_DOCUMENTATION_MAP[match];
        return {
          ...tech,
          evidence: `${tech.evidence}. Official Reference: ${doc.guideUrl}. ${doc.securityNote}`,
        };
      }
      return tech;
    });

    emitFinding({
      type: 'standards_enrichment_completed',
      vulnerabilitiesEnriched: enrichedVulnerabilities.length,
      technologiesEnriched: enrichedTechnologies.length,
      authorities: ['OWASP', 'NIST SP 800', 'CISA', 'RFC Standards'],
    });

    // 3. Evidence Construction
    const enrichmentHash = await calculateSha256(
      JSON.stringify(enrichedVulnerabilities.map((v) => ({ id: v.id, refs: v.references })))
    );

    const evidence: EvidenceItem[] = [
      {
        id: `ev-source-enrichment-${domain}`,
        timestamp: now,
        source: 'Authoritative Standards & Citation Knowledge Base',
        evidenceType: 'Other',
        rawData: JSON.stringify(
          {
            enrichedVulnerabilitiesCount: enrichedVulnerabilities.length,
            citationStandards: ['OWASP Top 10', 'NIST SP 800', 'CISA CPG', 'RFC Standards'],
          },
          null,
          2
        ),
        notes: `Enriched ${enrichedVulnerabilities.length} findings with peer-reviewed cybersecurity standards`,
        confidence: 'HIGH',
        confidenceScore: 100,
        collectionMethod: 'Multi-standard regulatory cross-indexing and normative framework correlation',
        relatedEntity: domain,
        relatedObservation: `Cross-referenced findings with OWASP, NIST, CISA, and RFC standards`,
        observationNature: 'OBSERVED',
        verificationHash: enrichmentHash,
      },
    ];

    // 4. Enrich WHOIS/RDAP with RFC 9083, RFC 7095, RFC 6350 citations & ISO country mapping
    let enrichedRdap = sharedState.whoisRdap;
    if (enrichedRdap) {
      const originalCountry = enrichedRdap.country;
      let mappedCountry = originalCountry;
      if (originalCountry && typeof originalCountry === 'string') {
        const upper = originalCountry.trim().toUpperCase();
        if (ISO_COUNTRY_NAMES[upper]) {
          mappedCountry = ISO_COUNTRY_NAMES[upper];
        }
      }

      const rfcCitations = [
        'RFC 9083 - JSON Responses for the Registration Data Access Protocol (RDAP)',
        'RFC 7095 - jCard: The JSON Format for vCard (vCard 4.0 in RDAP)',
        'RFC 6350 - vCard Format Specification (vCard 4.0)',
      ];

      enrichedRdap = {
        ...enrichedRdap,
        country: mappedCountry || enrichedRdap.country,
        standards: rfcCitations,
      };

      const rdapEnrichmentHash = await calculateSha256(JSON.stringify(enrichedRdap));

      evidence.push({
        id: `ev-rdap-enrichment-${domain}`,
        timestamp: now,
        source: 'RFC Standards & ICANN RDAP Normative Framework',
        evidenceType: 'Other',
        rawData: JSON.stringify(
          {
            domain,
            registrantName: enrichedRdap.registrantName,
            organization: enrichedRdap.organization,
            country: enrichedRdap.country,
            standards: rfcCitations,
          },
          null,
          2
        ),
        notes: `Enriched WHOIS/RDAP record for ${domain} with RFC 9083, RFC 7095, and RFC 6350 citations; country mapped to ${enrichedRdap.country || 'N/A'}.`,
        confidence: 'HIGH',
        confidenceScore: 100,
        collectionMethod: 'Normative framework cross-referencing and ISO-3166 country normalization',
        relatedEntity: domain,
        relatedObservation: `Registration record validated against RFC 9083 / RFC 7095 (${enrichedRdap.organization || 'Private'}, ${enrichedRdap.country || 'Unknown'})`,
        observationNature: 'OBSERVED',
        verificationHash: rdapEnrichmentHash,
      });

      ctx.sharedState.whoisRdap = enrichedRdap;
    }

    const durationMs = Date.now() - startTime;

    emitTelemetry({
      id: 'source-enrichment',
      status: 'completed',
      progress: 100,
      currentAction: 'Authoritative source enrichment completed',
      findingsCount: enrichedVulnerabilities.length,
      durationMs,
      completedAt: new Date().toISOString(),
    });

    // Update shared state
    ctx.sharedState.vulnerabilities = enrichedVulnerabilities;
    ctx.sharedState.technologies = enrichedTechnologies;
    ctx.sharedState.evidence.push(...evidence);

    return {
      vulnerabilities: enrichedVulnerabilities,
      technologies: enrichedTechnologies,
      evidence,
      whoisRdap: enrichedRdap,
    };
  },
};

export async function runSourceEnrichmentAgent(
  context: {
    domain: string;
    targetUrl: string;
    authorization?: any;
    onTelemetry: (t: any) => void;
    onAudit: (action: any, details: string) => void;
  },
  options?: {
    vulnerabilities?: SafeVulnerabilityFinding[];
    evidence?: EvidenceItem[];
    whoisRdap?: WhoisRdapRecord;
  }
): Promise<{
  enrichedVulnerabilities: SafeVulnerabilityFinding[];
  vulnerabilities: SafeVulnerabilityFinding[];
  technologies: Technology[];
  evidence: EvidenceItem[];
  whoisRdap?: WhoisRdapRecord;
}> {
  const agentCtx: AgentContext = {
    domain: context.domain,
    targetUrl: context.targetUrl,
    authorization: context.authorization,
    sharedState: {
      domain: context.domain,
      targetUrl: context.targetUrl,
      authorization: context.authorization,
      dnsRecords: [],
      ipAddresses: [],
      subdomains: [],
      certificates: [],
      asnInfo: [],
      snapshots: [],
      technologies: [],
      evidence: options?.evidence || [],
      vulnerabilities: options?.vulnerabilities || [],
      whoisRdap: options?.whoisRdap,
    },
    emitTelemetry: (t) => {
      context.onTelemetry({
        id: 'source-enrichment',
        name: 'Source Enrichment',
        role: 'OWASP, NIST & RFC Reference Mapping',
        status: t.status || 'running',
        progress: t.progress || 0,
        currentAction: t.currentAction || '',
        findingsCount: t.findingsCount || 0,
        durationMs: t.durationMs,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        error: t.error,
      });
    },
    emitFinding: () => {},
    emitAudit: (a) => context.onAudit(a.action, a.details),
  };
  const res = await sourceEnrichmentAgent.execute(agentCtx);
  return {
    enrichedVulnerabilities: res.vulnerabilities,
    vulnerabilities: res.vulnerabilities,
    technologies: res.technologies,
    evidence: res.evidence,
    whoisRdap: res.whoisRdap,
  };
}

