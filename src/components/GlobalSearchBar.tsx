'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Investigation } from '@/types/osint';
import { NavigationTab } from '@/app/page';
import {
  Search,
  X,
  Globe,
  Network,
  Cpu,
  Clock,
  Lock,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Mail,
  HeartPulse,
  ShieldAlert,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  tab: NavigationTab;
  tabLabel: string;
  category:
    | 'DNS'
    | 'Subdomain'
    | 'Technology'
    | 'Archive'
    | 'Certificate'
    | 'Milestone'
    | 'Evidence'
    | 'Vulnerability'
    | 'Contact'
    | 'Health';
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ElementType;
}

interface Props {
  investigation: Investigation | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab, highlightId?: string) => void;
}

export const GlobalSearchBar: React.FC<Props> = ({
  investigation,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Lock background body scrolling when search dialog is active
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigate('story'); // Toggle or trigger search
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  // Index all data across all tabs
  const indexedItems: SearchResultItem[] = useMemo(() => {
    if (!investigation) return [];
    const items: SearchResultItem[] = [];

    // 1. DNS Records -> 'infra' or 'overview'
    investigation.dnsRecords.forEach((rec, idx) => {
      items.push({
        id: `dns-${idx}`,
        tab: 'infra',
        tabLabel: 'DNS Zone Map',
        category: 'DNS',
        title: `${rec.type} Record: ${rec.value}`,
        subtitle: `TTL: ${rec.ttl || 300}s • Authoritative Zone`,
        badge: rec.type,
        icon: Database,
      });
    });

    // 2. Subdomains -> 'subdomains'
    investigation.subdomains?.forEach((sub) => {
      items.push({
        id: `sub-${sub.fullDomain}`,
        tab: 'subdomains',
        tabLabel: 'Subdomains View',
        category: 'Subdomain',
        title: sub.fullDomain,
        subtitle: `Discovered via ${sub.source} • Status: ${sub.status}`,
        badge: sub.source.split(' ')[0],
        icon: Network,
      });
    });

    // 3. Technologies -> 'tech' or 'tech-evolution'
    investigation.technologies.forEach((tech) => {
      items.push({
        id: `tech-${tech.id}`,
        tab: 'tech-evolution',
        tabLabel: 'Tech Evolution',
        category: 'Technology',
        title: `${tech.name} (${tech.category})`,
        subtitle: tech.evidence,
        badge: `${tech.confidence}% Conf`,
        icon: Cpu,
      });
    });

    // 4. Snapshots -> 'timeline'
    investigation.snapshots.forEach((snap) => {
      items.push({
        id: snap.id,
        tab: 'timeline',
        tabLabel: 'Wayback Timeline',
        category: 'Archive',
        title: snap.title,
        subtitle: `Crawl Date: ${snap.timestamp.split('T')[0]} • Status: ${snap.statusCode} • Tech: ${snap.detectedTech.map((t) => t.name).join(', ')}`,
        badge: snap.timestamp.substring(0, 4),
        icon: Clock,
      });
    });

    // 5. Certificates -> 'certs'
    investigation.certificates?.forEach((cert) => {
      items.push({
        id: cert.id,
        tab: 'certs',
        tabLabel: 'TLS & Certificates',
        category: 'Certificate',
        title: cert.commonName,
        subtitle: `Issuer: ${cert.issuer} • Valid: ${cert.notBefore} to ${cert.notAfter}`,
        badge: cert.status,
        icon: Lock,
      });
    });

    // 6. Milestones -> 'story'
    investigation.milestones?.forEach((m) => {
      items.push({
        id: m.id,
        tab: 'story',
        tabLabel: 'Website Story',
        category: 'Milestone',
        title: m.title,
        subtitle: m.description,
        badge: m.era,
        icon: Sparkles,
      });
    });

    // 7. Evidence -> 'evidence'
    investigation.evidence?.forEach((ev) => {
      items.push({
        id: ev.id,
        tab: 'evidence',
        tabLabel: 'Evidence Ledger',
        category: 'Evidence',
        title: `${ev.evidenceType}: ${ev.relatedObservation}`,
        subtitle: `Source: ${ev.source} • Method: ${ev.collectionMethod}`,
        badge: `${ev.confidenceScore}%`,
        icon: Shield,
      });
    });

    // 8. Discovered Public Contacts -> 'domain-intel'
    investigation.exposedContacts?.forEach((contact, idx) => {
      items.push({
        id: `contact-${idx}`,
        tab: 'domain-intel',
        tabLabel: 'Domain Intelligence',
        category: 'Contact',
        title: `${contact.role}: ${contact.maskedValue || contact.value}`,
        subtitle: `Source: ${contact.source} • RFC/Public Data`,
        badge: contact.role.split(' ')[0],
        icon: Mail,
      });
    });

    // 9. Vulnerabilities -> 'vulnerabilities'
    investigation.vulnerabilities?.forEach((vuln) => {
      items.push({
        id: vuln.id,
        tab: 'vulnerabilities',
        tabLabel: 'Vulnerability Posture',
        category: 'Vulnerability',
        title: `[${vuln.severity}] ${vuln.title}`,
        subtitle: `CVSS ${vuln.cvssScore} • Category: ${vuln.category} • Status: ${vuln.status}`,
        badge: vuln.severity,
        icon: ShieldAlert,
      });
    });

    // 10. Website Health Issues -> 'website-health'
    const brokenLinks = investigation.websiteHealth?.brokenLinks || investigation.healthReport?.brokenLinks;
    brokenLinks?.forEach((bl, idx) => {
      items.push({
        id: `health-bl-${idx}`,
        tab: 'website-health',
        tabLabel: 'Website Health & Hygiene',
        category: 'Health',
        title: `Broken Link (${bl.statusCode}): ${bl.url}`,
        subtitle: `Status: HTTP ${bl.statusCode} • Page: ${bl.sourcePage}`,
        badge: `${bl.statusCode}`,
        icon: HeartPulse,
      });
    });

    return items;
  }, [investigation]);

  // Filter items matching query
  const filteredResults = useMemo(() => {
    if (!debouncedQuery) return [];
    return indexedItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(debouncedQuery) ||
          item.subtitle.toLowerCase().includes(debouncedQuery) ||
          item.category.toLowerCase().includes(debouncedQuery) ||
          (item.badge && item.badge.toLowerCase().includes(debouncedQuery))
        );
      })
      .slice(0, 25);
  }, [debouncedQuery, indexedItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-amber-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search across all tabs for "${investigation?.domain || 'domain'}" (DNS, subdomains, tech, certs, archives)...`}
            className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/40">
          {!debouncedQuery ? (
            <div className="p-8 text-center space-y-2">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-mono text-slate-400">
                Type keywords like <span className="text-amber-300">nginx</span>,{' '}
                <span className="text-emerald-300">mx</span>,{' '}
                <span className="text-cyan-300">api</span>, or{' '}
                <span className="text-purple-300">react</span>
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Simultaneously scans {indexedItems.length} indexed forensic records across all tabs
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center space-y-2 font-mono">
              <p className="text-sm text-slate-400">
                No forensic entities match &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-600">
                Try searching for IP addresses, DNS record types, or protocols
              </p>
            </div>
          ) : (
            filteredResults.map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.id}
                  onClick={() => {
                    onNavigate(res.tab, res.id);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-slate-800/80 transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-4">
                    <div className="p-2 rounded-lg bg-slate-800 text-amber-400 shrink-0 mt-0.5 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs md:text-sm text-slate-200 group-hover:text-amber-300 transition-colors truncate">
                          {res.title}
                        </span>
                        {res.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            {res.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate max-w-lg">
                        {res.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors hidden sm:inline">
                      {res.tabLabel}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>{filteredResults.length} matching entities</span>
          <span>Click any item to jump directly to its tab</span>
        </div>
      </div>
    </div>
  );
};
