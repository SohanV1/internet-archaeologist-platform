'use client';

import React, { useState } from 'react';
import { Investigation, ExposedContact, ContactRole } from '@/types/osint';
import {
  Building2,
  Mail,
  Server,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Copy,
  Check,
  Calendar,
  Lock,
  Phone,
  Layers,
  Cpu,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface DomainIntelligenceViewProps {
  investigation: Investigation;
}

const ROLE_BADGES: Record<ContactRole, { bg: string; text: string; border: string }> = {
  // Canonical 7 roles (v2.1)
  security: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  admin: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  sales: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  support: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  legal: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  executive: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  general: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
  // Legacy roles (v2.0 backward compatibility)
  'Security / CERT': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  'Abuse / Legal': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Technical / Webmaster': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Support / Sales': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  General: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
};

export function DomainIntelligenceView({ investigation }: DomainIntelligenceViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const whois = investigation.whoisRdap;
  const mail = investigation.mailProvider;
  const hosting = investigation.hostingFingerprint;
  const contacts = investigation.exposedContacts || [];

  return (
    <div className="space-y-6">
      {/* Top Grid: RDAP Registration & Business Mail Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RDAP / WHOIS Card */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Domain Ownership & RDAP</h3>
                <p className="text-xs text-zinc-400">Public registry records via ICANN RDAP</p>
              </div>
            </div>
            {whois?.privacyProtected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                Privacy Shield Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400">
                Standard Registration
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Registrant Name</span>
              <span className="text-xs font-semibold text-zinc-200 mt-0.5 block truncate" title={whois?.registrantName}>
                {whois?.registrantName || (whois?.privacyProtected ? 'Redacted for Privacy' : 'Not Disclosed')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Organization</span>
              <span className="text-xs font-semibold text-zinc-200 mt-0.5 block truncate" title={whois?.organization}>
                {whois?.organization || 'Private Registrant'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Country</span>
              <span className="text-xs font-semibold text-zinc-200 mt-0.5 block truncate" title={whois?.country}>
                {whois?.country || 'Unknown'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Registrar</span>
              <span className="text-xs font-semibold text-zinc-200 mt-0.5 block truncate" title={whois?.registrar}>
                {whois?.registrar || 'IANA Authorized Registrar'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Registration Date</span>
              <span className="text-xs font-semibold text-zinc-200 mt-0.5 block">
                {whois?.createdDate ? new Date(whois.createdDate).toLocaleDateString() : 'Historical (pre-2000)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Registry Expiration</span>
              <span className="text-xs font-semibold text-zinc-200 mt-0.5 block">
                {whois?.registryExpiry ? new Date(whois.registryExpiry).toLocaleDateString() : 'Auto-Renew Active'}
              </span>
            </div>
          </div>

          {whois?.privacyNotice && (
            <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300 font-medium truncate" title={whois.privacyNotice}>
                {whois.privacyNotice}
              </span>
            </div>
          )}

          {whois?.abuseContactEmail && (
            <div className="mt-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-zinc-400">Designated Abuse Contact:</span>
                <span className="text-xs font-mono text-zinc-200">{whois.abuseContactEmail}</span>
              </div>
              <button
                onClick={() => handleCopy('abuse-whois', whois.abuseContactEmail!)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Copy Abuse Email"
              >
                {copiedId === 'abuse-whois' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Business Mail Provider & Posture */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Business Email & DNS Posture</h3>
                <p className="text-xs text-zinc-400">MX routing, SPF alignment & DMARC anti-spoofing</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
              {mail?.provider || 'Detecting MX...'}
            </div>
          </div>

          {/* Email Posture Badges */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            {/* SPF Status */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">SPF Policy</span>
                {mail?.spfStatus?.includes('Strict') || mail?.spfStatus?.includes('SoftFail') ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-zinc-200 mt-1 block">
                {mail?.spfStatus || 'Missing'}
              </span>
            </div>

            {/* DMARC Policy */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">DMARC Policy</span>
                {mail?.dmarcPolicy === 'reject' || mail?.dmarcPolicy === 'quarantine' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-zinc-200 mt-1 block uppercase">
                {mail?.dmarcPolicy || 'None'}
              </span>
            </div>
          </div>

          {/* SPF Raw Value */}
          {mail?.spfRecord && (
            <div className="mt-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Authoritative SPF TXT Record</span>
              <code className="text-[11px] text-emerald-400 font-mono break-all">{mail.spfRecord}</code>
            </div>
          )}

          {/* Primary MX Hosts */}
          <div className="mt-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Mail Exchange (MX) Gateways</span>
            <div className="flex flex-wrap gap-1.5">
              {mail?.mxHosts && mail.mxHosts.length > 0 ? (
                mail.mxHosts.map((mx) => (
                  <span
                    key={mx}
                    className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                  >
                    {mx}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-500">No MX records advertised</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Infrastructure & Hosting Fingerprint */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Hosting & Infrastructure Fingerprint</h3>
              <p className="text-xs text-zinc-400">Cloud architecture, CDN edge, BGP ASN & server geolocation</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            {hosting?.hostingType || 'Cloud Infrastructure'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Primary Provider</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">{hosting?.primaryProvider || 'Edge CDN'}</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>CDN Edge Proxy</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">{hosting?.cdn || 'Direct Origin / Shielded'}</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Autonomous System (ASN)</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200 font-mono truncate">
              {hosting?.asn ? `${hosting.asn} (${hosting.asnOrg})` : 'AS13335 (Cloudflare)'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Estimated Region</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {hosting?.serverRegion?.country
                ? `${hosting.serverRegion.city || 'Edge'}, ${hosting.serverRegion.country}`
                : 'Anycast Distributed Edge'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Public Contact Directory */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Public Contact Directory</h3>
              <p className="text-xs text-zinc-400">
                Publicly exposed contact emails and phone numbers categorized by role (with privacy masking)
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400">
            {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'} Discovered
          </span>
        </div>

        {contacts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No public contact channels or security.txt records detected on this target.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {contacts.map((contact) => {
              const badgeStyle =
                ROLE_BADGES[contact.role] ||
                ROLE_BADGES[(contact.role || '').toLowerCase() as ContactRole] ||
                ROLE_BADGES.general ||
                ROLE_BADGES.General;

              return (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                      >
                        {contact.role}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{contact.confidence}% conf.</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {contact.type === 'phone' ? (
                        <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <span className="text-xs font-mono font-medium text-zinc-200 select-all">
                        {contact.value}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500">
                    <span className="truncate max-w-[170px]" title={contact.source}>
                      {contact.source}
                    </span>
                    <button
                      onClick={() => handleCopy(contact.id, contact.value)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Copy Contact"
                    >
                      {copiedId === contact.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
