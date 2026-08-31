'use client';

import React from 'react';
import { WebsiteStoryMilestone, ExecutiveSummary, SubdomainRecord, Technology } from '@/types/osint';
import { 
  Sparkles, 
  GitCommit, 
  Layers, 
  Compass, 
  Globe, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Cpu,
  Palette,
  Network
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
  onTraceEvidence
}) => {
  const [filterCategory, setFilterCategory] = React.useState<string>('all');

  const categories = ['all', 'Framework Migration', 'UI/UX Redesign', 'Subdomain Expansion', 'Security & CDN'];

  const filteredMilestones = filterCategory === 'all'
    ? milestones
    : milestones.filter(m => m.category === filterCategory);

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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-mono font-extrabold bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Website Evolution Intelligence
                </span>
                <span className="text-xs text-slate-400 font-mono">Forensic Timeline Analysis</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono tracking-tight pt-1">
                What Happened to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">{domain}</span>?
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Active Since: <strong className="text-slate-100">{summary.firstRecordedDate.split('-')[0]}</strong> ({summary.totalYearsActive} yrs)
              </span>
            </div>
          </div>

          {/* Headline & Narrative Summary */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-5 space-y-3 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base md:text-lg font-bold text-amber-300 font-mono">
                  {summary.headline}
                </h3>
                <p className="text-sm text-slate-300 font-sans leading-relaxed">
                  {summary.narrative}
                </p>
              </div>
            </div>

            {/* Framework Evolution Pathway */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">Framework Evolution:</span>
                <span className="px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  {summary.primaryFrameworkEvolution}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">Security Posture:</span>
                <span className={`px-2.5 py-0.5 rounded font-bold ${
                  summary.securityRating === 'High' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {summary.securityRating}
                </span>
              </div>
            </div>
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div 
              onClick={() => onNavigateToTab?.('tech')}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/50 p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-purple-400" /> Active Stack</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="text-xl font-extrabold text-purple-300 font-mono">{technologies.length} Techs</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{technologies[0]?.name || 'Modern Stack'}</p>
            </div>

            <div 
              onClick={() => onNavigateToTab?.('timeline')}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/50 p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-amber-400" /> UI/UX Shifts</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xl font-extrabold text-amber-300 font-mono">{summary.majorRedesignsCount} Redesigns</p>
              <p className="text-[11px] text-slate-500 font-mono">Structural Overhauls</p>
            </div>

            <div 
              onClick={() => onNavigateToTab?.('subdomains')}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-emerald-400" /> Subdomains</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xl font-extrabold text-emerald-300 font-mono">{subdomains.length} Detected</p>
              <p className="text-[11px] text-slate-500 font-mono">Ecosystem Sprawl</p>
            </div>

            <div 
              onClick={() => onNavigateToTab?.('changes')}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/50 p-4 rounded-xl space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" /> History Span</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-xl font-extrabold text-cyan-300 font-mono">{summary.totalYearsActive} Years</p>
              <p className="text-[11px] text-slate-500 font-mono">{milestones.length} Milestones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Milestones Feed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-100 font-mono flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-amber-400" />
              Key Evolutionary Milestones & Findings
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Chronological log of major architectural rewrites, interface overhauls, and infrastructure events.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {cat === 'all' ? 'All Findings' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800 before:hidden md:before:block">
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              No milestones found matching the selected category.
            </div>
          ) : (
            filteredMilestones.map((m, mIdx) => (
              <div
                key={`${m.id}-${mIdx}`}
                className="relative flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg group"
              >
                {/* Year / Era Pill Badge */}
                <div className="flex md:flex-col items-center justify-between md:justify-start gap-2 md:w-28 shrink-0">
                  <div className="flex items-center gap-2 md:flex-col">
                    <span className="text-sm font-mono font-extrabold text-amber-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg shadow-sm">
                      {m.era}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {m.timestamp.split('T')[0]}
                    </span>
                  </div>
                </div>

                {/* Milestone Content */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-semibold flex items-center gap-1.5 ${getCategoryBadgeStyle(m.category)}`}>
                        {getCategoryIcon(m.category)}
                        {m.category}
                      </span>
                      {m.impact === 'critical' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold uppercase">
                          Critical Shift
                        </span>
                      )}
                      {m.impact === 'major' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold uppercase">
                          Major Milestone
                        </span>
                      )}
                    </div>

                    {/* Trace Evidence Link */}
                    {onTraceEvidence && (
                      <button
                        onClick={() => onTraceEvidence(m.evidenceId || m.title)}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                        title="Trace underlying evidence record"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Trace Evidence</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-100 font-mono group-hover:text-amber-300 transition-colors">
                    {m.title}
                  </h4>

                  <p className="text-sm text-slate-300 font-sans leading-relaxed">
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

