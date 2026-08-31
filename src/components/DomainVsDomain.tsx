'use client';

import React from 'react';
import { Investigation, DomainComparisonResult } from '@/types/osint';
import { compareInvestigations } from '@/lib/osint/domainCompare';
import { 
  Swords, 
  Search, 
  Loader2, 
  Sparkles, 
  Layers, 
  Shield, 
  Calendar, 
  Network, 
  Cpu, 
  CheckCircle,
  FileCode,
  ArrowRight
} from 'lucide-react';

interface Props {
  currentInvestigation: Investigation;
}

export const DomainVsDomain: React.FC<Props> = ({ currentInvestigation }) => {
  const [competitorInput, setCompetitorInput] = React.useState('gitlab.com');
  const [competitorInv, setCompetitorInv] = React.useState<Investigation | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const runComparison = async (targetB: string) => {
    if (!targetB.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetB.trim() })
      });

      if (!res.ok) {
        throw new Error(`Failed to load target ${targetB}`);
      }

      const data: Investigation = await res.json();
      setCompetitorInv(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison query failed.');
    } finally {
      setLoading(false);
    }
  };

  const comparison: DomainComparisonResult | null = competitorInv
    ? compareInvestigations(currentInvestigation, competitorInv)
    : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Swords className="w-6 h-6 text-amber-400" />
            Target-vs-Target Multi-Domain Comparator
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Compare two distinct web entities to contrast tech stack overlap, attack surfaces, and historical longevity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold">
            Dual Entity Intelligence Matrix
          </span>
        </div>
      </div>

      {/* Target Input Form */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
          Compare Target Domain [{currentInvestigation.domain}] Against:
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runComparison(competitorInput);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            placeholder="Enter second target (e.g. gitlab.com, vercel.com)..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            <span>Compare Targets</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/80 text-red-300 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparison && competitorInv && (
        <div className="space-y-6">
          {/* Executive Delta Finding */}
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs font-mono">
              <span className="font-bold text-amber-300 uppercase tracking-wider block">Cross-Domain Intelligence Finding:</span>
              <p className="text-slate-200 font-sans text-sm leading-relaxed">
                {comparison.summaryNarrative}
              </p>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain A Card */}
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-extrabold text-amber-400 font-mono">{comparison.domainA}</h4>
                <span className="text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded font-mono font-bold">
                  Target A
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Longevity</span>
                  <span className="text-base font-bold text-slate-100">{comparison.yearsA} Years</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Subdomains Sprawl</span>
                  <span className="text-base font-bold text-emerald-400">{comparison.subdomainsCountA} Hosts</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Security Posture</span>
                  <span className="text-base font-bold text-purple-300">{comparison.securityRatingA}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Tech Signatures</span>
                  <span className="text-base font-bold text-cyan-300">{currentInvestigation.technologies.length} Stack Components</span>
                </div>
              </div>
            </div>

            {/* Domain B Card */}
            <div className="bg-slate-950/90 border border-blue-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-extrabold text-blue-400 font-mono">{comparison.domainB}</h4>
                <span className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded font-mono font-bold">
                  Target B
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Longevity</span>
                  <span className="text-base font-bold text-slate-100">{comparison.yearsB} Years</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Subdomains Sprawl</span>
                  <span className="text-base font-bold text-emerald-400">{comparison.subdomainsCountB} Hosts</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Security Posture</span>
                  <span className="text-base font-bold text-purple-300">{comparison.securityRatingB}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Tech Signatures</span>
                  <span className="text-base font-bold text-cyan-300">{competitorInv.technologies.length} Stack Components</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Overlap Matrix */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Technology Overlap & Architectural Exclusives:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Shared Tech */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-2">
                <span className="text-purple-300 font-bold block flex items-center justify-between">
                  <span>Shared Technologies</span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full">{comparison.sharedTech.length}</span>
                </span>
                {comparison.sharedTech.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No shared frameworks</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {comparison.sharedTech.map((t, idx) => (
                      <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 text-purple-200">
                        {t.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exclusive to A */}
              <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <span className="text-amber-300 font-bold block flex items-center justify-between">
                  <span>Exclusive to {comparison.domainA}</span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">{comparison.exclusiveTechA.length}</span>
                </span>
                {comparison.exclusiveTechA.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">None</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {comparison.exclusiveTechA.map((t, idx) => (
                      <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 text-amber-200">
                        {t.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exclusive to B */}
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-4 space-y-2">
                <span className="text-blue-300 font-bold block flex items-center justify-between">
                  <span>Exclusive to {comparison.domainB}</span>
                  <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">{comparison.exclusiveTechB.length}</span>
                </span>
                {comparison.exclusiveTechB.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">None</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {comparison.exclusiveTechB.map((t, idx) => (
                      <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 text-blue-200">
                        {t.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};