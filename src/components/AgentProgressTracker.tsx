'use client';

import React from 'react';
import { AgentTelemetry, AgentId } from '@/types/agent';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Search,
  Server,
  History,
  Mail,
  HeartPulse,
  BookOpen,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';

interface AgentProgressTrackerProps {
  telemetries: Record<AgentId, AgentTelemetry>;
  activeDomain: string;
}

const AGENT_ICONS: Record<AgentId, React.ReactNode> = {
  orchestrator: <Zap className="w-4 h-4 text-amber-400" />,
  'passive-recon': <Search className="w-4 h-4 text-blue-400" />,
  'tech-hosting': <Server className="w-4 h-4 text-purple-400" />,
  'snapshot-history': <History className="w-4 h-4 text-emerald-400" />,
  'contact-discovery': <Mail className="w-4 h-4 text-cyan-400" />,
  'website-health': <HeartPulse className="w-4 h-4 text-pink-400" />,
  'safe-vulnerability': <Shield className="w-4 h-4 text-red-400" />,
  'source-enrichment': <BookOpen className="w-4 h-4 text-indigo-400" />,
  reporting: <FileSpreadsheet className="w-4 h-4 text-teal-400" />,
};

export function AgentProgressTracker({ telemetries, activeDomain }: AgentProgressTrackerProps) {
  const agentsList = Object.values(telemetries);
  const completedCount = agentsList.filter((a) => a.status === 'completed').length;
  const runningCount = agentsList.filter((a) => a.status === 'running').length;
  const overallProgress = Math.round(
    agentsList.reduce((acc, a) => acc + (a.progress || 0), 0) / Math.max(1, agentsList.length)
  );

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md mb-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Activity className="w-5 h-5 animate-pulse" />
            {runningCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">Parallel Agent Swarm Telemetry</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                v2.0 Zero-Buffer
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Coordinating 8 specialized defensive workers for <span className="text-emerald-400 font-mono">{activeDomain}</span>
            </p>
          </div>
        </div>

        {/* Global Progress Pill */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-zinc-200">
              {completedCount} of {agentsList.length} Complete
            </div>
            <div className="text-[11px] text-zinc-500">
              {runningCount > 0 ? `${runningCount} active streams` : 'All tasks settled'}
            </div>
          </div>
          <div className="w-24 bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 min-w-9 text-right">
            {overallProgress}%
          </span>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {agentsList.map((agent) => {
          const isRunning = agent.status === 'running';
          const isComplete = agent.status === 'completed';
          const isFailed = agent.status === 'failed';

          return (
            <div
              key={agent.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isRunning
                  ? 'bg-amber-500/5 border-amber-500/30 shadow-sm shadow-amber-500/10'
                  : isComplete
                  ? 'bg-zinc-900/40 border-emerald-500/20'
                  : isFailed
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-zinc-900/20 border-zinc-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                    {AGENT_ICONS[agent.id] || <Activity className="w-3.5 h-3.5 text-zinc-400" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-zinc-200 truncate max-w-[120px]">{agent.name}</h4>
                    <p className="text-[10px] text-zinc-500 truncate">{agent.role}</p>
                  </div>
                </div>

                {/* Status indicator */}
                {isRunning && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Run
                  </span>
                )}
                {isComplete && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Done
                  </span>
                )}
                {isFailed && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    Error
                  </span>
                )}
                {agent.status === 'idle' && (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock className="w-3 h-3" />
                    Idle
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden mb-2 border border-zinc-800/50">
                <div
                  className={`h-full transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-400'
                      : isFailed
                      ? 'bg-red-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${agent.progress}%` }}
                />
              </div>

              {/* Action & Findings */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="truncate max-w-[140px]" title={agent.currentAction}>
                  {agent.currentAction || 'Waiting in queue...'}
                </span>
                {agent.findingsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px]">
                    +{agent.findingsCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
