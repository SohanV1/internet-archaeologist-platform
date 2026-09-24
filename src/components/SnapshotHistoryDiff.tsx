'use client';

import React, { useState } from 'react';
import { Investigation, HistoricalScanDiff } from '@/types/osint';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  Globe,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SnapshotHistoryDiffProps {
  currentInvestigation: Investigation;
  savedInvestigations: Investigation[];
}

export function SnapshotHistoryDiff({
  currentInvestigation,
  savedInvestigations,
}: SnapshotHistoryDiffProps) {
  // Filter prior investigations for the same domain
  const historyForDomain = savedInvestigations.filter(
    (inv) => inv.domain.toLowerCase() === currentInvestigation.domain.toLowerCase()
  );

  const [selectedPriorId, setSelectedPriorId] = useState<string>(
    historyForDomain.length > 1 ? historyForDomain[1].id : ''
  );

  const priorScan = historyForDomain.find((inv) => inv.id === selectedPriorId);

  // Compute live diff if priorScan exists
  const diff: HistoricalScanDiff | null = React.useMemo(() => {
    if (!priorScan) return null;

    const priorSubdomains = new Set(priorScan.subdomains.map((s) => s.fullDomain));
    const currentSubdomains = new Set(currentInvestigation.subdomains.map((s) => s.fullDomain));

    const newSubdomains = [...currentSubdomains].filter((s) => !priorSubdomains.has(s));
    const removedSubdomains = [...priorSubdomains].filter((s) => !currentSubdomains.has(s));

    const priorVulns = new Set(priorScan.vulnerabilities?.map((v) => v.title) || []);
    const currentVulns = new Set(currentInvestigation.vulnerabilities?.map((v) => v.title) || []);

    const resolvedVulnerabilities = [...priorVulns].filter((v) => !currentVulns.has(v));
    const newVulnerabilities = [...currentVulns].filter((v) => !priorVulns.has(v));

    const currentScore = currentInvestigation.riskAssessment?.overallScore ?? 50;
    const priorScore = priorScan.riskAssessment?.overallScore ?? 50;
    const netScoreDelta = priorScore - currentScore; // positive means lower risk score (improvement)

    let summaryNarrative = `Comparison between scans recorded on ${new Date(
      priorScan.createdAt
    ).toLocaleDateString()} and ${new Date(currentInvestigation.createdAt).toLocaleDateString()}.`;

    if (newSubdomains.length > 0) {
      summaryNarrative += ` ${newSubdomains.length} new subdomains were indexed.`;
    }
    if (resolvedVulnerabilities.length > 0) {
      summaryNarrative += ` ${resolvedVulnerabilities.length} previously detected risks were resolved.`;
    }
    if (newVulnerabilities.length > 0) {
      summaryNarrative += ` ${newVulnerabilities.length} new defensive hygiene issues were observed.`;
    }

    return {
      priorScanId: priorScan.id,
      priorTimestamp: priorScan.createdAt,
      currentTimestamp: currentInvestigation.createdAt,
      domain: currentInvestigation.domain,
      newSubdomains,
      removedSubdomains,
      resolvedVulnerabilities,
      newVulnerabilities,
      netScoreDelta,
      summaryNarrative,
    };
  }, [currentInvestigation, priorScan]);

  return (
    <div className="space-y-6">
      {/* Header card with selector */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Historical Snapshot & Version Comparison</h3>
              <p className="text-xs text-zinc-400">
                Compare attack surface drift and security hygiene posture changes over time
              </p>
            </div>
          </div>

          {/* Prior Scan Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Compare Baseline:</span>
            {historyForDomain.length <= 1 ? (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500">
                Single scan recorded (run additional scans to diff)
              </span>
            ) : (
              <select
                value={selectedPriorId}
                onChange={(e) => setSelectedPriorId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500/60"
              >
                {historyForDomain
                  .filter((inv) => inv.id !== currentInvestigation.id)
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {new Date(inv.createdAt).toLocaleString()} (Grade: {inv.riskAssessment?.grade || 'N/A'})
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {/* Narrative Banner */}
        {diff ? (
          <div className="mt-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
            {diff.summaryNarrative}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400">
            No baseline scan selected. When you perform future assessments on{' '}
            <strong className="text-zinc-200">{currentInvestigation.domain}</strong>, they will be archived here for
            differential analysis.
          </div>
        )}
      </div>

      {diff && (
        <>
          {/* Key Delta Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Security Score Delta */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">Security Score Delta</span>
              <div className="flex items-center gap-2 mt-1">
                {diff.netScoreDelta > 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-400">+{diff.netScoreDelta} pts</span>
                    <span className="text-[11px] text-zinc-500">Improved</span>
                  </>
                ) : diff.netScoreDelta < 0 ? (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold text-red-400">{diff.netScoreDelta} pts</span>
                    <span className="text-[11px] text-zinc-500">Regressed</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5 text-zinc-400" />
                    <span className="text-xl font-bold text-zinc-300">0 pts</span>
                    <span className="text-[11px] text-zinc-500">Unchanged</span>
                  </>
                )}
              </div>
            </div>

            {/* Discovered Subdomains */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">New Subdomains Discovered</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                +{diff.newSubdomains.length}
              </div>
              <span className="text-[11px] text-zinc-500">Attack surface expansion</span>
            </div>

            {/* Resolved Vulnerabilities */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">Resolved Vulnerabilities</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {diff.resolvedVulnerabilities.length}
              </div>
              <span className="text-[11px] text-zinc-500">Remediated since baseline</span>
            </div>

            {/* Newly Introduced Risks */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs text-zinc-400">New Hygiene Flaws</span>
              <div className="text-xl font-bold text-red-400 mt-1">
                {diff.newVulnerabilities.length}
              </div>
              <span className="text-[11px] text-zinc-500">Newly observed issues</span>
            </div>
          </div>

          {/* Side by side comparison lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subdomain Surface Changes */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Subdomain Surface Delta
              </h4>
              {diff.newSubdomains.length === 0 && diff.removedSubdomains.length === 0 ? (
                <p className="text-xs text-zinc-500">No subdomain changes detected between these two snapshots.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {diff.newSubdomains.map((sub) => (
                    <div
                      key={sub}
                      className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-emerald-300">{sub}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        NEW
                      </span>
                    </div>
                  ))}
                  {diff.removedSubdomains.map((sub) => (
                    <div
                      key={sub}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs opacity-60"
                    >
                      <span className="font-mono text-zinc-400 line-through">{sub}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                        RETIRED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vulnerability Posture Delta */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Defensive Finding Changes
              </h4>
              {diff.resolvedVulnerabilities.length === 0 && diff.newVulnerabilities.length === 0 ? (
                <p className="text-xs text-zinc-500">All security checks maintained the same status as baseline.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {diff.resolvedVulnerabilities.map((vuln) => (
                    <div
                      key={vuln}
                      className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2 text-xs"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-200 font-medium">{vuln}</span>
                      <span className="ml-auto text-[10px] text-emerald-400 font-bold">RESOLVED</span>
                    </div>
                  ))}
                  {diff.newVulnerabilities.map((vuln) => (
                    <div
                      key={vuln}
                      className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center gap-2 text-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-red-200 font-medium">{vuln}</span>
                      <span className="ml-auto text-[10px] text-red-400 font-bold">NEW ISSUE</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
