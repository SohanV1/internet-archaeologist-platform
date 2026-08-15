import { WebSnapshot, ChangeEvent, DnsRecord } from '@/types/osint';

export function computeChangeEvents(snapshots: WebSnapshot[], dnsRecords: DnsRecord[]): ChangeEvent[] {
  const changes: ChangeEvent[] = [];

  if (snapshots.length >= 2) {
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];

      const prevTechNames = new Set(prev.detectedTech.map(t => t.name));
      const currTechNames = new Set(curr.detectedTech.map(t => t.name));

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
      description: `Active Nameservers: ${nsRecords.join(', ')}`,
      severity: 'low'
    });
  }

  return changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
