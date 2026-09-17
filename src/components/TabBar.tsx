'use client';

import React from 'react';
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
  Server, 
  Swords, 
  Sliders, 
  Clock, 
  Database,
  ChevronDown
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

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  counts = {}
}) => {
  const categories: TabCategory[] = React.useMemo(() => [
    {
      id: 'core',
      label: 'Core Overview',
      tabs: [
        { id: 'story', label: 'Website Story', shortLabel: 'Story', icon: Sparkles },
        { id: 'overview', label: 'Domain Overview', shortLabel: 'Overview', icon: Globe },
        { id: 'visual-archeology', label: 'Visual Archeology', shortLabel: 'Visuals', icon: Eye },
      ]
    },
    {
      id: 'recon',
      label: 'Recon & Network',
      tabs: [
        { id: 'graph', label: 'Entity Topology', shortLabel: 'Topology', icon: Network, badge: counts.graphNodes },
        { id: 'subdomains', label: 'Subdomains', shortLabel: 'Subdomains', icon: Layers, badge: counts.subdomains },
        { id: 'infra', label: 'DNS Zone Map', shortLabel: 'DNS Zone', icon: Database, badge: counts.dnsRecords },
        { id: 'certs', label: 'TLS & Certificates', shortLabel: 'Certs', icon: Lock },
      ]
    },
    {
      id: 'forensic',
      label: 'Forensics & History',
      tabs: [
        { id: 'timeline', label: 'Wayback Timeline', shortLabel: 'Timeline', icon: Clock, badge: counts.snapshots },
        { id: 'tech-evolution', label: 'Tech Evolution', shortLabel: 'Tech Drift', icon: History },
        { id: 'dns-drift', label: 'DNS Drift Tracker', shortLabel: 'DNS Drift', icon: Sliders },
        { id: 'changes', label: 'Content Diffs', shortLabel: 'Diffs', icon: GitCompare },
        { id: 'compare', label: 'Snapshot Comparison', shortLabel: 'Compare', icon: Layers },
        { id: 'tech', label: 'Current Tech Stack', shortLabel: 'Tech Stack', icon: Cpu },
      ]
    },
    {
      id: 'intel',
      label: 'Comparative & Audit',
      tabs: [
        { id: 'vs', label: 'Domain vs Domain', shortLabel: 'Domain VS', icon: Swords },
        { id: 'evidence', label: 'Evidence Ledger', shortLabel: 'Evidence', icon: Shield, badge: counts.evidence },
      ]
    }
  ], [counts]);

  // Determine which category the active tab belongs to
  const activeCategoryId = React.useMemo(() => {
    for (const cat of categories) {
      if (cat.tabs.some(t => t.id === activeTab)) {
        return cat.id;
      }
    }
    return categories[0].id;
  }, [activeTab, categories]);

  const [selectedCategory, setSelectedCategory] = React.useState<string>(activeCategoryId);

  React.useEffect(() => {
    setSelectedCategory(activeCategoryId);
  }, [activeCategoryId]);

  const currentCategoryTabs = categories.find(c => c.id === selectedCategory)?.tabs || categories[0].tabs;
  const activeTabMeta = categories.flatMap(c => c.tabs).find(t => t.id === activeTab);

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-2.5 md:p-3 shadow-2xl backdrop-blur-xl space-y-2.5">
      {/* Mobile Selector Header */}
      <div className="md:hidden flex items-center justify-between gap-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          {activeTabMeta && (
            <>
              <activeTabMeta.icon className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-300">{activeTabMeta.label}</span>
            </>
          )}
        </div>
        <div className="relative">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as NavigationTab)}
            className="appearance-none bg-slate-900 border border-slate-700/80 text-slate-100 text-xs font-mono py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.label}>
                {cat.tabs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} {t.badge ? `(${t.badge})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Category Level Filter Pills (Desktop & Tablet) */}
      <div className="hidden md:flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
        <div className="flex items-center space-x-2">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            const hasActiveTab = cat.tabs.some(t => t.id === activeTab);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs font-mono px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  isCatActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span>{cat.label}</span>
                {hasActiveTab && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Active: <span className="text-amber-400 font-bold">{activeTabMeta?.label}</span>
        </div>
      </div>

      {/* Tabs Row for Selected Category */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        {currentCategoryTabs.map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/10 font-bold'
                  : 'bg-slate-950/60 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive 
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
