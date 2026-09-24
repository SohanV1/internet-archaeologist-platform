'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { TabBar } from '@/components/TabBar';
import { DomainOverview } from '@/components/DomainOverview';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { SavedInvestigations } from '@/components/SavedInvestigations';
import { Investigation } from '@/types/osint';
import {
  getSavedInvestigations,
  saveInvestigation,
  deleteInvestigation,
} from '@/lib/osint/storage';
import { generateHtmlReport, exportDnsToCsv, exportSubdomainsToCsv } from '@/lib/osint/export';
import { validateAndSanitizeDomain } from '@/lib/osint/validator';
import { LegalComplianceModal, ComplianceSection } from '@/components/LegalComplianceModal';
import { TargetAuthorizationModal } from '@/components/TargetAuthorizationModal';
import { AgentProgressTracker } from '@/components/AgentProgressTracker';
import { AgentId, AgentTelemetry, AuthorizationGateRecord } from '@/types/agent';
import { Globe, Loader2, Copy, Check, AlertTriangle, Terminal, ShieldAlert } from 'lucide-react';


// Lazy loading of heavy tab components for optimized perceived performance
const WebsiteStory = dynamic(
  () => import('@/components/WebsiteStory').then((m) => m.WebsiteStory),
  { loading: () => <SkeletonLoader type="card" /> }
);
const TechEvolutionMatrix = dynamic(
  () => import('@/components/TechEvolutionMatrix').then((m) => m.TechEvolutionMatrix),
  { loading: () => <SkeletonLoader type="matrix" /> }
);
const VisualArcheology = dynamic(
  () => import('@/components/VisualArcheology').then((m) => m.VisualArcheology),
  { loading: () => <SkeletonLoader type="card" /> }
);
const DnsDriftTracker = dynamic(
  () => import('@/components/DnsDriftTracker').then((m) => m.DnsDriftTracker),
  { loading: () => <SkeletonLoader type="table" /> }
);
const SnapshotComparison = dynamic(
  () => import('@/components/SnapshotComparison').then((m) => m.SnapshotComparison),
  { loading: () => <SkeletonLoader type="card" /> }
);
const SubdomainsView = dynamic(
  () => import('@/components/SubdomainsView').then((m) => m.SubdomainsView),
  { loading: () => <SkeletonLoader type="table" /> }
);
const CertificateHistory = dynamic(
  () => import('@/components/CertificateHistory').then((m) => m.CertificateHistory),
  { loading: () => <SkeletonLoader type="table" /> }
);
const DnsHistoryMap = dynamic(
  () => import('@/components/DnsHistoryMap').then((m) => m.DnsHistoryMap),
  { loading: () => <SkeletonLoader type="card" /> }
);
const DomainVsDomain = dynamic(
  () => import('@/components/DomainVsDomain').then((m) => m.DomainVsDomain),
  { loading: () => <SkeletonLoader type="card" /> }
);
const TechStack = dynamic(() => import('@/components/TechStack').then((m) => m.TechStack), {
  loading: () => <SkeletonLoader type="card" />,
});
const Timeline = dynamic(() => import('@/components/Timeline').then((m) => m.Timeline), {
  loading: () => <SkeletonLoader type="card" />,
});
const ChangeDetector = dynamic(
  () => import('@/components/ChangeDetector').then((m) => m.ChangeDetector),
  { loading: () => <SkeletonLoader type="table" /> }
);
const RelationshipGraph = dynamic(
  () => import('@/components/RelationshipGraph').then((m) => m.RelationshipGraph),
  { loading: () => <SkeletonLoader type="graph" /> }
);
const EvidenceList = dynamic(
  () => import('@/components/EvidenceList').then((m) => m.EvidenceList),
  { loading: () => <SkeletonLoader type="table" /> }
);
const AnalyticsDashboard = dynamic(
  () => import('@/components/AnalyticsDashboard').then((m) => m.AnalyticsDashboard),
  { loading: () => <SkeletonLoader type="card" /> }
);
const DomainIntelligenceView = dynamic(
  () => import('@/components/DomainIntelligenceView').then((m) => m.DomainIntelligenceView),
  { loading: () => <SkeletonLoader type="card" /> }
);
const WebsiteHealthCard = dynamic(
  () => import('@/components/WebsiteHealthCard').then((m) => m.WebsiteHealthCard),
  { loading: () => <SkeletonLoader type="card" /> }
);
const VulnerabilityReport = dynamic(
  () => import('@/components/VulnerabilityReport').then((m) => m.VulnerabilityReport),
  { loading: () => <SkeletonLoader type="table" /> }
);
const SnapshotHistoryDiff = dynamic(
  () => import('@/components/SnapshotHistoryDiff').then((m) => m.SnapshotHistoryDiff),
  { loading: () => <SkeletonLoader type="card" /> }
);

const LOADING_STAGES = [
  { label: 'Resolving Cloudflare DoH & Authoritative DNS Zones...', progress: 20 },
  { label: 'Querying Certificate Transparency & Subdomain Registers...', progress: 40 },
  { label: 'Analyzing IP Routing, Autonomous Systems (ASN) & TLS...', progress: 60 },
  { label: 'Indexing Wayback Machine CDX Historical Snapshots...', progress: 80 },
  { label: 'Analyzing Tech Drift, Visual Wireframes & Synthesizing Story...', progress: 95 },
];

export type NavigationTab =
  | 'story'
  | 'tech-evolution'
  | 'visual-archeology'
  | 'dns-drift'
  | 'compare'
  | 'subdomains'
  | 'certs'
  | 'infra'
  | 'vs'
  | 'overview'
  | 'tech'
  | 'timeline'
  | 'changes'
  | 'graph'
  | 'evidence'
  | 'analytics'
  | 'domain-intel'
  | 'website-health'
  | 'vulnerabilities'
  | 'scan-diff';

const INITIAL_TELEMETRIES: Record<AgentId, AgentTelemetry> = {
  orchestrator: { id: 'orchestrator', name: 'Central Orchestrator', role: 'Workflow Coordinator & Audit', status: 'idle', progress: 0, currentAction: 'Initialized', findingsCount: 0 },
  'passive-recon': { id: 'passive-recon', name: 'Passive Recon', role: 'DNS, CT Logs & RDAP', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  'tech-hosting': { id: 'tech-hosting', name: 'Tech & Hosting', role: 'Infrastructure & Mail Detection', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  'snapshot-history': { id: 'snapshot-history', name: 'Snapshot & History', role: 'Temporal Forensics & Version Diffing', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  'contact-discovery': { id: 'contact-discovery', name: 'Contact Discovery', role: 'Public Contact & security.txt Parser', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  'website-health': { id: 'website-health', name: 'Website Health', role: 'HTTP Performance & Login Hygiene', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  'safe-vulnerability': { id: 'safe-vulnerability', name: 'Safe Vulnerability', role: 'Defensive Posture & CVSS Scoring', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  'source-enrichment': { id: 'source-enrichment', name: 'Source Enrichment', role: 'Authoritative Citations & RFC Specs', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
  reporting: { id: 'reporting', name: 'Reporting Agent', role: 'Executive Summary & Posture Ledger', status: 'idle', progress: 0, currentAction: 'Pending launch', findingsCount: 0 },
};

export default function Home() {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('story');
  const [highlightEvidenceId, setHighlightEvidenceId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<Investigation[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalSection, setLegalSection] = useState<ComplianceSection>('ethics');

  // v2.0 Parallel Telemetry & Authorization State
  const [telemetries, setTelemetries] = useState<Record<AgentId, AgentTelemetry>>(INITIAL_TELEMETRIES);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingTargetDomain, setPendingTargetDomain] = useState<string>('');
  const [pendingInitialTab, setPendingInitialTab] = useState<NavigationTab | undefined>(undefined);
  const [activeDomain, setActiveDomain] = useState<string>('');

  const handleOpenLegal = useCallback((section: ComplianceSection) => {
    setLegalSection(section);
    setIsLegalModalOpen(true);
  }, []);

  // Update browser tab title dynamically with active domain
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = investigation?.domain
        ? `${investigation.domain} — Internet Archaeologist Platform v2.0`
        : 'Internet Archaeologist Platform v2.0';
    }
  }, [investigation]);

  const updateUrlParams = useCallback(
    (domain: string, tab?: NavigationTab) => {
      if (typeof window !== 'undefined' && window.history.pushState) {
        const currentTab = tab || activeTab;
        const newUrl = `${window.location.pathname}?domain=${encodeURIComponent(domain)}&tab=${encodeURIComponent(currentTab)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    },
    [activeTab]
  );

  const handleTabChange = useCallback(
    (tab: NavigationTab) => {
      setActiveTab(tab);
      if (investigation) {
        updateUrlParams(investigation.domain, tab);
      }
    },
    [investigation, updateUrlParams]
  );

  const validateDomain = (input: string): { valid: boolean; cleaned: string; error?: string } => {
    const res = validateAndSanitizeDomain(input);
    if (!res.isValid || !res.sanitizedDomain) {
      return {
        valid: false,
        cleaned: input,
        error: res.error || `"${input}" is not a valid domain name. Example format: github.com or cloudflare.com`,
      };
    }
    return { valid: true, cleaned: res.sanitizedDomain };
  };

  const startInvestigationStream = useCallback(
    async (targetDomain: string, authRecord?: AuthorizationGateRecord, initialTab?: NavigationTab) => {
      setLoading(true);
      setError(null);
      setActiveDomain(targetDomain);
      setTelemetries({
        orchestrator: { id: 'orchestrator', name: 'Central Orchestrator', role: 'Workflow Coordinator & Audit', status: 'running', progress: 10, currentAction: 'Coordinating agent pipeline', findingsCount: 0 },
        'passive-recon': { id: 'passive-recon', name: 'Passive Recon', role: 'DNS, CT Logs & RDAP', status: 'running', progress: 15, currentAction: 'Resolving DNS and crt.sh logs', findingsCount: 0 },
        'tech-hosting': { id: 'tech-hosting', name: 'Tech & Hosting', role: 'Infrastructure & Mail Detection', status: 'running', progress: 15, currentAction: 'Fingerprinting MX and hosting', findingsCount: 0 },
        'snapshot-history': { id: 'snapshot-history', name: 'Snapshot & History', role: 'Temporal Forensics & Version Diffing', status: 'running', progress: 15, currentAction: 'Indexing Wayback snapshots', findingsCount: 0 },
        'contact-discovery': { id: 'contact-discovery', name: 'Contact Discovery', role: 'Public Contact & security.txt Parser', status: 'idle', progress: 0, currentAction: 'Queued', findingsCount: 0 },
        'website-health': { id: 'website-health', name: 'Website Health', role: 'HTTP Performance & Login Hygiene', status: 'idle', progress: 0, currentAction: 'Queued', findingsCount: 0 },
        'safe-vulnerability': { id: 'safe-vulnerability', name: 'Safe Vulnerability', role: 'Defensive Posture & CVSS Scoring', status: 'idle', progress: 0, currentAction: 'Queued', findingsCount: 0 },
        'source-enrichment': { id: 'source-enrichment', name: 'Source Enrichment', role: 'Authoritative Citations & RFC Specs', status: 'idle', progress: 0, currentAction: 'Queued', findingsCount: 0 },
        reporting: { id: 'reporting', name: 'Reporting Agent', role: 'Executive Summary & Posture Ledger', status: 'idle', progress: 0, currentAction: 'Queued', findingsCount: 0 },
      });

      updateUrlParams(targetDomain, initialTab);

      try {
        const streamRes = await fetch('/api/investigate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: targetDomain, authorization: authRecord }),
        });

        if (!streamRes.ok || !streamRes.body) {
          // Fallback to standard investigate endpoint
          const fallbackRes = await fetch('/api/investigate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: targetDomain, authorization: authRecord }),
          });

          if (!fallbackRes.ok) {
            throw new Error(`Failed to fetch investigation for "${targetDomain}". Upstream service responded with HTTP ${fallbackRes.status}.`);
          }

          const fallbackData: Investigation = await fallbackRes.json();
          setInvestigation(fallbackData);
          saveInvestigation(fallbackData);
          setSavedList(getSavedInvestigations());
          if (initialTab) setActiveTab(initialTab);
          return;
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalInvestigation: Investigation | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const msg of messages) {
            const trimmed = msg.trim();
            if (!trimmed) continue;

            const eventMatch = trimmed.match(/^event:\s*(\w+)/m);
            const dataMatch = trimmed.match(/^data:\s*(.*)$/ms);

            const eventType = eventMatch ? eventMatch[1] : 'message';
            const dataStr = dataMatch ? dataMatch[1] : '';

            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (eventType === 'telemetry') {
                  const tel = parsed.telemetry || parsed;
                  if (tel && tel.id) {
                    setTelemetries((prev) => ({
                      ...prev,
                      [tel.id]: {
                        ...prev[tel.id as AgentId],
                        ...tel,
                      },
                    }));
                  }
                } else if (eventType === 'complete') {
                  finalInvestigation = (parsed.payload?.partialResult || parsed.payload || parsed) as Investigation;
                } else if (eventType === 'error') {
                  throw new Error(parsed.error || 'Agent swarm encountered an error');
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }

        if (finalInvestigation) {
          setInvestigation(finalInvestigation);
          saveInvestigation(finalInvestigation);
          setSavedList(getSavedInvestigations());
          if (initialTab) {
            setActiveTab(initialTab);
          }
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'An error occurred during domain research.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [updateUrlParams]
  );

  const handleInvestigate = useCallback(
    async (targetDomainInput: string, initialTab?: NavigationTab) => {
      const validation = validateDomain(targetDomainInput);
      if (!validation.valid) {
        setError(validation.error || 'Invalid domain format.');
        return;
      }

      const targetDomain = validation.cleaned;
      setPendingTargetDomain(targetDomain);
      setPendingInitialTab(initialTab);
      setIsAuthModalOpen(true);
    },
    []
  );

  const handleAuthorizeAndScan = useCallback(
    (record: AuthorizationGateRecord) => {
      setIsAuthModalOpen(false);
      startInvestigationStream(record.targetDomain, record, pendingInitialTab);
    },
    [pendingInitialTab, startInvestigationStream]
  );

  // Initial startup load
  useEffect(() => {
    const list = getSavedInvestigations();
    setSavedList(list);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryDomain = params.get('domain');
      const queryTab = params.get('tab') as NavigationTab | null;

      if (queryTab) {
        setActiveTab(queryTab);
      }

      if (queryDomain) {
        startInvestigationStream(queryDomain, undefined, queryTab || undefined);
        return;
      } else if (list.length > 0) {
        setInvestigation(list[0]);
        return;
      }
    }

    startInvestigationStream('example.com', undefined, 'story');
  }, [startInvestigationStream]);

  const handleTraceEvidence = useCallback(
    (evidenceIdOrEntity: string) => {
      if (!investigation) return;

      const match = investigation.evidence.find(
        (ev) =>
          ev.id === evidenceIdOrEntity ||
          (ev.relatedEntity &&
            ev.relatedEntity.toLowerCase() === evidenceIdOrEntity.toLowerCase()) ||
          ev.id.toLowerCase().includes(evidenceIdOrEntity.toLowerCase())
      );

      const targetId = match ? match.id : evidenceIdOrEntity;
      setHighlightEvidenceId(targetId);
      handleTabChange('evidence');

      setTimeout(() => {
        const el = document.getElementById(`evidence-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    },
    [investigation, handleTabChange]
  );

  const handleDeleteSaved = useCallback((id: string) => {
    deleteInvestigation(id);
    setSavedList(getSavedInvestigations());
  }, []);

  const handleExportReport = useCallback(
    (format: 'json' | 'html' | 'csv-dns' | 'csv-subs') => {
      if (!investigation) return;

      let blob: Blob;
      let filename: string;
      const dateStr = new Date().toISOString().split('T')[0];

      switch (format) {
        case 'html': {
          const htmlContent = generateHtmlReport(investigation);
          blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          filename = `osint-audit-report-${investigation.domain}-${dateStr}.html`;
          break;
        }
        case 'csv-dns': {
          const csvContent = exportDnsToCsv(investigation);
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          filename = `dns-zones-${investigation.domain}-${dateStr}.csv`;
          break;
        }
        case 'csv-subs': {
          const csvContent = exportSubdomainsToCsv(investigation);
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          filename = `subdomains-${investigation.domain}-${dateStr}.csv`;
          break;
        }
        case 'json':
        default: {
          blob = new Blob([JSON.stringify(investigation, null, 2)], { type: 'application/json' });
          filename = `osint-report-${investigation.domain}-${dateStr}.json`;
          break;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [investigation]
  );

  const copyText = useCallback((val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      <Navbar
        currentDomain={investigation?.domain || 'example.com'}
        onSearch={(d) => handleInvestigate(d)}
        onExportReport={handleExportReport}
        savedCount={savedList.length}
        onToggleSavedModal={() => setIsSavedModalOpen(true)}
        onOpenGlobalSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Loading Progress State - v2.0 Real-Time Parallel Telemetry */}
        {loading && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <AgentProgressTracker
              telemetries={telemetries}
              activeDomain={activeDomain || pendingTargetDomain || 'target domain'}
            />
          </div>
        )}

        {/* Error Notification Card */}
        {error && !loading && (
          <div className="p-5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-neutral-900 dark:text-neutral-100 rounded-2xl text-xs md:text-sm flex items-start gap-3.5 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="font-semibold text-red-600 dark:text-red-400 text-xs uppercase tracking-wider block">
                Investigation Notice
              </span>
              <p className="text-neutral-700 dark:text-neutral-300 text-xs">{error}</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleInvestigate('example.com')}
                  className="px-3 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300 border border-black/[0.08] dark:border-white/[0.1] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Scan example.com
                </button>
                <button
                  onClick={() => handleInvestigate('github.com')}
                  className="px-3 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300 border border-black/[0.08] dark:border-white/[0.1] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Scan github.com
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Investigation Views */}
        {investigation && !loading && (
          <>
            {/* Domain Top Overview Banner with Codebase Intelligence */}
            <DomainOverview
              investigation={investigation}
              onTraceEvidence={handleTraceEvidence}
              onNavigateToAnalytics={() => handleTabChange('analytics')}
            />

            {/* Sidebar + Main Content Flex Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Collapsible Sidebar Tab Navigation */}
              <TabBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                counts={{
                  subdomains: investigation.subdomains?.length,
                  evidence: investigation.evidence?.length,
                  graphNodes: investigation.relationships?.nodes.length,
                  dnsRecords: investigation.dnsRecords?.length,
                  snapshots: investigation.snapshots?.length,
                  contacts: investigation.exposedContacts?.length,
                  healthIssues: (investigation.websiteHealth || investigation.healthReport)?.brokenLinks?.length,
                  vulns: investigation.vulnerabilities?.length,
                }}
              />

              {/* Main Tab Views Content Container with Error Boundary */}
              <div className="flex-1 w-full min-w-0 space-y-6">
                <ErrorBoundary fallbackTitle="Module Render Exception">
                  {activeTab === 'story' && investigation.summary && (
                    <WebsiteStory
                      domain={investigation.domain}
                      summary={investigation.summary}
                      milestones={investigation.milestones || []}
                      subdomains={investigation.subdomains || []}
                      technologies={investigation.technologies || []}
                      onNavigateToTab={(tab) => {
                        if (tab === 'tech') handleTabChange('tech-evolution');
                        else if (tab === 'timeline') handleTabChange('timeline');
                        else if (tab === 'changes') handleTabChange('changes');
                        else if (tab === 'graph') handleTabChange('graph');
                        else if (tab === 'subdomains') handleTabChange('subdomains');
                      }}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'analytics' && <AnalyticsDashboard />}

                  {activeTab === 'tech-evolution' && (
                    <TechEvolutionMatrix
                      techEvolution={investigation.techEvolution}
                      domain={investigation.domain}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'visual-archeology' && (
                    <VisualArcheology
                      reconstructions={investigation.visualReconstructions}
                      snapshots={investigation.snapshots}
                      domain={investigation.domain}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'dns-drift' && (
                    <DnsDriftTracker
                      dnsDrifts={investigation.dnsDrifts}
                      dnsRecords={investigation.dnsRecords}
                      domain={investigation.domain}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'compare' && (
                    <SnapshotComparison
                      snapshots={investigation.snapshots}
                      domain={investigation.domain}
                    />
                  )}

                  {activeTab === 'subdomains' && (
                    <SubdomainsView
                      subdomains={investigation.subdomains || []}
                      rootDomain={investigation.domain}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'certs' && (
                    <CertificateHistory
                      certificates={investigation.certificates}
                      domain={investigation.domain}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'infra' && (
                    <DnsHistoryMap
                      asnInfo={investigation.asnInfo}
                      dnsRecords={investigation.dnsRecords}
                      domain={investigation.domain}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'vs' && <DomainVsDomain currentInvestigation={investigation} />}

                  {activeTab === 'overview' && (
                    <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 md:p-8 apple-card space-y-4 backdrop-blur-xl">
                      <div className="flex flex-wrap items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4 gap-2">
                        <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                          Authoritative DNS Zone Records
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTraceEvidence('ev-dns-' + investigation.domain)}
                            className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 px-3 py-1 rounded-full font-medium transition-colors cursor-pointer"
                          >
                            Trace DNS Evidence
                          </button>
                          <span className="text-xs text-neutral-500">
                            {investigation.dnsRecords.length} entries resolved via DoH
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-neutral-500 uppercase font-medium tracking-wider">
                              <th className="p-3.5">Type</th>
                              <th className="p-3.5">Value / Target Record</th>
                              <th className="p-3.5">TTL</th>
                              <th className="p-3.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] font-mono">
                            {investigation.dnsRecords.map((r, i) => (
                              <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                <td className="p-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                                  <span className="px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-md text-[11px]">
                                    {r.type}
                                  </span>
                                </td>
                                <td className="p-3.5 text-neutral-800 dark:text-neutral-200 font-medium">{r.value}</td>
                                <td className="p-3.5 text-neutral-500">{r.ttl || 3600}s</td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => copyText(r.value)}
                                    className="p-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 rounded-md text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="Copy record value"
                                  >
                                    {copiedValue === r.value ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tech' && (
                    <TechStack
                      technologies={investigation.technologies}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'timeline' && (
                    <Timeline
                      snapshots={investigation.snapshots}
                      onNavigateToCompare={() => handleTabChange('visual-archeology')}
                      onTraceEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'changes' && <ChangeDetector changes={investigation.changes} />}

                  {activeTab === 'graph' && (
                    <RelationshipGraph
                      data={investigation.relationships}
                      onSelectEvidence={handleTraceEvidence}
                    />
                  )}

                  {activeTab === 'evidence' && (
                    <EvidenceList
                      evidence={investigation.evidence}
                      highlightId={highlightEvidenceId}
                    />
                  )}

                  {activeTab === 'domain-intel' && (
                    <DomainIntelligenceView investigation={investigation} />
                  )}

                  {activeTab === 'website-health' && (
                    <WebsiteHealthCard
                      healthReport={investigation.websiteHealth || investigation.healthReport}
                      targetDomain={investigation.domain}
                    />
                  )}

                  {activeTab === 'vulnerabilities' && (
                    <VulnerabilityReport
                      findings={investigation.vulnerabilities}
                      targetDomain={investigation.domain}
                    />
                  )}

                  {activeTab === 'scan-diff' && (
                    <SnapshotHistoryDiff
                      currentInvestigation={investigation}
                      savedInvestigations={savedList}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Minimal Apple Footer with Legal & Compliance Transparency */}
      <footer className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-4">
        <div className="flex items-center gap-2">
          <span>Internet Archaeologist © 2026</span>
          <span>•</span>
          <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">RFC 8484 / RFC 6962 Passive Forensics</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => handleOpenLegal('ethics')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Ethical OSINT Charter
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenLegal('privacy')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Privacy & GDPR
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenLegal('terms')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Terms of Use
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenLegal('provenance')}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cryptographic Integrity
          </button>
        </div>
      </footer>

      {/* Global Search Bar (⌘K) Modal */}
      <GlobalSearchBar
        investigation={investigation}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab, highlightId) => {
          handleTabChange(tab);
          if (highlightId) {
            handleTraceEvidence(highlightId);
          }
        }}
      />

      {/* Saved Investigations Modal */}
      <SavedInvestigations
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedList={savedList}
        onSelect={(inv) => {
          setInvestigation(inv);
          handleTabChange('story');
        }}
        onDelete={handleDeleteSaved}
      />

      {/* Legal & Compliance Modal */}
      <LegalComplianceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultSection={legalSection}
      />

      {/* Target Authorization Gate Modal */}
      <TargetAuthorizationModal
        isOpen={isAuthModalOpen}
        targetDomain={pendingTargetDomain}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthorize={handleAuthorizeAndScan}
      />
    </div>
  );
}
