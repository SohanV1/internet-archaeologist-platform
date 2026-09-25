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
    <header className="bg-white/80 dark:bg-[#0a0a0c]/85 backdrop-blur-xl text-neutral-900 dark:text-neutral-100 border-b border-black/[0.06] dark:border-white/[0.08] sticky top-0 z-50 px-4 md:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Apple-style Logo & Monogram */}
        <div
          className="flex items-center space-x-3 cursor-pointer group select-none"
          onClick={() => onSearch('example.com')}
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-sm transition-transform active:scale-95">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-[15px] tracking-tight text-neutral-900 dark:text-neutral-100">
                Internet Archaeologist
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono font-medium border border-black/[0.04] dark:border-white/[0.06]">
                v2.1
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              OSINT Reconnaissance & Temporal Forensics
            </p>
          </div>
        </div>

        {/* Minimal Search Field & Clean Presets */}
        <div className="flex-1 max-w-xl w-full flex flex-col gap-1.5">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <div className="relative w-full group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-neutral-800 dark:group-focus-within:text-neutral-200" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search domain (e.g. example.com, github.com)..."
                className="w-full bg-neutral-100/90 dark:bg-neutral-900/90 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-[#121214] rounded-xl pl-10 pr-16 py-2 text-xs md:text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 apple-focus transition-all shadow-none"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-2xs">
                  ↵
                </kbd>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-xs md:text-sm rounded-xl transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 apple-focus"
            >
              <span>Scan Target</span>
            </button>
          </form>

          {/* Preset Domain Tags */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-sans overflow-x-auto py-0.5">
            <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-medium shrink-0">Presets:</span>
            {PRESET_DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => {
                  setInputVal(domain);
                  onSearch(domain);
                }}
                className="px-2.5 py-1 min-h-[28px] rounded-md bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer touch-manipulation apple-focus"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] text-xs bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer apple-focus"
              title="Global forensic search across all tabs (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-xs bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer apple-focus"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* Share Permalink Button */}
          <button
            onClick={handleSharePermalink}
            className="flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] text-xs bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer apple-focus"
            title="Share domain investigation permalink"
          >
            {isCopiedPermalink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Saved Dossiers Modal Toggle */}
          <button
            onClick={onToggleSavedModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] text-xs bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer apple-focus"
            title="View saved research projects"
          >
            <Shield className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono rounded-full font-medium">
                {savedCount}
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] text-xs bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl border border-black/[0.04] dark:border-white/[0.06] transition-colors cursor-pointer apple-focus"
              title="Export Findings"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Export</span>
            </button>

            {isExportOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#161618] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-xl"
                onMouseLeave={() => setIsExportOpen(false)}
              >
                <button
                  onClick={() => {
                    onExportReport('html');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  <span>Standalone HTML Report</span>
                </button>
                <button
                  onClick={() => {
                    onExportReport('json');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  <span>Full JSON Payload</span>
                </button>
                <button
                  onClick={() => {
                    onExportReport('csv-dns');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  <span>DNS Zones (CSV)</span>
                </button>
                <button
                  onClick={() => {
                    onExportReport('csv-subs');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
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
