'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { DomainOverview } from '@/components/DomainOverview';
import { TechStack } from '@/components/TechStack';
import { Timeline } from '@/components/Timeline';
import { ChangeDetector } from '@/components/ChangeDetector';
import { RelationshipGraph } from '@/components/RelationshipGraph';
import { EvidenceList } from '@/components/EvidenceList';
import { SavedInvestigations } from '@/components/SavedInvestigations';
import { Investigation } from '@/types/osint';
import { getSavedInvestigations, saveInvestigation, deleteInvestigation } from '@/lib/osint/storage';
import { Globe, Cpu, History, GitCompare, Network, Shield, Loader2 } from 'lucide-react';

export default function Home() {
  const [investigation, setInvestigation] = React.useState<Investigation | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'tech' | 'timeline' | 'changes' | 'graph' | 'evidence'>('overview');
  const [savedList, setSavedList] = React.useState<Investigation[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = React.useState<boolean>(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        currentDomain={investigation?.domain || 'example.com'}
        onSearch={handleInvestigate}
        onExportReport={handleExportReport}
        savedCount={savedList.length}
        onToggleSavedModal={() => setIsSavedModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-slate-900 border border-slate-800 rounded-xl">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-slate-300 font-mono text-sm">Conducting passive public investigation...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {investigation && !loading && (
          <>
            {/* Domain Top Overview Banner */}
            <DomainOverview investigation={investigation} />

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-slate-800 gap-1 font-medium text-sm">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Overview & DNS</span>
              </button>

              <button
                onClick={() => setActiveTab('tech')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'tech'
                    ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Tech Detection ({investigation.technologies.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'timeline'
                    ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Website History ({investigation.snapshots.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('changes')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'changes'
                    ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitCompare className="w-4 h-4" />
                <span>Change Detector ({investigation.changes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'graph'
                    ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Relationship Graph</span>
              </button>

              <button
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'evidence'
                    ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Evidence Trail ({investigation.evidence.length})</span>
              </button>
            </div>

            {/* Active Tab View */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-lg font-bold text-slate-100">DNS Records Table</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-mono">
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Value / Target</th>
                          <th className="p-2.5">TTL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {investigation.dnsRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-950/50">
                            <td className="p-2.5 font-bold text-amber-400">{r.type}</td>
                            <td className="p-2.5 text-slate-200">{r.value}</td>
                            <td className="p-2.5 text-slate-400">{r.ttl || 3600}s</td>
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
        onSelect={(inv) => { setInvestigation(inv); setActiveTab('overview'); }}
        onDelete={handleDeleteSaved}
      />
    </div>
  );
}
