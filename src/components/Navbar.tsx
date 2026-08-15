'use client';

import React from 'react';
import { Search, History, Shield, FileText, Download } from 'lucide-react';

interface NavbarProps {
  currentDomain: string;
  onSearch: (domain: string) => void;
  onExportReport: () => void;
  savedCount: number;
  onToggleSavedModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDomain,
  onSearch,
  onExportReport,
  savedCount,
  onToggleSavedModal
}) => {
  const [inputVal, setInputVal] = React.useState(currentDomain);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSearch('example.com')}>
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-amber-400 flex items-center gap-2">
              Internet Archaeologist
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono font-normal">
                OSINT v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Public Footprint & Web Time Machine</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl w-full flex items-center gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter domain (e.g. example.com, github.com)"
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-sm rounded-md transition-colors whitespace-nowrap"
          >
            Investigate
          </button>
        </form>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSavedModal}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
            title="View saved research projects"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Saved Projects</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/30">
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={onExportReport}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
            title="Export Findings Report"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
