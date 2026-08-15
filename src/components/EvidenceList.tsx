'use client';

import React from 'react';
import { EvidenceItem } from '@/types/osint';
import { Shield, FileCheck, Copy } from 'lucide-react';

interface Props {
  evidence: EvidenceItem[];
}

export const EvidenceList: React.FC<Props> = ({ evidence }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Evidence Tracking & Source Verification
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {evidence.length} Verified Evidence Entries
        </span>
      </div>

      <div className="space-y-4">
        {evidence.map((ev) => (
          <div key={ev.id} className="bg-slate-950 border border-slate-800 rounded-md p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200 text-sm">{ev.source}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] px-2 py-0.5 bg-slate-900 text-amber-400 border border-slate-800 rounded font-mono">
                  {ev.evidenceType}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {ev.notes && <p className="text-xs text-slate-400 italic">{ev.notes}</p>}

            <div className="relative mt-2">
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded border border-slate-800 font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                {ev.rawData}
              </pre>
              <button
                onClick={() => handleCopy(ev.id, ev.rawData)}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center space-x-1"
                title="Copy raw evidence data"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === ev.id ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
