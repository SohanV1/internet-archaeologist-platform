'use client';

import React from 'react';
import { CertificateRecord } from '@/types/osint';
import {
  ShieldCheck,
  Lock,
  Calendar,
  CheckCircle2,
  XCircle,
  Key,
  ExternalLink,
  Search,
  Fingerprint,
  Filter,
  Copy,
  Check,
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
  certificates?: CertificateRecord[];
  domain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const CertificateHistory: React.FC<Props> = ({
  certificates = [],
  domain,
  onTraceEvidence,
}) => {
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredCerts = certificates.filter((cert) => {
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const matchesSearch =
      cert.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.serialNumber && cert.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cert.sans.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const issuerStats = React.useMemo(() => {
    const map = new Map<string, number>();
    certificates.forEach((c) => {
      let shortIssuer = c.issuer.split(',')[0].replace(/^CN=/i, '').trim();
      if (shortIssuer.length > 22) shortIssuer = shortIssuer.substring(0, 20) + '...';
      map.set(shortIssuer, (map.get(shortIssuer) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([issuer, count]) => ({
        issuer,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [certificates]);

  const activeCount = certificates.filter((c) => c.status === 'active').length;
  const expiredCount = certificates.filter((c) => c.status === 'expired').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-mono">
            <Lock className="w-6 h-6 text-cyan-400" />
            SSL/TLS Certificate History & Transparency Ledger
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Cryptographic trust provenance, Certificate Authority issuance history, and SAN registry
            logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTraceEvidence && (
            <button
              onClick={() => onTraceEvidence('ev-ct-certs-' + domain)}
              className="text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Trace CT Evidence</span>
            </button>
          )}

          <a
            href={`https://crt.sh/?q=%.${encodeURIComponent(domain)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Live crt.sh Index</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Visual Analytics Chart & Stat Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3 font-mono text-xs flex flex-col justify-between">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              Total Issuances Observed
            </span>
            <div className="text-2xl font-extrabold text-slate-100">
              {certificates.length} Certificates
            </div>
            <span className="text-[11px] text-cyan-400">Indexed via Public CT Logs</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              Active Cryptographic Validity
            </span>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold">{activeCount} Active</span>
              <span className="text-slate-500 font-bold">{expiredCount} Expired</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${certificates.length ? (activeCount / certificates.length) * 100 : 50}%`,
                }}
              />
              <div className="bg-slate-700 h-full flex-1" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Certificate Authority (CA) Distribution
            </span>
            <span className="text-[10px] font-mono text-slate-500">Root trust distribution</span>
          </div>

          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuerStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="issuer"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl font-mono text-xs text-slate-200 shadow-xl">
                          <div className="text-cyan-400 font-bold">{data.issuer}</div>
                          <div className="text-slate-300">
                            Total Certs: <span className="text-white font-bold">{data.count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {issuerStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#06b6d4' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search issuer CA, SAN domains, serial numbers..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Status:</span>
          {(['all', 'active', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                filterStatus === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {status === 'all' ? 'All Records' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Certificate Cards */}
      <div className="space-y-3.5">
        {filteredCerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
            No certificate transparency records matched your query.
          </div>
        ) : (
          filteredCerts.map((cert, idx) => (
            <div
              key={`${cert.id}-${idx}`}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 md:p-5 space-y-3 transition-all shadow-md group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-cyan-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-100 font-mono block">
                      {cert.commonName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Issuer: <strong className="text-slate-200">{cert.issuer}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 border ${
                      cert.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {cert.status === 'active' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="capitalize">{cert.status}</span>
                  </span>

                  {onTraceEvidence && (
                    <button
                      onClick={() => onTraceEvidence(cert.evidenceId || cert.commonName)}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Trace</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Validity Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">
                    Valid From (Not Before)
                  </span>
                  <span className="text-slate-200">{cert.notBefore.split('T')[0]}</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">
                    Valid Until (Not After)
                  </span>
                  <span className="text-slate-200">{cert.notAfter.split('T')[0]}</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">
                      Serial Number
                    </span>
                    <span className="text-slate-300 truncate block max-w-[140px]">
                      {cert.serialNumber || 'Unavailable'}
                    </span>
                  </div>
                  {cert.serialNumber && (
                    <button
                      onClick={() => handleCopy(`serial-${idx}`, cert.serialNumber!)}
                      className="p-1 text-slate-500 hover:text-cyan-400 cursor-pointer"
                      title="Copy serial number"
                    >
                      {copiedId === `serial-${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Alternative Names (SANs) */}
              {cert.sans && cert.sans.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                    Subject Alternative Names (SANs) ({cert.sans.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {cert.sans.slice(0, 10).map((san, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded"
                      >
                        {san}
                      </span>
                    ))}
                    {cert.sans.length > 10 && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 rounded text-[10px]">
                        +{cert.sans.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
