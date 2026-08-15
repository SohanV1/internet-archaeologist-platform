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

export interface ChangeEvent {
  id: string;
  timestamp: string;
  category: 'Tech Added' | 'Tech Removed' | 'DNS Change' | 'Header Change' | 'Status Change';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'domain' | 'ip' | 'technology' | 'nameserver' | 'organization';
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
  source: string; // e.g. "Public DNS", "Wayback Machine Archive", "HTTP Response Headers"
  evidenceType: 'DNS' | 'HTTP Header' | 'HTML Scraping' | 'Historical Archive' | 'SSL Cert';
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
  ipAddresses: string[];
  dnsRecords: DnsRecord[];
  technologies: Technology[];
  snapshots: WebSnapshot[];
  changes: ChangeEvent[];
  relationships: RelationshipData;
  evidence: EvidenceItem[];
}
