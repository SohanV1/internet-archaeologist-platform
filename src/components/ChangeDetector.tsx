'use client';

import React from 'react';
import { ChangeEvent } from '@/types/osint';
import { GitCompare, AlertTriangle, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  changes: ChangeEvent[];
}

export const ChangeDetector: React.FC<Props> = ({ changes }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <GitCompare className="w-6 h-6 text-amber-400" />
            Infrastructure & Tech Stack Delta Engine
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Automated detection of hosting shifts, framework migrations, & security header changes across history.
          </p>
        </div>
        <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {changes.length} Change Events Logged
        </span>
      </div>

      {changes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-mono text-sm border border-dashed border-slate-800 rounded-xl">
          No major structural shifts or hosting changes detected across historical snapshots.
        </div>
      ) : (
        <div className="space-y-3.5">
          {changes.map((c, idx) => {
            const severityColor =
              c.severity === 'high'
                ? 'border-red-500/40 bg-red-950/20 text-red-300 hover:border-red-500/70'
                : c.severity === 'medium'
                ? 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:border-amber-500/70'
                : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700';

            const severityBadge =
              c.severity === 'high'
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : c.severity === 'medium'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

            return (
              <div
                key={`${c.id}-${idx}`}
                className={`border rounded-xl p-4 flex items-start justify-between gap-4 transition-all shadow-md ${severityColor}`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-900 font-mono font-bold uppercase text-amber-400 border border-slate-800">
                      {c.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border uppercase ${severityBadge}`}>
                      {c.severity} priority
                    </span>
                    <span className="text-xs font-mono text-slate-400 ml-auto">
                      {c.timestamp ? new Date(c.timestamp).toISOString().split('T')[0] : 'Current'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 font-mono">{c.description}</p>
                </div>

                {c.severity === 'high' && (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-1" />
                )}
                {c.severity === 'medium' && (
                  <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
                )}
                {c.severity === 'low' && (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
