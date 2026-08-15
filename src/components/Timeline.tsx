'use client';

import React from 'react';
import { WebSnapshot } from '@/types/osint';
import { History, ExternalLink, Calendar, FileCode } from 'lucide-react';

interface Props {
  snapshots: WebSnapshot[];
}

export const Timeline: React.FC<Props> = ({ snapshots }) => {
  const [selectedSnapshot, setSelectedSnapshot] = React.useState<WebSnapshot | null>(
    snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          Website History & Snapshot Timeline
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {snapshots.length} archive entries available
        </span>
      </div>

      {/* Timeline Bar */}
      <div className="relative py-4 overflow-x-auto">
        <div className="flex items-center space-x-4 min-w-max px-2">
          {snapshots.map((snap, idx) => {
            const isSelected = selectedSnapshot?.id === snap.id;
            const dateStr = snap.timestamp.split('T')[0];

            return (
              <button
                key={snap.id || idx}
                onClick={() => setSelectedSnapshot(snap)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-xs font-bold font-mono">{dateStr}</span>
                <span className="text-[11px] text-slate-400 mt-1">Status {snap.statusCode}</span>
                <span className="text-[10px] px-1.5 py-0.5 mt-2 bg-slate-900 rounded border border-slate-800 text-slate-400">
                  {(snap.contentLength / 1024).toFixed(1)} KB
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Snapshot detail card */}
      {selectedSnapshot && (
        <div className="bg-slate-950 border border-slate-800 rounded-md p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-sm text-slate-200 font-semibold">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Snapshot Captured: {new Date(selectedSnapshot.timestamp).toUTCString()}</span>
            </div>
            <a
              href={selectedSnapshot.archiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:underline font-medium"
            >
              <span>View Public Archive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 uppercase font-mono block mb-1">HTTP Status Code</span>
              <span className="font-semibold text-emerald-400">{selectedSnapshot.statusCode} OK</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-mono block mb-1">Payload Size</span>
              <span className="font-semibold">{selectedSnapshot.contentLength.toLocaleString()} bytes</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase font-mono block mb-2">Detected Tech Stack at Snapshot Date</span>
            <div className="flex flex-wrap gap-2">
              {selectedSnapshot.detectedTech.map((t, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs flex items-center gap-1 font-mono">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
