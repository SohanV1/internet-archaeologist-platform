'use client';

import React from 'react';
import { Technology } from '@/types/osint';
import { Cpu, CheckCircle2, Code2, Server, ShieldAlert, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface Props {
  technologies: Technology[];
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const TechStack: React.FC<Props> = ({ technologies, onTraceEvidence }) => {
  const categories = Array.from(new Set(technologies.map(t => t.category)));

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'web framework':
      case 'javascript framework':
      case 'framework':
        return <Code2 className="w-4 h-4 text-purple-400" />;
      case 'web server':
      case 'server':
        return <Server className="w-4 h-4 text-blue-400" />;
      case 'security':
      case 'cdn':
      case 'cdn/hosting':
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Cpu className="w-6 h-6 text-purple-400" />
            Public Technology Detection Engine
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Distinguishing direct protocol header observations from heuristic HTML DOM fingerprints with full audit trails.
          </p>
        </div>
        <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold">
          {technologies.length} Stack Signatures Identified
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-mono text-sm border border-dashed border-slate-800 rounded-xl">
          No technologies detected for this domain footprint.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((cat) => {
            const catTechs = technologies.filter(t => t.category === cat);
            return (
              <div key={cat} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    {getCategoryIcon(cat)}
                    {cat}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{catTechs.length} item(s)</span>
                </div>

                <div className="space-y-3">
                  {catTechs.map((tech, techIdx) => (
                    <div key={`${tech.id}-${techIdx}`} className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-purple-500/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-sm flex items-center gap-2 font-mono">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          {tech.name}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            tech.observationNature === 'OBSERVED' 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}>
                            {tech.observationNature || 'INFERRED'}
                          </span>

                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {tech.confidence}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 text-xs font-mono text-slate-400 space-y-1">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Evidence Signature:</span>
                        <span className="text-amber-300/90">{tech.evidence}</span>
                      </div>

                      {/* Traceability Link */}
                      {onTraceEvidence && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => onTraceEvidence(tech.evidenceId || tech.name)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Trace Evidence Provenance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

