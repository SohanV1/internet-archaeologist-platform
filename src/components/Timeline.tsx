'use client';

import React from 'react';
import { WebSnapshot } from '@/types/osint';
import { History, ExternalLink, Calendar, FileCode, CheckCircle, Clock } from 'lucide-react';

interface Props {
  snapshots: WebSnapshot[];
}

export const Timeline: React.FC<Props> = ({ snapshots }) => {
  const [selectedSnapshot, setSelectedSnapshot] = React.useState<WebSnapshot | null>(
    snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <History className="w-6 h-6 text-amber-400" />
            Website History & Archive Snapshot Timeline
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Historical website capture records & structural evolution over time.
          </p>
        </div>
        <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {snapshots.length} Historical Snapshots
        </span>
      </div>

      {/* Horizontal Interactive Timeline Scroll */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
        <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>Select Timeline Node:</span>
        </div>
        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-center space-x-3 min-w-max">
            {snapshots.map((snap, idx) => {
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
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5 text-sm text-slate-100 font-semibold font-mono">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Snapshot Timestamp: {new Date(selectedSnapshot.timestamp).toUTCString()}</span>
            </div>
            <a
              href={selectedSnapshot.archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 text-xs font-mono font-semibold transition-all"
            >
              <span>View Wayback Archive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-slate-500 uppercase block mb-1 font-bold text-[10px]">HTTP Response Code</span>
              <span className="font-bold text-emerald-400 text-base">{selectedSnapshot.statusCode} OK</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-slate-500 uppercase block mb-1 font-bold text-[10px]">Page Payload Size</span>
              <span className="font-bold text-slate-200 text-base">{selectedSnapshot.contentLength.toLocaleString()} bytes</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-lg">
              <span className="text-slate-500 uppercase block mb-1 font-bold text-[10px]">Archive Hash Reference</span>
              <span className="font-bold text-amber-300 text-xs truncate block">{selectedSnapshot.id}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
              Observed Web Stack Signatures at Capture:
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedSnapshot.detectedTech.map((t, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg text-xs flex items-center gap-2 font-mono hover:border-slate-700">
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
