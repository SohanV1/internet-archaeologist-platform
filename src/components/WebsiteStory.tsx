'use client';

import React from 'react';
import {
  WebsiteStoryMilestone,
  ExecutiveSummary,
  SubdomainRecord,
  Technology,
} from '@/types/osint';
import {
  Sparkles,
  GitCommit,
  Compass,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Cpu,
  Palette,
  Network,
} from 'lucide-react';

interface Props {
  domain: string;
  summary: ExecutiveSummary;
  milestones: WebsiteStoryMilestone[];
  subdomains: SubdomainRecord[];
  technologies: Technology[];
  onNavigateToTab?: (tab: 'tech' | 'timeline' | 'changes' | 'graph' | 'subdomains') => void;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const WebsiteStory: React.FC<Props> = ({
  domain,
  summary,
  milestones,
  subdomains,
  technologies,
  onNavigateToTab,
  onTraceEvidence,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');

  const categories = [
    'all',
    'Framework Migration',
    'UI/UX Redesign',
    'Subdomain Expansion',
    'Security & CDN',
  ];

  const filteredMilestones = milestones.filter((m) => {
    const matchesCat = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.details && m.details.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Framework Migration':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'UI/UX Redesign':
        return <Palette className="w-4 h-4 text-amber-400" />;
      case 'Subdomain Expansion':
        return <Network className="w-4 h-4 text-emerald-400" />;
      case 'Security & CDN':
        return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
      default:
        return <GitCommit className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'Framework Migration':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'UI/UX Redesign':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Subdomain Expansion':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Security & CDN':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Story Narrative Hero Card */}
      <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 md:p-8 apple-card backdrop-blur-xl relative overflow-hidden transition-colors">
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.06] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-neutral-500" />
                  Website Evolution Intelligence
                </span>
                <span className="text-xs text-neutral-400">Forensic Timeline Analysis</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight pt-1">
                Evolutionary History of{' '}
                <span className="text-neutral-900 dark:text-white font-bold">
                  {domain}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-neutral-600 dark:text-neutral-300 flex items-center gap-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Active Since:{' '}
                <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                  {summary.firstRecordedDate.split('-')[0]}
                </strong>{' '}
                ({summary.totalYearsActive} yrs)
              </span>
            </div>
          </div>

          {/* Headline & Narrative Summary */}
          <div className="bg-neutral-50/70 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {summary.headline}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                  {summary.narrative}
                </p>
              </div>
            </div>

            {/* Framework Evolution Pathway */}
            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-medium uppercase tracking-wider text-[11px]">
                  Framework Evolution:
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 font-medium">
                  {summary.primaryFrameworkEvolution}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-medium uppercase tracking-wider text-[11px]">
                  Security Posture:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    summary.securityRating === 'High'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {summary.securityRating} Security
                </span>
              </div>
            </div>
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div
              onClick={() => onNavigateToTab?.('tech')}
              className="bg-neutral-50/70 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.12] p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-neutral-400" /> Active Stack
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
              </div>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {technologies.length} Techs
              </p>
              <p className="text-[11px] text-neutral-400 truncate">
                {technologies[0]?.name || 'Modern Stack'}
              </p>
            </div>

            <div
              onClick={() => onNavigateToTab?.('timeline')}
              className="bg-neutral-50/70 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.12] p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Palette className="w-3.5 h-3.5 text-neutral-400" /> UI/UX Shifts
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
              </div>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {summary.majorRedesignsCount} Redesigns
              </p>
              <p className="text-[11px] text-neutral-400">Structural Overhauls</p>
            </div>

            <div
              onClick={() => onNavigateToTab?.('subdomains')}
              className="bg-neutral-50/70 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.12] p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Network className="w-3.5 h-3.5 text-neutral-400" /> Subdomains
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
              </div>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {subdomains.length} Detected
              </p>
              <p className="text-[11px] text-neutral-400">Ecosystem Sprawl</p>
            </div>

            <div
              onClick={() => onNavigateToTab?.('changes')}
              className="bg-neutral-50/70 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.12] p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" /> History Span
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
              </div>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {summary.totalYearsActive} Years
              </p>
              <p className="text-[11px] text-neutral-400">{milestones.length} Milestones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Milestones Feed */}
      <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 md:p-8 apple-card backdrop-blur-xl space-y-6 transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
          <div className="space-y-0.5">
            <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              Key Evolutionary Milestones & Findings
            </h3>
            <p className="text-xs text-neutral-500">
              Chronological log of major architectural rewrites, interface overhauls, and infrastructure events.
            </p>
          </div>

          {/* Search Input and Category Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <div className="relative w-full sm:w-52">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search milestones..."
                className="w-full bg-neutral-100/90 dark:bg-neutral-900/90 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-all capitalize cursor-pointer text-[11px] font-medium ${
                    filterCategory === cat
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-2xl">
              No milestones found matching your search or filter.
            </div>
          ) : (
            filteredMilestones.map((m, mIdx) => (
              <div
                key={`${m.id}-${mIdx}`}
                className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-all group"
              >
                {/* Year / Era Pill Badge */}
                <div className="flex md:flex-col items-center justify-between md:justify-start gap-1.5 md:w-28 shrink-0">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-black/[0.06] dark:border-white/[0.08] px-2.5 py-1 rounded-lg">
                    {m.era}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {m.timestamp.split('T')[0]}
                  </span>
                </div>

                {/* Milestone Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1.5 ${getCategoryBadgeStyle(m.category)}`}
                      >
                        {getCategoryIcon(m.category)}
                        {m.category}
                      </span>
                      {m.impact === 'critical' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">
                          Critical Shift
                        </span>
                      )}
                      {m.impact === 'major' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
                          Major
                        </span>
                      )}
                    </div>

                    {/* Trace Evidence Link */}
                    {onTraceEvidence && (
                      <button
                        onClick={() => onTraceEvidence(m.evidenceId || m.title)}
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] px-2 py-0.5 rounded-lg border border-black/[0.04] dark:border-white/[0.06]"
                        title="Trace underlying evidence record"
                      >
                        <ShieldCheck className="w-3 h-3 text-neutral-400" />
                        <span>Trace Evidence</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                    {m.title}
                  </h4>

                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                    {m.description}
                  </p>

                  {/* Bullet details if present */}
                  {m.details && m.details.length > 0 && (
                    <div className="pt-2">
                      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold block">
                          Supporting Forensic Artifacts & Indicators:
                        </span>
                        <ul className="space-y-1 text-xs font-mono text-slate-300">
                          {m.details.slice(0, 5).map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold">&bull;</span>
                              <span className="text-slate-300">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
