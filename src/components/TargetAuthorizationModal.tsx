'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock, UserCheck, FileText, AlertTriangle, X } from 'lucide-react';
import { AuthorizationGateRecord, AuthorizationScopeType } from '@/types/agent';
import { calculateSha256 } from '@/lib/osint/cryptoHash';

interface TargetAuthorizationModalProps {
  isOpen: boolean;
  targetDomain: string;
  onClose: () => void;
  onAuthorize: (record: AuthorizationGateRecord) => void;
}

export function TargetAuthorizationModal({
  isOpen,
  targetDomain,
  onClose,
  onAuthorize,
}: TargetAuthorizationModalProps) {
  const [operatorName, setOperatorName] = useState<string>('Security Analyst');
  const [organization, setOrganization] = useState<string>('');
  const [scope, setScope] = useState<AuthorizationScopeType>('authorized_defensive');
  const [certifiedOwnership, setCertifiedOwnership] = useState<boolean>(false);
  const [acknowledgedNonDestructive, setAcknowledgedNonDestructive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const canProceed = certifiedOwnership && acknowledgedNonDestructive && operatorName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;

    setIsSubmitting(true);
    const timestamp = new Date().toISOString();
    const signatureContent = `${targetDomain}:${scope}:${operatorName}:${organization}:${timestamp}`;
    const auditSignatureHash = await calculateSha256(signatureContent);

    const record: AuthorizationGateRecord = {
      targetDomain,
      scope,
      authorizedBy: operatorName.trim(),
      organization: organization.trim() || undefined,
      timestamp,
      disclaimerAccepted: true,
      auditSignatureHash,
    };

    setIsSubmitting(false);
    onAuthorize(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Target Authorization Gate</h3>
              <p className="text-xs text-zinc-400">Defensive scope confirmation & immutable audit log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Banner */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Target Domain</span>
            <span className="text-sm font-mono font-semibold text-emerald-400">{targetDomain}</span>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Assessment Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('passive_only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === 'passive_only'
                    ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Passive OSINT Only
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Public DNS DoH, crt.sh logs, RDAP & Wayback. Zero contact with target servers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('authorized_defensive')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === 'authorized_defensive'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Authorized Defensive
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  Safe health checks (TLS, headers, broken links, login hygiene). Non-intrusive.
                </p>
              </button>
            </div>
          </div>

          {/* Operator Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Assessor Name / Handle *</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                placeholder="e.g. Lead Security Engineer"
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Organization (Optional)</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Internal SecOps"
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Compliance Checkboxes */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={certifiedOwnership}
                onChange={(e) => setCertifiedOwnership(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                I certify that I am the verified owner of <strong>{targetDomain}</strong> or have explicit written authorization from the owner to conduct this defensive assessment.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgedNonDestructive}
                onChange={(e) => setAcknowledgedNonDestructive(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0"
              />
              <span className="text-xs text-zinc-400 leading-relaxed">
                I confirm that all checks will remain non-destructive and defensive. No brute-force, exploitation, fake login submissions, or denial-of-service will be initiated.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canProceed || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                canProceed && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Authorize & Launch Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
