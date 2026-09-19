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
import { Globe, Loader2, Copy, Check, AlertTriangle, Terminal } from 'lucide-react';

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
  | 'analytics';

export default function Home() {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('story');
  const [highlightEvidenceId, setHighlightEvidenceId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<Investigation[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Update browser tab title dynamically with active domain
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = investigation?.domain
        ? `${investigation.domain} — Internet Archaeologist Platform v1.5`
        : 'Internet Archaeologist Platform v1.5';
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
    const cleaned = input
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^ftp:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();

    if (!cleaned) {
      return { valid: false, cleaned: '', error: 'Domain name cannot be empty.' };
    }

    const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(cleaned)) {
      return {
        valid: false,
        cleaned,
        error: `"${input}" is not a valid domain name. Example format: github.com or cloudflare.com`,
      };
    }

    return { valid: true, cleaned };
  };

  const handleInvestigate = useCallback(
    async (targetDomainInput: string, initialTab?: NavigationTab) => {
      const validation = validateDomain(targetDomainInput);
      if (!validation.valid) {
        setError(validation.error || 'Invalid domain format.');
        return;
      }

      const targetDomain = validation.cleaned;
      setLoading(true);
      setError(null);
      setLoadingStage(0);

      updateUrlParams(targetDomain, initialTab);

      const stageInterval = setInterval(() => {
        setLoadingStage((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 700);

      try {
        const res = await fetch('/api/investigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: targetDomain }),
        });

        if (!res.ok) {
          throw new Error(
            `Failed to fetch investigation for "${targetDomain}". Upstream service responded with HTTP ${res.status}.`
          );
        }

        const data: Investigation = await res.json();
        setInvestigation(data);
        saveInvestigation(data);
        setSavedList(getSavedInvestigations());
        if (initialTab) {
          setActiveTab(initialTab);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'An error occurred during domain research.';
        setError(msg);
      } finally {
        clearInterval(stageInterval);
        setLoading(false);
      }
    },
    [updateUrlParams]
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
        handleInvestigate(queryDomain, queryTab || undefined);
        return;
      }
    }

    handleInvestigate('example.com');
  }, [handleInvestigate]);

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

  const currentStage = useMemo(
    () => LOADING_STAGES[loadingStage] || LOADING_STAGES[0],
    [loadingStage]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        currentDomain={investigation?.domain || 'example.com'}
        onSearch={(d) => handleInvestigate(d)}
        onExportReport={handleExportReport}
        savedCount={savedList.length}
        onToggleSavedModal={() => setIsSavedModalOpen(true)}
        onOpenGlobalSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Loading Progress State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 px-6 space-y-6 bg-slate-900/70 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
            <div className="relative">
              <Loader2 className="w-14 h-14 text-amber-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
            </div>

            <div className="w-full max-w-md space-y-3 text-center">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Terminal className="w-3.5 h-3.5" /> Stage {loadingStage + 1} of{' '}
                  {LOADING_STAGES.length}
                </span>
                <span className="font-bold text-slate-200">{currentStage.progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-md"
                  style={{ width: `${currentStage.progress}%` }}
                />
              </div>

              <p className="text-slate-300 font-mono text-xs tracking-wide animate-pulse pt-1">
                {currentStage.label}
              </p>
            </div>
          </div>
        )}

        {/* Error Notification Card */}
        {error && !loading && (
          <div className="p-6 bg-red-950/40 border border-red-800/80 text-red-200 rounded-2xl text-xs md:text-sm font-mono flex items-start gap-3.5 shadow-2xl">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-300 uppercase tracking-wider block">
                Investigation Scan Error:
              </span>
              <p className="text-slate-300 font-sans text-xs">{error}</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleInvestigate('example.com')}
                  className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 rounded-lg text-xs font-mono text-red-200 transition-colors cursor-pointer"
                >
                  Try scanning example.com
                </button>
                <button
                  onClick={() => handleInvestigate('github.com')}
                  className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 rounded-lg text-xs font-mono text-red-200 transition-colors cursor-pointer"
                >
                  Try scanning github.com
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
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-4 backdrop-blur-xl">
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-2">
                        <h3 className="text-xl font-extrabold text-slate-100 font-mono flex items-center gap-2">
                          <Globe className="w-5 h-5 text-amber-400" />
                          Authoritative DNS Zone Records
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTraceEvidence('ev-dns-' + investigation.domain)}
                            className="text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold transition-colors cursor-pointer"
                          >
                            Trace DNS Evidence
                          </button>
                          <span className="text-xs text-slate-400 font-mono">
                            {investigation.dnsRecords.length} entries resolved via DoH
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-mono tracking-wider">
                              <th className="p-3.5">Type</th>
                              <th className="p-3.5">Value / Target Record</th>
                              <th className="p-3.5">TTL</th>
                              <th className="p-3.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {investigation.dnsRecords.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-950/60 transition-colors group">
                                <td className="p-3.5 font-bold text-amber-400">
                                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md">
                                    {r.type}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-200 font-semibold">{r.value}</td>
                                <td className="p-3.5 text-slate-400">{r.ttl || 3600}s</td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => copyText(r.value)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="Copy record value"
                                  >
                                    {copiedValue === r.value ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-slate-400" />
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
                </ErrorBoundary>
              </div>
            </div>
          </>
        )}
      </main>

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
    </div>
  );
}
