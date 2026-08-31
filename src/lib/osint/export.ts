import { Investigation } from '@/types/osint';

export function generateHtmlReport(inv: Investigation): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Forensic OSINT Intelligence Report - ${inv.domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { color: #f59e0b; margin-top: 0; font-size: 28px; border-bottom: 1px solid #334155; padding-bottom: 16px; font-family: monospace; }
    h2 { color: #38bdf8; font-size: 18px; margin-top: 28px; margin-bottom: 12px; font-family: monospace; text-transform: uppercase; }
    .badge { display: inline-block; padding: 4px 10px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; font-family: monospace; font-size: 12px; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
    .card { background: #0f172a; padding: 16px; border-radius: 10px; border: 1px solid #334155; }
    .card-title { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-family: monospace; }
    .card-val { font-size: 20px; font-weight: bold; color: #f8fafc; font-family: monospace; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; font-family: monospace; }
    th { text-align: left; background: #0f172a; padding: 10px; color: #94a3b8; border-bottom: 1px solid #334155; }
    td { padding: 10px; border-bottom: 1px solid #334155; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; font-family: monospace; text-align: center; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { background: #fff; border: none; box-shadow: none; padding: 0; color: #000; }
      h1, h2, .card-val { color: #000; }
      .card, table, th, td { border-color: #cbd5e1; background: #f8fafc; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏛️ Forensic OSINT Intelligence Report: ${inv.domain}</h1>
    <p style="color: #94a3b8; font-family: monospace; font-size: 12px;">Captured At: ${new Date(inv.createdAt).toUTCString()} | Target: ${inv.targetUrl}</p>
    
    <h2>1. Executive Synthesis</h2>
    <div class="card" style="background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.3);">
      <h3 style="margin: 0 0 8px 0; color: #fbbf24; font-family: monospace;">${inv.summary.headline}</h3>
      <p style="margin: 0; line-height: 1.6; color: #cbd5e1;">${inv.summary.narrative}</p>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Years Active</div>
        <div class="card-val">${inv.summary.totalYearsActive} Yrs</div>
      </div>
      <div class="card">
        <div class="card-title">Discovered Subdomains</div>
        <div class="card-val">${inv.subdomains.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Detected Technologies</div>
        <div class="card-val">${inv.technologies.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Security Rating</div>
        <div class="card-val">${inv.summary.securityRating}</div>
      </div>
    </div>

    <h2>2. Authoritative DNS Zones</h2>
    <table>
      <thead>
        <tr><th>Type</th><th>Value</th><th>TTL</th></tr>
      </thead>
      <tbody>
        ${inv.dnsRecords.map(r => `<tr><td style="color: #f59e0b; font-weight: bold;">${r.type}</td><td>${r.value}</td><td>${r.ttl || 3600}s</td></tr>`).join('')}
      </tbody>
    </table>

    <h2>3. Detected Web Stack Technologies</h2>
    <table>
      <thead>
        <tr><th>Technology</th><th>Category</th><th>Confidence</th></tr>
      </thead>
      <tbody>
        ${inv.technologies.map(t => `<tr><td>${t.name}</td><td>${t.category}</td><td style="color: #10b981;">${t.confidence}%</td></tr>`).join('')}
      </tbody>
    </table>

    <h2>4. Forensic Evidence & Provenance Audit Chain</h2>
    <table>
      <thead>
        <tr><th>Source</th><th>Type</th><th>SHA-256 Provenance Hash</th></tr>
      </thead>
      <tbody>
        ${inv.evidence.map(e => `<tr><td>${e.source}</td><td>${e.evidenceType}</td><td style="color: #38bdf8; font-size: 11px;">${e.verificationHash || 'N/A'}</td></tr>`).join('')}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by Internet Archaeologist Platform v1.0 • Cryptographically Verified Forensic Artifact
    </div>
  </div>
</body>
</html>`;
}

export function exportDnsToCsv(inv: Investigation): string {
  const rows = [['Type', 'Value', 'TTL']];
  inv.dnsRecords.forEach(r => {
    rows.push([r.type, `"${r.value.replace(/"/g, '""')}"`, (r.ttl || 3600).toString()]);
  });
  return rows.map(r => r.join(',')).join('\n');
}

export function exportSubdomainsToCsv(inv: Investigation): string {
  const rows = [['Subdomain', 'Root Domain', 'Source', 'Status']];
  inv.subdomains.forEach(s => {
    rows.push([`"${s.subdomain}"`, `"${s.fullDomain}"`, `"${s.source}"`, s.status]);
  });
  return rows.map(r => r.join(',')).join('\n');
}

export function exportChangesToCsv(inv: Investigation): string {
  const rows = [['Timestamp', 'Category', 'Severity', 'Description']];
  inv.changes.forEach(c => {
    rows.push([c.timestamp, `"${c.category}"`, c.severity, `"${c.description.replace(/"/g, '""')}"`]);
  });
  return rows.map(r => r.join(',')).join('\n');
}