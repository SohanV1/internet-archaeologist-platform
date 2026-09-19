'use client';

import React from 'react';
import { SubdomainRecord } from '@/types/osint';
import {
  Network,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Globe,
  Shield,
  ArrowRight,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface Props {
  subdomains: SubdomainRecord[];
  rootDomain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const SubdomainsView: React.FC<Props> = ({ subdomains, rootDomain, onTraceEvidence }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [copiedDomain, setCopiedDomain] = React.useState<string | null>(null);

  const filtered = subdomains.filter(
    (s) =>
      s.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.fullDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  // Group by discovery source
  const sourceStats = React.useMemo(() => {
    const map = new Map<string, number>();
    subdomains.forEach((s) => {
      map.set(s.source, (map.get(s.source) || 0) + 1);
    });
    return Array.from(map.entries()).map(([source, count]) => ({
      source,
      count,
    }));
  }, [subdomains]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Network className="w-6 h-6 text-emerald-400" />
            Passive Subdomain & Hostname Reconnaissance
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Ecosystem hostnames identified via Certificate Transparency (crt.sh) and public web
            crawls with linked provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            {subdomains.length} Discovered Hosts
          </span>
        </div>
      </div>

      {/* Subdomain Discovery Source Distribution Chart */}
      {subdomains.length > 0 && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 md:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Subdomain Discovery Vectors & Intelligence Sources
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Host distribution by reconnaissance channel
            </span>
          </div>

          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="source"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl font-mono text-xs text-slate-200 shadow-xl">
                          <div className="text-emerald-400 font-bold">{data.source}</div>
                          <div className="text-slate-300">
                            Hosts Found: <span className="text-white font-bold">{data.count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {sourceStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#10b981', '#3b82f6', '#06b6d4', '#a855f7'][index % 4]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter subdomains (e.g. api, app, cdn)..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-slate-200 font-bold">{filtered.length}</span> of{' '}
          {subdomains.length} subdomains
        </div>
      </div>

      {/* Subdomain Grid / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
          No subdomains match the search filter "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-xl p-4 space-y-3 transition-all group shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-400">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {item.subdomain}
                    </span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(item.fullDomain)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md text-xs transition-colors cursor-pointer"
                    title="Copy full hostname"
                  >
                    {copiedDomain === item.fullDomain ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <div
                    className="text-xs font-mono text-slate-200 font-semibold truncate"
                    title={item.fullDomain}
                  >
                    {item.fullDomain}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Source:</span>
                    <span className="text-slate-400 font-medium">{item.source}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                {onTraceEvidence ? (
                  <button
                    onClick={() => onTraceEvidence(item.evidenceId || item.fullDomain)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Evidence</span>
                  </button>
                ) : (
                  <span className="text-slate-500 text-[10px]">Verified</span>
                )}

                <a
                  href={`https://${item.fullDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <span>Visit Host</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
