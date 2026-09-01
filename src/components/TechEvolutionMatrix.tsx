'use client';

import React from 'react';
import { TechEvolutionAnalysis, TechEvolutionEra, TechEvolutionItem, TechLifecycleStatus } from '@/types/osint';
import { 
  Cpu, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ShieldCheck, 
  Server,
  Code
} from 'lucide-react';

interface Props {
  techEvolution?: TechEvolutionAnalysis;
  domain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const TechEvolutionMatrix: React.FC<Props> = ({ techEvolution, domain, onTraceEvidence }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState<'all' | 'introduced' | 'retained' | 'deprecated'>('all');

  if (!techEvolution || techEvolution.eras.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-3 font-mono">
        <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-300">Tech Evolution History Not Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Historical snapshot captures are needed to synthesize the chronological stack migration trail.
        </p>
      </div>
    );
  }

  const { eras, lifecycleItems, stackShiftNarrative, frontendEvolutionTrail, infrastructureEvolutionTrail, totalTechsDetectedHistorically } = techEvolution;

  const filteredItems = lifecycleItems.filter(item => {
    const matchesSearch = item.technology.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.technology.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.lifecycle === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getLifecycleBadge = (status: TechLifecycleStatus) => {
    switch (status) {
      case 'introduced':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Introduced
          </span>
        );
      case 'deprecated':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Sunset / Replaced
          </span>
        );
      case 'retained':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active Stack
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Narrative & Flow Hero */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" />
                Stack Drift & Lifecycle Matrix
              </span>
              <span className="text-xs text-slate-400 font-mono">Chronological Stack Archeology</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight pt-1">
              How <span className="text-purple-300">{domain}</span> Evolved Its Tech Stack Over Time
            </h2>
          </div>

          <span className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <strong className="text-slate-100">{totalTechsDetectedHistorically}</strong> Historic Signatures Identified
          </span>
        </div>

        {/* Narrative & Evolution Trails */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-5 space-y-4 shadow-inner">
          <p className="text-sm text-slate-300 font-sans leading-relaxed">
            {stackShiftNarrative}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 font-mono text-xs">
            {/* Frontend Trail */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                Client-Side Framework Evolution:
              </span>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {frontendEvolutionTrail.map((fe, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-md font-bold text-xs">
                      {fe}
                    </span>
                    {idx < frontendEvolutionTrail.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Infrastructure Trail */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Infrastructure & Edge Evolution:
              </span>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {infrastructureEvolutionTrail.map((ie, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-md font-bold text-xs">
                      {ie}
                    </span>
                    {idx < infrastructureEvolutionTrail.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Archaeological Eras Timeline Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Archeological Eras & Stack Drift Breakdown
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Comparing technology presence, introductions, and sunsetted libraries by era.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {eras.map((era, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800/90 hover:border-purple-500/40 rounded-xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs font-mono font-extrabold text-amber-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {era.yearRange}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {era.snapshotsCount} Captures
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100 font-mono group-hover:text-purple-300 transition-colors">
                  {era.era}
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Primary Frontend</span>
                    <span className="text-purple-300 font-bold block truncate">{era.dominantFrontend}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Hosting / CDN</span>
                    <span className="text-blue-300 font-bold block truncate">{era.dominantInfrastructure}</span>
                  </div>
                </div>

                {/* Newly Introduced */}
                {era.introduced.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Adopted in this Era ({era.introduced.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {era.introduced.map((t, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono">
                          +{t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deprecated */}
                {era.deprecated.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Deprecated ({era.deprecated.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {era.deprecated.map((t, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] rounded font-mono line-through">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Active Stack:</span>
                <span className="text-slate-200 font-bold">{era.activeStack.length} Techs</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifecycle Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search historical technologies, categories..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Status:</span>
            {(['all', 'introduced', 'retained', 'deprecated'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                  selectedFilter === filter
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                {filter === 'all' ? 'All Lifecycle' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Technology</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Lifecycle State</th>
                <th className="p-3.5">First Seen</th>
                <th className="p-3.5">Confidence</th>
                <th className="p-3.5 text-right">Evidence Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No technologies matched your filter query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/60 transition-colors group">
                    <td className="p-3.5 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span>{item.technology.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400">{item.technology.category}</td>
                    <td className="p-3.5">{getLifecycleBadge(item.lifecycle)}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                        {item.firstSeenEra}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 font-bold text-[11px]">
                        {item.technology.confidence}%
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {onTraceEvidence && (
                        <button
                          onClick={() => onTraceEvidence(item.evidenceId || item.technology.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Trace</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
