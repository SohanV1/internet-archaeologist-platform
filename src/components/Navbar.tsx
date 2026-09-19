'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  Search,
  Shield,
  Download,
  Sparkles,
  Terminal,
  Share2,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  currentDomain: string;
  onSearch: (domain: string) => void;
  onExportReport: (format: 'json' | 'html' | 'csv-dns' | 'csv-subs') => void;
  savedCount: number;
  onToggleSavedModal: () => void;
  onOpenGlobalSearch?: () => void;
}

const PRESET_DOMAINS = ['example.com', 'github.com', 'wikipedia.org', 'cloudflare.com'];

export const NavbarComponent: React.FC<NavbarProps> = ({
  currentDomain,
  onSearch,
  onExportReport,
  savedCount,
  onToggleSavedModal,
  onOpenGlobalSearch,
}) => {
  const [inputVal, setInputVal] = useState(currentDomain);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCopiedPermalink, setIsCopiedPermalink] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setInputVal(currentDomain);
  }, [currentDomain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handleSharePermalink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedPermalink(true);
      setTimeout(() => setIsCopiedPermalink(false), 2500);
    }
  }, []);

  return (
    <header className="bg-slate-950/80 backdrop-blur-md text-slate-100 border-b border-slate-800/80 sticky top-0 z-50 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / Title */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onSearch('example.com')}
        >
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent text-amber-400 rounded-xl border border-amber-500/30 group-hover:border-amber-400 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.4"
                strokeDasharray="2 2"
              />
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeOpacity="0.7" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeOpacity="0.3" />
              <path
                d="M12 12l7 -7"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-spin origin-center"
                style={{ animationDuration: '4s' }}
              />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 flex items-center gap-2 font-mono">
              INTERNET ARCHAEOLOGIST
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                v1.5
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OSINT Reconnaissance & Temporal Forensics
            </p>
          </div>
        </div>

        {/* Search Bar & Quick Presets */}
        <div className="flex-1 max-w-xl w-full flex flex-col gap-1.5">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <div className="relative w-full group">
              <Terminal className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/70 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Target domain (e.g. example.com, github.com)..."
                className="w-full bg-slate-900/95 border border-slate-700/80 rounded-xl pl-10 pr-16 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono transition-all shadow-inner"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded shadow-sm">
                  ↵ Enter
                </kbd>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs md:text-sm rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Scan Target</span>
            </button>
          </form>

          {/* Preset Domain Tags */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono overflow-x-auto">
            <span className="text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
            </span>
            {PRESET_DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => {
                  setInputVal(domain);
                  onSearch(domain);
                }}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-amber-500/10 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions & Navigation Controls */}
        <div className="flex items-center space-x-2 relative">
          {/* Global Multi-Tab Search Button (⌘K) */}
          {onOpenGlobalSearch && (
            <button
              onClick={onOpenGlobalSearch}
              className="flex items-center space-x-1 px-3 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 hover:border-slate-700 transition-all font-mono shadow-sm cursor-pointer"
              title="Global forensic search across all tabs (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-xs bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Share Permalink Button */}
          <button
            onClick={handleSharePermalink}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 hover:border-slate-700 transition-all font-medium shadow-sm cursor-pointer"
            title="Share domain investigation permalink"
          >
            {isCopiedPermalink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Saved Dossiers Modal Toggle */}
          <button
            onClick={onToggleSavedModal}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 hover:border-slate-700 transition-all font-medium shadow-sm cursor-pointer"
            title="View saved research projects"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/40 font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all font-medium cursor-pointer"
              title="Export Findings"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export</span>
            </button>

            {isExportOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-mono space-y-1 backdrop-blur-xl"
                onMouseLeave={() => setIsExportOpen(false)}
              >
                <button
                  onClick={() => {
                    onExportReport('html');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/15 text-slate-200 hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Standalone HTML Report</span>
                </button>
                <button
                  onClick={() => {
                    onExportReport('json');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                >
                  <span>Full JSON Payload</span>
                </button>
                <button
                  onClick={() => {
                    onExportReport('csv-dns');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                >
                  <span>DNS Zones (CSV)</span>
                </button>
                <button
                  onClick={() => {
                    onExportReport('csv-subs');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
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

export const Navbar = memo(NavbarComponent);
