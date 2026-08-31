'use client';

import React from 'react';
import { EvidenceItem } from '@/types/osint';
import { Shield, FileCheck, Copy, Check, Terminal } from 'lucide-react';

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Shield className="w-6 h-6 text-emerald-400" />
            Evidence Chain & Provenance Log
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Raw captured payload artifacts, headers, & cryptographic audit trails for forensics documentation.
          </p>
        </div>
        <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
          {evidence.length} Verified Evidence Artifacts
        </span>
      </div>

      <div className="space-y-4">
        {evidence.map((ev, idx) => (
          <div key={`${ev.id}-${idx}`} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-100 text-sm font-mono">{ev.source}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-[11px] px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md font-mono font-bold">
                  {ev.evidenceType}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {ev.notes && (
              <p className="text-xs text-slate-300 italic font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                Note: {ev.notes}
              </p>
            )}

            <div className="relative mt-2">
              <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-800 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-amber-400" /> RAW ARTIFACT DATA</span>
                <span>ID: {ev.id}</span>
              </div>
              <pre className="bg-slate-950 text-emerald-400 text-xs p-4 rounded-b-lg border border-slate-800 font-mono overflow-x-auto max-h-56 whitespace-pre-wrap leading-relaxed shadow-inner">
                {ev.rawData}
              </pre>
              <button
                onClick={() => handleCopy(ev.id, ev.rawData)}
                className="absolute top-8 right-3 p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-md border border-slate-700 text-xs flex items-center space-x-1.5 font-mono cursor-pointer transition-colors shadow-md"
                title="Copy raw evidence data"
              >
                {copiedId === ev.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Payload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
