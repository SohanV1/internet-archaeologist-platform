# 📜 Ethical OSINT & Legal Compliance Charter

> **Notice**: The Internet Archaeologist Platform is engineered exclusively for lawful, defensive reconnaissance, security posture evaluation, and academic research.

---

## 1. Purely Passive Forensics Boundary

The Internet Archaeologist Platform operates exclusively within strictly passive reconnaissance boundaries:

* **RFC 8484 (DNS-over-HTTPS)**: Queries authoritative nameserver records via Cloudflare DoH (`https://cloudflare-dns.com/dns-query`). Traffic is indistinguishable from standard secure web navigation and does not perform intrusive DNS zone transfers or AXFR attacks.
* **RFC 6962 (Certificate Transparency)**: Ingests cryptographic CT audit logs (`crt.sh` / public CT monitors) to map historical and existing subdomains from public certificate issuances without sending packets to the target origin.
* **Wayback Machine CDX API**: Evaluates historical internet snapshots from the Internet Archive's public CDX indices to reconstruct architectural shifts over decades.
* **RDAP (Registration Data Access Protocol)**: Queries standardized ICANN registration data replacing deprecated legacy WHOIS, strictly blocking private/loopback address ranges (SSRF protection).

**Zero Active Probing**:
- No TCP/UDP port scanning
- No exploit payload delivery
- No brute-force credential stuffing or password spray
- No denial-of-service or connection flooding

All collected data originates from intentionally public, globally replicated ledgers designed for transparent internet operation.

---

## 2. GDPR (Regulation (EU) 2016/679) & Privacy by Design

### Legal Basis: Article 6(1)(f) Legitimate Interest
Processing of internet infrastructure indicators (IP addresses, autonomous system numbers, DNS zone records, publicly declared administrative email endpoints) is conducted under the legitimate interest of cybersecurity hygiene, vulnerability mitigation, and attack surface reduction.

### Privacy Safeguards & Data Minimization (Article 5 & 14)
* **Automated Redaction & Masking**: All email addresses and telephone numbers identified within public records (such as `security.txt` or public contact pages) are automatically masked in memory (e.g. `sec***@target.com`, `+1 (555) ***-1234`) before display and persistent storage.
* **No PII Harvesting**: The platform never scrapes, parses, or retains consumer names, private credentials, or residential addresses.
* **Ephemeral Analysis**: Forensic scan data resides in browser local storage or operator-controlled local persistence; no telemetry or target dossiers are transmitted to third-party tracking services.

---

## 3. Statutory Compliance & Safe Harbor

### Computer Fraud and Abuse Act (CFAA — 18 U.S.C. § 1030)
Under *Van Buren v. United States* (2021), accessing publicly available internet records through standard HTTP interfaces does not constitute access without authorization. Because the platform queries only public registries and publicly available servers, its operation complies with CFAA boundaries.

### UK Computer Misuse Act (CMA 1990)
Sections 1–3 of the CMA penalize unauthorized access and intentional system degradation. The platform performs zero unauthorized modifications, zero data impairment, and strictly non-destructive analysis.

### Dual-Attestation Target Authorization Gate
For defensive health audits (HTTP status checks, SSL cipher verification, security headers, RFC 9116 security.txt validation), the platform provides a built-in **Target Authorization Gate**:
1. Operators attest authorization or ownership before running defensive probes.
2. Cryptographic SHA-256 audit signatures are recorded for accountability.

---

## 4. Upstream Service Hygiene & Rate Limiting

The platform implements polite client engineering to ensure zero disruption to upstream registries:
* **Cloudflare DoH**: Managed with exponential backoff on HTTP 429.
* **Certificate Transparency Logs**: Strict request spacing and timeout management.
* **Wayback Machine CDX**: Backoff with randomized jitter to respect Internet Archive bandwidth.
* **Zero Buffer Flooding**: SSE streaming and backpressure mechanisms prevent client or server memory exhaustion.

---

### Informational Disclaimer
*This document and the Internet Archaeologist Platform are provided for technical, educational, and authorized defensive analysis. Users assume full responsibility for ensuring their usage complies with their local jurisdiction, network acceptable use policies (AUP), and statutory mandates. The authors and maintainers disclaim any liability for unauthorized or unlawful actions.*
