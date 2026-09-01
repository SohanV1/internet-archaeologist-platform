'use client';

import React from 'react';
import { Search, Shield, Download, Radar, Sparkles, Terminal, Share2, Check } from 'lucide-react';

interface NavbarProps {
  currentDomain: string;
  onSearch: (domain: string) => void;
  onExportReport: (format: 'json' | 'html' | 'csv-dns' | 'csv-subs') => void;
  savedCount: number;
  onToggleSavedModal: () => void;
}

const PRESET_DOMAINS = ['example.com', 'github.com', 'wikipedia.org', 'cloudflare.com'];

export const Navbar: React.FC<NavbarProps> = ({
  currentDomain,
  onSearch,
  onExportReport,
  savedCount,
  onToggleSavedModal
}) => {
  const [inputVal, setInputVal] = React.useState(currentDomain);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isCopiedPermalink, setIsCopiedPermalink] = React.useState(false);

  React.useEffect(() => {
    setInputVal(currentDomain);
  }, [currentDomain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handleSharePermalink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedPermalink(true);
      setTimeout(() => setIsCopiedPermalink(false), 2500);
    }
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur-md text-slate-100 border-b border-slate-800/80 sticky top-0 z-50 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / Title */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onSearch('example.com')}>
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 rounded-xl border border-amber-500/30 group-hover:border-amber-400 transition-all glow-amber">
            <Radar className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 flex items-center gap-2">
              INTERNET ARCHAEOLOGIST PLATFORM
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-semibold">
                v1.5
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Public Footprint & Web Time Machine Engine
            </p>
          </div>
        </div>

        {/* Search Bar & Quick Presets */}
        <div className="flex-1 max-w-xl w-full flex flex-col gap-1.5">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <div className="relative w-full">
              <Terminal className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/70" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter domain (e.g. example.com, github.com)..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Scan Target</span>
            </button>
          </form>

          {/* Preset Domain Tags */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono overflow-x-auto">
            <span className="text-slate-500 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Presets:</span>
            {PRESET_DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => { setInputVal(domain); onSearch(domain); }}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-amber-500/10 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors"
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 relative">
          {/* Share Permalink Button */}
          <button
            onClick={handleSharePermalink}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 hover:border-slate-700 transition-all font-medium shadow-sm cursor-pointer"
            title="Share domain investigation permalink"
          >
            {isCopiedPermalink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleSavedModal}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 hover:border-slate-700 transition-all font-medium shadow-sm cursor-pointer"
            title="View saved research projects"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/40 font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center space-x-2 px-3.5 py-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all font-medium cursor-pointer"
              title="Export Findings"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export</span>
            </button>

            {isExportOpen && (
              <div 
                className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-mono space-y-1 backdrop-blur-xl"
                onMouseLeave={() => setIsExportOpen(false)}
              >
                <button
                  onClick={() => { onExportReport('html'); setIsExportOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/15 text-slate-200 hover:text-amber-300 flex items-center justify-between transition-colors"
                >
                  <span>Standalone HTML (Print PDF)</span>
                </button>
                <button
                  onClick={() => { onExportReport('json'); setIsExportOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <span>Full JSON Payload</span>
                </button>
                <button
                  onClick={() => { onExportReport('csv-dns'); setIsExportOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <span>DNS Zones (CSV)</span>
                </button>
                <button
                  onClick={() => { onExportReport('csv-subs'); setIsExportOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <span>Subdomains (CSV)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
