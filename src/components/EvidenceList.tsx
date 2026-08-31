'use client';

import React from 'react';
import { EvidenceItem } from '@/types/osint';
import { 
  Shield, 
  FileCheck, 
  Copy, 
  Check, 
  Terminal, 
  Search, 
  ExternalLink, 
  Fingerprint, 
  CheckCircle2, 
  ShieldAlert,
  Hash
} from 'lucide-react';

interface Props {
  evidence: EvidenceItem[];
}

export const EvidenceList: React.FC<Props> = ({ evidence }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const types = ['all', 'DNS', 'Subdomain Recon', 'HTTP Header', 'Historical Archive'];

  const filtered = evidence.filter(ev => {
    const matchesType = selectedType === 'all' || ev.evidenceType === selectedType;
    const matchesSearch = 
      ev.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.rawData.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.verificationHash && ev.verificationHash.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Shield className="w-6 h-6 text-emerald-400" />
            Forensic Evidence Chain & Provenance Audit
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Cryptographic hashes, raw payloads, and authoritative source URLs establishing verified chain of custody.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {evidence.length} Cryptographically Fingerprinted Artifacts
          </span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within raw evidence, headers, hashes, notes..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono w-full md:w-auto">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                selectedType === type
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {type === 'all' ? 'All Artifacts' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
          No forensic evidence records matched your search query.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ev, idx) => (
            <div key={`${ev.id}-${idx}`} className="bg-slate-950/85 border border-slate-800/90 rounded-xl p-5 space-y-3.5 hover:border-slate-700 transition-all shadow-md">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-100 text-sm font-mono">{ev.source}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md font-mono font-bold">
                    {ev.evidenceType}
                  </span>

                  {/* Confidence Score */}
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-[11px] font-mono text-emerald-300 font-bold">
                    <span>{ev.confidenceScore || 100}% Confidence</span>
                  </div>

                  {ev.sourceUrl && (
                    <a
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                      title="Open source URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <span className="text-xs text-slate-500 font-mono pl-1">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Provenance Hash & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {ev.verificationHash && (
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <Fingerprint className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">SHA-256:</span>
                      <span className="text-cyan-300 text-[11px] truncate">{ev.verificationHash}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(`hash-${ev.id}`, ev.verificationHash)}
                      className="text-slate-500 hover:text-cyan-300 p-1 cursor-pointer shrink-0"
                      title="Copy SHA-256 hash"
                    >
                      {copiedId === `hash-${ev.id}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                {ev.notes && (
                  <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80 text-xs text-slate-300 font-mono italic flex items-center">
                    <span>Note: {ev.notes}</span>
                  </div>
                )}
              </div>

              {/* Raw Payload Block */}
              <div className="relative mt-2">
                <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-amber-400" /> CAPTURED PAYLOAD</span>
                  <span>ID: {ev.id}</span>
                </div>
                <pre className="bg-slate-950 text-emerald-400 text-xs p-4 rounded-b-lg border border-slate-800 font-mono overflow-x-auto max-h-56 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {ev.rawData}
                </pre>
                <button
                  onClick={() => handleCopy(ev.id, ev.rawData)}
                  className="absolute top-8 right-3 p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-md border border-slate-700 text-xs flex items-center space-x-1.5 font-mono cursor-pointer transition-colors shadow-md"
                  title="Copy raw evidence payload"
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
      )}
    </div>
  );
};

