'use client';

import React from 'react';
import { SubdomainRecord } from '@/types/osint';
import { Network, Search, Copy, Check, ExternalLink, ShieldCheck, Globe, Shield, ArrowRight } from 'lucide-react';

interface Props {
  subdomains: SubdomainRecord[];
  rootDomain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const SubdomainsView: React.FC<Props> = ({ subdomains, rootDomain, onTraceEvidence }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [copiedDomain, setCopiedDomain] = React.useState<string | null>(null);

  const filtered = subdomains.filter(s => 
    s.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.fullDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Network className="w-6 h-6 text-emerald-400" />
            Passive Subdomain & Hostname Reconnaissance
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Ecosystem hostnames identified via Certificate Transparency (crt.sh) and public web crawls with linked provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            {subdomains.length} Discovered Hosts
          </span>
        </div>
      </div>

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
          Showing <span className="text-slate-200 font-bold">{filtered.length}</span> of {subdomains.length} subdomains
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
                  <span className="text-sm font-mono font-bold text-slate-200 group-hover:text-emerald-300 transition-colors block truncate">
                    {item.fullDomain}
                  </span>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span>Source: {item.source}</span>
                    {item.firstSeen && (
                      <span className="text-slate-400">Seen {item.firstSeen}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {item.status}
                  </span>
                  <a
                    href={`https://${item.fullDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <span>Visit Host</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {onTraceEvidence && (
                  <button
                    onClick={() => onTraceEvidence(item.evidenceId || item.fullDomain)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 py-1 rounded-lg border border-emerald-500/20"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Trace Subdomain Evidence</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

