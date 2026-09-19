'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart2,
  PieChart as PieIcon,
  Code2,
  FolderGit2,
  Download,
  TrendingUp,
  Cpu,
  FileCode,
  Check,
  RefreshCw,
  Layers,
  FileText,
} from 'lucide-react';
import { D3Treemap } from './D3Treemap';
import { CodebaseAnalyticsData } from '@/types/api';
import { getDefaultCodebaseAnalytics } from '@/lib/osint/codebaseData';
import { exportElementAsPng, exportElementAsSvg } from '@/lib/osint/chartExport';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<CodebaseAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Animated counter for total LOC
  const [locCounter, setLocCounter] = useState<number>(0);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          return;
        }
      }
      // Fallback to client calculation if API unavailable
      setData(getDefaultCodebaseAnalytics());
    } catch {
      setData(getDefaultCodebaseAnalytics());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Animate LOC count up on load
  useEffect(() => {
    if (!data?.summary.totalLoc) return;
    const target = data.summary.totalLoc;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setLocCounter(target);
        clearInterval(timer);
      } else {
        setLocCounter(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data?.summary.totalLoc]);

  // Radial / Runtime execution breakdown data
  const runtimePieData = useMemo(
    () => [
      { name: 'TS / TSX (TypeScript)', value: 26.7, color: '#3178c6', type: 'Executable Code' },
      { name: 'JS / JSX (JavaScript)', value: 11.8, color: '#facc15', type: 'Executable Code' },
      { name: 'Python (Scripts)', value: 0.4, color: '#10b981', type: 'Executable Code' },
      {
        name: 'Markdown & Docs',
        value: 40.8,
        color: '#0891b2',
        type: 'Documentation (Non-executable)',
      },
      {
        name: 'Config & Markup (JSON/HTML/CSS)',
        value: 20.3,
        color: '#94a3b8',
        type: 'Infrastructure/Declarative',
      },
    ],
    []
  );

  const handleExport = async (elementId: string, format: 'png' | 'svg', title: string) => {
    setActiveExportId(elementId);
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    if (format === 'png') {
      await exportElementAsPng(elementId, filename);
    } else {
      exportElementAsSvg(elementId, filename);
    }
    setCopiedNotification(`Exported ${title} as ${format.toUpperCase()}`);
    setTimeout(() => {
      setActiveExportId(null);
      setCopiedNotification(null);
    }, 2000);
  };

  if (loading || !data) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-950/70 rounded-xl border border-slate-800" />
          ))}
        </div>
        <div className="h-80 bg-slate-950/70 rounded-xl border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification for Exports */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Top Banner & KPI Stat Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-400" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Portfolio Telemetry
              </span>
              <span className="text-xs text-slate-500 font-mono">
                (Dynamic Codebase Intelligence)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono flex items-center gap-3">
              <BarChart2 className="w-7 h-7 text-cyan-400" />
              Codebase Analytics Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer shadow-sm"
              title="Rescan project repositories"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rescan Files</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Lines of Code */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <div className="flex items-center space-x-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>TOTAL LOC</span>
              </div>
              <span className="text-cyan-400 text-[10px] font-bold uppercase">5 Projects</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                {locCounter.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono">lines</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              Calculated across all tracked workspace repos
            </p>
          </div>

          {/* Executable Code Ratio */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>EXECUTABLE RATIO</span>
              </div>
              <span className="text-emerald-400 font-bold">
                {data.runtimeBreakdown.executablePercent}%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-100 font-mono">
                {data.runtimeBreakdown.executablePercent}%
              </span>
              <span className="text-xs text-slate-400 font-mono">of total code</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${data.runtimeBreakdown.executablePercent}%` }}
              />
            </div>
          </div>

          {/* Documentation Ratio */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>DOCUMENTATION</span>
              </div>
              <span className="text-amber-400 font-bold">
                {data.runtimeBreakdown.documentationPercent}%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-100 font-mono">
                {data.runtimeBreakdown.documentationPercent}%
              </span>
              <span className="text-xs text-slate-400 font-mono">markdown / specs</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${data.runtimeBreakdown.documentationPercent}%` }}
              />
            </div>
          </div>

          {/* Configuration & Infrastructure */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>CONFIG & DATA</span>
              </div>
              <span className="text-purple-400 font-bold">
                {data.runtimeBreakdown.configPercent}%
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-100 font-mono">
                {data.runtimeBreakdown.configPercent}%
              </span>
              <span className="text-xs text-slate-400 font-mono">JSON / YAML / HTML</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-400 h-full rounded-full"
                style={{ width: `${data.runtimeBreakdown.configPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Language Breakdown Doughnut Chart + Project LOC Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Language / Extension Doughnut */}
        <div
          id="chart-language-breakdown"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-mono font-bold text-sm md:text-base text-slate-100 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                Language & Extension Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Percentage volume of entire codebase by language extension
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  handleExport('chart-language-breakdown', 'png', 'Language Breakdown')
                }
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Export as PNG"
              >
                <Download className="w-3 h-3 text-cyan-400" /> PNG
              </button>
              <button
                onClick={() =>
                  handleExport('chart-language-breakdown', 'svg', 'Language Breakdown')
                }
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Export as SVG"
              >
                SVG
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.languages}
                  dataKey="percentage"
                  nameKey="language"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {data.languages.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#090d16"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as (typeof data.languages)[0];
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl font-mono text-xs text-slate-200">
                          <div
                            className="font-bold flex items-center gap-2"
                            style={{ color: item.color }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: item.color }}
                            />
                            {item.language}
                          </div>
                          <div className="text-slate-300 mt-1">
                            Share: <span className="font-bold text-white">{item.percentage}%</span>
                          </div>
                          <div className="text-slate-400">
                            Lines:{' '}
                            <span className="font-bold text-slate-200">
                              {item.lines.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[10px] mt-0.5">
                            {item.isExecutable ? 'Executable Code' : 'Non-executable / Declarative'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Project LOC Bar Chart */}
        <div
          id="chart-project-loc"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-mono font-bold text-sm md:text-base text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Lines of Code per Project
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Comparative magnitude across workspace portfolio
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport('chart-project-loc', 'png', 'Project LOC')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Export as PNG"
              >
                <Download className="w-3 h-3 text-blue-400" /> PNG
              </button>
              <button
                onClick={() => handleExport('chart-project-loc', 'svg', 'Project LOC')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Export as SVG"
              >
                SVG
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projects} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as (typeof data.projects)[0];
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs text-slate-200 space-y-1">
                          <div className="font-bold text-amber-400">{item.displayName}</div>
                          <div className="text-slate-300">
                            LOC:{' '}
                            <span className="font-bold text-white">
                              {item.loc.toLocaleString()} ({item.locDisplay})
                            </span>
                          </div>
                          <div className="text-slate-400">
                            Files: <span className="text-slate-200">{item.files} source files</span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic max-w-xs">
                            {item.description}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="loc" radius={[6, 6, 0, 0]}>
                  {data.projects.map((entry, index) => (
                    <Cell key={`proj-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: D3.js Hierarchical Treemap Visualization */}
      <div
        id="chart-d3-treemap"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-mono font-bold text-sm md:text-base text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              D3.js Nested Codebase Treemap
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Proportional area layout representing file system volume and nested directory
              hierarchy
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('chart-d3-treemap', 'png', 'D3 Treemap')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Export as PNG"
            >
              <Download className="w-3 h-3 text-amber-400" /> PNG
            </button>
            <button
              onClick={() => handleExport('chart-d3-treemap', 'svg', 'D3 Treemap')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Export as SVG"
            >
              SVG
            </button>
          </div>
        </div>

        <D3Treemap data={data.treemapData} height={380} />
      </div>

      {/* Row 3: Radial Runtime Execution Breakdown + Git Commit Growth Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Runtime Execution Breakdown Pie */}
        <div
          id="chart-runtime-breakdown"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-mono font-bold text-sm md:text-base text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Language Runtime & Execution Mix
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Executable runtime proportion: TS/TSX (26.7%), JS/JSX (11.8%), Python (0.4%),
                Markdown (40.8%)
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport('chart-runtime-breakdown', 'png', 'Runtime Mix')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3 text-emerald-400" /> PNG
              </button>
              <button
                onClick={() => handleExport('chart-runtime-breakdown', 'svg', 'Runtime Mix')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                SVG
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={runtimePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${(name || '').split(' ')[0]} (${((percent || 0) * 100).toFixed(1)}%)`
                  }
                  labelLine={false}
                >
                  {runtimePieData.map((entry, index) => (
                    <Cell
                      key={`runtime-cell-${index}`}
                      fill={entry.color}
                      stroke="#090d16"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as (typeof runtimePieData)[0];
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl font-mono text-xs text-slate-200">
                          <div className="font-bold" style={{ color: item.color }}>
                            {item.name}
                          </div>
                          <div className="text-slate-300 mt-1">
                            Proportion: <span className="font-bold text-white">{item.value}%</span>
                          </div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{item.type}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Git History LOC Added per Commit */}
        <div
          id="chart-git-loc-growth"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-mono font-bold text-sm md:text-base text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                LOC Growth per Git Commit
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Temporal velocity and net lines added chronologically
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport('chart-git-loc-growth', 'png', 'Git Commit Velocity')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3 text-emerald-400" /> PNG
              </button>
              <button
                onClick={() => handleExport('chart-git-loc-growth', 'svg', 'Git Commit Velocity')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                SVG
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.gitHistory}
                margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="hash"
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
                      const item = payload[0].payload as (typeof data.gitHistory)[0];
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs text-slate-200 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-amber-400">{item.hash}</span>
                            <span className="text-slate-500 text-[10px]">{item.date}</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{item.message}</p>
                          <div className="text-emerald-400 font-bold pt-1">
                            +{item.insertions} lines / -{item.deletions} lines (Net: +
                            {item.netAdded})
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            Cumulative Repository LOC: {item.cumulativeLoc.toLocaleString()}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netAdded"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff' }}
                  name="Net LOC Added"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLoc"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Cumulative LOC"
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val) => <span className="text-slate-300">{val}</span>}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Stacked Area Chart Showing Language Mix Changes Over Time */}
      <div
        id="chart-language-mix-timeline"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-mono font-bold text-sm md:text-base text-slate-100 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-purple-400" />
              Language Mix Evolution Over Time (Stacked Area)
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Temporal transition of technology share across release milestones
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                handleExport('chart-language-mix-timeline', 'png', 'Language Mix Timeline')
              }
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-purple-400" /> PNG
            </button>
            <button
              onClick={() =>
                handleExport('chart-language-mix-timeline', 'svg', 'Language Mix Timeline')
              }
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              SVG
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.languageMixTimeline}
              margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="milestone"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl font-mono text-xs text-slate-200 space-y-1">
                        <div className="font-bold text-amber-400">{label}</div>
                        {payload.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between gap-4 text-[11px]"
                            style={{ color: entry.color }}
                          >
                            <span>{entry.name}:</span>
                            <span className="font-bold">{entry.value}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="markdown"
                stackId="1"
                stroke="#0891b2"
                fill="#0891b2"
                fillOpacity={0.6}
                name="Markdown"
              />
              <Area
                type="monotone"
                dataKey="tsx"
                stackId="1"
                stroke="#3178c6"
                fill="#3178c6"
                fillOpacity={0.6}
                name="TSX"
              />
              <Area
                type="monotone"
                dataKey="json"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
                name="JSON"
              />
              <Area
                type="monotone"
                dataKey="js"
                stackId="1"
                stroke="#facc15"
                fill="#facc15"
                fillOpacity={0.6}
                name="JS"
              />
              <Area
                type="monotone"
                dataKey="html"
                stackId="1"
                stroke="#ea580c"
                fill="#ea580c"
                fillOpacity={0.6}
                name="HTML"
              />
              <Area
                type="monotone"
                dataKey="ts"
                stackId="1"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.6}
                name="TS"
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
                formatter={(v) => <span className="text-slate-300">{v}</span>}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
