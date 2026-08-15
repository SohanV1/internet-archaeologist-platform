'use client';

import React from 'react';
import { Investigation } from '@/types/osint';
import { Globe, Server, Database, ShieldCheck } from 'lucide-react';

interface Props {
  investigation: Investigation;
}

export const DomainOverview: React.FC<Props> = ({ investigation }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target Domain</span>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            {investigation.domain}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Public Passive Footprint
          </span>
          <span className="text-slate-400 font-mono">
            Analyzed: {new Date(investigation.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* IPs */}
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span>RESOLVED IP ADDRESSES</span>
          </div>
          {investigation.ipAddresses.length > 0 ? (
            <div className="space-y-1 font-mono text-sm">
              {investigation.ipAddresses.map((ip, idx) => (
                <div key={idx} className="text-slate-200 bg-slate-900 px-2.5 py-1 rounded border border-slate-800/80">
                  {ip}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No IP records resolved</p>
          )}
        </div>

        {/* DNS Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>DNS RECORD COUNT</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">{investigation.dnsRecords.length}</span>
            <span className="text-xs text-slate-400">active records</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from(new Set(investigation.dnsRecords.map(r => r.type))).map((type, idx) => (
              <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded font-mono">
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Tech Stack Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <span>OBSERVED TECHNOLOGIES</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">{investigation.technologies.length}</span>
            <span className="text-xs text-slate-400">detected stack items</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 truncate">
            {investigation.technologies.map(t => t.name).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
};
