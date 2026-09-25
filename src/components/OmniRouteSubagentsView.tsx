'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bot,
  Zap,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { OmniRouteSubagentTask } from '@/types/agent';
import { Investigation } from '@/types/osint';

interface Props {
  currentInvestigation: Investigation | null;
  onTraceEvidence?: (evidenceId: string) => void;
}

const PRESET_TASKS = [
  {
    id: 'deep-recon',
    title: 'Deep Recon Synthesis',
    role: 'research' as const,
    icon: Zap,
    description: 'Correlate DNS zones, SSL certificates, and ASN routing into an executive risk synthesis.',
    promptTemplate: (domain: string, summary: string) =>
      `Perform a comprehensive forensic intelligence synthesis for target domain: ${domain}.\nAnalyze the passive reconnaissance data:\n${summary}\nProvide:\n1. Infrastructure Attack Surface Summary\n2. Key Operational Risks\n3. Strategic Defensive Recommendations.`,
  },
  {
    id: 'defensive-audit',
    title: 'Defensive Security & Mail Hygiene',
    role: 'code' as const,
    icon: Shield,
    description: 'Audit email hygiene (SPF, DMARC, MX), security.txt disclosures, and TLS posture.',
    promptTemplate: (domain: string, summary: string) =>
      `Audit the defensive hygiene and compliance for domain: ${domain}.\nContext summary:\n${summary}\nIdentify:\n1. Mail Authentication (SPF/DMARC/DKIM/MX) gaps\n2. Security Disclosure posture (security.txt, contact discovery)\n3. Immediate hardening actions in priority order.`,
  },
  {
    id: 'temporal-forensics',
    title: 'Temporal Drift & Tech Evolution',
    role: 'research' as const,
    icon: Clock,
    description: 'Analyze historical snapshot changes, DNS record migrations, and tech stack drift.',
    promptTemplate: (domain: string, summary: string) =>
      `Investigate the historical evolution and drift patterns for domain: ${domain}.\nContext summary:\n${summary}\nEvaluate:\n1. Major architectural shifts over time\n2. Legacy or deprecated technologies detected\n3. DNS infrastructure migrations and potential takeover vectors.`,
  },
];

const LOCAL_STORAGE_KEY = 'osint_omniroute_tasks_v2';

export function OmniRouteSubagentsView({ currentInvestigation }: Props) {
  const [tasks, setTasks] = useState<OmniRouteSubagentTask[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedRole, setSelectedRole] = useState<'research' | 'code' | 'general'>('research');
  const [selectedModel, setSelectedModel] = useState<string>('auto/best-fast');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const domain = currentInvestigation?.domain || 'target domain';

  // Load saved tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save tasks to localStorage
  const saveTasks = useCallback((newTasks: OmniRouteSubagentTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTasks.slice(0, 30)));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Check OmniRoute Server Status & Load Models
  const checkOmniRouteStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/subagents');
      if (res.ok) {
        const data = await res.json();
        setIsServerOnline(Boolean(data.online));
        if (Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
          if (!data.models.includes(selectedModel)) {
            setSelectedModel(data.models[0]);
          }
        }
      } else {
        setIsServerOnline(false);
      }
    } catch {
      setIsServerOnline(false);
    } finally {
      setCheckingStatus(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    checkOmniRouteStatus();
    const interval = setInterval(checkOmniRouteStatus, 30000);
    return () => clearInterval(interval);
  }, [checkOmniRouteStatus]);

  // Build condensed context from current investigation
  const contextSummary = useMemo(() => {
    if (!currentInvestigation) return 'No active investigation context available.';
    const parts = [
      `Target Domain: ${currentInvestigation.domain}`,
      `Overview Summary: ${currentInvestigation.summary || 'N/A'}`,
      `DNS Records: ${currentInvestigation.dnsRecords?.length || 0} discovered`,
      `Subdomains: ${currentInvestigation.subdomains?.map((s) => s.subdomain).slice(0, 10).join(', ') || 'None'}`,
      `Technologies: ${currentInvestigation.technologies?.map((t) => t.name).slice(0, 10).join(', ') || 'None'}`,
      `Certificates: ${currentInvestigation.certificates?.length || 0} logged`,
      `Vulnerabilities: ${currentInvestigation.vulnerabilities?.length || 0} findings`,
    ];
    return parts.join('\n');
  }, [currentInvestigation]);

  // Dispatch a task to OmniRoute
  const handleDispatchTask = useCallback(
    async (taskParams: {
      title: string;
      prompt: string;
      role: 'research' | 'code' | 'general';
      model?: string;
    }) => {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTask: OmniRouteSubagentTask = {
        id: taskId,
        title: taskParams.title,
        prompt: taskParams.prompt,
        role: taskParams.role,
        model: taskParams.model || selectedModel,
        status: 'running',
        createdAt: new Date().toISOString(),
        targetDomain: currentInvestigation?.domain,
      };

      const updatedTasks = [newTask, ...tasks];
      saveTasks(updatedTasks);
      setExpandedTaskId(taskId);
      setDispatching(true);

      try {
        const response = await fetch('/api/subagents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: taskParams.prompt,
            role: taskParams.role,
            model: taskParams.model || selectedModel,
            targetDomain: currentInvestigation?.domain,
            contextData: contextSummary,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          saveTasks(
            updatedTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: 'completed',
                    result: data.result,
                    model: data.model || t.model,
                    auditFindings: data.auditFindings,
                    executionTimeMs: data.executionTimeMs,
                    tokensUsed: data.usage?.total_tokens,
                  }
                : t
            )
          );
        } else {
          saveTasks(
            updatedTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: 'failed',
                    error: data.error || 'Execution failed on OmniRoute subagent runner',
                  }
                : t
            )
          );
        }
      } catch (err: unknown) {
        saveTasks(
          updatedTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'failed',
                  error: (err as Error).message || 'Network request failed',
                }
              : t
          )
        );
      } finally {
        setDispatching(false);
      }
    },
    [tasks, selectedModel, currentInvestigation, contextSummary, saveTasks]
  );

  const handleRunPreset = (preset: (typeof PRESET_TASKS)[0]) => {
    const prompt = preset.promptTemplate(domain, contextSummary);
    handleDispatchTask({
      title: `${preset.title} · ${domain}`,
      prompt,
      role: preset.role,
      model: selectedModel,
    });
  };

  const handleRunCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleDispatchTask({
      title: customPrompt.slice(0, 50) + (customPrompt.length > 50 ? '...' : ''),
      prompt: customPrompt,
      role: selectedRole,
      model: selectedModel,
    });
    setCustomPrompt('');
  };

  const copyResult = (taskId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const clearAllTasks = () => {
    saveTasks([]);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const runningCount = tasks.filter((t) => t.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* OmniRoute Swarm Status Banner */}
      <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 apple-card backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.06] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  OmniRoute Autonomous Subagent Swarm
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  v3.8 Local
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Local model orchestration via OmniRoute router. Zero Antigravity cloud credits consumed.
              </p>
            </div>
          </div>

          {/* Live Status Indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isServerOnline === true
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : isServerOnline === false
                    ? 'bg-red-500'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                {isServerOnline === true
                  ? 'OmniRoute Online (Port 20128)'
                  : isServerOnline === false
                  ? 'OmniRoute Offline'
                  : 'Checking port 20128...'}
              </span>
            </div>

            <button
              onClick={checkOmniRouteStatus}
              disabled={checkingStatus}
              className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh OmniRoute Status"
            >
              <RotateCcw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats & Ponytail Ladder Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] text-neutral-500 uppercase font-semibold tracking-wider block">
              Active Workers
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {runningCount}
              </span>
              <span className="text-xs text-neutral-400">running</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] text-neutral-500 uppercase font-semibold tracking-wider block">
              Settled Tasks
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
              <span className="text-xs text-neutral-400">completed</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] text-neutral-500 uppercase font-semibold tracking-wider block">
              Ponytail Level
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Full</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                Zero Bloat
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] text-neutral-500 uppercase font-semibold tracking-wider block">
              Target Scope
            </span>
            <span className="text-sm font-mono font-medium text-amber-600 dark:text-amber-400 truncate block mt-1">
              {domain}
            </span>
          </div>
        </div>
      </div>

      {/* 1-Click Subagent Intelligence Presets */}
      <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 apple-card backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              1-Click OSINT Intelligence Subagents
            </h3>
          </div>
          <span className="text-xs text-neutral-500">Autonomous context analysis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_TASKS.map((preset) => {
            const Icon = preset.icon;
            return (
              <div
                key={preset.id}
                className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] hover:border-amber-500/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 group-hover:text-amber-500 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase">
                      {preset.role}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleRunPreset(preset)}
                    disabled={dispatching || isServerOnline === false}
                    className="w-full py-1.5 px-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Subagent</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Task Dispatcher */}
      <div className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-6 apple-card backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Dispatch Custom OmniRoute Subagent Task
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">⌘ + Enter to execute</span>
        </div>

        <form onSubmit={handleRunCustom} className="space-y-3">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleRunCustom(e);
              }
            }}
            placeholder={`Enter subagent prompt (e.g. "Examine DNS mail exchange records for SPF vulnerabilities and generate a defensive RFC-compliant policy for ${domain}")`}
            rows={3}
            className="w-full p-3.5 bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-400/30 transition-all resize-y font-sans"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              {/* Role Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-500 font-medium">Role:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'research' | 'code' | 'general')}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="research">Research</option>
                  <option value="code">Code / Audit</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Model Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-500 font-medium">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-neutral-800 dark:text-neutral-200 font-mono cursor-pointer max-w-[180px] truncate"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {!availableModels.includes(selectedModel) && (
                    <option value={selectedModel}>{selectedModel}</option>
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={dispatching || !customPrompt.trim() || isServerOnline === false}
              className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{dispatching ? 'Dispatching...' : 'Dispatch Task'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Subagent Task Execution Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              OmniRoute Execution Ledger ({tasks.length})
            </h3>
          </div>

          {tasks.length > 0 && (
            <button
              onClick={clearAllTasks}
              className="text-xs text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center bg-white/40 dark:bg-[#141416]/40 border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-2xl">
            <Bot className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              No subagent tasks dispatched yet.
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Select one of the 1-click presets above or enter a custom prompt to launch an OmniRoute worker.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isCompleted = task.status === 'completed';
              const isRunning = task.status === 'running';
              const isFailed = task.status === 'failed';

              return (
                <div
                  key={task.id}
                  className="bg-white/80 dark:bg-[#141416]/90 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 apple-card backdrop-blur-xl transition-all"
                >
                  <div
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {isRunning && (
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 animate-pulse">
                            <Activity className="w-4 h-4" />
                          </div>
                        )}
                        {isCompleted && (
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {isFailed && (
                          <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {task.title}
                          </h4>
                          {task.targetDomain && (
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 shrink-0">
                              {task.targetDomain}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                          <span className="font-mono">{task.model}</span>
                          <span>•</span>
                          <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                          {Boolean(task.executionTimeMs) && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{task.executionTimeMs}ms</span>
                            </>
                          )}
                          {Boolean(task.tokensUsed) && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{task.tokensUsed} tokens</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          isRunning
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {task.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Task Output Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] space-y-4 animate-in fade-in duration-200">
                      {/* Original Prompt */}
                      <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                        <span className="font-semibold block text-[10px] uppercase text-neutral-400 mb-1">
                          Dispatched Prompt
                        </span>
                        {task.prompt}
                      </div>

                      {/* Error Banner */}
                      {task.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                          {task.error}
                        </div>
                      )}

                      {/* Output Result */}
                      {task.result && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              Subagent Intelligence Output
                            </span>
                            <button
                              onClick={() => copyResult(task.id, task.result || '')}
                              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedTaskId === task.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Result</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="p-4 bg-neutral-950 text-neutral-100 rounded-xl text-xs font-sans leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-amber-500/30">
                            {task.result}
                          </div>
                        </div>
                      )}

                      {/* Ponytail-Audit Verification */}
                      {task.auditFindings && (
                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 text-[11px]">
                              <Shield className="w-3.5 h-3.5 text-emerald-500" />
                              Ponytail Zero-Bloat Audit Verification
                            </span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              PASS
                            </span>
                          </div>
                          {task.auditFindings.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-[11px] text-amber-600 dark:text-amber-400">
                              {task.auditFindings.map((finding, idx) => (
                                <li key={idx}>• {finding}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                              Verified: Minimal diff, native standard types, zero dead abstractions.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
