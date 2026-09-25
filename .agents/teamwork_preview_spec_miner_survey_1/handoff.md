# Specification Mining Report: Requirements R1 & R2 (v2.1)

**Investigator**: Specification Miner (`teamwork_preview_spec_miner_survey_1`)  
**Date**: 2026-09-25T07:15:00Z  
**Target Milestone**: Survey / Specification Mining (R1 & R2)  
**Authoritative Reference**: `j:\osint_tool\.agents\ORIGINAL_REQUEST.md`  

---

## Executive Summary

Requirements **R1** (*Domain Owner Identity Resolution*) and **R2** (*Deep Email Discovery & Role Categorization*) for v2.1 of the Internet Archaeologist Platform enhance three core agents (`passiveReconAgent`, `sourceEnrichmentAgent`, and `contactDiscoveryAgent`) and the `DomainIntelligenceView` component.

Current status of codebase:
- All **67/67 unit and integration tests** in `npm test` are currently passing.
- TypeScript typecheck (`npx tsc --noEmit`) passes with 0 errors.
- ESLint (`npm run lint`) passes with 0 errors.
- The system is architected as a non-intrusive, strictly passive OSINT intelligence platform with strict SSRF prevention (`isSafeUrlForFetch`), cryptographic SHA-256 provenance hashing (`calculateSha256`), and privacy masking (`maskEmail`, `maskPhone`).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1 (Identity) | RDAP Thin-to-Thick Resolver | Traverses RDAP `links` looking for `rel: "related"` with `type: "application/rdap+json"` to query registrar RDAP from thin registries (Verisign `.com`/`.net`, PIR `.org`). | Target Domain (`string`), registry RDAP JSON | Registrar authoritative RDAP response with full registrant entities | Returns thin registry data if related link absent or fetch fails | Live RDAP probe on `google.com`, `eff.org`, `cloudflare.com` |
| 2 | R1 (Identity) | vCard 4.0 `fn` Extractor | Extracts Formatted Name (`fn`) from `vcardArray` on entities with role `registrant` or `owner`. | `entity.vcardArray` (`Array`) | `registrantName` string (e.g. `"Alice Smith"`) | Falls back to entity handle or organization name if `fn` empty | RFC 7095 / RFC 9083 inspection on MarkMonitor, Gandi, Cloudflare RDAP |
| 3 | R1 (Identity) | vCard 4.0 `org` Extractor | Extracts Organization (`org`) from `vcardArray`, handling both string literals and array-of-strings. | `entity.vcardArray` (`Array`) | `organization` string (e.g. `"Google LLC"`) | Defaults to `'Private Registrant'` or privacy proxy name | Live RDAP inspection on `google.com`, `fsf.org`, `apnic.net` |
| 4 | R1 (Identity) | vCard 4.0 `adr` Country Extractor | Extracts country code from either parameter object `p[1].cc` or address array `p[3][6]`. | `entity.vcardArray` (`Array`) | ISO-3166 2-letter country code (e.g. `"US"`, `"NL"`) | Defaults to existing country or `'US'` baseline | RFC 7095 inspection across Gandi, Cloudflare, MarkMonitor RDAP |
| 5 | R1 (Identity) | RDAP Entity Handle Fallback | Extracts `entity.handle` as identity handle when `vcardArray` is stripped (e.g. in ccTLDs like `.cz`, `.de`). | `entity.handle` (`string`) | Identifier string (e.g. `"CZ-NIC"`) | Ignored if handle is generic redaction token like `"REDACTED"` | Live RDAP probe on `nic.cz` |
| 6 | R1 (Identity) | Privacy Redaction Classifier | Identifies WHOIS/RDAP privacy proxies and GDPR redaction tokens (`REDACTED`, `Privacy`, `Withheld`, `Proxy`, `Domains by Proxy`, `WhoisGuard`). | Entity `fn`, `org`, and `remarks` | `privacyProtected: boolean`, `privacyNotice: string` | If no privacy markers detected, flags standard registration | Live RDAP probe on `apnic.net`, `cloudflare.com` |
| 7 | R1 (Identity) | Source Enrichment for RDAP Standards | Enriches `sharedState.whoisRdap` in `sourceEnrichmentAgent` with RFC 9083, RFC 7095, RFC 6350 citations and full country name mapping. | `sharedState.whoisRdap` (`WhoisRdapRecord`) | Enriched `whoisRdap` + normative evidence item `ev-rdap-enrichment-${domain}` | Silently preserves existing record if no RDAP acquired | Source code analysis of `sourceEnrichmentAgent.ts` |
| 8 | R1 (UI) | Domain Intelligence Owner Card | Displays Registrant Name, Organization, Country, Privacy Status in `DomainIntelligenceView` RDAP Card. | `investigation.whoisRdap` | Responsive 6-item grid with Privacy Shield badge | Renders fallback placeholders gracefully if data missing | Source code analysis of `DomainIntelligenceView.tsx` |
| 9 | R2 (Emails) | Deep Multi-Path HTML Scraping | Concurrently fetches public subpages (`/contact`, `/about`, `/team`, `/privacy`, `/imprint`) via safe SSRF-checked HTTP. | Domain (`string`), target path list | HTML strings (max 100KB each) | Individual page failures (404, 500, timeout) caught via `Promise.allSettled` | Source code analysis of `contactDiscoveryAgent.ts` & `fetchWithRetry.ts` |
| 10 | R2 (Emails) | `mailto:` Link Parsing | Scrapes `href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})` links with query string stripping. | HTML string | Array of raw discovered email addresses | Ignores invalid URLs or non-email mailto targets | Source code analysis of `contactDiscoveryAgent.ts` |
| 11 | R2 (Emails) | Visible Text & Footer Email Detection | Strips scripts, styles, SVGs, tags, and extracts emails from visible body text and isolated footer sections. | Cleaned HTML text | Array of raw discovered email addresses | Ignores noise matching email patterns | Pattern analysis on website HTML samples |
| 12 | R2 (Emails) | False-Positive Noise Filter | Drops image assets (`.png`, `.jpg`, `.svg`), styles, scripts, and placeholder domains (`example.com`, `domain.com`). | Candidate email strings | Cleaned valid email list | Filters out syntax anomalies and asset extensions | Codebase analysis of regex and image asset matching |
| 13 | R2 (Emails) | 7-Role Email Categorization | Categorizes discovered emails into `security`, `admin`, `sales`, `support`, `legal`, `executive`, `general`. | Email address & source path/context | Canonical role string | Unrecognized patterns default to `general` | ORIGINAL_REQUEST.md Requirement R2 |
| 14 | R2 (Emails) | Backward Compatible Role Taxonomy | Preserves legacy `categorizeContactRole` string outputs for the 6 existing test assertions in `agents.test.ts`. | Email & source string | Legacy formatted string or canonical role | Preserves 100% test compatibility | `src/__tests__/agents.test.ts:119-126` |
| 15 | R2 (UI) | Contact Role Badges | Displays role badges (`security`: Red, `admin`: Blue, `sales`: Emerald, `support`: Cyan, `legal`: Amber, `executive`: Purple, `general`: Zinc) in UI. | `contact.role` | Color-coded badge in Public Contact Directory card | Falls back to General badge styling | `src/components/DomainIntelligenceView.tsx:28-34` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Thin Registry Traversal | `google.com` (Verisign thin registry) | Top-level RDAP response contains only registrar entity (MarkMonitor) and `links` with `rel: "related"`, `href: "https://rdap.markmonitor.com/rdap/domain/GOOGLE.COM"`. Fetching related link yields registrant entity with `fn: "REDACTED REGISTRANT"`, `org: "Google LLC"`, `country: "US"`. |
| 2 | Pure Registry without Related Link | `example.com` (Verisign/IANA) | Returns registrar entity `RESERVED-Internet Assigned Numbers Authority` without `rel: "related"` link. Must fall back cleanly to registrar baseline. |
| 3 | Redacted Name with Real Org | `eff.org` (Gandi registrar) | `fn` is `"Redacted for Privacy"`, `org` is `"Electronic Frontier Foundation"`, country is `"US"`. Must classify `registrantName` as privacy-redacted while resolving `organization` as `"Electronic Frontier Foundation"`. |
| 4 | Privacy Proxy Service | `apnic.net` (Name.com registrar) | `fn` is `"Redacted For Privacy"`, `org` is `"Domain Protection Services, Inc."`. Must flag `privacyProtected: true` and note the privacy proxy service. |
| 5 | Country Code in Parameter vs Array | `cloudflare.com` vs RFC standard | Parameter has `adrProp[1].cc = "US"`, whereas address array has `adrProp[3][6] = ""`. Parser must inspect both `p[1]?.cc` and `p[3]?.[6]`. |
| 6 | Empty Formatted Name `fn` | `iana.org` (CSC registrar) | Entity with role `registrant` has `fn` as empty string `""`, `org` as `"IETF Trust"`, country `"US"`. Parser must not use empty string as owner name; should fallback to `org` or note redaction. |
| 7 | Registrant Handle without vCard | `nic.cz` (CZ-NIC) | Entity with role `registrant` has `handle: "CZ-NIC"` but no `vcardArray`. Parser must fallback to handle `"CZ-NIC"`. |
| 8 | Subpage 404 / 403 / Timeout | Target missing `/imprint` or `/team` | `fetchWithRetry` throws or returns non-200. Handled via `Promise.allSettled`; scraper proceeds with remaining pages without failing the agent. |
| 9 | Email inside Image or Script Asset | `<img src="/avatars/user@2x.png">` | Regex matches `user@2x.png`. Filter checks `.png`, `.jpg`, `.svg`, `.webp`, `.css`, `.js` extension and discards it. |
| 10 | `mailto:` Link with Query Parameters | `<a href="mailto:support@domain.com?subject=Help&body=Hi">` | Parser splits or matches up to `?` or quote, preserving clean `support@domain.com`. |
| 11 | Truncation of Large HTML Responses | 10 MB single-page bundle | Reading whole document could degrade Node.js event loop. Slice HTML at 100,000 characters before regex parsing. |
| 12 | Backward Compatibility with Existing Unit Tests | `categorizeContactRole('security@example.com', 'RFC 9116')` | `agents.test.ts:120` expects literal `'Security / CERT'`. Function must retain compatibility or mapping so all 67 tests continue to pass. |

---

## 5-Component Handoff Report

### 1. Observation

Direct code and environment observations:

1. **Test Suite Baseline**:
   - Running `npm test` executes Jest across 11 test suites.
   - Result: **11 passed, 11 total. 67 passed, 67 total.** Time: ~28 seconds.
   - Typecheck (`npx tsc --noEmit`): 0 errors.
   - Linter (`npm run lint`): 0 errors.

2. **RDAP Fetching & Parsing in `passiveReconAgent.ts`** (`src/lib/agents/passiveReconAgent.ts:244-355`):
   - At line 260, fetches `https://rdap.org/domain/${encodeURIComponent(domain)}`.
   - At line 298:
     ```typescript
     if (roles.includes('registrant')) {
       const org = entity.vcardArray?.[1]?.find?.((v: any[]) => v[0] === 'org')?.[3];
       const country = entity.vcardArray?.[1]?.find?.((v: any[]) => v[0] === 'adr')?.[3]?.[6];
       if (org) whoisRdap.organization = org;
       if (country) whoisRdap.country = country;
     }
     ```
   - **Critical defect**: Never checks for `fn` (Formatted Name / Owner Name) in `vcardArray`!
   - Never checks `entity.handle` when `vcardArray` is omitted.
   - Does not follow `rel: "related"` link to registrar RDAP when Verisign thin registry returns only registrar data.
   - Line 334 checks `JSON.stringify(rdapData).toLowerCase()` for `'privacy' | 'redacted' | 'withheld' | 'proxy'`.

3. **Current Interface in `src/types/osint.ts:283-296`**:
   ```typescript
   export interface WhoisRdapRecord {
     domain: string;
     registrar?: string;
     registryExpiry?: string;
     createdDate?: string;
     updatedDate?: string;
     organization?: string;
     country?: string;
     abuseContactEmail?: string;
     abuseContactPhone?: string;
     privacyProtected: boolean;
     rawRdapUrl?: string;
     evidenceId?: string;
   }
   ```
   - Lacks `registrantName?: string;` and `privacyNotice?: string;`.

4. **Source Enrichment in `src/lib/agents/sourceEnrichmentAgent.ts`**:
   - Currently enriches `sharedState.vulnerabilities` and `sharedState.technologies`.
   - Does NOT currently process `sharedState.whoisRdap`.
   - In `CentralOrchestrator` (`src/lib/agents/centralOrchestrator.ts:363-376`), `sourceEnrichmentAgent` runs in Phase 4 after vulnerability assessment.

5. **Existing Contact Discovery in `src/lib/agents/contactDiscoveryAgent.ts`**:
   - Lines 106-175: Probes `/.well-known/security.txt` and `/security.txt`.
   - Lines 185-218: Extracts abuse contact from `sharedState.whoisRdap`.
   - Lines 220-243: Only searches `sharedState.htmlSample` (homepage) for `mailto:`.
   - Lines 62-77 (`categorizeContactRole`):
     ```typescript
     export function categorizeContactRole(value: string, source: string): ContactRole {
       const lower = value.toLowerCase();
       if (source.includes('security.txt') || /security|cert|psirt|cve|bounty|vuln/.test(lower)) {
         return 'Security / CERT';
       }
       if (source.includes('RDAP') || /abuse|legal|dmca|privacy|compliance|law/.test(lower)) {
         return 'Abuse / Legal';
       }
       if (/webmaster|hostmaster|postmaster|noc|admin|sysadmin|root|infra/.test(lower)) {
         return 'Technical / Webmaster';
       }
       if (/support|help|sales|billing|info|hello|contact/.test(lower)) {
         return 'Support / Sales';
       }
       return 'General';
     }
     ```
   - Does NOT crawl `/contact`, `/about`, `/team`, `/privacy`, `/imprint`, or isolate footers.
   - Does NOT search visible text with email regex.
   - Only categorizes into 5 roles instead of the 7 roles required in R2 (`security`, `admin`, `sales`, `support`, `legal`, `executive`, `general`).

6. **Existing UI in `src/components/DomainIntelligenceView.tsx`**:
   - Lines 28-34: `ROLE_BADGES` only defines:
     `'Security / CERT'`, `'Abuse / Legal'`, `'Technical / Webmaster'`, `'Support / Sales'`, `'General'`.
   - Lines 78-103: RDAP Card displays Registrar, Registrant Org, Registration Date, Registry Expiration. Does NOT display Registrant Owner Name or Country.
   - Lines 285-334: Renders discovered contacts with badge and copy button.

---

### 2. Logic Chain

1. **R1 Data Flow & Parsing Logic**:
   - **Step 1**: In `passiveReconAgent`, query `https://rdap.org/domain/${encodeURIComponent(domain)}`.
   - **Step 2**: Inspect top-level `rdapData.entities`. If no entity has `roles.includes('registrant')`, check `rdapData.links` for `{ rel: 'related', type: 'application/rdap+json' }`.
   - **Step 3**: If a related link exists, fetch the registrar RDAP JSON via `fetchWithRetry`. Thin registries (like Verisign for `.com` and `.net`) will return the complete entity list from the registrar (e.g. MarkMonitor for `google.com`, Cloudflare for `cloudflare.com`, Gandi for `eff.org`).
   - **Step 4**: Traverse all entities (both top-level and nested `entity.entities`). Look for `entity.roles.includes('registrant')` or `entity.roles.includes('owner')`.
   - **Step 5**: From `entity.vcardArray` (RFC 7095):
     - `fn`: Find `p[0] === 'fn'`. If string and non-empty, test against privacy regex `/redacted|privacy|withheld|proxy|protected|whoisguard/i`. If match, set `whoisRdap.privacyProtected = true`, `whoisRdap.registrantName = 'Redacted for Privacy'`. Otherwise, `whoisRdap.registrantName = fn`.
     - `org`: Find `p[0] === 'org'`. Handle string or array-of-strings. Assign to `whoisRdap.organization`.
     - `adr`: Find `p[0] === 'adr'`. Extract `p[1]?.cc` or `p[3]?.[6]`. Assign to `whoisRdap.country`.
   - **Step 6**: Fallback to `entity.handle`: If `fn` is blank or `vcardArray` is missing (as seen in `nic.cz`), use `entity.handle` unless it equals `"REDACTED"`.
   - **Step 7**: In `sourceEnrichmentAgent`, enrich `whoisRdap` with RFC 9083/7095 citations, normalize country ISO codes (e.g. `US` -> `United States`), and classify privacy proxy services.
   - **Step 8**: In `DomainIntelligenceView`, update the RDAP grid to display Registrant Owner Name, Organization, Country, Registrar, Registration Date, and Expiration Date, with a Privacy Shield badge and privacy notice tooltip/card.

2. **R2 Data Flow & Scraping Logic**:
   - **Step 1**: In `contactDiscoveryAgent`, define target scraping paths:
     `['/contact', '/contact-us', '/about', '/about-us', '/team', '/privacy', '/imprint', '/impressum']`.
   - **Step 2**: Fetch target paths concurrently using `Promise.allSettled` and `fetchWithRetry(..., { retries: 1, timeoutMs: 3000 })`. Include SSRF check `isSafeUrlForFetch`.
   - **Step 3**: For each successful HTML response and `sharedState.htmlSample`:
     - Run `mailto:` regex: `href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`.
     - Isolate `<footer>` tags and `<div class="*footer*">` elements.
     - Strip `<script>`, `<style>`, `<svg>`, comments, and HTML tags.
     - Run visible text regex: `/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g`.
   - **Step 4**: Filter noise:
     - Discard matches ending with asset extensions: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.css`, `.js`, `.ico`.
     - Discard sample domains: `example.com`, `example.org`, `domain.com`, `email.com`, `test.com`, `w3.org`, `sentry.io`.
   - **Step 5**: Deduplicate discovered emails by lowercase string. Apply `maskEmail(rawEmail)`.
   - **Step 6**: Categorize each email into one of the 7 required roles:
     - `security`: `security@`, `cert@`, `psirt@`, `cve@`, `bounty@`, `vuln@`, `infosec@`, `soc@` or from `security.txt`
     - `admin`: `admin@`, `administrator@`, `sysadmin@`, `webmaster@`, `hostmaster@`, `postmaster@`, `noc@`, `it@`, `ops@`, `infra@`, `devops@`, `tech@`, `root@`
     - `sales`: `sales@`, `marketing@`, `business@`, `deals@`, `revenue@`, `growth@`, `partnerships@`, `enterprise@`, `commercial@`
     - `support`: `support@`, `help@`, `helpdesk@`, `care@`, `service@`, `billing@`, `accounts@`, `contact@`, `hello@`, `hi@`, `info@`
     - `legal`: `legal@`, `privacy@`, `compliance@`, `dpo@`, `gdpr@`, `dmca@`, `abuse@`, `copyright@`, `terms@`, `law@`, `imprint@`, `impressum@` or from `/privacy` or `/imprint`
     - `executive`: `ceo@`, `cto@`, `cfo@`, `ciso@`, `coo@`, `founder@`, `president@`, `leadership@`, `board@`, `exec@`, `director@` or from `/team`
     - `general`: all other personal or general addresses
   - **Step 7**: Backward compatibility: Retain `categorizeContactRole(value, source)` returning the legacy strings for the 6 existing assertions in `agents.test.ts`. Provide `categorizeEmailRole(rawEmail, source)` returning the 7 canonical roles. Update `ContactRole` union to include both.
   - **Step 8**: In `DomainIntelligenceView.tsx`, update `ROLE_BADGES` to support all 7 roles with distinctive colors (`security`: Red, `admin`: Blue, `sales`: Emerald, `support`: Cyan, `legal`: Amber, `executive`: Purple, `general`: Zinc) while maintaining legacy badge mappings.

---

### 3. Caveats

1. **GDPR Masking Reality**: Since ICANN's post-GDPR Temporary Specification (2018), most `.com` and European registries redact registrant personal names by default unless the registrant explicitly opts in or is a non-EU entity. Therefore, accurately recognizing redaction tokens (`"Redacted for Privacy"`, `"DATA REDACTED"`) and distinguishing real organizations from privacy proxies is critical.
2. **Subpage Scraping Limits**: Web servers may return 403 (Cloudflare WAF) or 404 for paths like `/imprint`. The design ensures that failure on any subpage does not affect the rest of the discovery process.
3. **SSRF Guarding**: Outbound fetches to `/contact`, `/about`, etc., must be strictly bounded to `https://${domain}/${path}` to prevent open redirect abuse or SSRF.

---

### 4. Conclusion

The codebase is exceptionally well-structured and ready for v2.1 enhancements:
- The type system in `src/types/osint.ts` only needs two new fields on `WhoisRdapRecord` (`registrantName`, `privacyNotice`) and expansion of `ContactRole`.
- The agent pipeline in `src/lib/agents/` already has clean separation between `passiveReconAgent` (Phase 1), `contactDiscoveryAgent` (Phase 2), and `sourceEnrichmentAgent` (Phase 4).
- `DomainIntelligenceView.tsx` already has the exact cards for RDAP Ownership and Public Contact Directory, allowing the 5 new features to integrate without modifying page routes or breaking layout.
- The 67 existing tests will remain completely green by retaining legacy taxonomy mappings alongside the 7 new roles.

---

### 5. Verification Method

To independently verify the survey observations and findings:

1. **Run full existing test suite**:
   ```powershell
   npm test
   ```
   *Expected*: 11 test suites pass, 67 tests pass.

2. **Verify TypeScript compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected*: Exits with code 0, no type errors.

3. **Verify ESLint standards**:
   ```powershell
   npm run lint
   ```
   *Expected*: Exits with code 0, no lint errors.

4. **Verify RDAP live parsing behavior**:
   ```powershell
   node -e "fetch('https://rdap.org/domain/google.com', { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rdap+json' } }).then(r => r.json()).then(d => console.log('Related link:', d.links?.find(l => l.rel === 'related')?.href))"
   ```
   *Expected*: Outputs `https://rdap.markmonitor.com/rdap/domain/GOOGLE.COM`.

5. **Verify `contactDiscoveryAgent` test assertions**:
   Inspect `src/__tests__/agents.test.ts` lines 119-126 to verify the 6 role categorization assertions that must remain satisfied.
