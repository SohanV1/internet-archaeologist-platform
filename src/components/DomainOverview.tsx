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
  Activity,
  Code2,
  Cpu,
  FileText,
  FileCode,
  Download,
  ChevronDown,
  Shield,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { evaluateRiskPosture } from '@/lib/osint/riskAssessment';

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
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);
  const [showRiskDetails, setShowRiskDetails] = useState<boolean>(false);

  const risk = useMemo(() => {
    if (investigation.riskAssessment) return investigation.riskAssessment;
    return evaluateRiskPosture({
      domain: investigation.domain,
      dnsRecords: investigation.dnsRecords || [],
      certificates: investigation.certificates || [],
      subdomains: investigation.subdomains || [],
      technologies: investigation.technologies || [],
    });
  }, [investigation]);

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
      { dimension: 'Active Tech', count: investigation.technologies.length, color: '#8b5cf6' },
      { dimension: 'Captures', count: investigation.snapshots.length, color: '#f59e0b' },
      { dimension: 'Evidence Trail', count: investigation.evidence?.length || 0, color: '#ef4444' },
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
    <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 md:p-6 apple-card space-y-6 backdrop-blur-xl relative transition-colors">
      {exportNotice && (
        <div className="absolute top-3 right-6 z-10 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1.5 animate-fade-in">
          <Check className="w-3.5 h-3.5" /> {exportNotice}
        </div>
      )}

      {/* Target Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Target Dossier
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
              (ID: {investigation.id.substring(0, 14)}...)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
            {investigation.domain}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onTraceEvidence && (
            <button
              onClick={() => onTraceEvidence('ev-dns-' + investigation.domain)}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-black/[0.04] dark:border-white/[0.06] rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" /> Provenance Dossier
            </button>
          )}

          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5 text-xs font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> {investigation.summary?.securityRating || 'High'}{' '}
            Security
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 px-3 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            {investigation.summary?.totalYearsActive
              ? `${investigation.summary.totalYearsActive} yrs archived`
              : 'Analyzed'}
          </span>
        </div>
      </div>

      {/* 4 Apple Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* IPs */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-4 space-y-2 hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span className="uppercase text-[11px] tracking-wider">RESOLVED IPS</span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{investigation.ipAddresses.length}</span>
          </div>
          {investigation.ipAddresses.length > 0 ? (
            <div className="space-y-1 font-mono text-xs max-h-20 overflow-y-auto pr-1">
              {investigation.ipAddresses.map((ip, idx) => (
                <div
                  key={idx}
                  onClick={() => copyToClipboard(ip)}
                  className="text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-md border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between group hover:border-neutral-400/50 transition-all cursor-pointer text-[11px]"
                >
                  <span className="truncate">{ip}</span>
                  {copiedIp === ip ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-1" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors shrink-0 ml-1" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 italic">No IP records</p>
          )}
        </div>

        {/* Subdomains */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-4 space-y-2 hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <Network className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span className="uppercase text-[11px] tracking-wider">SUBDOMAINS</span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {investigation.subdomains?.length || 0}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {investigation.subdomains?.length || 0}
            </span>
            <span className="text-xs text-neutral-500">discovered</span>
          </div>
          <p className="text-[11px] text-neutral-400 truncate">
            {investigation.subdomains
              ?.slice(0, 2)
              .map((s) => s.subdomain)
              .join(', ') || 'Root zone only'}
          </p>
        </div>

        {/* DNS Summary */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-4 space-y-2 hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span className="uppercase text-[11px] tracking-wider">DNS RECORDS</span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{investigation.dnsRecords.length}</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {investigation.dnsRecords.length}
            </span>
            <span className="text-xs text-neutral-500">entries</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {Array.from(new Set(investigation.dnsRecords.map((r) => r.type)))
              .slice(0, 4)
              .map((type, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 rounded font-mono font-medium"
                >
                  {type}
                </span>
              ))}
          </div>
        </div>

        {/* Tech Stack Summary */}
        <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-4 space-y-2 hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span className="uppercase text-[11px] tracking-wider">ACTIVE TECH</span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{investigation.technologies.length}</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {investigation.technologies.length}
            </span>
            <span className="text-xs text-neutral-500">signatures</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {investigation.technologies
              .slice(0, 2)
              .map((t) => t.name)
              .join(', ') || 'Analyzed'}
          </p>
        </div>
      </div>

      {/* Apple-Style Risk Assessment & Defensive Posture Section */}
      <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                risk.grade === 'A+' || risk.grade === 'A'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : risk.grade === 'B' || risk.grade === 'C'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Security & Passive Hygiene Posture</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    risk.grade === 'A+' || risk.grade === 'A'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : risk.grade === 'B' || risk.grade === 'C'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}
                >
                  Grade {risk.grade} ({risk.riskLevel} RISK)
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {risk.passedChecksCount} of {risk.totalChecksCount} baseline security controls verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                {risk.overallScore} / 100
              </div>
              <div className="text-[10px] text-neutral-400">Risk Score</div>
            </div>
          </div>
        </div>

        {/* Narrative Posture Summary */}
        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {risk.postureSummary}
        </p>

        {/* Findings Toggle & Expansion */}
        {risk.findings.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRiskDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {showRiskDetails ? 'Hide' : 'Review'} {risk.findings.length} Defensive Vulnerabilities & Recommendations
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  showRiskDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showRiskDetails && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] animate-fade-in">
                {risk.findings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-black/[0.04] dark:border-white/[0.06] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            f.severity === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : f.severity === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {f.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        +{f.impactScore} risk penalty
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {f.description}
                    </p>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400/90 bg-emerald-500/5 dark:bg-emerald-500/10 p-2 rounded border border-emerald-500/15 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                      <span>{f.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Telemetry Disclosure Header */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => setShowTelemetry((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-neutral-500" />
          <span>{showTelemetry ? 'Hide' : 'View'} Recon Surface & Codebase Intelligence ({locCount.toLocaleString()} LOC)</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${showTelemetry ? 'rotate-180' : ''}`} />
        </button>

        {onNavigateToAnalytics && (
          <button
            onClick={onNavigateToAnalytics}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Open Full Codebase Analytics</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Collapsible Telemetry / Analytics View */}
      {showTelemetry && (
        <div className="space-y-6 pt-2 animate-fade-in">
          {/* Reconnaissance Surface & Asset Inventory Bar Chart */}
          <div
            id="overview-recon-chart"
            className="bg-neutral-50/80 dark:bg-[#18181b]/70 border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-4 md:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2.5">
              <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-neutral-500" />
                Reconnaissance Surface & Asset Inventory
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportChart('overview-recon-chart', 'png', 'recon-inventory')}
                  className="px-2 py-0.5 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] rounded border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" /> PNG
                </button>
                <span className="text-[11px] text-neutral-400">
                  Relative discovery volume across target dimensions
                </span>
              </div>
            </div>

            <div className="h-36 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reconChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.15)" vertical={false} />
                  <XAxis
                    dataKey="dimension"
                    stroke="#86868b"
                    tick={{ fill: '#86868b', fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#86868b"
                    tick={{ fill: '#86868b', fontSize: 10 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.1] p-2.5 rounded-xl shadow-lg text-xs text-neutral-800 dark:text-neutral-200">
                            <div className="font-semibold">
                              {data.dimension}
                            </div>
                            <div className="text-neutral-500 mt-0.5">
                              Total Discovered: <span className="font-semibold text-neutral-900 dark:text-white">{data.count}</span>
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

          {/* CODEBASE INTELLIGENCE SECTION */}
          <div
            id="codebase-intelligence-section"
            className="bg-neutral-50/80 dark:bg-[#18181b]/70 border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-5 md:p-6 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded">
                    TELEMETRY
                  </span>
                  <span className="text-xs text-neutral-500">Portfolio Code Analysis</span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                  Codebase Intelligence & Static Structure
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleExportChart('codebase-intelligence-section', 'png', 'codebase-intel')
                  }
                  className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-1 border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer"
                  title="Export PNG"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" /> PNG
                </button>
              </div>
            </div>

            {/* Runtime Breakdown Badge */}
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-neutral-500 shrink-0" />
                <div>
                  <span className="text-neutral-400 block text-[11px] uppercase tracking-wider">
                    LANGUAGE RUNTIME CLASSIFICATION
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                    Executable: 46% • Documentation: 41% • Config: 14%
                  </span>
                </div>
              </div>

              {/* Total LOC Counter */}
              <div className="flex items-center gap-3 pl-4 border-l border-black/[0.06] dark:border-white/[0.06]">
                <FileCode className="w-5 h-5 text-neutral-500" />
                <div>
                  <span className="text-neutral-400 block text-[11px] uppercase tracking-wider">TOTAL CODEBASE VOLUME</span>
                  <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {locCount.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-neutral-500">LOC</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column: Language Progress Bars + File Count Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-medium flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  Language Share
                </h4>

                <div className="space-y-2.5">
                  {LANGUAGE_PROGRESS.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.name}</span>
                        <span className="font-medium text-neutral-500">{item.percent}%</span>
                      </div>
                      <div className="w-full bg-neutral-200/70 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-medium flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-neutral-400" />
                  File Count by Extension
                </h4>

                <div className="h-64 w-full bg-white dark:bg-neutral-900 rounded-xl border border-black/[0.04] dark:border-white/[0.06] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={EXTENSION_BAR_DATA}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.15)" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#86868b"
                        tick={{ fill: '#86868b', fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="ext"
                        stroke="#86868b"
                        tick={{ fill: '#86868b', fontSize: 11 }}
                        tickLine={false}
                        width={50}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.1] p-2.5 rounded-xl shadow-lg text-xs text-neutral-800 dark:text-neutral-200">
                                <span className="font-semibold">
                                  {d.ext} Extension
                                </span>
                                <div className="text-neutral-500 mt-1">
                                  Total Files: <span className="font-semibold text-neutral-900 dark:text-white">{d.count}</span>
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
      )}
    </div>
  );
};

export const DomainOverview = React.memo(DomainOverviewComponent);
