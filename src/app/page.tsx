'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { DomainOverview } from '@/components/DomainOverview';
import { WebsiteStory } from '@/components/WebsiteStory';
import { SubdomainsView } from '@/components/SubdomainsView';
import { TechStack } from '@/components/TechStack';
import { Timeline } from '@/components/Timeline';
import { ChangeDetector } from '@/components/ChangeDetector';
import { RelationshipGraph } from '@/components/RelationshipGraph';
import { EvidenceList } from '@/components/EvidenceList';
import { SavedInvestigations } from '@/components/SavedInvestigations';
import { Investigation } from '@/types/osint';
import { getSavedInvestigations, saveInvestigation, deleteInvestigation } from '@/lib/osint/storage';
import { Globe, Cpu, History, GitCompare, Network, Shield, Loader2, Copy, Check, Sparkles, Layers } from 'lucide-react';

export default function Home() {
  const [investigation, setInvestigation] = React.useState<Investigation | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'story' | 'subdomains' | 'overview' | 'tech' | 'timeline' | 'changes' | 'graph' | 'evidence'>('story');
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

  // Load saved projects on startup
  React.useEffect(() => {
    const list = getSavedInvestigations();
    setSavedList(list);
    // Trigger initial search for default target domain
    handleInvestigate('example.com');
  }, []);

  const handleInvestigate = async (targetDomain: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch domain investigation');
      }

      const data: Investigation = await res.json();
      setInvestigation(data);
      saveInvestigation(data);
      setSavedList(getSavedInvestigations());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during domain research.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSaved = (id: string) => {
    deleteInvestigation(id);
    setSavedList(getSavedInvestigations());
  };

  const handleExportReport = () => {
    if (!investigation) return;
    const blob = new Blob([JSON.stringify(investigation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-report-${investigation.domain}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

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
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-ping" />
            </div>
            <p className="text-slate-300 font-mono text-sm tracking-wider animate-pulse">
              Conducting passive public OSINT reconnaissance on target domain...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="p-5 bg-red-950/60 border border-red-800/80 text-red-300 rounded-2xl text-sm font-mono flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {investigation && !loading && (
          <>
            {/* Domain Top Overview Banner */}
            <DomainOverview investigation={investigation} />

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-slate-800/80 gap-2 font-mono text-xs p-1.5 bg-slate-900/40 rounded-xl backdrop-blur-md">
              {/* What Happened / Story Tab (Default First Tab) */}
              <button
                onClick={() => setActiveTab('story')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
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

              {/* Subdomains Recon Tab */}
              <button
                onClick={() => setActiveTab('subdomains')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'subdomains'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-md glow-emerald'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Network className="w-4 h-4 text-emerald-400" />
                <span>Subdomains ({investigation.subdomains?.length || 0})</span>
              </button>

              {/* Tech Stack Tab */}
              <button
                onClick={() => setActiveTab('tech')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'tech'
                    ? 'border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Tech Detection ({investigation.technologies.length})</span>
              </button>

              {/* Time Machine History Tab */}
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'timeline'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>Web Archive ({investigation.snapshots.length})</span>
              </button>

              {/* Delta Changes Tab */}
              <button
                onClick={() => setActiveTab('changes')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'changes'
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>Delta Changes ({investigation.changes.length})</span>
              </button>

              {/* DNS Zone Records Tab */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'overview'
                    ? 'border-blue-500/60 bg-blue-500/15 text-blue-300 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>DNS Zone ({investigation.dnsRecords.length})</span>
              </button>

              {/* Relationship Topology Graph Tab */}
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'graph'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-md glow-emerald'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Entity Graph</span>
              </button>

              {/* Evidence Log Tab */}
              <button
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === 'evidence'
                    ? 'border-slate-600 bg-slate-800 text-slate-200 shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Forensic Evidence ({investigation.evidence.length})</span>
              </button>
            </div>

            {/* Active Tab View */}
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
                />
              )}

              {activeTab === 'subdomains' && (
                <SubdomainsView
                  subdomains={investigation.subdomains || []}
                  rootDomain={investigation.domain}
                />
              )}

              {activeTab === 'overview' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <h3 className="text-xl font-extrabold text-slate-100 font-mono flex items-center gap-2">
                      <Globe className="w-5 h-5 text-amber-400" />
                      Authoritative DNS Zone Records
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {investigation.dnsRecords.length} entries resolved via DNS-over-HTTPS
                    </span>
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

              {activeTab === 'tech' && <TechStack technologies={investigation.technologies} />}
              {activeTab === 'timeline' && <Timeline snapshots={investigation.snapshots} />}
              {activeTab === 'changes' && <ChangeDetector changes={investigation.changes} />}
              {activeTab === 'graph' && <RelationshipGraph data={investigation.relationships} />}
              {activeTab === 'evidence' && <EvidenceList evidence={investigation.evidence} />}
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
