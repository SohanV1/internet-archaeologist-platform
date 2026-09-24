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
  ChevronDown,
  Menu,
  X,
  HeartPulse,
  ShieldAlert,
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
    contacts?: number;
    healthIssues?: number;
    vulns?: number;
  };
}

export const TabBarComponent: React.FC<TabBarProps> = ({ activeTab, onTabChange, counts = {} }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

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
      {
        id: 'defensive-v2',
        label: 'v2.0 Defensive Suite',
        tabs: [
          {
            id: 'domain-intel',
            label: 'Domain Intelligence',
            shortLabel: 'Domain Intel',
            icon: Globe,
            badge: counts.contacts,
          },
          {
            id: 'website-health',
            label: 'Website Health & Hygiene',
            shortLabel: 'Site Health',
            icon: HeartPulse,
            badge: counts.healthIssues,
          },
          {
            id: 'vulnerabilities',
            label: 'Vulnerability Posture',
            shortLabel: 'Vuln Audit',
            icon: ShieldAlert,
            badge: counts.vulns,
          },
          {
            id: 'scan-diff',
            label: 'Historical Scan Diff',
            shortLabel: 'Scan Diff',
            icon: GitCompare,
          },
        ],
      },
    ],
    [counts]
  );

  const activeCategory = useMemo(() => {
    return categories.find((cat) => cat.tabs.some((t) => t.id === activeTab))?.id || 'core';
  }, [categories, activeTab]);

  const visibleCategories = useMemo(() => {
    if (selectedCategory === 'all') return categories;
    return categories.filter((cat) => cat.id === selectedCategory);
  }, [categories, selectedCategory]);

  return (
    <>
      {/* Mobile Toggle Button (Visible only on screens < lg) */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-white dark:bg-[#141416] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl mb-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
            Active: <span className="text-neutral-900 dark:text-neutral-100 font-semibold">{activeTab}</span>
          </span>
        </div>

        <span className="text-[11px] text-neutral-400 font-medium">20 Modules</span>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`
          ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#141416] p-4 shadow-2xl overflow-y-auto block' : 'hidden'}
          lg:block shrink-0 transition-all duration-200 ease-in-out
          ${isCollapsed ? 'lg:w-16' : 'lg:w-60'}
          bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-2.5 apple-card backdrop-blur-xl relative
        `}
      >
        {/* Top Controls: Collapse Toggle & Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
          {!isCollapsed && (
            <div className="hidden lg:flex items-center gap-2 pl-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Modules
              </span>
            </div>
          )}

          {/* Mobile close button */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white ml-auto cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Collapsible Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors ml-auto cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar Collapse"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Category Filter Pills (Uncluttered fast switching) */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl mb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedCategory === c.id
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                    : activeCategory === c.id
                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <span>{c.label.split(' ')[0]}</span>
                {activeCategory === c.id && selectedCategory !== c.id && (
                  <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Navigation Categories & Tabs */}
        <div className="space-y-3">
          {visibleCategories.map((cat) => {
            const isCatCollapsed = Boolean(collapsedCategories[cat.id]);

            return (
              <div key={cat.id} className="space-y-0.5">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold select-none hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer group"
                  >
                    <span>{cat.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-transform duration-200 ${
                        isCatCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>
                )}

                {!isCatCollapsed && (
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
                            w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer group relative apple-focus
                            ${
                              isActive
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium shadow-2xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                            }
                            ${isCollapsed ? 'justify-center px-1.5' : 'justify-between'}
                          `}
                          title={isCollapsed ? tab.label : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-white dark:text-neutral-950'
                                  : 'text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                              }`}
                            />
                            {!isCollapsed && <span className="truncate">{tab.label}</span>}
                          </div>

                          {!isCollapsed && Boolean(tab.badge) && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white dark:bg-black/15 dark:text-neutral-950'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}

                          {/* Indicator when collapsed */}
                          {isCollapsed && Boolean(tab.badge) && (
                            <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-400'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
};

export const TabBar = memo(TabBarComponent);
