# Test Infrastructure: Internet Archaeologist Platform v2.1

## Overview
This document specifies the testing infrastructure, verification channels, 4-tier testing methodology, and execution protocols for the Internet Archaeologist Platform v2.1.
All testing is strictly non-intrusive, hermetic, and adheres to the defensive OSINT principle: no credential stuffing, no brute-force attacks, and no exploitation.

---

## 1. Test Environment & Runner Configuration

- **Framework**: Jest `30.5.2` with `@swc/jest` transformer and `jest-environment-jsdom` / `node`.
- **Language**: TypeScript `5.9.3` (`tsc --noEmit` compliance).
- **Execution Engine**: Next.js `16.3.6` (Turbopack compiler).
- **Primary Test Runner Command**:
  ```bash
  npm test
  ```
- **Targeted E2E Requirements Runner Command**:
  ```bash
  npm test -- src/__tests__/e2e_requirements.test.ts
  ```
- **Typecheck Verification Command**:
  ```bash
  npx tsc --noEmit
  ```
- **Linter Verification Command**:
  ```bash
  npm run lint
  ```

---

## 2. 4-Tier Test Architecture

The E2E test suite (`src/__tests__/e2e_requirements.test.ts`) is organized into four distinct verification tiers:

```
src/__tests__/e2e_requirements.test.ts
├── Tier 1: Core Feature Coverage (24 test cases)
│   ├── R1: Domain Owner Identity Resolution (6 tests)
│   ├── R2: Deep Email Discovery & Role Categorization (6 tests)
│   ├── R3: Login Form Probe with Dummy Credential Error Capture (6 tests)
│   └── R4: Broken Link & Form Endpoint Discovery (6 tests)
├── Tier 2: Boundary, Corner Cases & Adversarial Verification (24 test cases)
│   ├── R1 Boundaries: Handle fallback, parameter vs array country, privacy proxies (6 tests)
│   ├── R2 Boundaries: Subpage failures, asset false positives, email deduplication (6 tests)
│   ├── R3 Boundaries: Non-standard actions, SSRF guards, rate-limiting, redirects (6 tests)
│   └── R4 Boundaries: 20-page crawl limit, circular links, non-navigable schemes (6 tests)
├── Tier 3: Cross-Feature Combinations (6 test cases)
│   ├── Privacy-redacted RDAP with subpage legal contact discovery
│   ├── Discovered login form on crawled 1-hop subpage triggers probe
│   ├── Discovered form action evaluated for reachability
│   ├── Concurrent contact discovery and health crawling
│   ├── CentralOrchestrator full DAG pipeline synthesis
│   └── Executive contact on /team correlated with RDAP organization
└── Tier 4: Real-World Application Scenarios (5 test cases)
    ├── T4-REAL-01: Enterprise Scenario (Google/Alphabet thin referral, SSO probe)
    ├── T4-REAL-02: Privacy-Shielded Non-Profit Scenario (EFF/APNIC GDPR redaction)
    ├── T4-REAL-03: High-Security FinTech Scenario (generic error, HTTPS enforcement)
    ├── T4-REAL-04: Legacy Web Application Scenario (enumeration leak, HTTP forms)
    └── T4-REAL-05: Complete E2E Streaming Investigation (/api/investigate/stream SSE)
```

**Total Test Count**: 59 test cases across all 4 tiers.

---

## 3. Verification Channels & Interface Contracts

The test suite interacts solely through public interfaces and contracts, ensuring opaque-box testing without coupling to private agent internals:

### R1 Interface Contract: Domain Owner Identity
```typescript
export interface WhoisRdapRecord {
  domain: string;
  registrar?: string;
  registryExpiry?: string;
  createdDate?: string;
  updatedDate?: string;
  registrantName?: string; // Formatted Name (fn) or handle fallback
  organization?: string;   // Organization name
  country?: string;        // 2-letter ISO code or full country name
  abuseContactEmail?: string;
  abuseContactPhone?: string;
  privacyProtected: boolean;
  privacyNotice?: string;  // Redaction notice (e.g., "Redacted for Privacy")
  standards?: string[];    // RFC 9083, RFC 7095, RFC 6350 citations
  rawRdapUrl?: string;
  evidenceId?: string;
}
```

### R2 Interface Contract: Contact Discovery & Roles
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
  value: string; // privacy-masked e.g. "sec***@example.com"
  source: string;
  role: string;
  confidence: number;
}
```

### R3 & R4 Interface Contract: Probing & Crawling
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
  dummyCredentialUsed: string; // "test@invalid.tld"
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
  overallHealthScore: number;
  targetAccessible: boolean;
  httpStatus: number;
  responseTimeMs: number;
  brokenLinks: BrokenLinkItem[];
  redirectChain: RedirectHop[];
  mixedContentIssues: { resourceUrl: string; resourceType: string }[];
  exposedErrorMessages: { snippet: string; type: string; url: string }[];
  loginFormHygiene: LoginFormHygiene[];
  loginProbeResults?: LoginProbeResult[];
  crawledPagesCount?: number;
  formEndpoints?: FormEndpoint[];
  generatedAt: string;
  evidenceId?: string;
}
```

---

## 4. Test Isolation & Hermetic Strategy

1. **Zero External Network Dependencies**: All outbound HTTP requests (`global.fetch`) are mocked via `jest.spyOn(global, 'fetch')` or `jest.fn()`. No live DNS lookups or external RDAP/website queries occur during test runs.
2. **Deterministic Time & Identifiers**: Timestamps, crypto hashes, and random IDs are verified via structural assertions or regex matching (`/^ev-/`).
3. **SSRF Guard Enforcement**: Every simulated outbound fetch passes through `isSafeUrlForFetch` to verify that private IP addresses (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`) and non-standard schemes are blocked before dispatch.
4. **Zero State Leakage**: Each test constructs its own isolated `AgentContext` and `AgentSharedState`. No tests share mutable state.

---

## 5. Authoritative Expected Output Derivation

All expected outputs are derived from authoritative sources:
- **R1 Expected Outputs**: ICANN RDAP RFC 9083 / RFC 7095 / RFC 6350 standards and `ORIGINAL_REQUEST.md § R1`.
- **R2 Expected Outputs**: RFC 9116 (`security.txt`), RFC 6068 (`mailto:` scheme), RFC 2606 (reserved domains), and `ORIGINAL_REQUEST.md § R2`.
- **R3 Expected Outputs**: OWASP WSTG-IDNT-04 (Testing for Account Enumeration and Guessable User Account) and `ORIGINAL_REQUEST.md § R3`.
- **R4 Expected Outputs**: W3C HTML5 Form Submission specification, HTTP/1.1 status codes (RFC 9110), and `ORIGINAL_REQUEST.md § R4`.

---

## 6. How to Run the Tests

To run the complete test suite:
```bash
npm test
```

To run only the requirement-driven E2E test suite:
```bash
npm test -- src/__tests__/e2e_requirements.test.ts
```

To run with coverage analysis:
```bash
npm run test:coverage
```
