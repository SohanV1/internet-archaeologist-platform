'use client';

import React from 'react';
import { EvidenceItem } from '@/types/osint';
import { 
  Shield, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Fingerprint, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText
} from 'lucide-react';

interface Props {
  evidence: EvidenceItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EvidenceModal: React.FC<Props> = ({ evidence, isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [isRawExpanded, setIsRawExpanded] = React.useState<boolean>(true);

  if (!isOpen || !evidence) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getConfidenceBadge = (confidence: string, score?: number) => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            HIGH CONFIDENCE {score !== undefined ? `(${score}%)` : ''}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            MEDIUM CONFIDENCE {score !== undefined ? `(${score}%)` : ''}
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
            LOW CONFIDENCE {score !== undefined ? `(${score}%)` : ''}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5">
            UNKNOWN CONFIDENCE
          </span>
        );
    }
  };

  const getNatureBadge = (nature: string) => {
    switch (nature) {
      case 'OBSERVED':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            ● OBSERVED FACT
          </span>
        );
      case 'INFERRED':
        return (
          <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            ◈ HEURISTIC INFERENCE
          </span>
        );
      case 'HISTORICAL':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            ⏳ HISTORICAL ARCHIVE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono font-bold uppercase tracking-wider">
            ? UNKNOWN NATURE
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                Forensic Evidence Dossier
                <span className="text-xs text-slate-500 font-normal">[{evidence.id}]</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Verified provenance metadata, collection methodology, and raw payload audit trail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-mono text-xs">
          {/* Status and Confidence Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md font-bold">
                {evidence.evidenceType}
              </span>
              {getNatureBadge(evidence.observationNature || 'OBSERVED')}
            </div>
            <div>
              {getConfidenceBadge(evidence.confidence, evidence.confidenceScore)}
            </div>
          </div>

          {/* Finding / What was observed */}
          <div className="space-y-1.5 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Finding / Observed State
            </h4>
            <p className="text-sm font-semibold text-slate-100 font-sans leading-relaxed">
              {evidence.relatedObservation || evidence.notes || 'No specific observation text recorded.'}
            </p>
            {evidence.relatedEntity && (
              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Related Target Entity:</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold">
                  {evidence.relatedEntity}
                </span>
              </div>
            )}
          </div>

          {/* Provenance Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                Origin / Data Source
              </span>
              <p className="text-xs text-slate-200 font-bold break-words">{evidence.source}</p>
              {evidence.sourceUrl ? (
                <a
                  href={evidence.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-colors cursor-pointer mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Source</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 italic block">Source URL: Explicitly unavailable</span>
              )}
            </div>

            {/* Collection Method */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                Collection Method
              </span>
              <p className="text-xs text-slate-300 leading-relaxed break-words">
                {evidence.collectionMethod || 'Automated passive OSINT query'}
              </p>
            </div>

            {/* Timestamp */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Observed Timestamp
              </span>
              <p className="text-xs text-cyan-300 font-mono">
                {new Date(evidence.timestamp).toLocaleString()}
              </p>
            </div>

            {/* SHA-256 Provenance Fingerprint */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-emerald-400" /> Cryptographic Fingerprint
                </span>
                {evidence.verificationHash && (
                  <button
                    onClick={() => handleCopy('hash', evidence.verificationHash || '')}
                    className="text-slate-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                    title="Copy hash"
                  >
                    {copiedKey === 'hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-emerald-400/90 font-mono truncate">
                {evidence.verificationHash || 'Unavailable'}
              </p>
            </div>
          </div>

          {/* Notes if present */}
          {evidence.notes && (
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 italic">
              <span className="font-bold text-slate-400 font-sans not-italic block mb-1">Analyst Notes:</span>
              {evidence.notes}
            </div>
          )}

          {/* Raw Data Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">Raw Evidence Payload</span>
                <span className="text-[10px] text-slate-500">({evidence.rawData.length} bytes)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsRawExpanded(!isRawExpanded)}
                  className="px-2 py-0.5 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  {isRawExpanded ? 'Collapse' : 'Expand'}
                </button>
                <button
                  onClick={() => handleCopy('raw', evidence.rawData)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors text-[11px] cursor-pointer"
                >
                  {copiedKey === 'raw' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isRawExpanded && (
              <pre className="bg-slate-950 text-emerald-400 text-xs p-4 rounded-b-xl border-b border-x border-slate-800 font-mono overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed shadow-inner">
                {evidence.rawData}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};