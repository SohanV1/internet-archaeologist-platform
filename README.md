# 🏛️ Internet Archaeologist Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Netlify Status](https://img.shields.io/badge/Hosted_on-Netlify-00C7B7?logo=netlify)](https://internet-archaeologist-platform.netlify.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SohanV1%2Finternet--archaeologist--platform-181717?logo=github)](https://github.com/SohanV1/internet-archaeologist-platform)

> **Passive Public OSINT Reconnaissance, Historical Web Time Machine, and Architectural Evolution Intelligence Engine.**

🔗 **Live Demo:** [https://internet-archaeologist-platform.netlify.app](https://internet-archaeologist-platform.netlify.app)  
📦 **GitHub Repository:** [https://github.com/SohanV1/internet-archaeologist-platform](https://github.com/SohanV1/internet-archaeologist-platform)

---

## 🌟 Key Capabilities & Features

### 1. 📖 Website Evolution Story & "What Happened?" Engine
- Synthesizes decades of public web crawl captures into an executive narrative.
- Identifies major framework migrations (e.g. *jQuery/WordPress ➔ React/Next.js*), security posture overhauls, and infrastructure modernization.
- Chronological milestone cards categorized by **Framework Migration**, **UI/UX Redesign**, **Subdomain Expansion**, and **Security & CDN**.

### 2. ⚖️ Before / After Historical Snapshot Comparison
- Interactive split diff comparator allowing side-by-side inspection between any two historical eras (e.g. *2018 vs 2024*).
- Automatic diffing of page titles, HTTP status transitions, payload size shifts ($+X\%$ / $-Y\%$), and tech stack additions/removals.
- Categorized technology migration cards:
  - 🟢 **Adopted Technologies**
  - 🔴 **Decommissioned Stack Components**
  - ⚪ **Retained Technologies Across Eras**

### 3. 🛡️ Cryptographic Evidence Chain & Provenance Audit
- Strict `Evidence ➔ Source ➔ Timestamp ➔ Verification Hash` audit trail.
- Authoritative source attribution tags (`Cloudflare DoH RFC 8484`, `crt.sh Certificate Transparency`, `Wayback CDX API`, `Active Probe`).
- Deterministic SHA-256 fingerprinting for forensic chain-of-custody verification.
- Confidence scoring meters (0–100%) and instant raw payload copying.
- Real-time search & type filtering across evidence records.

### 4. 🌐 Passive Subdomain Discovery & Infrastructure Recon
- Enumerates subdomains using public SSL/TLS Certificate Transparency logs and historical index queries without invasive active brute-forcing.
- Live search directory with 1-click clipboard copy and direct protocol links.

### 5. ⏳ Interactive Historical Web Archive Timeline
- Interactive horizontal node scrubber with era filters (*All Years, Decade selectors*).
- Snapshot detail cards with HTTP status codes, payload bytes, detected tech signatures, and direct Wayback archive links.
- One-click jump to the Before/After Comparison viewer.

### 6. 📜 SSL/TLS Certificate History & Transparency Ledger
- Queries public Certificate Transparency logs (`crt.sh`) for issuance history, root CAs (*Let's Encrypt, DigiCert, Sectigo, Cloudflare Inc ECC CA*), validity windows, and Subject Alternative Names (SANs).

### 7. 🌐 IP Routing & Autonomous System (ASN) Infrastructure Map
- Resolves Autonomous System Numbers (ASN), ISP / Hosting Organizations (*Cloudflare AS13335, AWS AS16509, Fastly, Google, Akamai*), and maps BGP network CIDR routing.

### 8. ⚔️ Target-vs-Target Multi-Domain Comparator
- Compares two distinct web entities side-by-side (e.g. `github.com` vs `gitlab.com`).
- Generates tech stack overlap matrices, exclusive stack components, subdomain attack surface deltas, and longevity comparisons.

### 9. 🌐 Authoritative DNS Zone Records
- Resolves DNS zone records (`A`, `AAAA`, `MX`, `TXT`, `NS`, `CNAME`, `SOA`) using DNS-over-HTTPS (DoH).

### 10. 🕸️ Entity Relationship Topology Graph
- Visualizes topological connections between root domains, discovered subdomains, resolved IP nodes, authoritative nameservers, and detected web technologies with live entity filtering and search.

### 11. 📄 Multi-Format Forensic Exporter
- **Standalone HTML / PDF Audit Report**: Print-optimized executive forensic report.
- **CSV Data Exporter**: 1-click export of DNS zone records, Subdomains, and Change events.

---

## 🏗️ Architecture & Reconnaissance Pipeline

```
                     ┌─────────────────────────────┐
                     │   User Target Domain Input  │
                     └──────────────┬──────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Cloudflare DoH DNS  │  │  crt.sh Transparency│  │ Wayback Machine CDX │
│  (RFC 8484 Queries) │  │  (Passive Subdomain)│  │ (Historical Crawls) │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │ Investigation Engine Core   │
                     │  - Heuristic Tech Profiler  │
                     │  - Evolution Diff Engine    │
                     │  - Provenance Hasher        │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Dynamic Multi-Tab Dashboard │
                     │  - Executive Story Hero     │
                     │  - Before/After Comparator  │
                     │  - Subdomain Directory      │
                     │  - Interactive Timeline     │
                     │  - Cryptographic Evidence   │
                     └─────────────────────────────┘
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node.js 20 & 22)
- npm or yarn

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/SohanV1/internet-archaeologist-platform.git
cd internet-archaeologist-platform

# 2. Install dependencies
npm install

# 3. Start development server with Turbopack
npm run dev

# 4. Open in browser
http://localhost:3000
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Run production server
npm start
```

---

## 📡 API Reference

### `POST /api/investigate`
Performs an automated passive reconnaissance and historical archive analysis for a domain.

**Request Body:**
```json
{
  "domain": "example.com"
}
```

**Response Payload Structure:**
```json
{
  "id": "inv-1725114800-abcde",
  "domain": "example.com",
  "targetUrl": "https://example.com",
  "createdAt": "2026-08-31T14:30:00.000Z",
  "status": "completed",
  "summary": {
    "headline": "Modern Cloud & Edge Infrastructure",
    "narrative": "...",
    "firstRecordedDate": "2001-10-26",
    "totalYearsActive": 25,
    "primaryFrameworkEvolution": "Static HTML -> Next.js / Edge",
    "securityRating": "High"
  },
  "milestones": [...],
  "subdomains": [...],
  "technologies": [...],
  "snapshots": [...],
  "changes": [...],
  "relationships": { "nodes": [...], "edges": [...] },
  "evidence": [...]
}
```

---

## 🔒 Security & Privacy Notice
The **Internet Archaeologist Platform** conducts strictly **passive open-source intelligence (OSINT)** gathering using publicly available records (DNS-over-HTTPS, public Certificate Transparency registers, and the Internet Archive). It does not perform invasive port scanning, exploitation, or intrusive crawling.

---

## 📄 License
MIT License. Created by [Sohan V](https://github.com/SohanV1).