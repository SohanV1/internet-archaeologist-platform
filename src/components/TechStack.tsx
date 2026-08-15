'use client';

import React from 'react';
import { Technology } from '@/types/osint';
import { Cpu, CheckCircle2 } from 'lucide-react';

interface Props {
  technologies: Technology[];
}

export const TechStack: React.FC<Props> = ({ technologies }) => {
  const categories = Array.from(new Set(technologies.map(t => t.category)));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          Public Technology Detection
        </h3>
        <span className="text-xs text-slate-400">
          {technologies.length} identified signatures
        </span>
      </div>

      {categories.length === 0 ? (
        <p className="text-slate-400 text-sm py-4">No technologies detected.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const catTechs = technologies.filter(t => t.category === cat);
            return (
              <div key={cat} className="bg-slate-950 border border-slate-800 rounded-md p-4 space-y-3">
                <span className="text-xs uppercase font-bold text-amber-400/90 tracking-wider">
                  {cat}
                </span>
                <div className="space-y-2">
                  {catTechs.map((tech) => (
                    <div key={tech.id} className="bg-slate-900 border border-slate-800/80 rounded p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {tech.name}
                        </span>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          {tech.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono italic">
                        Evidence: {tech.evidence}
                      </p>
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
