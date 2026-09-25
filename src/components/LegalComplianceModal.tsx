'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Scale, Lock, EyeOff, X, FileText, CheckCircle2 } from 'lucide-react';

export type ComplianceSection = 'ethics' | 'privacy' | 'terms' | 'provenance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: ComplianceSection;
}

export const LegalComplianceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultSection = 'ethics',
}) => {
  const [activeSection, setActiveSection] = useState<ComplianceSection>(defaultSection);

  useEffect(() => {
    setActiveSection(defaultSection);
  }, [defaultSection]);

  // Lock background body scrolling when modal is active
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-compliance-modal-title"
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 id="legal-compliance-modal-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Governance, Privacy & Ethical OSINT Charter
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Legal transparency, data protection protocols, and passive verification standards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer apple-focus"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-black/[0.06] dark:border-white/[0.06] px-6 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('ethics')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 apple-focus ${
              activeSection === 'ethics'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Ethical Reconnaissance Charter
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('privacy')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 apple-focus ${
              activeSection === 'privacy'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" /> Privacy & GDPR Compliance
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('terms')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 apple-focus ${
              activeSection === 'terms'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('provenance')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 apple-focus ${
              activeSection === 'provenance'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Cryptographic Integrity
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {activeSection === 'ethics' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Strictly Passive Reconnaissance Architecture
              </h4>
              <p>
                Internet Archaeologist operates strictly within the boundaries of <strong>passive open-source intelligence (OSINT)</strong>. The system collects data exclusively from publicly accessible, non-intrusive registries:
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>RFC 8484 DNS over HTTPS (DoH):</strong> Authoritative public DNS zone queries executed via encrypted Cloudflare recursive resolvers without zone-transfer exploitation.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>RFC 6962 Certificate Transparency Logs:</strong> Read-only cryptographic log extraction (via crt.sh) inspecting publicly broadcast SSL/TLS certificates issued by Certificate Authorities.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Internet Archive CDX Index:</strong> Temporal historical snapshot metadata harvested from the public Wayback Machine index without aggressive crawling.
                  </div>
                </li>
              </ul>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg">
                <strong>Zero Active Exploitation Guarantee:</strong> This application executes zero port scans, zero vulnerability exploits, zero credential stuffing, and zero bypass techniques.
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-cyan-500" />
                Privacy Policy & GDPR Compliance Notice
              </h4>
              <p>
                Internet Archaeologist is engineered with privacy-by-design principles adhering to the European Union General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA).
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <strong>1. Zero Identity Tracking & Cookieless Architecture:</strong> We do not deploy advertising cookies, canvas fingerprinting scripts, or third-party behavioral trackers.
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <strong>2. Local Storage Autonomy:</strong> Saved investigations and history dossiers reside strictly in your client-side browser <code>localStorage</code> and are never transmitted to external data aggregators.
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06]">
                  <strong>3. Right to Erasure:</strong> You maintain full sovereignty to clear all stored reconnaissance dossiers instantly using the &quot;Purge All&quot; feature in Saved Investigations.
                </div>
              </div>
            </div>
          )}

          {activeSection === 'terms' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Terms of Service & Acceptable Use Policy
              </h4>
              <p>
                By utilizing the Internet Archaeologist platform, you acknowledge and agree to comply with all applicable local, national, and international laws governing telecommunications and cybersecurity.
              </p>
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">Authorized Use Cases:</div>
                <p>• Defensive security posture audits and attack surface reduction.</p>
                <p>• Academic research, digital archaeology, and web history preservation.</p>
                <p>• DNS hygiene verification, email spoofing prevention (SPF/DMARC), and certificate lifecycle management.</p>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg">
                <strong>Prohibited Uses:</strong> Users are strictly prohibited from utilizing this tool to facilitate unlawful harassment, stalking, unauthorized reconnaissance for cyberattacks, or denial-of-service operations.
              </div>
            </div>
          )}

          {activeSection === 'provenance' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                Cryptographic Evidence Integrity & Web3 Verifiability
              </h4>
              <p>
                Every investigation dossier synthesized by Internet Archaeologist is fortified with cryptographic integrity proofs:
              </p>
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <p>
                  <strong>SHA-256 Content Hashing:</strong> Each raw artifact (DNS zone array, subdomain register, HTTP response header bundle, and certificate chain) is hashed in real-time using the Web Crypto API standard (<code>crypto.subtle.digest(&apos;SHA-256&apos;)</code>).
                </p>
                <p>
                  <strong>Anti-Tamper Evidence Linkages:</strong> Every timeline milestone and node in the relationship graph references an immutable <code>evidenceId</code> and corresponding <code>verificationHash</code>, creating a verifiable paper trail suitable for forensic auditing and decentralized attestation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
          <span className="text-[11px] text-neutral-400">
            Internet Archaeologist v2.1 • RFC 8484 & RFC 6962 Standard
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-medium transition-colors cursor-pointer apple-focus"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
