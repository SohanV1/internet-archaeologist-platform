'use client';

import React from 'react';
import { ChangeEvent } from '@/types/osint';
import { GitCompare, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface Props {
  changes: ChangeEvent[];
}

export const ChangeDetector: React.FC<Props> = ({ changes }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-amber-400" />
          Infrastructure & Stack Change Detection
        </h3>
        <span className="text-xs text-slate-400">
          {changes.length} change log events
        </span>
      </div>

      {changes.length === 0 ? (
        <p className="text-slate-400 text-sm py-4">No major structural changes observed across snapshot history.</p>
      ) : (
        <div className="space-y-3">
          {changes.map((c) => {
            const severityColor =
              c.severity === 'high'
                ? 'border-red-500/40 bg-red-950/20 text-red-300'
                : c.severity === 'medium'
                ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
                : 'border-slate-800 bg-slate-950 text-slate-300';

            return (
              <div key={c.id} className={`border rounded-md p-3 flex items-start justify-between gap-3 ${severityColor}`}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 font-mono font-bold uppercase text-amber-400 border border-slate-800">
                      {c.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {c.timestamp ? new Date(c.timestamp).toISOString().split('T')[0] : 'Current'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{c.description}</p>
                </div>

                {c.severity === 'high' && (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                {c.severity === 'medium' && (
                  <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
