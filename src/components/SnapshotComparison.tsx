'use client';

import React from 'react';
import { WebSnapshot } from '@/types/osint';
import { compareSnapshots } from '@/lib/osint/compare';
import { 
  GitCompare, 
  ArrowRight, 
  PlusCircle, 
  MinusCircle, 
  CheckCircle, 
  ExternalLink, 
  Calendar, 
  FileCode, 
  TrendingUp, 
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Props {
  snapshots: WebSnapshot[];
  domain: string;
}

export const SnapshotComparison: React.FC<Props> = ({ snapshots, domain }) => {
  const [baseId, setBaseId] = React.useState<string>(
    snapshots.length >= 2 ? snapshots[0].id : snapshots[0]?.id || ''
  );
  const [targetId, setTargetId] = React.useState<string>(
    snapshots.length >= 2 ? snapshots[snapshots.length - 1].id : snapshots[0]?.id || ''
  );

  const baseSnapshot = snapshots.find(s => s.id === baseId) || snapshots[0];
  const targetSnapshot = snapshots.find(s => s.id === targetId) || snapshots[snapshots.length - 1];

  if (!baseSnapshot || !targetSnapshot) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-mono text-sm">
        Insufficient historical snapshots available for comparison.
      </div>
    );
  }

  const comparison = compareSnapshots(baseSnapshot, targetSnapshot);
  const baseYear = new Date(baseSnapshot.timestamp).getFullYear();
  const targetYear = new Date(targetSnapshot.timestamp).getFullYear();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <GitCompare className="w-6 h-6 text-amber-400" />
            Before / After Snapshot Comparison Engine
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Compare any two historical points in time to inspect framework migrations, payload deltas, and UX shifts.
          </p>
        </div>

        <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {comparison.yearsApart} Year Difference ({baseYear} ➔ {targetYear})
        </span>
      </div>

      {/* Snapshot Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            1. Select Baseline Snapshot (Before):
          </label>
          <select
            value={baseId}
            onChange={(e) => setBaseId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {snapshots.map((s, idx) => (
              <option key={`${s.id}-${idx}`} value={s.id}>
                {s.timestamp.split('T')[0]} ({new Date(s.timestamp).getFullYear()}) — {(s.contentLength / 1024).toFixed(1)} KB — HTTP {s.statusCode}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            2. Select Comparison Snapshot (After):
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {snapshots.map((s, idx) => (
              <option key={`${s.id}-${idx}`} value={s.id}>
                {s.timestamp.split('T')[0]} ({new Date(s.timestamp).getFullYear()}) — {(s.contentLength / 1024).toFixed(1)} KB — HTTP {s.statusCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Executive Delta Summary Callout */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 shadow-inner">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs font-mono">
          <span className="font-bold text-amber-300 uppercase tracking-wider block">Evolutionary Delta Finding:</span>
          <p className="text-slate-200 font-sans text-sm leading-relaxed">
            {comparison.evolutionSummary}
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Baseline Card (Left) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold uppercase">
                Baseline Era ({baseYear})
              </span>
            </div>
            <a
              href={baseSnapshot.archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
            >
              <span>View Capture</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 uppercase block text-[10px]">Crawl Timestamp</span>
              <span className="font-bold text-slate-200">{baseSnapshot.timestamp.split('T')[0]}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 uppercase block text-[10px]">Payload Weight</span>
              <span className="font-bold text-slate-200">{(baseSnapshot.contentLength / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Observed Tech Signatures ({baseSnapshot.detectedTech.length}):</span>
            <div className="flex flex-wrap gap-1.5">
              {baseSnapshot.detectedTech.map((t, idx) => (
                <span key={`${t.id}-${idx}`} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-md text-xs font-mono flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Target Card (Right) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold uppercase">
                Target Era ({targetYear})
              </span>
            </div>
            <a
              href={targetSnapshot.archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
            >
              <span>View Capture</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 uppercase block text-[10px]">Crawl Timestamp</span>
              <span className="font-bold text-slate-200">{targetSnapshot.timestamp.split('T')[0]}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 uppercase block text-[10px]">Payload Weight</span>
                <span className="font-bold text-slate-200">{(targetSnapshot.contentLength / 1024).toFixed(1)} KB</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                comparison.sizeDirection === 'increased' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {comparison.sizeDirection === 'increased' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {comparison.sizeDiffPercent}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Observed Tech Signatures ({targetSnapshot.detectedTech.length}):</span>
            <div className="flex flex-wrap gap-1.5">
              {targetSnapshot.detectedTech.map((t, idx) => (
                <span key={`${t.id}-${idx}`} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-md text-xs font-mono flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technology Migration Delta Breakdown */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Technology Migration & Architectural Shifts:</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Adopted Tech */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5"><PlusCircle className="w-4 h-4" /> Adopted Technologies</span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">{comparison.addedTech.length}</span>
            </div>
            {comparison.addedTech.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No newly added frameworks</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {comparison.addedTech.map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="bg-slate-900/90 p-2 rounded-lg border border-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decommissioned Tech */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-red-400 font-bold">
              <span className="flex items-center gap-1.5"><MinusCircle className="w-4 h-4" /> Decommissioned</span>
              <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded-full">{comparison.removedTech.length}</span>
            </div>
            {comparison.removedTech.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No frameworks removed</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {comparison.removedTech.map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="bg-slate-900/90 p-2 rounded-lg border border-red-500/20 text-red-300 font-bold text-xs flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retained Tech */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-blue-400" /> Retained Across Eras</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">{comparison.retainedTech.length}</span>
            </div>
            {comparison.retainedTech.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">Complete architectural replacement</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {comparison.retainedTech.map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-300 text-xs flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-500">{t.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};