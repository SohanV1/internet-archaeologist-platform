'use client';

import React from 'react';
import { AsnInfo, DnsRecord } from '@/types/osint';
import {
  Server,
  Globe2,
  Network,
  ShieldCheck,
  MapPin,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  Database,
  ExternalLink,
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
  asnInfo?: AsnInfo[];
  dnsRecords: DnsRecord[];
  domain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const DnsHistoryMap: React.FC<Props> = ({
  asnInfo = [],
  dnsRecords,
  domain,
  onTraceEvidence,
}) => {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Group ASN by Organization
  const orgStats = React.useMemo(() => {
    const map = new Map<string, number>();
    asnInfo.forEach((a) => {
      let shortOrg = a.org
        .split(',')[0]
        .replace(/Inc\.?|LLC|Corporation/gi, '')
        .trim();
      if (shortOrg.length > 18) shortOrg = shortOrg.substring(0, 16) + '...';
      map.set(shortOrg, (map.get(shortOrg) || 0) + 1);
    });
    return Array.from(map.entries()).map(([org, count]) => ({
      org,
      count,
    }));
  }, [asnInfo]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Server className="w-6 h-6 text-blue-400" />
            IP Routing & Autonomous System (ASN) Map
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            BGP routing analysis, Autonomous System Numbers (ASN), ISP infrastructure, and
            authoritative DNS clusters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTraceEvidence && (
            <button
              onClick={() => onTraceEvidence('ev-asn-routing-' + domain)}
              className="text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Trace ASN Evidence</span>
            </button>
          )}

          <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <Globe2 className="w-3.5 h-3.5" />
            {asnInfo.length} Resolved Endpoints
          </span>
        </div>
      </div>

      {/* ASN Distribution Chart */}
      {asnInfo.length > 0 && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 md:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              Autonomous System Network Distribution
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              IP allocation across hosting networks & cloud backbones
            </span>
          </div>

          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orgStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="org"
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
                          <div className="text-blue-400 font-bold">{data.org}</div>
                          <div className="text-slate-300">
                            Allocated Endpoints:{' '}
                            <span className="text-white font-bold">{data.count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {orgStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#3b82f6', '#06b6d4', '#10b981', '#a855f7'][index % 4]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Resolved Autonomous Systems (ASN) Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {asnInfo.map((item, idx) => (
          <div
            key={`${item.ip}-${idx}`}
            className="bg-slate-950/85 border border-slate-800/90 rounded-xl p-5 space-y-4 hover:border-blue-500/40 transition-all shadow-md group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                    <Network className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-slate-400 uppercase block font-bold">
                      Autonomous System
                    </span>
                    <span className="text-base font-extrabold text-blue-300 font-mono">
                      {item.asn}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-md font-mono font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  Country: {item.country}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">
                    BGP Route CIDR
                  </span>
                  <span className="text-slate-200">{item.cidr || `${item.ip}/24`}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">
                      Target IP
                    </span>
                    <span className="text-cyan-300 font-bold truncate block">{item.ip}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.ip)}
                    className="p-1 text-slate-500 hover:text-slate-200 cursor-pointer"
                    title="Copy IP"
                  >
                    {copiedText === item.ip ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1 text-xs font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Organization / Carrier:
                </span>
                <span className="text-slate-200 font-semibold block">{item.org}</span>
                {item.isp && (
                  <span className="text-slate-400 text-[11px] block">ISP: {item.isp}</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 text-[11px]">Anycast Cloud Node</span>
              {onTraceEvidence && (
                <button
                  onClick={() => onTraceEvidence(item.evidenceId || item.asn)}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Trace Provenance</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
