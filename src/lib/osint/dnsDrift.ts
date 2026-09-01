import { DnsRecord, AsnInfo, DnsDriftEvent } from '@/types/osint';

export function detectDnsDrift(
  domain: string,
  dnsRecords: DnsRecord[],
  asnInfo: AsnInfo[]
): DnsDriftEvent[] {
  const events: DnsDriftEvent[] = [];
  const now = new Date().toISOString();

  // 1. Nameserver Drift
  const nsRecords = dnsRecords.filter(r => r.type === 'NS');
  if (nsRecords.length > 0) {
    const primaryNs = nsRecords[0].value.toLowerCase();
    let nsProvider = 'Custom / Enterprise Nameservers';
    if (primaryNs.includes('cloudflare')) nsProvider = 'Cloudflare Authoritative DNS';
    else if (primaryNs.includes('awsdns') || primaryNs.includes('route53')) nsProvider = 'AWS Route 53 DNS';
    else if (primaryNs.includes('googledomains') || primaryNs.includes('cloud-dns')) nsProvider = 'Google Cloud DNS';
    else if (primaryNs.includes('azure-dns')) nsProvider = 'Microsoft Azure DNS';
    else if (primaryNs.includes('ns1.com')) nsProvider = 'NS1 Dynamic Anycast DNS';
    else if (primaryNs.includes('digitalocean')) nsProvider = 'DigitalOcean DNS';

    events.push({
      id: `drift-ns-${domain}`,
      timestamp: now,
      category: 'Nameserver Shift',
      recordType: 'NS',
      newValue: nsRecords.map(r => r.value).join(', '),
      description: `Active DNS zone delegation observed on ${nsProvider} with ${nsRecords.length} authoritative nodes.`,
      evidenceId: `ev-dns-${domain}`,
      severity: 'medium'
    });
  }

  // 2. Mail Exchanger (MX) Routing Shifts
  const mxRecords = dnsRecords.filter(r => r.type === 'MX');
  if (mxRecords.length > 0) {
    const mxHosts = mxRecords.map(m => m.value.toLowerCase());
    let mailProvider = 'Self-Hosted / Private MTA';
    if (mxHosts.some(m => m.includes('google') || m.includes('aspmx'))) {
      mailProvider = 'Google Workspace (Gmail Enterprise)';
    } else if (mxHosts.some(m => m.includes('outlook') || m.includes('protection.outlook.com'))) {
      mailProvider = 'Microsoft 365 / Exchange Online';
    } else if (mxHosts.some(m => m.includes('mimecast'))) {
      mailProvider = 'Mimecast Secure Email Gateway';
    } else if (mxHosts.some(m => m.includes('protonmail') || m.includes('proton.me'))) {
      mailProvider = 'ProtonMail Encrypted Gateway';
    } else if (mxHosts.some(m => m.includes('mailgun'))) {
      mailProvider = 'Mailgun Transactional Mail';
    } else if (mxHosts.some(m => m.includes('sendgrid'))) {
      mailProvider = 'Twilio SendGrid Routing';
    }

    events.push({
      id: `drift-mx-${domain}`,
      timestamp: now,
      category: 'Mail Routing Shift',
      recordType: 'MX',
      newValue: mxRecords.map(r => r.value).join(', '),
      description: `Domain mail routing configured via ${mailProvider} (${mxRecords.length} MX gateway endpoints active).`,
      evidenceId: `ev-dns-${domain}`,
      severity: 'medium'
    });
  }

  // 3. Security Policy (SPF / DMARC / DKIM) Adoption
  const txtRecords = dnsRecords.filter(r => r.type === 'TXT');
  const spfRecord = txtRecords.find(t => t.value.includes('v=spf1'));
  if (spfRecord) {
    events.push({
      id: `drift-spf-${domain}`,
      timestamp: now,
      category: 'Security Policy Adoption',
      recordType: 'TXT',
      newValue: spfRecord.value,
      description: `Enforced Sender Policy Framework (SPF) email validation policy deployed: "${spfRecord.value}"`,
      evidenceId: `ev-dns-${domain}`,
      severity: 'low'
    });
  }

  // 4. IP Pool & Cloud ASN Migration
  if (asnInfo.length > 0) {
    const primaryAsn = asnInfo[0];
    events.push({
      id: `drift-asn-${domain}`,
      timestamp: now,
      category: 'IP Pool Migration',
      recordType: 'A',
      newValue: `${primaryAsn.asn} (${primaryAsn.org})`,
      description: `Target IP endpoints routed through ${primaryAsn.org} located in ${primaryAsn.country} (Anycast/BGP Prefix: ${primaryAsn.asn}).`,
      evidenceId: `ev-asn-routing-${domain}`,
      severity: 'high'
    });
  }

  return events;
}
