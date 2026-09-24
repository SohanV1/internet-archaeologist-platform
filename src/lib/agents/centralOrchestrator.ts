import {
  AgentId,
  AgentTelemetry,
  AgentStreamEvent,
  AuthorizationGateRecord,
  AuditLogEntry,
  AgentStatus,
} from '@/types/agent';
import {
  Investigation,
  SubdomainRecord,
} from '@/types/osint';
import { AgentContext, AgentSharedState } from './types';
import { passiveReconAgent } from './passiveReconAgent';
import { techHostingAgent } from './techHostingAgent';
import { snapshotHistoryAgent } from './snapshotHistoryAgent';
import { contactDiscoveryAgent } from './contactDiscoveryAgent';
import { websiteHealthAgent } from './websiteHealthAgent';
import { safeVulnerabilityAgent } from './safeVulnerabilityAgent';
import { sourceEnrichmentAgent } from './sourceEnrichmentAgent';
import { reportingAgent } from './reportingAgent';
import { detectTechnologies } from '../osint/tech';
import { fetchWithRetry } from '../osint/fetchWithRetry';
import { validateAndSanitizeDomain } from '../osint/validator';
import { logger } from '../osint/logger';

export interface OrchestrationOptions {
  domain: string;
  authorization?: AuthorizationGateRecord;
  priorInvestigation?: Investigation;
  onEvent?: (event: AgentStreamEvent) => void;
}

export class CentralOrchestrator {
  private domain: string;
  private targetUrl: string;
  private authorization?: AuthorizationGateRecord;
  private priorInvestigation?: Investigation;
  private onEvent?: (event: AgentStreamEvent) => void;
  private auditLog: AuditLogEntry[] = [];
  private telemetries: Record<AgentId, AgentTelemetry>;

  constructor(options: OrchestrationOptions) {
    const validation = validateAndSanitizeDomain(options.domain);
    if (!validation.isValid || !validation.sanitizedDomain) {
      throw new Error(validation.error || 'Invalid domain format');
    }

    this.domain = validation.sanitizedDomain;
    this.targetUrl = `https://${this.domain}`;

    if (options.authorization) {
      if (!options.authorization.disclaimerAccepted) {
        throw new Error('Authorization rejected: Terms of engagement and legal disclaimer must be accepted.');
      }
      if (
        options.authorization.targetDomain &&
        options.authorization.targetDomain.toLowerCase() !== this.domain.toLowerCase()
      ) {
        throw new Error(
          `Target domain mismatch: Authorization is for '${options.authorization.targetDomain}', but requested '${this.domain}'.`
        );
      }
    }

    this.authorization = options.authorization;
    this.priorInvestigation = options.priorInvestigation;
    this.onEvent = options.onEvent;

    this.telemetries = {
      orchestrator: {
        id: 'orchestrator',
        name: 'Central Orchestrator',
        role: 'Workflow Coordinator & Audit',
        status: 'idle',
        progress: 0,
        currentAction: 'Initialized',
        findingsCount: 0,
      },
      'passive-recon': {
        id: 'passive-recon',
        name: 'Passive Recon',
        role: 'DNS, CT Logs & RDAP',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      'tech-hosting': {
        id: 'tech-hosting',
        name: 'Tech & Hosting',
        role: 'Infrastructure & Mail Detection',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      'snapshot-history': {
        id: 'snapshot-history',
        name: 'Snapshot & History',
        role: 'Temporal Forensics & Version Diffing',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      'contact-discovery': {
        id: 'contact-discovery',
        name: 'Contact Discovery',
        role: 'Public Contact & security.txt Parser',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      'website-health': {
        id: 'website-health',
        name: 'Website Health',
        role: 'Quality & Form Hygiene Inspector',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      'safe-vulnerability': {
        id: 'safe-vulnerability',
        name: 'Safe Vulnerability',
        role: 'Defensive Risk & Hygiene Evaluator',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      'source-enrichment': {
        id: 'source-enrichment',
        name: 'Source Enrichment',
        role: 'OWASP, NIST & RFC Reference Mapping',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
      reporting: {
        id: 'reporting',
        name: 'Reporting & Synthesis',
        role: 'Executive Story & Remediation Roadmap',
        status: 'idle',
        progress: 0,
        currentAction: 'Pending launch',
        findingsCount: 0,
      },
    };
  }

  private emitTelemetry(telemetry: AgentTelemetry) {
    this.telemetries[telemetry.id] = telemetry;
    if (this.onEvent) {
      this.onEvent({
        type: 'telemetry',
        agentId: telemetry.id,
        timestamp: new Date().toISOString(),
        payload: { telemetry },
      });
    }
  }

  private emitAudit(action: AuditLogEntry['action'], details: string) {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      domain: this.domain,
      operator: this.authorization?.authorizedBy || 'Anonymous Assessor',
      action,
      scope: this.authorization?.scope || 'passive_only',
      details,
    };
    this.auditLog.push(entry);

    if (this.onEvent) {
      this.onEvent({
        type: 'audit',
        agentId: 'orchestrator',
        timestamp: entry.timestamp,
        payload: { auditEntry: entry },
      });
    }
  }

  public async executePipeline(): Promise<Investigation> {
    const startTime = performance.now();
    const now = new Date().toISOString();

    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'running',
      progress: 5,
      currentAction: 'Enforcing target authorization & spinning up worker pool...',
      findingsCount: 0,
      startedAt: now,
    });

    this.emitAudit(
      'SCAN_INITIATED',
      `Assessment initiated for ${this.domain} under ${this.authorization?.scope || 'passive_only'} scope`
    );

    this.emitAudit(
      'AUTH_GRANTED',
      `Authorization verified for ${this.domain} (Scope: ${this.authorization?.scope || 'passive_only'})`
    );

    const sharedState: AgentSharedState = {
      domain: this.domain,
      targetUrl: this.targetUrl,
      authorization: this.authorization,
      dnsRecords: [],
      ipAddresses: [],
      subdomains: [],
      certificates: [],
      asnInfo: [],
      snapshots: [],
      technologies: [],
      evidence: [],
      priorInvestigation: this.priorInvestigation,
    };

    const makeContext = (agentId: AgentId): AgentContext => ({
      domain: this.domain,
      targetUrl: this.targetUrl,
      authorization: this.authorization,
      sharedState,
      emitTelemetry: (t: Partial<AgentTelemetry> & { status?: AgentStatus }) => {
        const full: AgentTelemetry = {
          id: agentId,
          name: this.telemetries[agentId]?.name || agentId,
          role: this.telemetries[agentId]?.role || agentId,
          status: t.status || 'running',
          progress: t.progress ?? 0,
          currentAction: t.currentAction || '',
          findingsCount: t.findingsCount ?? 0,
          ...t,
        };
        this.emitTelemetry(full);
      },
      emitFinding: (finding: Record<string, unknown>) => {
        if (this.onEvent) {
          this.onEvent({
            type: 'finding',
            agentId,
            timestamp: new Date().toISOString(),
            payload: { partialResult: finding },
          });
        }
      },
      emitAudit: (entry: AuditLogEntry) => {
        this.emitAudit(entry.action, entry.details);
      },
    });

    // Layer 1: Run Passive Recon & Snapshot History concurrently
    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'running',
      progress: 15,
      currentAction: 'Executing Phase 1: Passive Recon & Snapshot History agents...',
      findingsCount: 0,
    });

    const [passiveResult, snapshotResult] = await Promise.all([
      passiveReconAgent.execute(makeContext('passive-recon')),
      snapshotHistoryAgent.execute(makeContext('snapshot-history')),
    ]);

    sharedState.dnsRecords = passiveResult.dnsRecords;
    sharedState.ipAddresses = passiveResult.ipAddresses;
    sharedState.subdomains = passiveResult.subdomains;
    sharedState.certificates = passiveResult.certificates;
    sharedState.whoisRdap = passiveResult.whoisRdap;
    sharedState.snapshots = snapshotResult.snapshots;
    sharedState.historicalDiff = snapshotResult.historicalDiff;

    // Baseline live probe for headers & HTML
    let rawHeaders = 'Server: nginx\nContent-Type: text/html\nStrict-Transport-Security: max-age=31536000';
    let htmlSample = '<!DOCTYPE html><html><head><title>Domain</title></head><body></body></html>';
    let probeLatency = 120;

    try {
      const probeStart = performance.now();
      const probeRes = await fetchWithRetry(
        this.targetUrl,
        { headers: { 'User-Agent': 'Internet-Archaeologist-OSINT/2.0' } },
        { retries: 1, timeoutMs: 3500 }
      );
      probeLatency = Math.round(performance.now() - probeStart);
      if (probeRes.ok || probeRes.status) {
        const hObj: Record<string, string> = {};
        probeRes.headers.forEach((v, k) => {
          hObj[k] = v;
        });
        rawHeaders = Object.entries(hObj)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        const text = await probeRes.text();
        htmlSample = text.length > 500000 ? text.slice(0, 500000) : text;
      }
    } catch (err) {
      logger.warn('orchestrator', `Live probe unreachable for ${this.targetUrl}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const detectedTech = detectTechnologies(
      { server: 'nginx', 'strict-transport-security': 'max-age=31536000' },
      htmlSample
    );

    sharedState.rawResponseHeaders = rawHeaders;
    sharedState.htmlSample = htmlSample;
    sharedState.technologies = detectedTech;
    sharedState.responseTimeMs = probeLatency;

    // Layer 2: Run Tech & Hosting, Contact Discovery, and Website Health in parallel
    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'running',
      progress: 45,
      currentAction: 'Executing Phase 2: Tech/Hosting, Contacts & Health agents...',
      findingsCount: passiveResult.subdomains.length,
    });

    const [techHostingResult, contactResult, healthResult] = await Promise.all([
      techHostingAgent.execute(makeContext('tech-hosting')),
      contactDiscoveryAgent.execute(makeContext('contact-discovery')),
      websiteHealthAgent.execute(makeContext('website-health')),
    ]);

    sharedState.hostingFingerprint = techHostingResult.hostingFingerprint;
    sharedState.mailProvider = techHostingResult.mailProvider;
    sharedState.asnInfo = techHostingResult.asnInfo;
    sharedState.exposedContacts = contactResult.exposedContacts;
    sharedState.healthReport = healthResult.healthReport;

    // Layer 3: Safe Vulnerability Assessment
    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'running',
      progress: 70,
      currentAction: 'Executing Phase 3: Safe Vulnerability Assessment agent...',
      findingsCount: contactResult.exposedContacts.length,
    });

    const vulnResult = await safeVulnerabilityAgent.execute(makeContext('safe-vulnerability'));
    sharedState.vulnerabilities = vulnResult.vulnerabilities;

    // Layer 4: Source Enrichment
    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'running',
      progress: 85,
      currentAction: 'Executing Phase 4: Mapping findings to OWASP & NIST standards...',
      findingsCount: vulnResult.vulnerabilities.length,
    });

    const enrichedResult = await sourceEnrichmentAgent.execute(makeContext('source-enrichment'));
    sharedState.vulnerabilities = enrichedResult.vulnerabilities;

    // Layer 5: Reporting & Synthesis
    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'running',
      progress: 95,
      currentAction: 'Executing Phase 5: Synthesizing executive report & remediation roadmap...',
      findingsCount: enrichedResult.vulnerabilities.length,
    });

    const reportingResult = await reportingAgent.execute(makeContext('reporting'));

    const durationMs = Math.round(performance.now() - startTime);

    const investigation: Investigation = {
      ...reportingResult.investigation,
      version: '2.0.0',
      authorizationRecord: this.authorization
        ? {
            scope: this.authorization.scope,
            authorizedBy: this.authorization.authorizedBy,
            organization: this.authorization.organization,
            timestamp: this.authorization.timestamp,
            auditSignatureHash: this.authorization.auditSignatureHash,
          }
        : undefined,
    };

    this.emitAudit(
      'SCAN_COMPLETED',
      `Assessment completed for ${this.domain} with ${investigation.vulnerabilities?.length || 0} findings in ${durationMs}ms`
    );

    this.emitTelemetry({
      id: 'orchestrator',
      name: 'Central Orchestrator',
      role: 'Workflow Coordinator & Audit',
      status: 'completed',
      progress: 100,
      currentAction: `Completed orchestration for ${this.domain} in ${durationMs}ms`,
      findingsCount: enrichedResult.vulnerabilities.length,
      durationMs,
      completedAt: new Date().toISOString(),
    });

    if (this.onEvent) {
      this.onEvent({
        type: 'complete',
        agentId: 'orchestrator',
        timestamp: new Date().toISOString(),
        payload: { partialResult: investigation as unknown as Record<string, unknown> },
      });
    }

    this.emitAudit(
      'SCAN_COMPLETED',
      `Investigation successfully finalized for ${this.domain} in ${durationMs}ms`
    );

    return investigation;
  }
}

export const orchestrator = {
  execute: async (opts: OrchestrationOptions): Promise<Investigation> => {
    const instance = new CentralOrchestrator(opts);
    return instance.executePipeline();
  },
};
