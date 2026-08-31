export type EvidenceType = 
  | 'Historical Archive'
  | 'DNS'
  | 'HTTP Header'
  | 'Subdomain Recon'
  | 'Technology Detection'
  | 'Certificate Transparency'
  | 'Screenshot'
  | 'Other';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type ObservationNature = 'OBSERVED' | 'INFERRED' | 'HISTORICAL' | 'UNKNOWN';

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME' | 'SOA';
  value: string;
  ttl?: number;
  priority?: number;
  evidenceId?: string;
}

export interface Technology {
  id: string;
  name: string;
  category: 'CMS' | 'Web Server' | 'JavaScript Framework' | 'Analytics' | 'Security' | 'CDN/Hosting' | 'Database' | 'Other';
  confidence: number; // 0 to 100
  confidenceLevel?: ConfidenceLevel;
  version?: string;
  icon?: string;
  evidence: string;
  evidenceId?: string;
  observationNature?: ObservationNature;
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
  evidenceId?: string;
}

export interface SubdomainRecord {
  subdomain: string;
  fullDomain: string;
  source: 'Certificate Transparency' | 'Wayback Archive' | 'DNS Heuristic';
  firstSeen?: string;
  status: 'active' | 'archived' | 'detected';
  evidenceId?: string;
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
  evidenceId?: string;
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
  evidenceId?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'domain' | 'subdomain' | 'ip' | 'technology' | 'nameserver' | 'organization';
  evidenceId?: string;
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
  source: string; // e.g. "Cloudflare DoH RFC 8484", "crt.sh Certificate Transparency", "HTTP Headers (https://example.com)"
  evidenceType: EvidenceType;
  rawData: string;
  notes?: string;
  confidence: ConfidenceLevel;
  confidenceScore?: number; // 0 to 100% when available
  collectionMethod: string; // How it was collected
  relatedEntity?: string; // Entity or feature name e.g. "React", "api.github.com", "example.com"
  relatedObservation?: string; // Finding summary: What was observed
  sourceUrl?: string; // Verifiable URL/endpoint where artifact was queried (undefined if unavailable)
  observationNature: ObservationNature; // OBSERVED vs INFERRED vs HISTORICAL vs UNKNOWN
  verificationHash?: string; // Cryptographic SHA-256 fingerprint for forensic provenance
}

export interface SnapshotComparison {
  baseSnapshot: WebSnapshot;
  targetSnapshot: WebSnapshot;
  yearsApart: number;
  sizeDiffBytes: number;
  sizeDiffPercent: number;
  sizeDirection: 'increased' | 'decreased' | 'unchanged';
  statusChanged: boolean;
  addedTech: Technology[];
  removedTech: Technology[];
  retainedTech: Technology[];
  titleChanged: boolean;
  evolutionSummary: string;
}

export interface CertificateRecord {
  id: string;
  issuer: string;
  commonName: string;
  notBefore: string;
  notAfter: string;
  status: 'active' | 'expired';
  serialNumber?: string;
  sans: string[];
  evidenceId?: string;
}

export interface AsnInfo {
  ip: string;
  asn: string;
  org: string;
  country: string;
  isp?: string;
  cidr?: string;
  evidenceId?: string;
}

export interface DomainComparisonResult {
  domainA: string;
  domainB: string;
  yearsA: number;
  yearsB: number;
  sharedTech: Technology[];
  exclusiveTechA: Technology[];
  exclusiveTechB: Technology[];
  subdomainsCountA: number;
  subdomainsCountB: number;
  securityRatingA: string;
  securityRatingB: string;
  summaryNarrative: string;
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
  certificates?: CertificateRecord[];
  asnInfo?: AsnInfo[];
}

