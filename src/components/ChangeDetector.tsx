'use client';

import React from 'react';
import { ChangeEvent } from '@/types/osint';
import { GitCompare, AlertTriangle, ArrowUpRight, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

interface Props {
  changes: ChangeEvent[];
}

export const ChangeDetector: React.FC<Props> = ({ changes }) => {
  const categoryStats = React.useMemo(() => {
    const map = new Map<string, number>();
    changes.forEach(c => {
      map.set(c.category, (map.get(c.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }, [changes]);

  const highSev = changes.filter(c => c.severity === 'high').length;
  const medSev = changes.filter(c => c.severity === 'medium').length;
  const lowSev = changes.filter(c => c.severity === 'low').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
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
        <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {changes.length} Change Events Logged
        </span>
      </div>

      {changes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2 font-mono text-xs flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Severity Matrix</span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-red-400">
                <span>High Severity Shifts</span>
                <span className="font-bold">{highSev}</span>
              </div>
              <div className="flex items-center justify-between text-amber-400">
                <span>Medium Transitions</span>
                <span className="font-bold">{medSev}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Standard Updates</span>
                <span className="font-bold">{lowSev}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Change Events by Category
              </span>
              <span className="text-[10px] font-mono text-slate-500">Historical Distribution</span>
            </div>

            <div className="h-28 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl font-mono text-xs text-slate-200 shadow-xl">
                            <div className="text-amber-400 font-bold">{data.category}</div>
                            <div className="text-slate-300">Events: <span className="text-white font-bold">{data.count}</span></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
