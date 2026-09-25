# Project: Internet Archaeologist Platform v2.1

## Architecture
- Next.js 16.3.6 (Turbopack compiler), React 19.2.8, TypeScript 5.9.3, Jest 30.5.2 with @swc/jest.
- Core architecture: Non-intrusive, strictly passive OSINT intelligence platform with DAG-orchestrated worker agents (`CentralOrchestrator`), real-time Server-Sent Events (SSE) streaming (`/api/investigate/stream`), SSRF protection (`isSafeUrlForFetch`), cryptographic SHA-256 evidence provenance hashing (`calculateSha256`), and privacy masking.
- Data Flow:
  1. Phase 1: `passiveReconAgent` (DNS, RDAP/WHOIS, Certificate Transparency via crt.sh).
  2. Phase 2: `techHostingAgent`, `contactDiscoveryAgent`, `websiteHealthAgent` executed concurrently via Promise.all.
  3. Phase 3: `snapshotHistoryAgent`, `safeVulnerabilityAgent`.
  4. Phase 4: `sourceEnrichmentAgent`.
  5. Phase 5: `reportingAgent` synthesizes final `Investigation` object.
  6. UI: `src/app/page.tsx` coordinates `DomainIntelligenceView`, `WebsiteHealthCard`, `EvidenceTimeline`, etc.

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | RDAP vCard 4.0 Name Extraction | Extract registrant name (`fn`) from `vcardArray` or entity handle fallback | M1 | Survey Spec Miner / R1 |
| 2 | RDAP Organization & Country Resolution | Extract registrant org and country code/name, handling parameter `p[1].cc` and array `p[3][6]` | M1 | Survey Spec Miner / R1 |
| 3 | RDAP Thin-to-Thick Registrar Link Traversal | Query authoritative registrar RDAP via `rel: "related"` link when registry RDAP is thin | M1 | Survey Spec Miner / R1 |
| 4 | RDAP Privacy Redaction Detection | Flag privacy proxies, WhoisGuard, Domains by Proxy, and GDPR redaction tokens | M1 | Survey Spec Miner / R1 |
| 5 | Source Enrichment RDAP Standards | Enrich `sharedState.whoisRdap` with RFC 9083/7095/6350 citations in `sourceEnrichmentAgent` | M1 | Survey Spec Miner / R1 |
| 6 | DomainIntelligenceView Owner Card UI | Render Registrant Name, Org, Country, and Privacy Status badge in RDAP card | M1 | Survey Spec Miner / R1 |
| 7 | Multi-Path HTML Contact Scraping | Fetch and inspect `/contact`, `/about`, `/team`, `/privacy`, `/imprint` plus footers | M2 | Survey Spec Miner / R2 |
| 8 | mailto Link & Visible Text Email Extraction | Extract emails from `mailto:` links and visible body text with noise filtering | M2 | Survey Spec Miner / R2 |
| 9 | 7-Role Email Categorization | Categorize emails into `security`, `admin`, `sales`, `support`, `legal`, `executive`, `general` | M2 | Survey Spec Miner / R2 |
| 10 | DomainIntelligenceView Role Badges UI | Render color-coded role badges for all 7 categories in public contact directory | M2 | Survey Spec Miner / R2 |
| 11 | Login Form Detection & Input Mapping | Detect login forms, map username/email and password inputs, preserve hidden CSRF tokens | M3 | Survey Explorer 2 / R3 |
| 12 | Single Dummy Credential Probe | Submit exactly 1 probe with `test@invalid.tld` / `invalidpassword123` (no brute-force) | M3 | Survey Explorer 2 / R3 |
| 13 | Login Error Text & Timing Capture | Measure latency, HTTP status code, extract error text, evaluate username enumeration risk | M3 | Survey Explorer 2 / R3 |
| 14 | WebsiteHealthCard Login Error Analysis UI | Render action URL, dummy probe badge, HTTP status, latency, error text, and enumeration badge | M3 | Survey Explorer 2 / R3 |
| 15 | 1-Hop Same-Domain Page Crawl | Crawl up to 20 same-domain HTML pages starting from landing page | M4 | Survey Explorer 2 / R4 |
| 16 | Broken Link Detection with Anchor & Source | Discover broken links (>=400) capturing URL, HTTP status, anchor text, and source page | M4 | Survey Explorer 2 / R4 |
| 17 | Form Endpoint Discovery | Discover all form action endpoints across crawled pages, reporting method, HTTPS, accessibility | M4 | Survey Explorer 2 / R4 |
| 18 | WebsiteHealthCard Broken Links & Form Endpoints UI | Render source page for broken links and display discovered form endpoints card | M4 | Survey Explorer 2 / R4 |
| 19 | Requirement-Driven Opaque-Box E2E Test Suite | Build test infra and 4-tier test cases verifying R1-R4 independently | E2E-Track | Dual Track Requirement |
| 20 | Header Version Badge Update | Update header version badge in `src/app/page.tsx` from "v1.5" to "v2.1" | M5 | Follow-up Request |
| 21 | Version Synchronization to 2.1.0 | Bump package.json, types, reportingAgent, centralOrchestrator, and test assertions to 2.1.0 | M5 | Survey Explorer 3 / R5 |
| 22 | CHANGELOG.md v2.1.0 Section | Update CHANGELOG.md following Keep a Changelog standard with v2.1.0 entries | M5 | Survey Explorer 3 / R5 |
| 23 | Git Cleanliness, Commit & Push to main | Exclude .agents/ metadata, commit v2.1 codebase to main, and push to GitHub origin/main | M5 | Survey Explorer 3 / R5 |
| 24 | Netlify Production Live Deployment Verification | Verify Netlify automated build succeeds and site returns HTTP 200 on live URL | M5 | Survey Explorer 3 / R5 |
| 25 | Autonomous Discord Webhook Notification | Execute `cmd.exe /c "type <payload> | node .../discord-notify.js --stdin"` with full details | M5 | Survey Explorer 3 / R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Domain Owner Identity Resolution (R1) | Features 1-6: RDAP vcardArray parsing (`fn`, `org`, `adr`), thin-to-thick traversal, privacy redaction, source enrichment, DomainIntelligenceView UI | none | DONE |
| M2 | Deep Email Discovery & Role Categorization (R2) | Features 7-10: Multi-path scraping (`/contact`, `/about`, etc.), `mailto:` & regex extraction, 7-role categorization, DomainIntelligenceView UI badges | none | DONE |
| M3 | Login Form Probe with Error Capture (R3) | Features 11-14: Login form detection, single dummy credential probe (`test@invalid.tld` / `invalidpassword123`), error text & latency capture, enumeration analysis, WebsiteHealthCard UI | none | PLANNED |
| M4 | Broken Link & Form Endpoint Discovery (R4) | Features 15-18: 1-hop crawl (max 20 pages), broken link detection with anchor & sourcePage, form endpoint discovery, WebsiteHealthCard UI | none | PLANNED |
| E2E | E2E Testing Track | Feature 19: Opaque-box test suite across Tiers 1-4, test runner, publishes TEST_READY.md | none | DONE |
| M5 | Final Verification, Release, Deployment & Notification (R5) | Features 20-25: 100% E2E test pass, Tier 5 adversarial hardening, header badge v2.1, package.json 2.1.0, CHANGELOG.md, git push, Netlify HTTP 200, Discord webhook | M1, M2, M3, M4, E2E | PLANNED |

## Interface Contracts

### M1 Contract: RDAP Owner Identity
In `src/types/osint.ts`:
```typescript
export interface WhoisRdapRecord {
  domain: string;
  registrar?: string;
  registryExpiry?: string;
  createdDate?: string;
  updatedDate?: string;
  registrantName?: string; // v2.1 Formatted Name (fn) or handle fallback
  organization?: string;   // v2.1 Organization name
  country?: string;        // v2.1 2-letter ISO code or full country name
  abuseContactEmail?: string;
  abuseContactPhone?: string;
  privacyProtected: boolean;
  privacyNotice?: string;  // v2.1 Redaction notice (e.g., "Redacted for Privacy by Gandi")
  rawRdapUrl?: string;
  evidenceId?: string;
}
```

### M2 Contract: Email Discovery & Role Categorization
In `src/types/osint.ts` & `src/lib/agents/contactDiscoveryAgent.ts`:
```typescript
export type CanonicalContactRole =
  | 'security'
  | 'admin'
  | 'sales'
  | 'support'
  | 'legal'
  | 'executive'
  | 'general';

export interface DiscoveredContact {
  type: 'email' | 'phone' | 'url';
  value: string;
  source: string;
  role: string; // Supports CanonicalContactRole and backward-compatible strings
  confidence: number;
}
```

### M3 & M4 Contract: Website Health & Probing
In `src/types/osint.ts`:
```typescript
export type LoginErrorPattern =
  | 'generic_error'
  | 'username_enumeration_risk'
  | 'rate_limited'
  | 'redirected'
  | 'indeterminate';

export interface LoginProbeResult {
  formAction: string;
  httpMethod: string;
  dummyCredentialUsed: string; // e.g. "test@invalid.tld"
  httpStatus: number;
  responseTimeMs: number;
  extractedErrorText?: string;
  errorPattern: LoginErrorPattern;
  enumerationRiskDetected: boolean;
  notes: string;
}

export interface FormEndpoint {
  actionUrl: string;
  httpMethod: string;
  isHttps: boolean;
  isPubliclyAccessible: boolean;
  sourcePage: string;
  statusCode?: number;
}

export interface WebsiteHealthReport {
  // ... existing fields ...
  loginProbeResults?: LoginProbeResult[];
  crawledPagesCount?: number;
  formEndpoints?: FormEndpoint[];
}
```

## Code Layout
- `src/types/osint.ts`: OSINT models and contracts.
- `src/lib/agents/passiveReconAgent.ts`: M1 (RDAP vcardArray parsing).
- `src/lib/agents/sourceEnrichmentAgent.ts`: M1 (RDAP standards enrichment).
- `src/components/DomainIntelligenceView.tsx`: M1 & M2 UI (Owner details & role badges).
- `src/lib/agents/contactDiscoveryAgent.ts`: M2 (Multi-path HTML email scraping & role categorization).
- `src/lib/agents/websiteHealthAgent.ts`: M3 & M4 (Login form probing, 1-hop crawling, broken links & form endpoints).
- `src/components/WebsiteHealthCard.tsx`: M3 & M4 UI (Login error analysis, source pages, form endpoints).
- `src/app/page.tsx`: M5 UI header version badge ("v2.1").
- `package.json`, `CHANGELOG.md`: M5 release metadata.
- `src/__tests__/`: Unit and integration test suites.
- `tests/e2e/` (or `src/__tests__/e2e/`): Requirement-driven E2E test suite.
