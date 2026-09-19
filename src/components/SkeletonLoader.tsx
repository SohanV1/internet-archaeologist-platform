'use client';

import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'table' | 'graph' | 'overview' | 'matrix';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type = 'card' }) => {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 animate-pulse backdrop-blur-md">
      {/* Header shimmer */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="space-y-2.5">
          <div className="h-6 w-48 bg-slate-800 rounded-lg" />
          <div className="h-3.5 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          <div className="h-8 w-8 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {type === 'graph' && (
        <div className="h-96 w-full bg-slate-950/70 rounded-xl border border-slate-800/60 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
            <span className="text-xs font-mono text-slate-500 tracking-wider">
              Hydrating Interactive Topology...
            </span>
          </div>
        </div>
      )}

      {type === 'table' && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60"
            >
              <div className="h-4 w-36 bg-slate-800 rounded" />
              <div className="h-4 w-28 bg-slate-800/60 rounded" />
              <div className="h-4 w-16 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {type === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-950/60 rounded-xl border border-slate-800 p-4 space-y-3"
            >
              <div className="h-4 w-20 bg-slate-800 rounded" />
              <div className="h-8 w-16 bg-slate-800/70 rounded" />
            </div>
          ))}
        </div>
      )}

      {type === 'matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-800/70 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-slate-950/70 rounded-xl border border-slate-800" />
        </div>
      )}

      {type === 'card' && (
        <div className="space-y-4">
          <div className="h-32 bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="h-4 w-1/3 bg-slate-800 rounded" />
            <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
            <div className="h-3 w-1/2 bg-slate-800/40 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-slate-950/60 rounded-xl border border-slate-800" />
            <div className="h-40 bg-slate-950/60 rounded-xl border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
};
