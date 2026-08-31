'use client';

import React from 'react';
import { Investigation } from '@/types/osint';
import { Shield, Trash2, Globe, Calendar, X, ArrowUpRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedList: Investigation[];
  onSelect: (inv: Investigation) => void;
  onDelete: (id: string) => void;
}

export const SavedInvestigations: React.FC<Props> = ({
  isOpen,
  onClose,
  savedList,
  onSelect,
  onDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6 glow-amber">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">Saved Target Investigations</h3>
              <p className="text-xs text-slate-400 font-mono">Locally stored intelligence dossiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono text-sm border border-dashed border-slate-800 rounded-xl">
            No saved target investigations found. Investigate a domain to save its intelligence report.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {savedList.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-amber-500/50 transition-all group"
              >
                <div className="space-y-2 cursor-pointer flex-1" onClick={() => { onSelect(inv); onClose(); }}>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-100 text-base font-mono group-hover:text-amber-400 transition-colors">
                      {inv.domain}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-blue-400">
                      IPs: {inv.ipAddresses.length}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-purple-400">
                      Tech: {inv.technologies.length}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-emerald-400">
                      Snapshots: {inv.snapshots.length}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(inv.id); }}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer ml-3"
                  title="Delete stored research"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
