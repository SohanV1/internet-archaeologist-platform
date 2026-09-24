# Changelog

All notable changes to the **Internet Archaeologist Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-09-24

### Added
* **Parallel Multi-Agent Orchestration & Swarm Architecture**:
  * Supervisory orchestrator engine (`orchestrator`) coordinating 8 concurrent specialized defensive agents:
    * `passive-recon`: Authoritative DNS-over-HTTPS (RFC 8484), Certificate Transparency (crt.sh), ASN, and BGP prefix routing.
    * `tech-hosting`: Server response headers, framework detection, CDN edge proxy, and cloud host fingerprinting.
    * `snapshot-history`: Internet Archive CDX indexing, temporal tech stack evolution, and visual wireframe reconstruction.
    * `contact-discovery`: Role-categorized, privacy-masked security and administrative contact discovery.
    * `website-health`: Live reachability, HTTP latency, broken link detection, redirect hops, and login form hygiene.
    * `safe-vulnerability`: Strictly non-destructive security assessment with CVSS scoring and OWASP/NIST enrichment.
    * `source-enrichment`: RDAP registration lookups, business email provider detection, and SPF/DMARC/DKIM verification.
    * `reporting`: Forensic evidence graph synthesis, cryptographic SHA-256 chain of custody, and executive reporting.
  * Real-time Agent Progress HUD (`AgentProgressTracker.tsx`) rendering live status pills (`idle`, `running`, `completed`, `failed`), progress percentage bars, active action descriptions, and dynamic findings counters.

* **Real-Time Zero-Buffer SSE Streaming Architecture**:
  * Server-Sent Events (SSE) streaming protocol supporting low-latency push updates via typed `AgentStreamEvent` payloads.
  * Configured zero-buffering headers (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`, `Transfer-Encoding: chunked`) guaranteeing instantaneous dispatch of agent telemetry, incremental findings, and audit transitions.
  * Resilient client-side streaming receiver preventing blocking and maintaining smooth 60fps UI responsiveness during intensive multi-agent scans.

* **RDAP & Modern WHOIS Registration Intelligence**:
  * Modern Registration Data Access Protocol (RDAP, RFC 7480–7484) integration over HTTPS replacing legacy port-43 WHOIS queries.
  * Extracts registrar name, lifecycle dates (domain creation, last update, registry expiration countdown), registrant organization, and country.
  * Identifies WHOIS privacy proxies and redaction services (`privacyProtected: boolean`).
  * Authoritative abuse contact extraction yielding certified abuse reporting emails and telephone numbers for incident escalation.

* **Enterprise Business Email Provider & Security Posture Detection**:
  * Automated MX zone analysis and signature recognition detecting enterprise mail ecosystems: **Google Workspace**, **Microsoft 365**, **Zoho Mail**, **ProtonMail**, **iCloud Mail**, **Fastmail**, and custom self-hosted MTAs.
  * Deep SPF policy parser evaluating directive enforcement: Strict (`-all`), SoftFail (`~all`), Neutral (`?all`), Permissive (`+all`), or Missing.
  * DMARC record evaluation (`v=DMARC1`) inspecting alignment policy (`reject`, `quarantine`, `none`, `missing`) and reporting mailboxes (`rua`/`ruf`).
  * DKIM selector discovery and comprehensive mail security posture score calculation (0–100 scale).

* **Role-Categorized Privacy-Masked Contact Discovery**:
  * Multi-source contact mining from RFC 9116 security policies (`/.well-known/security.txt`), authoritative RDAP records, public website contact pages, and HTML meta attributes.
  * Categorizes discovered contacts into 5 distinct operational roles: *Security / CERT*, *Abuse / Legal*, *Technical / Webmaster*, *Support / Sales*, and *General*.
  * Automatic privacy masking on all discovered email addresses (e.g. `sec***@example.com`) and telephone numbers to prevent inadvertent PII exposure or scraper harvesting.

* **Website Health & Login Form Hygiene Analysis**:
  * Synthetic health monitor evaluating target availability, HTTP status codes, round-trip response latency, and multi-hop redirect chains (`RedirectHop`).
  * Broken link audit identifying unreachable anchor targets and anomalous response codes.
  * Mixed-content detection identifying insecure `http://` scripts, stylesheets, and images embedded inside HTTPS pages.
  * Deep login form hygiene inspection: validates HTTPS form submission endpoints, CSRF protection tokens, password field configuration, browser autocomplete flags, and cleartext credential transmission risks.

* **Non-Destructive Safe Vulnerability Assessment with OWASP / NIST Enrichment**:
  * 100% non-intrusive defensive vulnerability audit guaranteeing zero exploit payloads, zero brute-force authentication, zero fake form submissions, and zero denial-of-service risks.
  * Standardized CVSS v3.1 scoring across 6 defensive categories: *Access Control*, *Cryptographic Hygiene*, *Injection Defense*, *Security Misconfiguration*, *Transport Security*, and *Email Authentication*.
  * Rich reference enrichment mapping every finding directly to **OWASP Top 10**, **NIST SP 800-115 / SP 800-53**, **CISA** advisories, and relevant IETF **RFCs**.
  * Structured finding schemas with status flags (`CONFIRMED`, `INFORMATIONAL`, `FALSE_POSITIVE_CLEARED`), affected asset locators, reproducible evidence snippets, likely impact analysis, and actionable remediation steps.

* **Target Authorization Gate & Cryptographic Audit Trail**:
  * Pre-flight authorization gate modal (`TargetAuthorizationModal.tsx`) requiring operator identification, organization name, and selection of assessment scope (`passive_only` vs `authorized_defensive`).
  * Dual-attestation requirement verifying domain ownership or explicit written authorization, combined with a binding pledge to conduct strictly non-destructive testing.
  * Cryptographic audit signature generation using Web Crypto API (`crypto.subtle.digest('SHA-256')`) hashing operator metadata, target domain, scope, and timestamp.
  * Tamper-evident audit log ledger capturing lifecycle events: `SCAN_INITIATED`, `AUTH_GRANTED`, `AGENT_STARTED`, `AGENT_COMPLETED`, and `REPORT_EXPORTED`.

* **Historical Scan-to-Scan Diffing Engine**:
  * Automated comparative differential engine comparing current investigation results against historical baseline scans (`HistoricalScanDiff`).
  * Detects surface drift: newly discovered subdomains (`newSubdomains`), decommissioned subdomains (`removedSubdomains`), resolved vulnerabilities (`resolvedVulnerabilities`), and new security findings (`newVulnerabilities`).
  * Computes net security posture delta score (`netScoreDelta`) and outputs an automated executive narrative tracking security remediation progress over time.

### Security
* Enforced strict domain format sanitization and RFC-compliant hostname validation mitigating Server-Side Request Forgery (SSRF) and private IPv4/IPv6 loopback probing.
* Upgraded all cryptographic checksums to Web Crypto API SHA-256 digests with Node.js `crypto` fallback.
* Guaranteed strictly non-destructive probe semantics across all defensive scanning modules.

---

## [1.5.0] - 2026-09-19

### Added
* **Codebase Analytics & Telemetry Dashboard (`AnalyticsDashboard.tsx`)**:
  * Language and file extension breakdown doughnut chart (Markdown: 40.8%, TSX: 21.7%, JSON: 14.6%, JS: 11.8%, HTML: 7.1%, TS: 5.0%, CSS: 1.8%, Python: 0.4%, Other: 2.3%).
  * Lines-of-code per project comparison bar chart (website: 206K, antigravity-skills: 145K, osint_tool: 28K, scroll-world: 2K, vehicle-osint: 0.4K).
  * Interactive D3.js nested hierarchical Treemap layout displaying directory and module proportions.
  * Language runtime classification pie chart (TS/TSX: 26.7%, JS/JSX: 11.8%, Python: 0.4%, Markdown: 40.8% non-executable).
  * Git commit history LOC velocity line chart tracking net lines added per release.
  * Stacked area chart illustrating language mix evolution across major milestones.
  * PNG and SVG chart export functionality via `html2canvas` and SVG vector serialization.
* **Codebase Intelligence in Domain Dossier (`DomainOverview.tsx`)**:
  * Animated language percentage progress bars.
  * File count by extension horizontal bar chart.
  * Animated total LOC counter transition.
  * Runtime classification banner: Executable (46%) | Documentation (41%) | Config (14%).
* **Navigation & UX Overhaul**:
  * Redesigned `TabBar` from top pill navigation into a modern, collapsible sidebar with smooth CSS transitions, category groups, and responsive mobile drawer.
  * Dynamic Dark/Light theme toggle in `Navbar` with CSS variable theming and local storage persistence.
  * Global Search Bar modal (`⌘K` / `Ctrl+K`) with debounced multi-tab querying across DNS records, subdomains, certs, tech stack, milestones, and evidence ledger.
  * Perceived performance optimizations: lazy-loaded tab components via `next/dynamic` with shimmer `SkeletonLoader` views.
  * Component-level `ErrorBoundary` wrappers ensuring modular resilience against async rendering exceptions.
* **Forensic Cryptography & Reliability**:
  * Upgraded forensic audit hashing in `investigationEngine.ts` to standard Web Crypto API (`crypto.subtle.digest('SHA-256')`).
  * Exponential backoff, timeout, and retry handler (`fetchWithRetry.ts`) across all passive network probes.
  * Comprehensive TypeScript interfaces for all API payloads and response schemas (`src/types/api.ts`).
  * Unit test suite using Jest and React Testing Library with 80%+ code coverage threshold enforcement.
* **CI/CD Automation**:
  * Multi-stage GitHub Actions CI workflow (`.github/workflows/ci.yml`) enforcing typechecking, ESLint, test coverage >=80%, production build, and Netlify deployment.
  * Dedicated test workflow (`.github/workflows/test.yml`) running on pushes touching `src/**`.
  * Standardized `CONTRIBUTING.md`, `LICENSE` (MIT), and `CHANGELOG.md`.

### Fixed
* **Snapshot Key Collision**: Fixed critical snapshot ID collision bug in `history.ts` where identical indexes (`i=0`) or shared timestamps resulted in duplicate React keys. Replaced with collision-free, cryptographically randomized domain-timestamp ID generator.
* **Next.js Turbopack Client Bundling**: Isolated server-side `fs` filesystem scanning to `/api/analytics` route, providing client-safe default data structures in `codebaseData.ts`.

---

## [1.4.0] - 2026-09-01
### Added
* Historical Tech Evolution Matrix with categorized status pills (Retained, Upgraded, Deprecated).
* Visual Archeology wireframe slider reconstructing temporal website interfaces.
* DNS Drift Tracker detecting nameserver and IP infrastructure migrations.

---

## [1.2.0] - 2026-08-31
### Added
* Forensic Evidence Ledger with bidirectional traceability, confidence scoring, and cryptographic hashes.
* Certificate Transparency log querying (`crt.sh`) for SSL/TLS provenance.
* Autonomous System Number (ASN) and BGP prefix routing intelligence.
* Target vs Target comparative domain differential analyzer (`DomainVsDomain.tsx`).

---

## [1.0.0] - 2026-08-16
### Added
* Initial release of Internet Archaeologist Platform with passive DNS-over-HTTPS (RFC 8484) resolution and Wayback Machine CDX timeline indexing.
