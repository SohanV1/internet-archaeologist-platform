'use client';

import React from 'react';
import { Technology } from '@/types/osint';
import { Cpu, CheckCircle2, Code2, Server, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  technologies: Technology[];
}

export const TechStack: React.FC<Props> = ({ technologies }) => {
  const categories = Array.from(new Set(technologies.map(t => t.category)));

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'web framework':
      case 'framework':
        return <Code2 className="w-4 h-4 text-purple-400" />;
      case 'web server':
      case 'server':
        return <Server className="w-4 h-4 text-blue-400" />;
      case 'security':
      case 'cdn':
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Cpu className="w-6 h-6 text-purple-400" />
            Public Technology Detection Engine
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Heuristic signature analysis based on HTTP headers, HTML DOM structures, & public DNS meta.
          </p>
        </div>
        <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full font-mono font-bold">
          {technologies.length} Signatures Identified
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
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    {getCategoryIcon(cat)}
                    {cat}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{catTechs.length} item(s)</span>
                </div>

                <div className="space-y-3">
                  {catTechs.map((tech, techIdx) => (
                    <div key={`${tech.id}-${techIdx}`} className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-purple-500/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-sm flex items-center gap-2 font-mono">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          {tech.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                              style={{ width: `${tech.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {tech.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60 text-xs font-mono text-slate-400">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Evidence Signature:</span>
                        <span className="text-amber-300/90">{tech.evidence}</span>
                      </div>
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
