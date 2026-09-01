'use client';

import React from 'react';
import { DnsDriftEvent, DnsRecord } from '@/types/osint';
import { 
  Network, 
  ShieldCheck, 
  Server, 
  Mail, 
  ArrowRight, 
  Search, 
  Copy, 
  Check, 
  Globe
} from 'lucide-react';

interface Props {
  dnsDrifts?: DnsDriftEvent[];
  dnsRecords: DnsRecord[];
  domain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const DnsDriftTracker: React.FC<Props> = ({ dnsDrifts = [], dnsRecords, domain, onTraceEvidence }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const categories = ['all', 'Nameserver Shift', 'Mail Routing Shift', 'Security Policy Adoption', 'IP Pool Migration'];

  const filteredDrifts = dnsDrifts.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.recordType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.newValue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Nameserver Shift':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'Mail Routing Shift':
        return <Mail className="w-4 h-4 text-amber-400" />;
      case 'Security Policy Adoption':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'IP Pool Migration':
        return <Server className="w-4 h-4 text-purple-400" />;
      default:
        return <Network className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold bg-cyan-500/15 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-500/30 flex items-center gap-1.5">
                <Network className="w-3 h-3 text-cyan-400" />
                DNS Zone Drift & Routing Shifts
              </span>
              <span className="text-xs text-slate-400 font-mono">Infrastructure Tracking</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight pt-1">
              Historical DNS Infrastructure & Mail Shifts for <span className="text-cyan-300">{domain}</span>
            </h2>
          </div>

          <span className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono text-slate-300 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <strong className="text-slate-100">{dnsDrifts.length}</strong> Shift Events Recorded
          </span>
        </div>

        {/* Quick Infrastructure Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Authoritative NS Nodes</span>
            <span className="text-base font-extrabold text-blue-300 block">
              {dnsRecords.filter(r => r.type === 'NS').length} Active Nameservers
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {dnsRecords.find(r => r.type === 'NS')?.value || 'Standard DNS'}
            </span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Mail Exchangers (MX)</span>
            <span className="text-base font-extrabold text-amber-300 block">
              {dnsRecords.filter(r => r.type === 'MX').length} Gateway Hosts
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {dnsRecords.find(r => r.type === 'MX')?.value || 'No MX configured'}
            </span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Security TXT Directives</span>
            <span className="text-base font-extrabold text-emerald-300 block">
              {dnsRecords.filter(r => r.type === 'TXT').length} Policies Active
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {dnsRecords.some(r => r.type === 'TXT' && r.value.includes('spf1')) ? 'SPF Enforced ✓' : 'Standard TXT'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Drift Feed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search DNS drift events, records, values..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                  filterCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                {cat === 'all' ? 'All Shifts' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Drift Events List */}
        <div className="space-y-4">
          {filteredDrifts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              No DNS drift events matched your criteria.
            </div>
          ) : (
            filteredDrifts.map((event, idx) => (
              <div
                key={`${event.id}-${idx}`}
                className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 space-y-3.5 transition-all shadow-md group"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      {getCategoryIcon(event.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs rounded">
                          {event.recordType} Record
                        </span>
                        <span className="text-sm font-bold text-slate-100 font-mono">
                          {event.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {event.timestamp.split('T')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold border ${getSeverityBadge(event.severity)}`}>
                      {event.severity} Impact
                    </span>
                    {onTraceEvidence && (
                      <button
                        onClick={() => onTraceEvidence(event.evidenceId || event.recordType)}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Trace</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {event.description}
                </p>

                {/* Target Value Box */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Observed Configuration Value:</span>
                    <span className="text-cyan-300 font-semibold truncate block">{event.newValue}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`drift-${idx}`, event.newValue)}
                    className="p-1.5 text-slate-500 hover:text-cyan-300 cursor-pointer shrink-0"
                    title="Copy configuration value"
                  >
                    {copiedId === `drift-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
