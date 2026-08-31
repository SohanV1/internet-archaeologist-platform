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
  Check
} from 'lucide-react';

interface Props {
  certificates?: CertificateRecord[];
  domain: string;
}

export const CertificateHistory: React.FC<Props> = ({ certificates = [], domain }) => {
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredCerts = certificates.filter(cert => {
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const matchesSearch = 
      cert.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.serialNumber && cert.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cert.sans.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
            Cryptographic trust provenance, Certificate Authority issuance history, and SAN registry logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          {(['all', 'active', 'expired'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
                filterStatus === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates List */}
      {filteredCerts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
          No certificates found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCerts.map((cert, idx) => (
            <div
              key={`${cert.id}-${idx}`}
              className="bg-slate-950/85 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 space-y-4 transition-all shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <Key className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm font-mono flex items-center gap-2">
                      <span>{cert.commonName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Issuer: <strong className="text-slate-300">{cert.issuer}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold uppercase flex items-center gap-1 border ${
                    cert.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {cert.status === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    {cert.status}
                  </span>
                </div>
              </div>

              {/* Validity Dates & Serial */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Valid From (Not Before)</span>
                  <span className="text-slate-200">{cert.notBefore}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Valid Until (Not After)</span>
                  <span className="text-slate-200">{cert.notAfter}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Serial Number</span>
                    <span className="text-cyan-300 text-[11px] truncate block">{cert.serialNumber || 'N/A'}</span>
                  </div>
                  {cert.serialNumber && (
                    <button
                      onClick={() => handleCopy(`sn-${idx}`, cert.serialNumber || '')}
                      className="text-slate-500 hover:text-cyan-300 p-1 cursor-pointer"
                      title="Copy serial number"
                    >
                      {copiedId === `sn-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Alternative Names (SANs) */}
              {cert.sans && cert.sans.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold block">
                    Subject Alternative Names (SANs):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.sans.map((san, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono rounded-md"
                      >
                        {san}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};