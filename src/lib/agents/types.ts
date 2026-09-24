/**
 * Multi-Agent System Core Architecture & Contract Definitions
 * Version 2.0 - Internet Archaeologist Platform
 */

import {
  AgentId,
  AgentStatus,
  AgentTelemetry,
  AuthorizationGateRecord,
  AuditLogEntry,
  AgentStreamEvent,
} from '@/types/agent';

import {
  Investigation,
  DnsRecord,
  Technology,
  WebSnapshot,
  SubdomainRecord,
  CertificateRecord,
  AsnInfo,
  EvidenceItem,
  WhoisRdapRecord,
  MailProviderInfo,
  ExposedContact,
  HostingFingerprint,
  WebsiteHealthReport,
  SafeVulnerabilityFinding,
  HistoricalScanDiff,
  SnapshotComparison,
} from '@/types/osint';

// Re-export core types for unified module access
export * from '@/types/agent';
export * from '@/types/osint';

/**
 * Shared Blackboard / Intermediate State populated across agent execution phases
 */
export interface AgentSharedState {
  domain: string;
  targetUrl: string;
  authorization?: AuthorizationGateRecord;
  dnsRecords: DnsRecord[];
  ipAddresses: string[];
  subdomains: SubdomainRecord[];
  certificates: CertificateRecord[];
  asnInfo: AsnInfo[];
  snapshots: WebSnapshot[];
  technologies: Technology[];
  evidence: EvidenceItem[];
  rawResponseHeaders?: string;
  htmlSample?: string;
  liveProbeSuccess?: boolean;
  responseTimeMs?: number;
  httpStatus?: number;
  whoisRdap?: WhoisRdapRecord;
  mailProvider?: MailProviderInfo;
  exposedContacts?: ExposedContact[];
  hostingFingerprint?: HostingFingerprint;
  healthReport?: WebsiteHealthReport;
  vulnerabilities?: SafeVulnerabilityFinding[];
  historicalDiff?: HistoricalScanDiff;
  comparisons?: SnapshotComparison[];
  priorInvestigation?: Investigation | null;
}

/**
 * Runtime execution context provided to each specialized agent
 */
export interface AgentContext {
  domain: string;
  targetUrl: string;
  authorization?: AuthorizationGateRecord;
  sharedState: AgentSharedState;
  emitTelemetry: (telemetry: Partial<AgentTelemetry> & { status?: AgentStatus }) => void;
  emitFinding: (finding: Record<string, unknown>) => void;
  emitAudit?: (entry: AuditLogEntry) => void;
  signal?: AbortSignal;
}

/**
 * Standard Worker Agent Interface implemented by all specialized agents
 */
export interface WorkerAgent<TResult = unknown> {
  readonly id: AgentId;
  readonly name: string;
  readonly role: string;
  execute(ctx: AgentContext): Promise<TResult>;
}

/**
 * Event emitter callback for SSE streaming
 */
export type AgentStreamListener = (event: AgentStreamEvent) => void;

/**
 * DAG Phase definition
 */
export type OrchestratorPhase =
  | 'PHASE_0_AUTH_INIT'
  | 'PHASE_1_CONCURRENT_RECON'
  | 'PHASE_2_VULNERABILITY_ASSESSMENT'
  | 'PHASE_3_SOURCE_ENRICHMENT'
  | 'PHASE_4_REPORTING_SYNTHESIS'
  | 'PHASE_5_AUDIT_FINALIZATION';
