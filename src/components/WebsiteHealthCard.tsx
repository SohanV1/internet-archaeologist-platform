'use client';

import React from 'react';
import {
  WebsiteHealthReport,
  BrokenLinkItem,
  LoginFormHygiene,
  RedirectHop,
  LoginProbeResult,
  FormEndpoint,
} from '@/types/osint';
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-5">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Broken Links</span>
            <div className="flex items-center gap-2 mt-1">
              <Link2Off className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-zinc-200">{healthReport.brokenLinks.length}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Crawl Depth</span>
            <div className="flex items-center gap-2 mt-1">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-zinc-200">{healthReport.crawledPagesCount ?? 1} pages</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Form Endpoints</span>
            <div className="flex items-center gap-2 mt-1">
              <FormInput className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-zinc-200">{healthReport.formEndpoints?.length ?? 0}</span>
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
              Static DOM hygiene checks and single dummy probe error classification (OWASP WSTG-IDNT-04)
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

        {/* Login Error Analysis Section (OWASP Dummy Credential Probe) */}
        {healthReport.loginProbeResults && healthReport.loginProbeResults.length > 0 && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Login Error Analysis & Account Enumeration Audit
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Single dummy probe (test@invalid.tld) error response analysis per OWASP WSTG-IDNT-04
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {healthReport.loginProbeResults.map((probe, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {probe.httpMethod}
                      </span>
                      <span className="text-xs font-mono text-zinc-300 truncate">{probe.formAction}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        Dummy Probe: {probe.dummyCredentialUsed}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300">
                        HTTP {probe.httpStatus} &bull; {probe.responseTimeMs}ms
                      </span>
                    </div>
                  </div>

                  {/* OWASP Enumeration Risk badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">OWASP Enumeration Risk:</span>
                      {probe.enumerationRiskDetected || probe.errorPattern === 'username_enumeration_risk' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          Leaks Account Existence (Enumeration Risk)
                        </span>
                      ) : probe.errorPattern === 'generic_error' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Generic Error Pattern (OWASP Compliant)
                        </span>
                      ) : probe.errorPattern === 'rate_limited' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          Rate Limited / Anti-Automation (HTTP 429)
                        </span>
                      ) : probe.errorPattern === 'redirected' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
                          Redirected on Failure
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400">
                          Indeterminate / Unconfirmed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Extracted Error Text */}
                  {probe.extractedErrorText && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-semibold">
                        Extracted Server Error Response
                      </div>
                      <p className="font-mono text-xs text-zinc-200 break-words">&ldquo;{probe.extractedErrorText}&rdquo;</p>
                    </div>
                  )}

                  <p className="text-xs text-zinc-400">{probe.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Discovered Form Endpoints & Action Targets */}
      {healthReport.formEndpoints && healthReport.formEndpoints.length > 0 && (
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <FormInput className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Discovered Form Endpoints & Action Targets</h3>
                <p className="text-xs text-zinc-400">
                  Form submission endpoints discovered across landing page and 1-hop crawl ({healthReport.formEndpoints.length} total)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-purple-400">
              {healthReport.formEndpoints.length} Endpoints
            </span>
          </div>

          <div className="space-y-2 mt-4 max-h-72 overflow-y-auto pr-1">
            {healthReport.formEndpoints.map((ep, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-[200px] max-w-xl truncate">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {ep.httpMethod}
                    </span>
                    <span className="font-mono text-zinc-200 truncate">{ep.actionUrl}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">
                    Found on: {ep.sourcePage}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ep.isHttps ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Lock className="w-3 h-3" />
                      HTTPS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                      <Unlock className="w-3 h-3" />
                      HTTP
                    </span>
                  )}

                  {ep.isPubliclyAccessible ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                      Reachable {ep.statusCode ? `(HTTP ${ep.statusCode})` : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 font-mono">
                      Inaccessible {ep.statusCode ? `(HTTP ${ep.statusCode})` : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <div className="truncate max-w-[280px]">
                    <div className="font-mono text-amber-300 truncate">{link.url}</div>
                    {link.anchorText && (
                      <div className="text-[10px] text-zinc-400 truncate">Anchor: &ldquo;{link.anchorText}&rdquo;</div>
                    )}
                    {link.sourcePage && (
                      <div className="text-[10px] text-zinc-500 font-mono truncate">Found on: {link.sourcePage}</div>
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
