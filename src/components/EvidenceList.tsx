'use client';

import React from 'react';
import { EvidenceItem } from '@/types/osint';
import { EvidenceModal } from './EvidenceModal';
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
  AlertCircle,
  Clock,
  Maximize2,
  Filter,
  Eye,
  FileText
} from 'lucide-react';

interface Props {
  evidence: EvidenceItem[];
  highlightId?: string | null;
}

export const EvidenceList: React.FC<Props> = ({ evidence, highlightId }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [selectedConfidence, setSelectedConfidence] = React.useState<string>('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [expandedCardRawIds, setExpandedCardRawIds] = React.useState<Record<string, boolean>>({});
  const [modalEvidence, setModalEvidence] = React.useState<EvidenceItem | null>(null);

  const types = [
    'all', 
    'Historical Archive', 
    'DNS', 
    'HTTP Header', 
    'Subdomain Recon', 
    'Technology Detection', 
    'Certificate Transparency'
  ];

  const confidenceLevels = ['all', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = (evidence || []).filter(ev => {
    const matchesType = selectedType === 'all' || ev.evidenceType === selectedType;
    const matchesConfidence = selectedConfidence === 'all' || ev.confidence === selectedConfidence;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (ev.source && ev.source.toLowerCase().includes(searchLower)) ||
      (ev.rawData && ev.rawData.toLowerCase().includes(searchLower)) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchLower)) ||
      (ev.relatedObservation && ev.relatedObservation.toLowerCase().includes(searchLower)) ||
      (ev.relatedEntity && ev.relatedEntity.toLowerCase().includes(searchLower)) ||
      (ev.collectionMethod && ev.collectionMethod.toLowerCase().includes(searchLower)) ||
      (ev.verificationHash && ev.verificationHash.toLowerCase().includes(searchLower));

    return matchesType && matchesConfidence && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpandRaw = (id: string) => {
    setExpandedCardRawIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getConfidenceBadge = (confidence: string, score?: number) => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            HIGH {score !== undefined ? `(${score}%)` : ''}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            MEDIUM {score !== undefined ? `(${score}%)` : ''}
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3 h-3 text-orange-400" />
            LOW {score !== undefined ? `(${score}%)` : ''}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-mono font-bold">
            UNKNOWN
          </span>
        );
    }
  };

  const getNatureBadge = (nature: string) => {
    switch (nature) {
      case 'OBSERVED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
            ● OBSERVED
          </span>
        );
      case 'INFERRED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
            ◈ INFERRED
          </span>
        );
      case 'HISTORICAL':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
            ⏳ HISTORICAL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider">
            ? UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Shield className="w-6 h-6 text-emerald-400" />
            Forensic Evidence Chain & Provenance Audit
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Strict evidence traceability with explicit confidence ratings, collection methodology, and cryptographic provenance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {(evidence || []).length} Verified Evidence Records
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search findings, sources, methods, entities, raw payloads..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono w-full md:w-auto">
            <span className="text-slate-500 text-[11px] uppercase font-bold flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-400" /> Confidence:
            </span>
            {confidenceLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedConfidence(lvl)}
                className={`px-2.5 py-1 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                  selectedConfidence === lvl
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono pt-1 border-t border-slate-800/60">
          <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Type:</span>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                selectedType === type
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-400">No forensic evidence records matched your criteria.</p>
          <p className="text-slate-500">Try adjusting your keyword search or filter settings.</p>
        </div>
      ) : (
        /* Evidence Cards List */
        <div className="space-y-4">
          {filtered.map((ev, idx) => {
            const isExpanded = !!expandedCardRawIds[ev.id];
            const isHighlighted = highlightId === ev.id;

            return (
              <div 
                key={`${ev.id}-${idx}`} 
                id={`evidence-${ev.id}`}
                className={`bg-slate-950/85 border rounded-xl p-5 space-y-3.5 transition-all shadow-md ${
                  isHighlighted 
                    ? 'border-amber-500/80 ring-1 ring-amber-500/50 bg-amber-500/5' 
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
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

                    {getNatureBadge(ev.observationNature || 'OBSERVED')}

                    {getConfidenceBadge(ev.confidence, ev.confidenceScore)}

                    <button
                      onClick={() => setModalEvidence(ev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors cursor-pointer border border-slate-700"
                      title="Open full evidence dossier modal"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-400" />
                      <span>Dossier</span>
                    </button>
                  </div>
                </div>

                {/* Finding / What was observed */}
                <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <FileText className="w-3.5 h-3.5" /> Finding / Observation:
                    </span>
                    {ev.relatedEntity && (
                      <span className="text-slate-300 lowercase font-normal font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        entity: <strong className="text-amber-300">{ev.relatedEntity}</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed font-medium">
                    {ev.relatedObservation || ev.notes || 'No observation summary recorded.'}
                  </p>
                </div>

                {/* Metadata Row: Method, Timestamp, Source URL & Hash */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Method */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Collection Method:</span>
                    <p className="text-slate-300 text-[11px] leading-snug">{ev.collectionMethod || 'Passive OSINT query'}</p>
                  </div>

                  {/* Timestamp & Source Link */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/80 flex flex-col justify-between space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> Observed:
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      {ev.sourceUrl ? (
                        <a
                          href={ev.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px] font-bold transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Source</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Source URL unavailable</span>
                      )}

                      {ev.verificationHash && (
                        <button
                          onClick={() => handleCopy(`hash-${ev.id}`, ev.verificationHash || '')}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-300 text-[10px] transition-colors cursor-pointer"
                          title="Copy SHA-256 fingerprint"
                        >
                          <Fingerprint className="w-3 h-3 text-emerald-400" />
                          <span>{copiedId === `hash-${ev.id}` ? 'Copied Hash' : 'SHA-256'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw Payload Block Toggle */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpandRaw(ev.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      <span className="underline decoration-slate-700">
                        {isExpanded ? 'Hide Raw Evidence Payload' : 'View Raw Evidence Payload'}
                      </span>
                      <span className="text-[10px] text-slate-500">({ev.rawData.length} bytes)</span>
                    </button>

                    <button
                      onClick={() => handleCopy(ev.id, ev.rawData)}
                      className="text-slate-400 hover:text-slate-200 text-xs font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === ev.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Raw</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <pre className="bg-slate-950 text-emerald-400 text-xs p-3.5 rounded-lg border border-slate-800 font-mono overflow-x-auto max-h-52 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {ev.rawData}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal Dossier */}
      <EvidenceModal
        evidence={modalEvidence}
        isOpen={!!modalEvidence}
        onClose={() => setModalEvidence(null)}
      />
    </div>
  );
};


