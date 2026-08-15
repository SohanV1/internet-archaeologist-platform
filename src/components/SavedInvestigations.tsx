'use client';

import React from 'react';
import { Investigation } from '@/types/osint';
import { Shield, Trash2, Globe, Calendar, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">Saved Research Projects</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedList.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">
            No saved research investigations found. Investigate a domain to save your project.
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {savedList.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 cursor-pointer flex-1" onClick={() => { onSelect(inv); onClose(); }}>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-100 text-base">{inv.domain}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span>IPs: {inv.ipAddresses.length}</span>
                    <span>Tech: {inv.technologies.length}</span>
                    <span>Snapshots: {inv.snapshots.length}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDelete(inv.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-md transition-colors"
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
