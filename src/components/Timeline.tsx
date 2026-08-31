'use client';

import React from 'react';
import { WebSnapshot } from '@/types/osint';
import { History, ExternalLink, Calendar, FileCode, CheckCircle, Clock, GitCompare, Filter } from 'lucide-react';

interface Props {
  snapshots: WebSnapshot[];
  onNavigateToCompare?: (snapshotId: string) => void;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const Timeline: React.FC<Props> = ({ snapshots, onNavigateToCompare, onTraceEvidence }) => {
  const [selectedSnapshot, setSelectedSnapshot] = React.useState<WebSnapshot | null>(
    snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
  );
  const [selectedEra, setSelectedEra] = React.useState<string>('all');

  // Extract available years/decades
  const years = Array.from(new Set(snapshots.map(s => new Date(s.timestamp).getFullYear().toString()))).sort();
  
  const filteredSnapshots = selectedEra === 'all'
    ? snapshots
    : snapshots.filter(s => new Date(s.timestamp).getFullYear().toString() === selectedEra);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <History className="w-6 h-6 text-amber-400" />
            Interactive Historical Timeline & Web Snapshots
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Explore chronological website captures, inspected tech fingerprints, and historical payloads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {snapshots.length} Verified Captures
          </span>
        </div>
      </div>

      {/* Year / Era Quick Filter Scrubber */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
        <span className="text-slate-400 font-bold flex items-center gap-1.5 uppercase text-[11px]">
          <Filter className="w-3.5 h-3.5 text-amber-400" /> Filter by Era:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedEra('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedEra === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            All Years ({snapshots.length})
          </button>
          {years.map(yr => (
            <button
              key={yr}
              onClick={() => setSelectedEra(yr)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedEra === yr
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Interactive Timeline Scroll */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 space-y-2">
        <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Select Timeline Snapshot:</span>
          <span className="text-slate-500 text-[11px]">Showing {filteredSnapshots.length} Nodes</span>
        </div>
        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-center space-x-3 min-w-max">
            {filteredSnapshots.map((snap, idx) => {
              const isSelected = selectedSnapshot?.id === snap.id;
              const dateStr = snap.timestamp.split('T')[0];

              return (
                <button
                  key={`${snap.id}-${idx}`}
                  onClick={() => setSelectedSnapshot(snap)}
                  className={`flex flex-col items-center p-3.5 rounded-xl border transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 shadow-lg glow-amber scale-105'
                      : 'bg-slate-900 border-slate-800 hover:border-amber-500/40 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xs font-bold">{dateStr}</span>
                  <span className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> HTTP {snap.statusCode}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 mt-2 bg-slate-950 rounded-md border border-slate-800 text-slate-400">
                    {(snap.contentLength / 1024).toFixed(1)} KB
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Snapshot detail card */}
      {selectedSnapshot && (
        <div className="bg-slate-950/95 border border-slate-800/90 rounded-xl p-5 md:p-6 space-y-5 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2.5 text-sm text-slate-100 font-semibold font-mono">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Snapshot Timestamp: {new Date(selectedSnapshot.timestamp).toUTCString()}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {onTraceEvidence && (
                <button
                  onClick={() => onTraceEvidence(selectedSnapshot.evidenceId || selectedSnapshot.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <span>Trace Archive Evidence</span>
                </button>
              )}

              {onNavigateToCompare && (
                <button
                  onClick={() => onNavigateToCompare(selectedSnapshot.id)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                  <span>Compare in Diff Viewer</span>
                </button>
              )}

              <a
                href={selectedSnapshot.archiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 text-xs font-mono font-semibold transition-all shadow-sm"
              >
                <span>View Wayback Archive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
            <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-lg">
              <span className="text-slate-500 uppercase block mb-1 font-bold text-[10px]">HTTP Response Code</span>
              <span className="font-bold text-emerald-400 text-base">{selectedSnapshot.statusCode} OK</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-lg">
              <span className="text-slate-500 uppercase block mb-1 font-bold text-[10px]">Page Payload Size</span>
              <span className="font-bold text-slate-200 text-base">{selectedSnapshot.contentLength.toLocaleString()} bytes</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-lg">
              <span className="text-slate-500 uppercase block mb-1 font-bold text-[10px]">Archive Record Key</span>
              <span className="font-bold text-amber-300 text-xs truncate block">{selectedSnapshot.id}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
              Observed Web Stack Signatures at Capture ({selectedSnapshot.detectedTech.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedSnapshot.detectedTech.map((t, idx) => (
                <span key={`${t.id}-${idx}`} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg text-xs flex items-center gap-2 font-mono hover:border-slate-700">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  {t.name}
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    {t.confidence}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

