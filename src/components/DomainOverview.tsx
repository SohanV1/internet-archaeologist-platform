'use client';

import React from 'react';
import { Investigation } from '@/types/osint';
import { Globe, Server, Database, ShieldCheck, Copy, Check, Network, Calendar, Sparkles } from 'lucide-react';

interface Props {
  investigation: Investigation;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const DomainOverview: React.FC<Props> = ({ investigation, onTraceEvidence }) => {
  const [copiedIp, setCopiedIp] = React.useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
      {/* Decorative gradient glow top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-500" />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-amber-400/90 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Target Dossier
            </span>
            <span className="text-xs text-slate-500 font-mono">
              (ID: {investigation.id.substring(0, 14)}...)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-3 font-mono">
            <Globe className="w-7 h-7 text-amber-400" />
            {investigation.domain}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onTraceEvidence && (
            <button
              onClick={() => onTraceEvidence('ev-dns-' + investigation.domain)}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5 text-xs font-semibold font-mono shadow-sm transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Provenance Dossier
            </button>
          )}

          <span className="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1.5 text-xs font-semibold font-mono">
            <Sparkles className="w-3.5 h-3.5" /> {investigation.summary?.securityRating || 'High'} Security
          </span>
          <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {investigation.summary?.totalYearsActive ? `${investigation.summary.totalYearsActive} yrs of archives` : 'Analyzed'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* IPs */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-blue-400" />
              <span>RESOLVED IPS</span>
            </div>
            <span className="text-blue-400 font-bold">{investigation.ipAddresses.length}</span>
          </div>
          {investigation.ipAddresses.length > 0 ? (
            <div className="space-y-1 font-mono text-xs max-h-24 overflow-y-auto pr-1">
              {investigation.ipAddresses.map((ip, idx) => (
                <div
                  key={idx}
                  onClick={() => copyToClipboard(ip)}
                  className="text-slate-200 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-amber-500/50 transition-all cursor-pointer text-[11px]"
                >
                  <span className="text-blue-300 font-semibold truncate">{ip}</span>
                  {copiedIp === ip ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono italic">No IP records</p>
          )}
        </div>

        {/* Subdomains */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>SUBDOMAINS</span>
            </div>
            <span className="text-emerald-400 font-bold">{investigation.subdomains?.length || 0}</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {investigation.subdomains?.length || 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">discovered</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate">
            {investigation.subdomains?.slice(0, 2).map(s => s.subdomain).join(', ') || 'Root zone only'}
          </p>
        </div>

        {/* DNS Summary */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-amber-400" />
              <span>DNS RECORDS</span>
            </div>
            <span className="text-amber-400 font-bold">{investigation.dnsRecords.length}</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{investigation.dnsRecords.length}</span>
            <span className="text-xs text-slate-400 font-mono">zone entries</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {Array.from(new Set(investigation.dnsRecords.map(r => r.type))).slice(0, 4).map((type, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded font-mono font-semibold">
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Tech Stack Summary */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>ACTIVE TECH</span>
            </div>
            <span className="text-purple-400 font-bold">{investigation.technologies.length}</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{investigation.technologies.length}</span>
            <span className="text-xs text-slate-400 font-mono">signatures</span>
          </div>
          <p className="text-[11px] text-purple-300 font-mono truncate">
            {investigation.technologies.slice(0, 2).map(t => t.name).join(', ') || 'Analyzed'}
          </p>
        </div>
      </div>
    </div>
  );
};


