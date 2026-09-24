'use client';

import React from 'react';
import { WebsiteHealthReport, BrokenLinkItem, LoginFormHygiene, RedirectHop } from '@/types/osint';
import {
  HeartPulse,
  Link2Off,
  CornerDownRight,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink,
  FormInput,
} from 'lucide-react';

interface WebsiteHealthCardProps {
  healthReport?: WebsiteHealthReport;
  targetDomain: string;
}

export function WebsiteHealthCard({ healthReport, targetDomain }: WebsiteHealthCardProps) {
  if (!healthReport) {
    return (
      <div className="p-8 text-center bg-zinc-950/80 border border-zinc-800 rounded-2xl">
        <HeartPulse className="w-8 h-8 text-zinc-600 mx-auto mb-2 animate-pulse" />
        <p className="text-xs text-zinc-400">Health assessment pending or target was scanned in passive-only mode.</p>
      </div>
    );
  }

  const score = healthReport.overallHealthScore;
  const scoreColor =
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Overview Score Card */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Website Quality & Health Audit</h3>
              <p className="text-xs text-zinc-400">
                Safe non-destructive evaluation of links, redirects, errors & login form hygiene
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Health Index:</span>
            <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{score}/100</span>
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Broken Links</span>
            <div className="flex items-center gap-2 mt-1">
              <Link2Off className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-zinc-200">{healthReport.brokenLinks.length}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Redirect Hops</span>
            <div className="flex items-center gap-2 mt-1">
              <CornerDownRight className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-zinc-200">{healthReport.redirectChain.length}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Mixed Content</span>
            <div className="flex items-center gap-2 mt-1">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-zinc-200">{healthReport.mixedContentIssues.length}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Latency</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono font-bold text-emerald-400">{healthReport.responseTimeMs}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Flow & Form Hygiene (Non-Destructive Inspection) */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <FormInput className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Login Flow & Authentication Form Hygiene</h3>
            <p className="text-xs text-zinc-400">
              Static DOM hygiene checks without submitting credentials, fuzzing, or login attempts
            </p>
          </div>
        </div>

        {healthReport.loginFormHygiene.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs mt-3">
            No public authentication forms detected on index endpoints.
          </div>
        ) : (
          <div className="space-y-3 mt-5">
            {healthReport.loginFormHygiene.map((form, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {form.isHttps ? (
                      <Lock className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs font-mono text-zinc-200">Action: {form.formAction}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.hasCsrfToken ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        CSRF Token Present
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        No Visible CSRF
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400">{form.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redirect Chain & Mixed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redirect Chain */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-blue-400" />
            Redirect Chain Analysis
          </h4>
          {healthReport.redirectChain.length === 0 ? (
            <p className="text-xs text-zinc-500">Target resolved directly without redirect hops.</p>
          ) : (
            <div className="space-y-2">
              {healthReport.redirectChain.map((hop, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-blue-400 font-bold">{hop.statusCode}</span>
                    <span className="text-zinc-300 truncate">{hop.from}</span>
                  </div>
                  <span className="text-zinc-500">→</span>
                  <span className="text-emerald-400 truncate">{hop.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Broken Links */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <Link2Off className="w-4 h-4 text-amber-400" />
            Observed Broken Links
          </h4>
          {healthReport.brokenLinks.length === 0 ? (
            <p className="text-xs text-zinc-500">All surveyed links on target landing page responded successfully.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {healthReport.brokenLinks.map((link, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate max-w-[240px]">
                    <div className="font-mono text-amber-300 truncate">{link.url}</div>
                    {link.anchorText && (
                      <div className="text-[10px] text-zinc-500 truncate">Anchor: &ldquo;{link.anchorText}&rdquo;</div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono text-[10px] font-bold">
                    HTTP {link.statusCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
