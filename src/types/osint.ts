export interface DnsRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME' | 'SOA';
  value: string;
  ttl?: number;
  priority?: number;
}

export interface Technology {
  id: string;
  name: string;
  category: 'CMS' | 'Web Server' | 'JavaScript Framework' | 'Analytics' | 'Security' | 'CDN/Hosting' | 'Database' | 'Other';
  confidence: number; // 0 to 100
  version?: string;
  icon?: string;
  evidence: string;
}

export interface WebSnapshot {
  id: string;
  timestamp: string; // ISO date
  archiveUrl: string;
  statusCode: number;
  contentLength: number;
  title: string;
  detectedTech: Technology[];
  dnsSummary?: string[];
}

export interface SubdomainRecord {
  subdomain: string;
  fullDomain: string;
  source: 'Certificate Transparency' | 'Wayback Archive' | 'DNS Heuristic';
  firstSeen?: string;
  status: 'active' | 'archived' | 'detected';
}

export interface WebsiteStoryMilestone {
  id: string;
  era: string; // e.g. "2018", "2021", "2024"
  timestamp: string;
  title: string;
  description: string;
  category: 'Framework Migration' | 'UI/UX Redesign' | 'Subdomain Expansion' | 'Security & CDN' | 'Status & Outage';
  impact: 'critical' | 'major' | 'moderate' | 'info';
  details?: string[];
}

export interface ExecutiveSummary {
  headline: string;
  narrative: string;
  firstRecordedDate: string;
  totalYearsActive: number;
  primaryFrameworkEvolution: string;
  subdomainsCount: number;
  majorRedesignsCount: number;
  securityRating: 'High' | 'Moderate' | 'Basic';
}

export interface ChangeEvent {
  id: string;
  timestamp: string;
  category: 'Tech Added' | 'Tech Removed' | 'DNS Change' | 'Header Change' | 'Status Change' | 'UI/UX Redesign';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'domain' | 'subdomain' | 'ip' | 'technology' | 'nameserver' | 'organization';
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface RelationshipData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface EvidenceItem {
  id: string;
  timestamp: string;
  source: string; // e.g. "Public DNS", "Wayback Machine Archive", "HTTP Response Headers", "Certificate Transparency"
  evidenceType: 'DNS' | 'HTTP Header' | 'HTML Scraping' | 'Historical Archive' | 'SSL Cert' | 'Subdomain Recon';
  rawData: string;
  notes?: string;
}

export interface Investigation {
  id: string;
  domain: string;
  targetUrl: string;
  createdAt: string;
  lastUpdated: string;
  status: 'pending' | 'completed' | 'failed';
  summary: ExecutiveSummary;
  milestones: WebsiteStoryMilestone[];
  subdomains: SubdomainRecord[];
  ipAddresses: string[];
  dnsRecords: DnsRecord[];
  technologies: Technology[];
  snapshots: WebSnapshot[];
  changes: ChangeEvent[];
  relationships: RelationshipData;
  evidence: EvidenceItem[];
}

