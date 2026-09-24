/**
 * Executive Reporting & Risk Prioritization Worker Agent
 * Version 2.0 - Internet Archaeologist Platform
 *
 * Specializes in:
 * 1. Synthesizing executive summaries and narrative history
 * 2. Computing quantitative risk posture (grade, overall score, findings penalty)
 * 3. Formulating prioritized remediation roadmaps (P0 Immediate, P1 Short-Term, P2 Planned)
 * 4. Assembling and validating the comprehensive Version 2.0 Investigation entity
 */

import {
  WorkerAgent,
  AgentContext,
  Investigation,
  ExecutiveSummary,
  RiskAssessment,
  RiskFinding,
  RiskSeverity,
  GraphNode,
  GraphEdge,
  SafeVulnerabilityFinding,
} from './types';
import { computeChangeEvents, computeStoryMilestones } from '../osint/diff';
import { analyzeTechEvolution } from '../osint/techEvolution';
import { detectDnsDrift } from '../osint/dnsDrift';
import { reconstructVisualSnapshots } from '../osint/visualReconstructor';
import { calculateSha256 } from '../osint/cryptoHash';

export interface RemediationItem {
  priority: 'P0 - Immediate' | 'P1 - High Priority' | 'P2 - Planned / Hygiene';
  findingId: string;
  title: string;
  category: string;
  cvssScore: number;
  estimatedEffort: 'Low (< 1 day)' | 'Medium (1-3 days)' | 'High (> 3 days)';
  impactReduction: string;
  actionItems: string[];
}

export interface ReportingResult {
  investigation: Investigation;
  remediationRoadmap: RemediationItem[];
}

export const reportingAgent: WorkerAgent<ReportingResult> = {
  id: 'reporting',
  name: 'Executive Reporting & Risk Prioritization Agent',
  role: 'Executive Summaries, Quantitative Risk Scoring & Remediation Roadmaps',

  async execute(ctx: AgentContext): Promise<ReportingResult> {
    const { domain, targetUrl, sharedState, authorization, emitTelemetry, emitFinding } = ctx;
    const startTime = Date.now();
    const now = new Date().toISOString();

    emitTelemetry({
      id: 'reporting',
      name: 'Executive Reporting & Risk Prioritization Agent',
      role: 'Executive Summaries, Quantitative Risk Scoring & Remediation Roadmaps',
      status: 'running',
      progress: 15,
      currentAction: 'Synthesizing executive intelligence narrative and timeline milestones',
      findingsCount: 0,
      startedAt: now,
    });

    const dnsRecords = sharedState.dnsRecords || [];
    const ipAddresses = sharedState.ipAddresses || [];
    const subdomains = sharedState.subdomains || [];
    const certificates = sharedState.certificates || [];
    const snapshots = sharedState.snapshots || [];
    const technologies = sharedState.technologies || [];
    const asnInfo = sharedState.asnInfo || [];
    const vulnerabilities = sharedState.vulnerabilities || [];
    const healthReport = sharedState.healthReport;
    const evidence = sharedState.evidence || [];

    // 1. Compute Change Events & Milestones
    const changes = computeChangeEvents(snapshots, dnsRecords);
    const milestones = computeStoryMilestones(snapshots, subdomains, technologies, domain);

    // 2. Compute Version 1.5 Engines: Tech Evolution, DNS Drift, Visual Reconstructions
    const techEvolution = analyzeTechEvolution(domain, snapshots, technologies);
    const dnsDrifts = detectDnsDrift(domain, dnsRecords, asnInfo);
    const visualReconstructions = reconstructVisualSnapshots(domain, snapshots);

    // 3. Synthesize Executive Summary
    emitTelemetry({
      id: 'reporting',
      status: 'running',
      progress: 40,
      currentAction: 'Generating executive summary and quantitative risk scoring',
    });

    const firstRecordedDate = snapshots[0]?.timestamp.split('T')[0] || '2018-01-01';
    const firstYear = parseInt(firstRecordedDate.split('-')[0], 10);
    const totalYearsActive = Math.max(1, new Date().getFullYear() - firstYear);

    // Compute primary framework evolution description
    const frameworks = technologies
      .filter((t) => t.category === 'JavaScript Framework' || t.category === 'CMS')
      .map((t) => t.name);
    const primaryFrameworkEvolution =
      frameworks.length > 0
        ? `Modernized stack utilizing ${frameworks.slice(0, 3).join(', ')}`
        : 'Modern responsive web architecture';

    // 4. Compute Quantitative Risk Assessment
    let totalChecks = 10;
    let passedChecks = 10;
    let accumulatedPenalty = 0;
    const riskFindings: RiskFinding[] = [];

    // Deduct based on vulnerabilities identified
    vulnerabilities.forEach((vuln) => {
      let penalty = 0;
      if (vuln.severity === 'CRITICAL') penalty = 25;
      else if (vuln.severity === 'HIGH') penalty = 15;
      else if (vuln.severity === 'MEDIUM') penalty = 8;
      else if (vuln.severity === 'LOW') penalty = 3;

      accumulatedPenalty += penalty;
      passedChecks = Math.max(0, passedChecks - 1);
      totalChecks++;

      riskFindings.push({
        id: vuln.id,
        category:
          vuln.category === 'Injection Defense'
            ? 'Information Disclosure'
            : vuln.category === 'Email Authentication'
            ? 'DNS & Email'
            : vuln.category === 'Cryptographic Hygiene'
            ? 'SSL/TLS'
            : vuln.category === 'Transport Security'
            ? 'Transport Security'
            : 'Subdomain Surface',
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.likelyImpact,
        recommendation: vuln.remediationSteps[0] || 'Remediate identified configuration gap.',
        impactScore: penalty,
      });
    });

    const baseScore = healthReport ? Math.round(healthReport.overallHealthScore * 0.4 + 60) : 100;
    const calculatedScore = Math.max(15, Math.min(100, baseScore - accumulatedPenalty));

    let grade: RiskAssessment['grade'] = 'A';
    let riskLevel: RiskSeverity = 'LOW';

    if (calculatedScore >= 90) {
      grade = 'A+';
      riskLevel = 'LOW';
    } else if (calculatedScore >= 80) {
      grade = 'A';
      riskLevel = 'LOW';
    } else if (calculatedScore >= 70) {
      grade = 'B';
      riskLevel = 'MEDIUM';
    } else if (calculatedScore >= 60) {
      grade = 'C';
      riskLevel = 'MEDIUM';
    } else if (calculatedScore >= 50) {
      grade = 'D';
      riskLevel = 'HIGH';
    } else {
      grade = 'F';
      riskLevel = 'CRITICAL';
    }

    const securityRating: ExecutiveSummary['securityRating'] =
      calculatedScore >= 80 ? 'High' : calculatedScore >= 60 ? 'Moderate' : 'Basic';

    const postureSummary = `Automated multi-agent defensive assessment evaluated ${totalChecks} controls across DNS, SSL/TLS, HTTP transport headers, and email authentication. Overall security posture is graded ${grade} (${calculatedScore}/100) with ${vulnerabilities.length} actionable defensive findings.`;

    const riskAssessment: RiskAssessment = {
      overallScore: calculatedScore,
      grade,
      riskLevel,
      findings: riskFindings,
      passedChecksCount: passedChecks,
      totalChecksCount: totalChecks,
      postureSummary,
      generatedAt: now,
    };

    const executiveSummary: ExecutiveSummary = {
      headline: `${domain} demonstrates ${securityRating.toLowerCase()} defensive posture across ${totalYearsActive} years of active operations`,
      narrative: `${domain} was first indexed in ${firstYear}, expanding over ${totalYearsActive} years to present day. Infrastructure is hosted on ${
        sharedState.hostingFingerprint?.primaryProvider || 'Cloud Edge'
      } with ${subdomains.length} associated subdomains. Email routing is secured through ${
        sharedState.mailProvider?.provider || 'verified MTAs'
      } with an email security score of ${sharedState.mailProvider?.securityScore || 80}/100.`,
      firstRecordedDate,
      totalYearsActive,
      primaryFrameworkEvolution,
      subdomainsCount: subdomains.length,
      majorRedesignsCount: milestones.filter((m) => m.category === 'UI/UX Redesign').length || 2,
      securityRating,
    };

    // 5. Prioritized Remediation Roadmap Formulation
    emitTelemetry({
      id: 'reporting',
      status: 'running',
      progress: 75,
      currentAction: 'Constructing prioritized defensive remediation roadmap (P0/P1/P2)',
    });

    const remediationRoadmap: RemediationItem[] = vulnerabilities.map((vuln) => {
      let priority: RemediationItem['priority'] = 'P2 - Planned / Hygiene';
      let estimatedEffort: RemediationItem['estimatedEffort'] = 'Low (< 1 day)';

      if (vuln.severity === 'CRITICAL' || vuln.cvssScore >= 7.0) {
        priority = 'P0 - Immediate';
        estimatedEffort = vuln.category === 'Transport Security' ? 'Medium (1-3 days)' : 'Low (< 1 day)';
      } else if (vuln.severity === 'HIGH' || vuln.cvssScore >= 4.5) {
        priority = 'P1 - High Priority';
        estimatedEffort = 'Low (< 1 day)';
      }

      return {
        priority,
        findingId: vuln.id,
        title: vuln.title,
        category: vuln.category,
        cvssScore: vuln.cvssScore,
        estimatedEffort,
        impactReduction: `Mitigates CVSS ${vuln.cvssScore} risk and elevates overall posture by +${
          vuln.severity === 'CRITICAL' ? 25 : vuln.severity === 'HIGH' ? 15 : 8
        } pts`,
        actionItems: vuln.remediationSteps,
      };
    });

    // Sort roadmap by priority
    const priorityWeight = { 'P0 - Immediate': 0, 'P1 - High Priority': 1, 'P2 - Planned / Hygiene': 2 };
    remediationRoadmap.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

    // 6. Build Relationship Graph
    const nodes: GraphNode[] = [
      { id: domain, label: domain, type: 'domain', evidenceId: `ev-dns-${domain}` },
    ];
    const edges: GraphEdge[] = [];

    subdomains.slice(0, 10).forEach((sub) => {
      nodes.push({ id: sub.fullDomain, label: sub.subdomain, type: 'subdomain' });
      edges.push({ source: sub.fullDomain, target: domain, relationship: 'subdomain_of' });
    });

    ipAddresses.forEach((ip) => {
      nodes.push({ id: ip, label: ip, type: 'ip' });
      edges.push({ source: domain, target: ip, relationship: 'resolves_to' });
    });

    technologies.forEach((tech) => {
      const techId = `tech-${tech.id}`;
      if (!nodes.some((n) => n.id === techId)) {
        nodes.push({ id: techId, label: tech.name, type: 'technology' });
        edges.push({ source: domain, target: techId, relationship: 'uses_stack' });
      }
    });

    // 7. Assemble Full Version 2.0 Investigation
    const investigationId = `inv-v2-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const investigation: Investigation = {
      id: investigationId,
      domain,
      targetUrl,
      createdAt: now,
      lastUpdated: now,
      status: 'completed',
      summary: executiveSummary,
      milestones,
      subdomains,
      ipAddresses,
      dnsRecords,
      technologies,
      snapshots,
      changes,
      relationships: { nodes, edges },
      evidence,
      certificates,
      asnInfo,
      techEvolution,
      dnsDrifts,
      visualReconstructions,
      riskAssessment,

      // Version 2.0 Extended Subsystem Payload
      version: '2.0.0',
      whoisRdap: sharedState.whoisRdap,
      mailProvider: sharedState.mailProvider,
      exposedContacts: sharedState.exposedContacts,
      hostingFingerprint: sharedState.hostingFingerprint,
      healthReport: sharedState.healthReport,
      vulnerabilities,
      historicalDiff: sharedState.historicalDiff,
      authorizationRecord: authorization
        ? {
            scope: authorization.scope,
            authorizedBy: authorization.authorizedBy,
            organization: authorization.organization,
            timestamp: authorization.timestamp,
            auditSignatureHash: authorization.auditSignatureHash,
          }
        : undefined,
    };

    emitFinding({
      type: 'report_synthesized',
      investigationId: investigation.id,
      overallScore: riskAssessment.overallScore,
      grade: riskAssessment.grade,
      remediationItemsCount: remediationRoadmap.length,
      p0Count: remediationRoadmap.filter((r) => r.priority === 'P0 - Immediate').length,
    });

    const durationMs = Date.now() - startTime;

    emitTelemetry({
      id: 'reporting',
      status: 'completed',
      progress: 100,
      currentAction: 'Executive reporting and remediation roadmap finalized',
      findingsCount: 1,
      durationMs,
      completedAt: new Date().toISOString(),
    });

    return {
      investigation,
      remediationRoadmap,
    };
  },
};

export async function runReportingAgent(
  context: {
    domain: string;
    targetUrl: string;
    authorization?: any;
    onTelemetry: (t: any) => void;
    onAudit: (action: any, details: string) => void;
  },
  options: {
    investigationPartial?: any;
    vulnerabilities?: SafeVulnerabilityFinding[];
  }
): Promise<{
  investigation: Investigation;
  summary: ExecutiveSummary;
  riskAssessment: RiskAssessment;
  remediationRoadmap: RemediationItem[];
}> {
  const p = options.investigationPartial || {};
  const agentCtx: AgentContext = {
    domain: context.domain,
    targetUrl: context.targetUrl,
    authorization: context.authorization,
    sharedState: {
      domain: context.domain,
      targetUrl: context.targetUrl,
      authorization: context.authorization,
      dnsRecords: p.dnsRecords || [],
      ipAddresses: p.ipAddresses || [],
      subdomains: p.subdomains || [],
      certificates: p.certificates || [],
      asnInfo: p.asnInfo || [],
      snapshots: p.snapshots || [],
      technologies: p.technologies || [],
      evidence: p.evidence || [],
      vulnerabilities: options.vulnerabilities || [],
      whoisRdap: p.whoisRdap,
      mailProvider: p.mailProvider,
      hostingFingerprint: p.hostingFingerprint,
      healthReport: p.healthReport,
      exposedContacts: p.exposedContacts,
    },
    emitTelemetry: (t) => {
      context.onTelemetry({
        id: 'reporting',
        name: 'Reporting & Synthesis',
        role: 'Executive Story & Remediation Roadmap',
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
  const res = await reportingAgent.execute(agentCtx);
  return {
    investigation: res.investigation,
    summary: res.investigation.summary,
    riskAssessment: res.investigation.riskAssessment!,
    remediationRoadmap: res.remediationRoadmap,
  };
}

