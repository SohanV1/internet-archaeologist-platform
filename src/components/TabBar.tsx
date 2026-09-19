'use client';

import React, { useState, useMemo, memo } from 'react';
import {
  Globe,
  Cpu,
  History,
  GitCompare,
  Network,
  Shield,
  Sparkles,
  Layers,
  Eye,
  Lock,
  Swords,
  Sliders,
  Clock,
  Database,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { NavigationTab } from '@/app/page';

interface TabItem {
  id: NavigationTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface TabCategory {
  id: string;
  label: string;
  tabs: TabItem[];
}

interface TabBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  counts?: {
    subdomains?: number;
    evidence?: number;
    graphNodes?: number;
    dnsRecords?: number;
    snapshots?: number;
  };
}

export const TabBarComponent: React.FC<TabBarProps> = ({ activeTab, onTabChange, counts = {} }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const categories: TabCategory[] = useMemo(
    () => [
      {
        id: 'core',
        label: 'Core Overview',
        tabs: [
          { id: 'story', label: 'Website Story', shortLabel: 'Story', icon: Sparkles },
          { id: 'overview', label: 'Domain Overview', shortLabel: 'Overview', icon: Globe },
          { id: 'visual-archeology', label: 'Visual Archeology', shortLabel: 'Visuals', icon: Eye },
          {
            id: 'analytics',
            label: 'Codebase Analytics',
            shortLabel: 'Analytics',
            icon: BarChart2,
          },
        ],
      },
      {
        id: 'recon',
        label: 'Recon & Network',
        tabs: [
          {
            id: 'graph',
            label: 'Entity Topology',
            shortLabel: 'Topology',
            icon: Network,
            badge: counts.graphNodes,
          },
          {
            id: 'subdomains',
            label: 'Subdomains',
            shortLabel: 'Subdomains',
            icon: Layers,
            badge: counts.subdomains,
          },
          {
            id: 'infra',
            label: 'DNS Zone Map',
            shortLabel: 'DNS Zone',
            icon: Database,
            badge: counts.dnsRecords,
          },
          { id: 'certs', label: 'TLS & Certificates', shortLabel: 'Certs', icon: Lock },
        ],
      },
      {
        id: 'forensic',
        label: 'Forensics & History',
        tabs: [
          {
            id: 'timeline',
            label: 'Wayback Timeline',
            shortLabel: 'Timeline',
            icon: Clock,
            badge: counts.snapshots,
          },
          {
            id: 'tech-evolution',
            label: 'Tech Evolution',
            shortLabel: 'Tech Drift',
            icon: History,
          },
          { id: 'dns-drift', label: 'DNS Drift Tracker', shortLabel: 'DNS Drift', icon: Sliders },
          { id: 'changes', label: 'Content Diffs', shortLabel: 'Diffs', icon: GitCompare },
          { id: 'compare', label: 'Snapshot Comparison', shortLabel: 'Compare', icon: Layers },
          { id: 'tech', label: 'Current Tech Stack', shortLabel: 'Tech Stack', icon: Cpu },
        ],
      },
      {
        id: 'intel',
        label: 'Comparative & Audit',
        tabs: [
          { id: 'vs', label: 'Domain vs Domain', shortLabel: 'Domain VS', icon: Swords },
          {
            id: 'evidence',
            label: 'Evidence Ledger',
            shortLabel: 'Evidence',
            icon: Shield,
            badge: counts.evidence,
          },
        ],
      },
    ],
    [counts]
  );

  return (
    <>
      {/* Mobile Toggle Button (Visible only on screens < lg) */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl mb-4 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-mono text-xs text-slate-300 font-bold uppercase">
            Active: <span className="text-amber-400">{activeTab}</span>
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-500">16 Modules</span>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`
          ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 p-4 shadow-2xl overflow-y-auto block' : 'hidden'}
          lg:block shrink-0 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:w-18' : 'lg:w-64'}
          bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl relative
        `}
      >
        {/* Top Controls: Collapse Toggle & Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          {!isCollapsed && (
            <div className="hidden lg:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recon Modules
              </span>
            </div>
          )}

          {/* Mobile close button */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Collapsible Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors ml-auto cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar Collapse"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Categories & Tabs */}
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  {cat.label}
                </div>
              )}

              <div className="space-y-0.5">
                {cat.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsMobileOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer group relative
                        ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                        }
                        ${isCollapsed ? 'justify-center px-2' : 'justify-between'}
                      `}
                      title={isCollapsed ? tab.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'}`}
                        />
                        {!isCollapsed && <span className="truncate">{tab.label}</span>}
                      </div>

                      {!isCollapsed && Boolean(tab.badge) && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${isActive ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                        >
                          {tab.badge}
                        </span>
                      )}

                      {/* Dot badge indicator when collapsed */}
                      {isCollapsed && Boolean(tab.badge) && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
};

export const TabBar = memo(TabBarComponent);
