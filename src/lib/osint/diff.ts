import { WebSnapshot, ChangeEvent, DnsRecord, WebsiteStoryMilestone, ExecutiveSummary, SubdomainRecord, Technology } from '@/types/osint';

export function computeChangeEvents(snapshots: WebSnapshot[], dnsRecords: DnsRecord[]): ChangeEvent[] {
  const changes: ChangeEvent[] = [];

  if (snapshots.length >= 2) {
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];

      const prevTechNames = new Set(prev.detectedTech.map(t => t.name));
      const currTechNames = new Set(curr.detectedTech.map(t => t.name));

      // Major UI / Page payload redesign shift (>40% change)
      if (prev.contentLength > 0 && curr.contentLength > 0) {
        const ratio = curr.contentLength / prev.contentLength;
        if (ratio >= 1.5 || ratio <= 0.6) {
          const pct = Math.round(Math.abs(ratio - 1) * 100);
          const dir = ratio > 1 ? 'expanded by' : 'reduced by';
          changes.push({
            id: `change-redesign-${curr.id}`,
            timestamp: curr.timestamp,
            category: 'UI/UX Redesign',
            description: `Major page restructuring & payload redesign: footprint ${dir} ${pct}% (${(prev.contentLength / 1024).toFixed(1)} KB ➔ ${(curr.contentLength / 1024).toFixed(1)} KB)`,
            severity: 'medium'
          });
        }
      }

      // Tech added
      curr.detectedTech.forEach(t => {
        if (!prevTechNames.has(t.name)) {
          changes.push({
            id: `change-add-${curr.id}-${t.id}`,
            timestamp: curr.timestamp,
            category: 'Tech Added',
            description: `Adopted technology: ${t.name} (${t.category})`,
            severity: 'medium'
          });
        }
      });

      // Tech removed
      prev.detectedTech.forEach(t => {
        if (!currTechNames.has(t.name)) {
          changes.push({
            id: `change-rem-${curr.id}-${t.id}`,
            timestamp: curr.timestamp,
            category: 'Tech Removed',
            description: `Decommissioned technology: ${t.name} (${t.category})`,
            severity: 'low'
          });
        }
      });

      // Status code change
      if (prev.statusCode !== curr.statusCode) {
        changes.push({
          id: `change-status-${curr.id}`,
          timestamp: curr.timestamp,
          category: 'Status Change',
          description: `HTTP Status shifted from ${prev.statusCode} to ${curr.statusCode}`,
          severity: curr.statusCode >= 400 ? 'high' : 'low'
        });
      }
    }
  }

  // DNS records summary event
  const nsRecords = dnsRecords.filter(r => r.type === 'NS').map(r => r.value);
  if (nsRecords.length > 0) {
    changes.push({
      id: `change-dns-ns`,
      timestamp: new Date().toISOString(),
      category: 'DNS Change',
      description: `Active Authoritative Nameservers: ${nsRecords.join(', ')}`,
      severity: 'low'
    });
  }

  return changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function computeStoryMilestones(
  snapshots: WebSnapshot[],
  subdomains: SubdomainRecord[],
  activeTech: Technology[],
  domain: string
): WebsiteStoryMilestone[] {
  const milestones: WebsiteStoryMilestone[] = [];

  if (snapshots.length > 0) {
    const earliest = snapshots[0];
    const earliestYear = earliest.timestamp.split('-')[0];

    // Origin Milestone
    milestones.push({
      id: 'mile-origin',
      era: earliestYear,
      timestamp: earliest.timestamp,
      title: `Earliest Public Footprint Indexed (${earliestYear})`,
      description: `First documented crawl captured for ${domain}. Initial footprint utilized ${earliest.detectedTech.map(t => t.name).join(', ') || 'static HTML/CSS'}.`,
      category: 'UI/UX Redesign',
      impact: 'major',
      details: [
        `Archive Snapshot ID: ${earliest.id}`,
        `Initial payload size: ${(earliest.contentLength / 1024).toFixed(1)} KB`,
        `HTTP Status: ${earliest.statusCode}`
      ]
    });

    // Detect Framework Shifts between historical snapshots
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      const currYear = curr.timestamp.split('-')[0];

      const prevFrameworks = prev.detectedTech.filter(t => t.category === 'JavaScript Framework' || t.category === 'CMS');
      const currFrameworks = curr.detectedTech.filter(t => t.category === 'JavaScript Framework' || t.category === 'CMS');

      const prevNames = prevFrameworks.map(t => t.name).join(', ');
      const currNames = currFrameworks.map(t => t.name).join(', ');

      if (prevNames !== currNames && currFrameworks.length > 0) {
        milestones.push({
          id: `mile-framework-${curr.id}`,
          era: currYear,
          timestamp: curr.timestamp,
          title: `Major Framework Migration (${currYear})`,
          description: `Architecture overhauled from [${prevNames || 'Legacy static markup'}] to modern reactive stack: [${currNames}].`,
          category: 'Framework Migration',
          impact: 'critical',
          details: [
            `Detected Frameworks: ${currNames}`,
            `Performance impact: Hydration & dynamic client-side rendering enabled`,
            `Source: Historical snapshot analysis`
          ]
        });
      }

      // UI/UX Redesign Leap
      if (prev.contentLength > 0 && curr.contentLength > 0) {
        const ratio = curr.contentLength / prev.contentLength;
        if (ratio >= 1.5 || ratio <= 0.6) {
          const pct = Math.round(Math.abs(ratio - 1) * 100);
          milestones.push({
            id: `mile-redesign-${curr.id}`,
            era: currYear,
            timestamp: curr.timestamp,
            title: `Visual & Structural UI/UX Redesign (${currYear})`,
            description: `Significant frontend payload restructuring observed: asset weight shifted by ${pct}%, reflecting a full interface makeover.`,
            category: 'UI/UX Redesign',
            impact: 'major',
            details: [
              `Previous weight: ${(prev.contentLength / 1024).toFixed(1)} KB`,
              `New weight: ${(curr.contentLength / 1024).toFixed(1)} KB`,
              `Archive record: ${curr.title || domain}`
            ]
          });
        }
      }
    }
  }

  // Subdomain Expansion Milestone
  if (subdomains.length > 0) {
    const subNames = subdomains.map(s => `${s.subdomain}.${domain}`).slice(0, 4);
    const hasMore = subdomains.length > 4 ? ` (+${subdomains.length - 4} more)` : '';
    milestones.push({
      id: 'mile-subdomains',
      era: new Date().getFullYear().toString(),
      timestamp: new Date().toISOString(),
      title: `Subdomain Infrastructure Expansion (${subdomains.length} Detected)`,
      description: `Passive reconnaissance uncovered ${subdomains.length} public subdomains across Certificate Transparency and web crawls: ${subNames.join(', ')}${hasMore}.`,
      category: 'Subdomain Expansion',
      impact: 'major',
      details: subdomains.map(s => `${s.fullDomain} (${s.source}${s.firstSeen ? ' - First seen ' + s.firstSeen : ''})`)
    });
  }

  // Active Modern Stack & Security Milestone
  const activeTechNames = activeTech.map(t => t.name).join(', ');
  const currentYear = new Date().getFullYear().toString();
  milestones.push({
    id: 'mile-current-posture',
    era: currentYear,
    timestamp: new Date().toISOString(),
    title: `Current Active Stack & Edge Footprint (${currentYear})`,
    description: `Target domain is operating with ${activeTechNames || 'modern cloud infrastructure'}, leveraging edge acceleration and TLS encryption.`,
    category: 'Security & CDN',
    impact: 'info',
    details: activeTech.map(t => `${t.name} (${t.category} - ${t.confidence}% confidence)`)
  });

  return milestones.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function generateExecutiveSummary(
  domain: string,
  snapshots: WebSnapshot[],
  subdomains: SubdomainRecord[],
  activeTech: Technology[],
  milestones: WebsiteStoryMilestone[]
): ExecutiveSummary {
  const earliestYear = snapshots[0]?.timestamp.split('-')[0] || 'Unknown';
  const currentYear = new Date().getFullYear();
  const totalYears = snapshots.length > 0 ? currentYear - parseInt(earliestYear, 10) + 1 : 1;

  // Framework progression
  const earlyTech = snapshots[0]?.detectedTech.map(t => t.name).join(', ') || 'Static HTML';
  const currentStack = activeTech.filter(t => t.category === 'JavaScript Framework' || t.category === 'CMS').map(t => t.name).join(' & ') || 'Modern Web Stack';
  const primaryFrameworkEvolution = `${earlyTech} ➔ ${currentStack}`;

  // Redesign count
  const redesigns = milestones.filter(m => m.category === 'UI/UX Redesign').length;
  const migrations = milestones.filter(m => m.category === 'Framework Migration').length;

  const headline = migrations > 0
    ? `Complete architectural modernization from ${earlyTech} to ${currentStack} across ${totalYears} years`
    : `Stable infrastructure running ${currentStack} with ${subdomains.length} discovered subdomains`;

  const narrative = `Target ${domain} first surfaced in public web archives in ${earliestYear} (active for ~${totalYears} years). Over its lifecycle, our passive reconnaissance identified ${milestones.length} major structural events, including ${migrations} framework migrations, ${redesigns} UI/UX redesign cycles, and an ecosystem spanning ${subdomains.length} subdomains. Today, the domain operates on ${activeTech.map(t => t.name).slice(0, 3).join(', ')}.`;

  const hasSecurityHeader = activeTech.some(t => t.category === 'Security' || t.name.includes('HSTS'));
  const hasCDN = activeTech.some(t => t.category === 'CDN/Hosting' || t.name.toLowerCase().includes('cloudflare'));

  const securityRating: ExecutiveSummary['securityRating'] = hasSecurityHeader && hasCDN ? 'High' : hasSecurityHeader || hasCDN ? 'Moderate' : 'Basic';

  return {
    headline,
    narrative,
    firstRecordedDate: snapshots[0]?.timestamp || new Date().toISOString(),
    totalYearsActive: Math.max(1, totalYears),
    primaryFrameworkEvolution,
    subdomainsCount: subdomains.length,
    majorRedesignsCount: redesigns,
    securityRating
  };
}

