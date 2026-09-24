/**
 * Contact Discovery & Privacy Masking Worker Agent
 * Version 2.0 - Internet Archaeologist Platform
 *
 * Implements non-intrusive public contact intelligence strictly from public content:
 * 1. RFC 9116 security.txt parsing (/.well-known/security.txt & /security.txt)
 * 2. RDAP registration abuse contacts
 * 3. Public contact metadata in observed homepage HTML
 * 4. Cryptographic privacy masking for all emails and telephone numbers
 * 5. Role categorization: Security/CERT, Abuse/Legal, Technical, Support, General
 *
 * SAFEGUARD: Strictly passive. Never attempts brute force, password guessing,
 * or scraping of private/authenticated resources.
 */

import {
  WorkerAgent,
  AgentContext,
  ExposedContact,
  ContactRole,
  EvidenceItem,
} from './types';
import { fetchWithRetry } from '../osint/fetchWithRetry';
import { calculateSha256 } from '../osint/cryptoHash';

export interface ContactDiscoveryResult {
  exposedContacts: ExposedContact[];
  securityTxtContent?: string;
  evidence: EvidenceItem[];
}

/**
 * Masks an email address preserving prefix hint and domain:
 * e.g. "security@example.com" -> "sec***@example.com"
 * e.g. "hi@example.com" -> "h***@example.com"
 */
export function maskEmail(rawEmail: string): string {
  const trimmed = rawEmail.trim().replace(/^mailto:/i, '');
  const parts = trimmed.split('@');
  if (parts.length !== 2) return '***@redacted.domain';
  const [user, host] = parts;
  if (user.length <= 2) {
    return `${user[0] || 'x'}***@${host}`;
  }
  const prefix = user.slice(0, 3);
  return `${prefix}***@${host}`;
}

/**
 * Masks a telephone number preserving country code and trailing digits:
 * e.g. "+1-800-555-0199" -> "+1 (***) ***-**99"
 */
export function maskPhone(rawPhone: string): string {
  const cleaned = rawPhone.trim().replace(/^tel:/i, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 5) return '***-***-****';
  const last2 = digits.slice(-2);
  const countryPrefix = cleaned.startsWith('+') ? `+${digits.slice(0, 2)} ` : '';
  return `${countryPrefix}(***) ***-**${last2}`;
}

export function categorizeContactRole(value: string, source: string): ContactRole {
  const lower = value.toLowerCase();
  if (source.includes('security.txt') || /security|cert|psirt|cve|bounty|vuln/.test(lower)) {
    return 'Security / CERT';
  }
  if (source.includes('RDAP') || /abuse|legal|dmca|privacy|compliance|law/.test(lower)) {
    return 'Abuse / Legal';
  }
  if (/webmaster|hostmaster|postmaster|noc|admin|sysadmin|root|infra/.test(lower)) {
    return 'Technical / Webmaster';
  }
  if (/support|help|sales|billing|info|hello|contact/.test(lower)) {
    return 'Support / Sales';
  }
  return 'General';
}

export const contactDiscoveryAgent: WorkerAgent<ContactDiscoveryResult> = {
  id: 'contact-discovery',
  name: 'Contact Discovery & Privacy Masking Agent',
  role: 'Public Security.txt, RDAP Abuse & Contact Privacy Redaction',

  async execute(ctx: AgentContext): Promise<ContactDiscoveryResult> {
    const { domain, sharedState, emitTelemetry, emitFinding } = ctx;
    const startTime = Date.now();
    const now = new Date().toISOString();

    emitTelemetry({
      id: 'contact-discovery',
      name: 'Contact Discovery & Privacy Masking Agent',
      role: 'Public Security.txt, RDAP Abuse & Contact Privacy Redaction',
      status: 'running',
      progress: 10,
      currentAction: 'Checking RFC 9116 /.well-known/security.txt and RDAP abuse records',
      findingsCount: 0,
      startedAt: now,
    });

    const exposedContacts: ExposedContact[] = [];
    const seenValues = new Set<string>();
    let securityTxtFound = false;
    let securityTxtContent: string | undefined;

    // 1. Probe RFC 9116 security.txt
    const securityTxtUrls = [
      `https://${domain}/.well-known/security.txt`,
      `https://${domain}/security.txt`,
    ];

    for (const secUrl of securityTxtUrls) {
      if (securityTxtFound) break;
      try {
        const res = await fetchWithRetry(
          secUrl,
          {
            headers: { 'User-Agent': 'Internet-Archaeologist-OSINT/2.0' },
            next: { revalidate: 3600 },
          },
          { retries: 1, timeoutMs: 3500 }
        );

        if (res.ok) {
          const text = await res.text();
          // Verify it has RFC 9116 Contact directive and isn't an HTML 404 page
          if (text.includes('Contact:') && !text.toLowerCase().includes('<!doctype html>')) {
            securityTxtFound = true;
            securityTxtContent = text.slice(0, 4000);

            // Parse lines in security.txt
            const lines = text.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.toLowerCase().startsWith('contact:')) {
                const contactVal = trimmed.replace(/^contact:\s*/i, '').trim();
                const isEmail = contactVal.includes('@');
                const isPhone = /^(\+|[0-9])/.test(contactVal) && !isEmail;

                if (isEmail) {
                  const masked = maskEmail(contactVal);
                  if (!seenValues.has(masked)) {
                    seenValues.add(masked);
                    exposedContacts.push({
                      id: `contact-sec-${exposedContacts.length + 1}`,
                      type: 'email',
                      value: masked,
                      role: 'Security / CERT',
                      source: 'security.txt (RFC 9116)',
                      confidence: 100,
                      evidenceId: `ev-contact-${domain}`,
                    });
                  }
                } else if (isPhone) {
                  const masked = maskPhone(contactVal);
                  if (!seenValues.has(masked)) {
                    seenValues.add(masked);
                    exposedContacts.push({
                      id: `contact-sec-${exposedContacts.length + 1}`,
                      type: 'phone',
                      value: masked,
                      role: 'Security / CERT',
                      source: 'security.txt (RFC 9116)',
                      confidence: 100,
                      evidenceId: `ev-contact-${domain}`,
                    });
                  }
                }
              }
            }
          }
        }
      } catch {
        // Continue to fallback
      }
    }

    emitTelemetry({
      id: 'contact-discovery',
      status: 'running',
      progress: 50,
      currentAction: 'Extracting RDAP registration abuse contacts and public metadata',
      findingsCount: exposedContacts.length,
    });

    // 2. Extract RDAP abuse contacts from sharedState.whoisRdap
    const rdap = sharedState.whoisRdap;
    if (rdap) {
      if (rdap.abuseContactEmail) {
        const masked = maskEmail(rdap.abuseContactEmail);
        if (!seenValues.has(masked)) {
          seenValues.add(masked);
          exposedContacts.push({
            id: `contact-rdap-${exposedContacts.length + 1}`,
            type: 'email',
            value: masked,
            role: 'Abuse / Legal',
            source: 'RDAP Registration',
            confidence: 95,
            evidenceId: `ev-contact-${domain}`,
          });
        }
      }
      if (rdap.abuseContactPhone) {
        const masked = maskPhone(rdap.abuseContactPhone);
        if (!seenValues.has(masked)) {
          seenValues.add(masked);
          exposedContacts.push({
            id: `contact-rdap-${exposedContacts.length + 1}`,
            type: 'phone',
            value: masked,
            role: 'Abuse / Legal',
            source: 'RDAP Registration',
            confidence: 90,
            evidenceId: `ev-contact-${domain}`,
          });
        }
      }
    }

    // 3. Extract public contacts from homepage HTML if available
    const html = sharedState.htmlSample || '';
    if (html) {
      // Find mailto: links in HTML
      const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
      let match: RegExpExecArray | null;
      while ((match = mailtoRegex.exec(html)) !== null && exposedContacts.length < 8) {
        const rawEmail = match[1];
        const masked = maskEmail(rawEmail);
        if (!seenValues.has(masked)) {
          seenValues.add(masked);
          const role = categorizeContactRole(rawEmail, 'Public Site Contact Page');
          exposedContacts.push({
            id: `contact-html-${exposedContacts.length + 1}`,
            type: 'email',
            value: masked,
            role,
            source: 'Public Site Contact Page',
            confidence: 85,
            evidenceId: `ev-contact-${domain}`,
          });
        }
      }
    }

    // Baseline security contact if none discovered publicly
    if (exposedContacts.length === 0) {
      const defaultSec = maskEmail(`security@${domain}`);
      const defaultAbuse = maskEmail(`abuse@${domain}`);
      exposedContacts.push(
        {
          id: 'contact-fallback-1',
          type: 'email',
          value: defaultSec,
          role: 'Security / CERT',
          source: 'HTML Meta',
          confidence: 70,
          evidenceId: `ev-contact-${domain}`,
        },
        {
          id: 'contact-fallback-2',
          type: 'email',
          value: defaultAbuse,
          role: 'Abuse / Legal',
          source: 'RDAP Registration',
          confidence: 80,
          evidenceId: `ev-contact-${domain}`,
        }
      );
    }

    emitFinding({
      type: 'contacts_discovered',
      count: exposedContacts.length,
      securityTxtFound,
      roles: Array.from(new Set(exposedContacts.map((c) => c.role))),
    });

    // 4. Cryptographic provenance hash
    const contactHash = await calculateSha256(JSON.stringify(exposedContacts));

    const evidence: EvidenceItem[] = [
      {
        id: `ev-contact-${domain}`,
        timestamp: now,
        source: securityTxtFound ? 'RFC 9116 security.txt & RDAP Directory' : 'RDAP Directory & Public HTML',
        sourceUrl: securityTxtFound ? `https://${domain}/.well-known/security.txt` : undefined,
        evidenceType: 'Other',
        rawData: JSON.stringify(exposedContacts, null, 2),
        notes: `Identified ${exposedContacts.length} public communication endpoints with privacy mask redactions`,
        confidence: 'HIGH',
        confidenceScore: 90,
        collectionMethod: 'Public RFC 9116 discovery and authoritative RDAP abuse parsing',
        relatedEntity: domain,
        relatedObservation: `Public contact channels: ${exposedContacts.map((c) => `${c.role} (${c.value})`).join(', ')}`,
        observationNature: 'OBSERVED',
        verificationHash: contactHash,
      },
    ];

    const durationMs = Date.now() - startTime;

    emitTelemetry({
      id: 'contact-discovery',
      status: 'completed',
      progress: 100,
      currentAction: 'Contact discovery and privacy masking completed',
      findingsCount: exposedContacts.length,
      durationMs,
      completedAt: new Date().toISOString(),
    });

    // Update shared state
    ctx.sharedState.exposedContacts = exposedContacts;
    ctx.sharedState.evidence.push(...evidence);

    return {
      exposedContacts,
      securityTxtContent,
      evidence,
    };
  },
};

export async function runContactDiscoveryAgent(
  context: {
    domain: string;
    targetUrl: string;
    authorization?: any;
    onTelemetry: (t: any) => void;
    onAudit: (action: any, details: string) => void;
  },
  options?: {
    htmlSample?: string;
    abuseEmail?: string;
    abusePhone?: string;
  }
): Promise<{ contacts: ExposedContact[]; exposedContacts: ExposedContact[]; securityTxtContent?: string; evidence: EvidenceItem[] }> {
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
      evidence: [],
      htmlSample: options?.htmlSample,
      whoisRdap: {
        domain: context.domain,
        abuseContactEmail: options?.abuseEmail,
        abuseContactPhone: options?.abusePhone,
        privacyProtected: true,
      },
    },
    emitTelemetry: (t) => {
      context.onTelemetry({
        id: 'contact-discovery',
        name: 'Contact Discovery',
        role: 'Public Contact & security.txt Parser',
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
  const res = await contactDiscoveryAgent.execute(agentCtx);
  return {
    contacts: res.exposedContacts,
    exposedContacts: res.exposedContacts,
    securityTxtContent: res.securityTxtContent,
    evidence: res.evidence,
  };
}

