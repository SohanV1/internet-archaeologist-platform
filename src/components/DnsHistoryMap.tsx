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
  ExternalLink
} from 'lucide-react';

interface Props {
  asnInfo?: AsnInfo[];
  dnsRecords: DnsRecord[];
  domain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const DnsHistoryMap: React.FC<Props> = ({ asnInfo = [], dnsRecords, domain, onTraceEvidence }) => {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const aRecords = dnsRecords.filter(r => r.type === 'A' || r.type === 'AAAA');
  const nsRecords = dnsRecords.filter(r => r.type === 'NS');
  const mxRecords = dnsRecords.filter(r => r.type === 'MX');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Server className="w-6 h-6 text-blue-400" />
            IP Routing & Autonomous System (ASN) Map
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            BGP routing analysis, Autonomous System Numbers (ASN), ISP infrastructure, and authoritative DNS clusters.
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
                    <span className="text-xs font-mono text-slate-400 uppercase block font-bold">Autonomous System</span>
                    <span className="text-base font-extrabold text-blue-300 font-mono">{item.asn}</span>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-md font-mono font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  Country: {item.country}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">BGP Route CIDR</span>
                  <span className="text-slate-200">{item.cidr || `${item.ip}/24`}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Target IP</span>
                    <span className="text-emerald-400 font-bold">{item.ip}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.ip)}
                    className="p-1 text-slate-500 hover:text-emerald-400 cursor-pointer"
                    title="Copy IP"
                  >
                    {copiedText === item.ip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/70 text-xs font-mono space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Network Owner / Organization:</span>
                <p className="text-slate-200 font-bold">{item.org}</p>
                {item.isp && <p className="text-[11px] text-slate-400 italic">ISP: {item.isp}</p>}
              </div>
            </div>

            {onTraceEvidence && (
              <div className="pt-2">
                <button
                  onClick={() => onTraceEvidence(item.evidenceId || item.ip)}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-500/20"
                >
                  <span>Trace Routing Evidence</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Authoritative Infrastructure Clusters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Nameservers */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Authoritative Nameserver Nodes ({nsRecords.length}):
            </span>
          </div>
          <div className="space-y-1.5">
            {nsRecords.length === 0 ? (
              <p className="text-slate-500 text-xs font-mono italic">No NS records captured.</p>
            ) : (
              nsRecords.map((ns, idx) => (
                <div key={idx} className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
                  <span>{ns.value}</span>
                  <span className="text-[10px] text-slate-500 font-mono">TTL: {ns.ttl || 3600}s</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mail Exchanger Records */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Mail Routing (MX) Infrastructure ({mxRecords.length}):
            </span>
          </div>
          <div className="space-y-1.5">
            {mxRecords.length === 0 ? (
              <p className="text-slate-500 text-xs font-mono italic">No MX mail servers configured.</p>
            ) : (
              mxRecords.map((mx, idx) => (
                <div key={idx} className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-amber-300 flex items-center justify-between">
                  <span>{mx.value}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Pri: {mx.priority || 10}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};