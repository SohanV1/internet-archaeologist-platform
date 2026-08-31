'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { DomainOverview } from '@/components/DomainOverview';
import { WebsiteStory } from '@/components/WebsiteStory';
import { SubdomainsView } from '@/components/SubdomainsView';
import { TechStack } from '@/components/TechStack';
import { Timeline } from '@/components/Timeline';
import { SnapshotComparison } from '@/components/SnapshotComparison';
import { CertificateHistory } from '@/components/CertificateHistory';
import { DnsHistoryMap } from '@/components/DnsHistoryMap';
import { DomainVsDomain } from '@/components/DomainVsDomain';
import { ChangeDetector } from '@/components/ChangeDetector';
import { RelationshipGraph } from '@/components/RelationshipGraph';
import { EvidenceList } from '@/components/EvidenceList';
import { SavedInvestigations } from '@/components/SavedInvestigations';
import { Investigation } from '@/types/osint';
import { getSavedInvestigations, saveInvestigation, deleteInvestigation } from '@/lib/osint/storage';
import { generateHtmlReport, exportDnsToCsv, exportSubdomainsToCsv, exportChangesToCsv } from '@/lib/osint/export';
import { 
  Globe, 
  Cpu, 
  History, 
  GitCompare, 
  Network, 
  Shield, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  AlertTriangle,
  ArrowRight,
  Search,
  CheckCircle2,
  Terminal,
  Lock,
  Server,
  Swords
} from 'lucide-react';

const LOADING_STAGES = [
  { label: 'Resolving Cloudflare DoH & Authoritative DNS Zones...', progress: 20 },
  { label: 'Querying Certificate Transparency & Subdomain Registers...', progress: 40 },
  { label: 'Analyzing IP Routing, Autonomous Systems (ASN) & TLS...', progress: 60 },
  { label: 'Indexing Wayback Machine CDX Historical Snapshots...', progress: 80 },
  { label: 'Analyzing Tech Fingerprints & Synthesizing Story...', progress: 95 }
];

export default function Home() {
  const [investigation, setInvestigation] = React.useState<Investigation | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [loadingStage, setLoadingStage] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    'story' | 'compare' | 'subdomains' | 'certs' | 'infra' | 'vs' | 'overview' | 'tech' | 'timeline' | 'changes' | 'graph' | 'evidence'
  >('story');
  const [highlightEvidenceId, setHighlightEvidenceId] = React.useState<string | null>(null);
  const [savedList, setSavedList] = React.useState<Investigation[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = React.useState<boolean>(false);
  const [copiedValue, setCopiedValue] = React.useState<string | null>(null);

  // Update browser tab title dynamically with active domain
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = investigation?.domain 
        ? `${investigation.domain} — Internet Archaeologist Platform` 
        : 'Internet Archaeologist Platform';
    }
  }, [investigation]);

  // Load saved projects and check URL parameters on startup
  React.useEffect(() => {
    const list = getSavedInvestigations();
    setSavedList(list);

    // Read ?domain= query parameter from URL if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryDomain = params.get('domain');
      if (queryDomain) {
        handleInvestigate(queryDomain);
        return;
      }
    }

    // Default target domain
    handleInvestigate('example.com');
  }, []);

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

    // Standard RFC domain validation regex
    const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(cleaned)) {
      return { 
        valid: false, 
        cleaned, 
        error: `"${input}" is not a valid domain name. Example format: github.com or cloudflare.com` 
      };
    }

    return { valid: true, cleaned };
  };

  const handleInvestigate = async (targetDomainInput: string) => {
    const validation = validateDomain(targetDomainInput);
    if (!validation.valid) {
      setError(validation.error || 'Invalid domain format.');
      return;
    }

    const targetDomain = validation.cleaned;
    setLoading(true);
    setError(null);
    setLoadingStage(0);

    // Update browser URL query parameter without full reload
    if (typeof window !== 'undefined' && window.history.pushState) {
      const newUrl = `${window.location.pathname}?domain=${encodeURIComponent(targetDomain)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }

    // Progress stage animation timers
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain })
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch investigation for "${targetDomain}". Upstream service responded with HTTP ${res.status}.`);
      }

      const data: Investigation = await res.json();
      setInvestigation(data);
      saveInvestigation(data);
      setSavedList(getSavedInvestigations());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during domain research.';
      setError(msg);
    } finally {
      clearInterval(stageInterval);
      setLoading(false);
    }
  };

  const handleTraceEvidence = (evidenceIdOrEntity: string) => {
    if (!investigation) return;

    // Find matching evidence item
    const match = investigation.evidence.find(ev => 
      ev.id === evidenceIdOrEntity ||
      (ev.relatedEntity && ev.relatedEntity.toLowerCase() === evidenceIdOrEntity.toLowerCase()) ||
      ev.id.toLowerCase().includes(evidenceIdOrEntity.toLowerCase())
    );

    const targetId = match ? match.id : evidenceIdOrEntity;
    setHighlightEvidenceId(targetId);
    setActiveTab('evidence');

    // Smoothly scroll to the evidence card after tab render
    setTimeout(() => {
      const el = document.getElementById(`evidence-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleDeleteSaved = (id: string) => {
    deleteInvestigation(id);
    setSavedList(getSavedInvestigations());
  };

  const handleExportReport = (format: 'json' | 'html' | 'csv-dns' | 'csv-subs') => {
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
  };

  const copyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const currentStage = LOADING_STAGES[loadingStage] || LOADING_STAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        currentDomain={investigation?.domain || 'example.com'}
        onSearch={handleInvestigate}
        onExportReport={handleExportReport}
        savedCount={savedList.length}
        onToggleSavedModal={() => setIsSavedModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
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
                  <Terminal className="w-3.5 h-3.5" /> Stage {loadingStage + 1} of {LOADING_STAGES.length}
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
              <span className="font-bold text-red-300 uppercase tracking-wider block">Investigation Scan Error:</span>
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
            {/* Domain Top Overview Banner */}
            <DomainOverview 
              investigation={investigation} 
              onTraceEvidence={handleTraceEvidence}
            />

            {/* Navigation Tabs Bar */}
            <div className="flex flex-wrap border-b border-slate-800/80 gap-1.5 font-mono text-xs p-1.5 bg-slate-900/50 rounded-2xl backdrop-blur-md">
              {/* 1. What Happened / Evolution Story Tab */}
              <button
                onClick={() => setActiveTab('story')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'story'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-md glow-amber'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Story & Evolution</span>
                {investigation.milestones?.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                    {investigation.milestones.length}
                  </span>
                )}
              </button>

              {/* 2. Before / After Comparison Tab */}
              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'compare'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-md glow-amber'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <GitCompare className="w-4 h-4 text-amber-400" />
                <span>Diff Viewer</span>
              </button>

              {/* 3. Subdomains Recon Tab */}
              <button
                onClick={() => setActiveTab('subdomains')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'subdomains'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-md glow-emerald'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Network className="w-4 h-4 text-emerald-400" />
                <span>Subdomains ({investigation.subdomains?.length || 0})</span>
              </button>

              {/* 4. SSL/TLS Certificates Tab */}
              <button
                onClick={() => setActiveTab('certs')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'certs'
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Certificates ({investigation.certificates?.length || 0})</span>
              </button>

              {/* 5. IP & ASN Infrastructure Tab */}
              <button
                onClick={() => setActiveTab('infra')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'infra'
                    ? 'border-blue-500/60 bg-blue-500/15 text-blue-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Server className="w-4 h-4 text-blue-400" />
                <span>IP & ASN ({investigation.asnInfo?.length || 0})</span>
              </button>

              {/* 6. Target vs Target Comparator Tab */}
              <button
                onClick={() => setActiveTab('vs')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'vs'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-md glow-amber'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Swords className="w-4 h-4 text-amber-400" />
                <span>Target vs Target</span>
              </button>

              {/* 7. Tech Stack Tab */}
              <button
                onClick={() => setActiveTab('tech')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'tech'
                    ? 'border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Tech Stack ({investigation.technologies.length})</span>
              </button>

              {/* 8. Historical Archive Timeline Tab */}
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'timeline'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>Timeline ({investigation.snapshots.length})</span>
              </button>

              {/* 9. Delta Changes Tab */}
              <button
                onClick={() => setActiveTab('changes')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'changes'
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>Delta ({investigation.changes.length})</span>
              </button>

              {/* 10. DNS Zone Records Tab */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'overview'
                    ? 'border-blue-500/60 bg-blue-500/15 text-blue-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>DNS Zone ({investigation.dnsRecords.length})</span>
              </button>

              {/* 11. Entity Relationship Graph Tab */}
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'graph'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-md glow-emerald'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Entity Graph</span>
              </button>

              {/* 12. Forensic Evidence Chain Tab */}
              <button
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                  activeTab === 'evidence'
                    ? 'border-slate-600 bg-slate-800 text-slate-200 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Evidence Log ({investigation.evidence.length})</span>
              </button>
            </div>

            {/* Tab Views */}
            <div className="space-y-6">
              {activeTab === 'story' && investigation.summary && (
                <WebsiteStory
                  domain={investigation.domain}
                  summary={investigation.summary}
                  milestones={investigation.milestones || []}
                  subdomains={investigation.subdomains || []}
                  technologies={investigation.technologies || []}
                  onNavigateToTab={(tab) => {
                    if (tab === 'tech') setActiveTab('tech');
                    else if (tab === 'timeline') setActiveTab('timeline');
                    else if (tab === 'changes') setActiveTab('changes');
                    else if (tab === 'graph') setActiveTab('graph');
                    else if (tab === 'subdomains') setActiveTab('subdomains');
                  }}
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

              {activeTab === 'vs' && (
                <DomainVsDomain
                  currentInvestigation={investigation}
                />
              )}

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
                  onNavigateToCompare={() => setActiveTab('compare')}
                  onTraceEvidence={handleTraceEvidence}
                />
              )}
              {activeTab === 'changes' && <ChangeDetector changes={investigation.changes} />}
              {activeTab === 'graph' && <RelationshipGraph data={investigation.relationships} />}
              {activeTab === 'evidence' && (
                <EvidenceList 
                  evidence={investigation.evidence} 
                  highlightId={highlightEvidenceId}
                />
              )}
            </div>
          </>
        )}
      </main>

      <SavedInvestigations
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedList={savedList}
        onSelect={(inv) => { setInvestigation(inv); setActiveTab('story'); }}
        onDelete={handleDeleteSaved}
      />
    </div>
  );
}



