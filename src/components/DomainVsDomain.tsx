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
  ArrowRight,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

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
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs font-mono rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            <span>Execute Dual Scan</span>
          </button>
        </form>

        {error && (
          <div className="text-xs font-mono text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/60">
            {error}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && competitorInv && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Comparative Metrics Chart */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 md:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Footprint & Attack Surface Contrast
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-amber-400 font-bold">{comparison.domainA}</span>
                <span className="text-slate-600">vs</span>
                <span className="text-emerald-400 font-bold">{comparison.domainB}</span>
              </div>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      metric: 'Years Active',
                      [comparison.domainA]: comparison.yearsA,
                      [comparison.domainB]: comparison.yearsB
                    },
                    {
                      metric: 'Subdomains',
                      [comparison.domainA]: comparison.subdomainsCountA,
                      [comparison.domainB]: comparison.subdomainsCountB
                    },
                    {
                      metric: 'Tech Signatures',
                      [comparison.domainA]: currentInvestigation.technologies.length,
                      [comparison.domainB]: competitorInv.technologies.length
                    },
                    {
                      metric: 'DNS Records',
                      [comparison.domainA]: currentInvestigation.dnsRecords.length,
                      [comparison.domainB]: competitorInv.dnsRecords.length
                    },
                    {
                      metric: 'Captures',
                      [comparison.domainA]: currentInvestigation.snapshots.length,
                      [comparison.domainB]: competitorInv.snapshots.length
                    }
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="metric"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl font-mono text-xs text-slate-200 shadow-xl space-y-1">
                            <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">{label}</div>
                            <div className="text-amber-400">{comparison.domainA}: <span className="font-bold text-white">{payload[0]?.value}</span></div>
                            <div className="text-emerald-400">{comparison.domainB}: <span className="font-bold text-white">{payload[1]?.value}</span></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                  <Bar dataKey={comparison.domainA} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={comparison.domainB} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Narrative Summary */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
              Comparative Intelligence Narrative:
            </span>
            <p className="text-sm text-slate-200 font-sans leading-relaxed">
              {comparison.summaryNarrative}
            </p>
          </div>

          {/* Head-to-Head Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Target A */}
            <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-base font-extrabold text-amber-400">{comparison.domainA}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">Primary Target</span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>Years Active:</span><strong className="text-white">{comparison.yearsA} yrs</strong></div>
                <div className="flex justify-between"><span>Subdomains:</span><strong className="text-white">{comparison.subdomainsCountA}</strong></div>
                <div className="flex justify-between"><span>Security Posture:</span><strong className="text-emerald-400">{comparison.securityRatingA}</strong></div>
              </div>
            </div>

            {/* Target B */}
            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-base font-extrabold text-emerald-400">{comparison.domainB}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">Comparison Target</span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>Years Active:</span><strong className="text-white">{comparison.yearsB} yrs</strong></div>
                <div className="flex justify-between"><span>Subdomains:</span><strong className="text-white">{comparison.subdomainsCountB}</strong></div>
                <div className="flex justify-between"><span>Security Posture:</span><strong className="text-emerald-400">{comparison.securityRatingB}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
