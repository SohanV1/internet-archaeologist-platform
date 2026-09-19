# 🏛️ Internet Archaeologist Platform (v1.5)

[![CI Pipeline](https://github.com/SohanV1/internet-archaeologist-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/SohanV1/internet-archaeologist-platform/actions/workflows/ci.yml)
[![Tests](https://github.com/SohanV1/internet-archaeologist-platform/actions/workflows/test.yml/badge.svg)](https://github.com/SohanV1/internet-archaeologist-platform/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/badge/Coverage-%3E85%25-brightgreen)](https://github.com/SohanV1/internet-archaeologist-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Netlify Status](https://img.shields.io/badge/Hosted_on-Netlify-00C7B7?logo=netlify)](https://internet-archaeologist-platform.netlify.app)

Internet Archaeologist Platform v1.5 is a passive OSINT reconnaissance engine that performs forensic analysis of domain histories, tech stack migrations, and infrastructure evolution using public records (DNS-over-HTTPS, Certificate Transparency, Wayback Machine). It generates investigative reports, relationship topology graphs, and historical timelines.

🔗 **Live Deployment:** [https://internet-archaeologist-platform.netlify.app](https://internet-archaeologist-platform.netlify.app)  
📦 **GitHub Repository:** [https://github.com/SohanV1/internet-archaeologist-platform](https://github.com/SohanV1/internet-archaeologist-platform)

---

## 🌟 Key Features & Capabilities

### 📊 1. Codebase Intelligence & Analytics Dashboard (New in v1.5)
- **Language Composition Doughnut Chart**: Visualizes frontend/backend/styling breakdowns across TypeScript, JavaScript, CSS, HTML, and JSON.
- **Top Files LOC Bar Chart**: Identifies heavyweight modules and high-complexity files.
- **D3.js Hierarchical Treemap**: Interactive, proportional nested rectangles showing directory structures and module sizes.
- **Radial Runtime Breakdown**: Execution budget visualizer breaking down client rendering, worker parsing, hydration, and network overhead.
- **Animated Counter Statistics**: Live animated counters for lines of code, discovered files, total tests, and code modules.
- **LOC Growth & Language Mix**: Commit-by-commit LOC trend lines and stacked area language mix progression.
- **High-Res Export**: 1-click PNG (raster) and SVG (vector) chart exporting for investigative deliverables.

### 🚀 2. Historical Tech Stack Evolution Matrix
- **Chronological Era Breakdown**: Categorizes stack evolution across four eras (*Genesis 1998–2006*, *Web 2.0 2007–2014*, *Cloud/SPA 2015–2020*, *Modern Jamstack 2021–Present*).
- **Stack Migration River**: Traces dynamic transitions between client-side frameworks, styling architectures, and cloud host providers.
- **Lifecycle Status Directory**: Real-time tags (`✨ Introduced`, `🟢 Active Stack`, `🔴 Sunset / Replaced`) with forensic evidence hashes.

### 🖼️ 3. Visual Archeology & Interface Slider Diff
- **Interactive Split-Screen Swipe Slider**: Compare historical webpage captures side-by-side across decades.
- **Authentic Layout Wireframe Mockups**: Recreates vintage table-based HTML4 grids, Web 2.0 skeuomorphic glossy gradients, flat responsive patterns, and dark glassmorphic UI.
- **Retro Browser Frames**: Historical viewports rendered inside authentic Windows 98, Windows 7, and modern desktop browser chrome.

### 📡 4. Historical DNS Infrastructure & Mail Drift Tracker
- **Drift Event Ledger**: Pinpoints nameserver handoffs, MX mail routing switches (e.g., *Self-Hosted Postfix ➔ Google Workspace / M365*), and SPF/DMARC policy rollouts.
- **Severity Classification**: Clear severity grading (Critical, High, Medium, Low) with copyable zone records.

### 🛡️ 5. Cryptographic Evidence Chain of Custody
- **Hardware/Web-Native SHA-256**: Cryptographically digests raw payloads using `crypto.subtle.digest('SHA-256')` with Node.js fallback.
- **Authoritative Provenance**: Transparent source tags (`Cloudflare DoH RFC 8484`, `crt.sh Transparency`, `Wayback Machine CDX API`).
- **Audit Verification Modal**: Inspect exact raw JSON payloads, timestamps, confidence scores, and hash fingerprints.

### 🕸️ 6. Entity Relationship Topology Graph
- Visualizes topological connections between domains, subdomains, IP addresses, nameservers, autonomous systems (ASNs), and detected technologies.
- Interactive physics simulation with entity filtering, node expansion, and search.

### ⚡ 7. Modern UI & Developer Experience
- **Collapsible Sidebar (`TabBar`)**: Full text labels and clean icon-only compact mode (`lg:w-64` ⇄ `lg:w-18`) with badge counts and category groupings.
- **Dark / Light Theme Toggle**: System-synced theme toggle with CSS variable-driven styling.
- **Global Search (`⌘K` / `Ctrl+K`)**: Instant debounced multi-category quick-jump across DNS records, subdomains, evidence items, and archive snapshots.
- **Resilient Async Layer**: Configurable exponential backoff retries (`fetchWithRetry`), React Error Boundaries, and skeleton loading states.

---

## 🏗️ Reconnaissance Architecture

```
                     ┌─────────────────────────────┐
                     │   User Target Domain Input  │
                     └──────────────┬──────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
 ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
 │ Cloudflare DoH DNS  │ │  crt.sh Transparency│ │ Wayback Machine CDX │
 │  (RFC 8484 Queries) │ │  (Passive Subdomain)│ │ (Historical Crawls) │
 └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │ Investigation Engine Core   │
                     │  - Native SHA-256 Digest    │
                     │  - Exponential Backoff Fetch│
                     │  - Heuristic Tech Profiler  │
                     │  - DNS Drift & Timeline Map │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Dynamic Multi-Tab Dashboard │
                     │  - Codebase Intelligence    │
                     │  - Tech Drift Matrix        │
                     │  - Visual Diff Slider       │
                     │  - DNS Drift Ledger         │
                     │  - Topology Graph           │
                     │  - Cryptographic Evidence   │
                     └─────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher (tested on Node.js 20.x & 22.x)
- **npm**: `v9.x` or higher

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/SohanV1/internet-archaeologist-platform.git
cd internet-archaeologist-platform

# 2. Install dependencies
npm install

# 3. Start local development server with Turbopack
npm run dev

# 4. Open application
open http://localhost:3000
```

---

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server with Turbopack |
| `npm run build` | Compiles the production build |
| `npm run start` | Starts the production server |
| `npm run typecheck` | Validates TypeScript types across the codebase |
| `npm run lint` | Runs ESLint analysis for code quality |
| `npm run format` | Checks code formatting with Prettier |
| `npm run format:fix` | Automatically formats codebase with Prettier |
| `npm test` | Runs Jest unit test suites |
| `npm run test:coverage` | Runs Jest with Istanbul coverage (enforces ≥80% threshold) |

---

## 🧪 Testing & Quality Assurance

The codebase maintains strict quality thresholds with automated unit tests covering cryptographic hashing, resilient fetch operations, snapshot generation, and React UI error resilience:

```bash
# Run unit tests with code coverage
npm run test:coverage
```

### Coverage Guarantee
CI workflows enforce a strict **80% minimum coverage requirement** on statements, branches, functions, and lines:
- `Statements`: ≥ 80%
- `Branches`: ≥ 80%
- `Functions`: ≥ 80%
- `Lines`: ≥ 80%

---

## 🔄 CI / CD Workflows

- **Continuous Integration (`.github/workflows/ci.yml`)**:
  - Triggers on push and PR to `main` and `master`.
  - Runs clean install, typecheck, linting, unit tests with coverage verification, and production build.
  - Automatically deploys to Netlify on `main` branch pushes.
- **Dedicated Test Runner (`.github/workflows/test.yml`)**:
  - Fast feedback loop triggered on any change to `src/**`.

---

## 🔒 Security & Passive Reconnaissance Guarantee

The **Internet Archaeologist Platform** conducts strictly **passive open-source intelligence (OSINT)**. It queries only publicly indexed records:
- Public DNS-over-HTTPS (Cloudflare / RFC 8484)
- Public Certificate Transparency logs (crt.sh)
- The Internet Archive Wayback Machine CDX API
- Autonomous System data (BGP public lookups)

It **never** executes intrusive port scans, vulnerability probes, or brute-force requests against target infrastructure.

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome! Please read our [CONTRIBUTING.md](file:///home/sohan/shared/osint_tool/CONTRIBUTING.md) before submitting a pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](file:///home/sohan/shared/osint_tool/LICENSE) file for details.

Developed with 🏛️ by [Sohan V](https://github.com/SohanV1).
