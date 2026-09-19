# Changelog

All notable changes to the **Internet Archaeologist Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
