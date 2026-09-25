/**
 * Multi-Agent System Architecture & Telemetry Types
 * Version 2.0 - Internet Archaeologist Platform
 */

export type AgentId =
  | 'orchestrator'
  | 'passive-recon'
  | 'tech-hosting'
  | 'snapshot-history'
  | 'contact-discovery'
  | 'website-health'
  | 'safe-vulnerability'
  | 'source-enrichment'
  | 'reporting';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AgentTelemetry {
  id: AgentId;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number; // 0 to 100
  currentAction: string;
  findingsCount: number;
  durationMs?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export type AuthorizationScopeType = 'passive_only' | 'authorized_defensive';

export interface AuthorizationGateRecord {
  targetDomain: string;
  scope: AuthorizationScopeType;
  authorizedBy: string;
  organization?: string;
  timestamp: string;
  disclaimerAccepted: boolean;
  notes?: string;
  auditSignatureHash: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  domain: string;
  operator: string;
  action: 'SCAN_INITIATED' | 'AUTH_GRANTED' | 'AGENT_STARTED' | 'AGENT_COMPLETED' | 'AGENT_FAILED' | 'SCAN_COMPLETED' | 'REPORT_EXPORTED';
  scope: AuthorizationScopeType;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface AgentStreamEvent {
  type: 'telemetry' | 'finding' | 'complete' | 'error' | 'audit';
  agentId: AgentId;
  timestamp: string;
  payload: {
    telemetry?: AgentTelemetry;
    message?: string;
    auditEntry?: AuditLogEntry;
    partialResult?: Record<string, unknown>;
  };
}

export interface OmniRouteSubagentTask {
  id: string;
  title: string;
  prompt: string;
  role: 'code' | 'research' | 'general';
  model: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  auditFindings?: string[];
  executionTimeMs?: number;
  tokensUsed?: number;
  createdAt: string;
  targetDomain?: string;
  error?: string;
}

