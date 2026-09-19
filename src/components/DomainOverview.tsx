'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Investigation } from '@/types/osint';
import {
  Globe,
  Server,
  Database,
  ShieldCheck,
  Copy,
  Check,
  Network,
  Calendar,
  Sparkles,
  Activity,
  Code2,
  Cpu,
  FileText,
  FileCode,
  Download,
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
import { exportElementAsPng, exportElementAsSvg } from '@/lib/osint/chartExport';

interface Props {
  investigation: Investigation;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
  onNavigateToAnalytics?: () => void;
}

const EXTENSION_BAR_DATA = [
  { ext: '.md', count: 485, fill: '#0891b2' },
  { ext: '.tsx', count: 242, fill: '#3178c6' },
  { ext: '.json', count: 184, fill: '#f59e0b' },
  { ext: '.ts', count: 116, fill: '#2563eb' },
  { ext: '.js', count: 88, fill: '#facc15' },
  { ext: '.html', count: 46, fill: '#ea580c' },
  { ext: '.css', count: 28, fill: '#ec4899' },
  { ext: '.py', count: 8, fill: '#10b981' },
];

const LANGUAGE_PROGRESS = [
  { name: 'Markdown (Docs)', percent: 40.8, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  { name: 'TSX (React Views)', percent: 21.7, color: 'bg-blue-500', textColor: 'text-blue-400' },
  {
    name: 'JSON (Schemas/Data)',
    percent: 14.6,
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
  },
  {
    name: 'JavaScript (Scripts)',
    percent: 11.8,
    color: 'bg-yellow-400',
    textColor: 'text-yellow-300',
  },
  { name: 'HTML (Templates)', percent: 7.1, color: 'bg-orange-500', textColor: 'text-orange-400' },
  {
    name: 'TypeScript (Core lib)',
    percent: 5.0,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-400',
  },
  { name: 'CSS / Styling', percent: 1.8, color: 'bg-pink-500', textColor: 'text-pink-400' },
  {
    name: 'Python (Tooling)',
    percent: 0.4,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
  },
];

export const DomainOverviewComponent: React.FC<Props> = ({
  investigation,
  onTraceEvidence,
  onNavigateToAnalytics,
}) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [locCount, setLocCount] = useState<number>(0);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Animated counter for total LOC (381,400)
  useEffect(() => {
    const targetLoc = 381400;
    const duration = 1000;
    const steps = 25;
    const increment = targetLoc / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= targetLoc) {
        setLocCount(targetLoc);
        clearInterval(interval);
      } else {
        setLocCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  }, []);

  const handleExportChart = async (elementId: string, format: 'png' | 'svg', name: string) => {
    if (format === 'png') {
      await exportElementAsPng(elementId, name);
    } else {
      exportElementAsSvg(elementId, name);
    }
    setExportNotice(`Exported ${name}`);
    setTimeout(() => setExportNotice(null), 2000);
  };

  const reconChartData = useMemo(
    () => [
      { dimension: 'Resolved IPs', count: investigation.ipAddresses.length, color: '#3b82f6' },
      { dimension: 'Subdomains', count: investigation.subdomains?.length || 0, color: '#10b981' },
      { dimension: 'DNS Zone', count: investigation.dnsRecords.length, color: '#06b6d4' },
      { dimension: 'Active Tech', count: investigation.technologies.length, color: '#a855f7' },
      { dimension: 'Captures', count: investigation.snapshots.length, color: '#f59e0b' },
      { dimension: 'Evidence Trail', count: investigation.evidence?.length || 0, color: '#f43f5e' },
    ],
    [
      investigation.ipAddresses.length,
      investigation.subdomains?.length,
      investigation.dnsRecords.length,
      investigation.technologies.length,
      investigation.snapshots.length,
      investigation.evidence?.length,
    ]
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
      {/* Decorative gradient glow top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-500" />

      {exportNotice && (
        <div className="absolute top-3 right-6 z-10 px-3 py-1 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 animate-fade-in">
          <Check className="w-3.5 h-3.5" /> {exportNotice}
        </div>
      )}

      {/* Target Header */}
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
            <Sparkles className="w-3.5 h-3.5" /> {investigation.summary?.securityRating || 'High'}{' '}
            Security
          </span>
          <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {investigation.summary?.totalYearsActive
              ? `${investigation.summary.totalYearsActive} yrs of archives`
              : 'Analyzed'}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
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
            <span className="text-emerald-400 font-bold">
              {investigation.subdomains?.length || 0}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {investigation.subdomains?.length || 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">discovered</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate">
            {investigation.subdomains
              ?.slice(0, 2)
              .map((s) => s.subdomain)
              .join(', ') || 'Root zone only'}
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
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {investigation.dnsRecords.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">zone entries</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {Array.from(new Set(investigation.dnsRecords.map((r) => r.type)))
              .slice(0, 4)
              .map((type, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded font-mono font-semibold"
                >
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
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {investigation.technologies.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">signatures</span>
          </div>
          <p className="text-[11px] text-purple-300 font-mono truncate">
            {investigation.technologies
              .slice(0, 2)
              .map((t) => t.name)
              .join(', ') || 'Analyzed'}
          </p>
        </div>
      </div>

      {/* Reconnaissance Surface & Asset Inventory Bar Chart */}
      <div
        id="overview-recon-chart"
        className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 md:p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Reconnaissance Surface & Asset Inventory
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportChart('overview-recon-chart', 'png', 'recon-inventory')}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono rounded border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" /> PNG
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Relative discovery volume across target dimensions
            </span>
          </div>
        </div>

        <div className="h-36 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reconChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="dimension"
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
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl font-mono text-xs text-slate-200">
                        <div className="font-bold" style={{ color: data.color }}>
                          {data.dimension}
                        </div>
                        <div className="text-slate-300">
                          Total Discovered:{' '}
                          <span className="font-bold text-white">{data.count}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {reconChartData.map((entry, index) => (
                  <Cell key={`recon-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CODEBASE INTELLIGENCE SECTION (Part 2 Requirement 2) */}
      <div
        id="codebase-intelligence-section"
        className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold rounded">
                TELEMETRY
              </span>
              <span className="text-xs text-slate-400 font-mono">Portfolio Code Analysis</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-100 flex items-center gap-2.5">
              <Code2 className="w-5 h-5 text-cyan-400" />
              Codebase Intelligence & Static Structure
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToAnalytics && (
              <button
                onClick={onNavigateToAnalytics}
                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Full Analytics Tab →</span>
              </button>
            )}
            <button
              onClick={() =>
                handleExportChart('codebase-intelligence-section', 'png', 'codebase-intel')
              }
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono flex items-center gap-1 border border-slate-800 transition-colors cursor-pointer"
              title="Export PNG"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> PNG
            </button>
          </div>
        </div>

        {/* Runtime Breakdown Badge / Header Banner */}
        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">
                LANGUAGE RUNTIME CLASSIFICATION
              </span>
              <span className="font-bold text-slate-100 text-sm">
                Executable: <span className="text-emerald-400">46%</span> | Documentation:{' '}
                <span className="text-amber-400">41%</span> | Config:{' '}
                <span className="text-purple-400">14%</span>
              </span>
            </div>
          </div>

          {/* Animated Total LOC Counter */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-slate-400 block text-[11px]">TOTAL CODEBASE VOLUME</span>
              <span className="text-base font-extrabold text-cyan-300 font-mono tracking-tight">
                {locCount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">LOC</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column: Animated Language Progress Bars + File Count Horizontal Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
          {/* Column A: Language Percentage with Animated Progress Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              Language Share (Animated Progress Bars)
            </h4>

            <div className="space-y-2.5">
              {LANGUAGE_PROGRESS.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className={`font-semibold ${item.textColor}`}>{item.name}</span>
                    <span className="font-bold text-slate-200">{item.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column B: File Count by Extension Horizontal Bar Chart */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              File Count by Extension (Horizontal Distribution)
            </h4>

            <div className="h-64 w-full bg-slate-900/60 rounded-xl border border-slate-800/80 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={EXTENSION_BAR_DATA}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="ext"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl font-mono text-xs text-slate-200">
                            <span className="font-bold" style={{ color: d.fill }}>
                              {d.ext} Extension
                            </span>
                            <div className="text-slate-300 mt-1">
                              Total Files: <span className="font-bold text-white">{d.count}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {EXTENSION_BAR_DATA.map((entry, index) => (
                      <Cell key={`ext-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DomainOverview = React.memo(DomainOverviewComponent);
