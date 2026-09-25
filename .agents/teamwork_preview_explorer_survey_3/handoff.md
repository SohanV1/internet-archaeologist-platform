# Architecture, Testing, and Release Requirements Survey (R5)
**Internet Archaeologist Platform v2.1**
**Date**: 2026-09-25
**Explorer**: Survey Explorer 3 (`teamwork_preview_explorer_survey_3`)
**Authoritative Request**: `j:\osint_tool\.agents\ORIGINAL_REQUEST.md`

---

## 1. Observation

### 1.1 Project Architecture & Setup
- **Framework & Runtime**: Next.js 16.3.6 (Turbopack compiler), React 19.2.8, React DOM 19.2.8, Node.js v26.7.0 (`node -v` output: `v26.7.0`).
- **Language**: TypeScript 5.9.3 (`target: ES2022`, `moduleResolution: bundler`, `strict: true`, path alias `@/*` pointing to `./src/*`).
- **Package Manager**: npm with lockfile `package-lock.json` (337 KB).
- **Current Version**: `2.0.0` in `package.json` line 3 (`"version": "2.0.0"`).
- **Core Scripts** (`package.json` lines 6–15):
  - `dev`: `next dev -p 5006`
  - `build`: `next build`
  - `start`: `next start -p 5006`
  - `typecheck`: `tsc --noEmit`
  - `lint`: `eslint src/`
  - `format`: `prettier --write src/`
  - `test`: `jest`
  - `test:coverage`: `jest --coverage`
- **Configuration Files**:
  - `tsconfig.json`: Target ES2022, JSX `react-jsx`, paths `@/*` -> `./src/*`, includes `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`. Excludes `node_modules`, `node_modules_corrupt`.
  - `eslint.config.mjs`: Flat config with `@typescript-eslint/parser` for `src/**/*.{js,mjs,cjs,ts,jsx,tsx}`, rules `'no-unused-vars': 'off'`, `'no-undef': 'off'`, `'no-empty': ['error', { allowEmptyCatch: true }]`. Ignores `node_modules/**`, `.next/**`, `.netlify/**`, `coverage/**`, `dist/**`, `build/**`.
  - `next.config.mjs`: Sets `poweredByHeader: false`, comprehensive security headers (HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, strict CSP allowing `connect-src` to `cloudflare-dns.com`, `crt.sh`, `web.archive.org`, and `https://internet-archaeologist-platform.netlify.app`).
  - `netlify.toml`: Build command `npm run build`, publish directory `.next`, plugin `@netlify/plugin-nextjs`.
  - `.netlify/state.json`: Site ID `542ad6e0-8a2d-4727-9563-c4f65df8b5a3`.

### 1.2 Test Suite & Baseline Execution
- **Test Runner**: Jest 30.5.2 with `@swc/jest` transform and `jest-environment-jsdom` (with node environment specified per file where applicable, e.g. `/** @jest-environment node */` in `agents.test.ts`).
- **Jest Configuration** (`jest.config.js`):
  - Setup file: `jest.setup.ts` (imports `@testing-library/jest-dom`, polyfills `TextEncoder`/`TextDecoder`).
  - Style mock: `__mocks__/styleMock.js`.
  - Path alias: `^@/(.*)$` -> `<rootDir>/src/$1`.
  - Coverage threshold: 80% global enforcement across branches, functions, lines, statements for collected files (`history.ts`, `cryptoHash.ts`, `fetchWithRetry.ts`, `codebaseData.ts`, `ErrorBoundary.tsx`, `SkeletonLoader.tsx`).
- **Test Baseline Status**:
  - Command: `npm test`
  - Result: **11 test suites passed, 67 tests passed, 67 total (0 failures)**.
  - Breakdown by test file:
    1. `src/__tests__/rateLimiter.test.ts`: 4 passed (threshold limits, retryAfter, distinct IPs, x-forwarded-for extraction)
    2. `src/__tests__/codebaseData.test.ts`: 2 passed (language breakdowns, execution ratios)
    3. `src/__tests__/cryptoHash.test.ts`: 4 passed (SHA-256 64-char hex, deterministic output, avalanche effect, crypto.subtle fallback)
    4. `src/__tests__/validator.test.ts`: 18 passed (FQDN normalization, schemes/ports/injection stripping, loopback 127.0.0.1, AWS 169.254.169.254 metadata, RFC 1918 10.0.0.0/8 and 192.168.0.0/16 blocks, internal hostnames/TLDs, outbound SSRF guard `isSafeUrlForFetch`)
    5. `src/__tests__/logger.test.ts`: 4 passed (structured JSON for info/warn/error, async duration profiling)
    6. `src/__tests__/riskAssessment.test.ts`: 4 passed (A/A+ scoring, SPF/DMARC posture flaws, cert expiry, subdomain sprawl)
    7. `src/__tests__/SkeletonLoader.test.tsx`: 5 passed (card, graph, table, overview, matrix skeletons)
    8. `src/__tests__/fetchWithRetry.test.ts`: 4 passed (200 OK immediate, 503 retry backoff, exhaustion error, pre-flight SSRF blocking)
    9. `src/__tests__/ErrorBoundary.test.tsx`: 4 passed (normal render, fallback card, custom title/message, onReset callback)
    10. `src/__tests__/agents.test.ts`: 16 passed (contact masking & categorization, passiveRecon DNS/crt.sh, techHosting mail/ASN, snapshotHistory, websiteHealth redirect/mixed-content/login hygiene, safeVulnerability CVSS, sourceEnrichment standards, reportingAgent executive summary, CentralOrchestrator DAG execution & authorization gate, SSE stream endpoint `/api/investigate/stream` validation & SSRF blocks)
    11. `src/__tests__/history.test.ts`: 2 passed (collision-free snapshot IDs, fallback archive handling)
- **Quality Baseline Checks**:
  - `npm run typecheck` (`tsc --noEmit`): Exited with code 0 (zero errors).
  - `npm run lint` (`eslint src/`): Exited with code 0 (zero errors).
  - `npm run build` (`next build`): Exited with code 0 (compiled in 36.3s, static pages generated).
  - `npm run test:coverage` (`jest --coverage`): Exited with code 0 (Statements: 90.9%, Branches: 84.93%, Functions: 95%, Lines: 93.96% — all surpassing 80% requirement).

### 1.3 Release & Deployment Setup (Requirement R5)
- **Git State**:
  - Branch: `main` (`Your branch is up to date with 'origin/main'`).
  - Remote: `origin` -> `https://github.com/SohanV1/internet-archaeologist-platform.git`.
  - Untracked files: only `.agents/` directory.
  - Recent commits:
    - `9ee38a4`: `fix(security): resolve Next.js RCE advisory, add outbound SSRF guard and rate limiting`
    - `c9cab46`: `fix(ci): use git archive for robust tarball and zip release packaging`
    - `2c7b538`: `feat(v2.0): parallel multi-agent defensive OSINT suite with real-time SSE streaming and uncluttered UI`
- **CHANGELOG.md**:
  - Adheres to Keep a Changelog format.
  - Latest section is `## [2.0.0] - 2026-09-24` with subsections `### Added` and `### Security`.
  - v2.1.0 section must be inserted directly above `## [2.0.0]` following this standard.
- **Netlify Status**:
  - Site ID: `542ad6e0-8a2d-4727-9563-c4f65df8b5a3`
  - Name: `internet-archaeologist-platform`
  - Primary URL: `https://internet-archaeologist-platform.netlify.app`
  - Current Deploy: ID `6ab549d2d9490000084dc2ec`, status `ready`, commit `9ee38a4`, title `Deploy triggered by hook: GitHub Push Trigger`.
  - Live Verification: HTTP request to `https://internet-archaeologist-platform.netlify.app` returns HTTP 200 and loads successfully.
  - Deploy Trigger: Continuous deployment hook triggers on GitHub push to `main`.
- **Discord Notification System**:
  - Script path: `C:\Users\sohan\.gemini\config\scripts\discord-notify.js`.
  - Supports `--stdin` flag to read a JSON payload from standard input.
  - Webhook URL: Built-in default (`https://discord.com/api/webhooks/1552313299238916199/...`).
  - Expected execution pattern specified in `ORIGINAL_REQUEST.md`:
    ```cmd
    cmd.exe /c "type <path-to-json-payload> | node C:\Users\sohan\.gemini\config\scripts\discord-notify.js --stdin"
    ```
  - Required JSON schema fields:
    - `project`: `"internet-archaeologist-platform"`
    - `category`: `"feature"` (supported: `feature`, `bugfix`, `refactor`, `config`, `security`, `docs`)
    - `title`: String descriptive title (e.g. `"✨ v2.1.0 Release: Enhanced Passive Intelligence Capabilities"`)
    - `intent`: Synthesized user request context
    - `summary`: Detailed architectural and technical summary of changes
    - `files`: Array of relative or absolute file paths modified/added
    - `status`: String (e.g. `"Verified / Tests Passed (70+/70+) / Netlify Live"`)
    - `verification`: String detailing test commands and build status

### 1.4 Version String Invariants Across Codebase
Grep investigation revealed four specific locations hardcoding `'2.0.0'` that must be updated upon version bump:
1. `package.json` line 3: `"version": "2.0.0"` -> `"2.1.0"`
2. `src/types/osint.ts` line 452: `version?: '2.0.0';` -> update union or string type `version?: '2.1.0' | '2.0.0';`
3. `src/lib/agents/reportingAgent.ts` line 292: `version: '2.0.0'` -> `'2.1.0'`
4. `src/lib/agents/centralOrchestrator.ts` line 394: `version: '2.0.0'` -> `'2.1.0'`
5. `src/__tests__/agents.test.ts` lines 333 & 351: `expect(result.investigation.version).toBe('2.0.0')` -> must expect `'2.1.0'`.

---

## 2. Logic Chain

1. **Architecture & Toolchain Compatibility**:
   - Next.js 16.3.6 with Turbopack and React 19 is fully configured and builds cleanly without warnings.
   - Package manager is npm. All scripts are standard npm lifecycle scripts (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`).
   - Strict TypeScript configuration (`strict: true`) means any new interfaces for R1–R4 (`ownerName`, `loginFormHygiene`, `brokenLinks`, contact roles) must be accurately typed in `src/types/osint.ts` and `src/types/agent.ts` to pass `tsc --noEmit`.

2. **Test Baseline & Regression Prevention**:
   - Exactly 67 tests across 11 suites currently pass in ~5–10 seconds.
   - `jest.config.js` enforces 80% coverage on core utility modules.
   - Existing agent tests in `src/__tests__/agents.test.ts` mock `global.fetch` and test each agent (`passiveReconAgent`, `contactDiscoveryAgent`, `websiteHealthAgent`, `sourceEnrichmentAgent`, `reportingAgent`) against controlled fixtures.
   - New tests for R1 (RDAP owner identity resolution with privacy redaction detection), R2 (HTML page email scraping & 7-role taxonomy), R3 (single dummy login probe with error capture & zero brute-force), and R4 (1-hop 20-page broken link crawl & form endpoints) should be added directly into `src/__tests__/agents.test.ts` or dedicated test suites.
   - Modifying `version` from `2.0.0` to `2.1.0` will immediately fail lines 333 and 351 of `src/__tests__/agents.test.ts` unless the test expectations are simultaneously updated.

3. **Git Cleanliness & .agents Exclusion**:
   - `git status` shows `.agents/` as untracked because `.gitignore` currently does not list `.agents/`.
   - `.agents/` contains local subagent metadata and working files. When committing R5 release artifacts, `.agents/` must NOT be committed to git.
   - Either `.agents/` should be added to `.gitignore` or git commits must explicitly stage project files (`git add package.json CHANGELOG.md src/ ...`).

4. **Continuous Deployment via Netlify**:
   - Netlify site `542ad6e0-8a2d-4727-9563-c4f65df8b5a3` has an active GitHub push trigger on `main`.
   - Pushing the committed v2.1.0 release to `origin/main` automatically triggers Netlify's production build pipeline (`npm run build` with `@netlify/plugin-nextjs`).
   - The live site `https://internet-archaeologist-platform.netlify.app` is currently healthy and serving HTTP 200.

5. **Discord Webhook Notification Execution**:
   - `discord-notify.js` parses `--stdin` JSON correctly and handles Discord embed formatting, color coding, field truncation, and user mentions.
   - Writing the notification payload to a temporary JSON file (e.g. in `.agents/teamwork_preview_explorer_survey_3/discord_payload.json`) and piping via `cmd.exe /c "type <path> | node C:\Users\sohan\.gemini\config\scripts\discord-notify.js --stdin"` satisfies all requirements without command-line string escaping issues.

---

## 3. Caveats

1. **External RDAP and CDX Flakiness in Real Scans**:
   - Live network calls to `rdap.org` or `web.archive.org` during tests are properly intercepted by `jest.fn()` mocks in `agents.test.ts`. Real network requests occur only during runtime operations with timeout fallbacks in `fetchWithRetry.ts`.
2. **Netlify Webhook Latency**:
   - Netlify production build takes ~45 seconds following a `git push`. Verification of the live URL in R5 must allow sufficient time for Netlify to finish the deploy before verifying the HTTP 200 response.
3. **No Unannounced Breaking UI Changes**:
   - Existing UI components (`DomainIntelligenceView.tsx`, `WebsiteHealthCard.tsx`) must integrate the new intelligence without changing routing or removing existing cards.

---

## 4. Conclusion

1. **Codebase Health**: The platform is in an immaculate baseline state. All 67/67 Jest tests pass, TypeScript typecheck passes with 0 errors, ESLint passes with 0 errors, and Next.js Turbopack production build succeeds.
2. **Implementation Scope**:
   - **R1 (Domain Owner Resolution)**: Extend `WhoisRdapRecord` with `registrantName` / `ownerName`, parse `vcardArray` `fn` and `handle` in `passiveReconAgent.ts` and `sourceEnrichmentAgent.ts`, display in `DomainIntelligenceView.tsx`.
   - **R2 (Deep Email Discovery & Roles)**: Extend `contactDiscoveryAgent.ts` to crawl same-domain contact/about pages, parse `mailto:` and regex emails, expand role taxonomy to 7 roles (`security`, `admin`, `sales`, `support`, `legal`, `executive`, `general`), display role badges in `DomainIntelligenceView.tsx`.
   - **R3 (Login Form Probe)**: Extend `websiteHealthAgent.ts` with safe single dummy probe (`test@invalid.tld` / `invalidpassword123`), capture status/timing/error patterns, render "Login Error Analysis" section in `WebsiteHealthCard.tsx`.
   - **R4 (Broken Link & Form Crawl)**: Enhance `websiteHealthAgent.ts` to crawl same-domain links up to 1 hop (max 20 pages), record broken links with source page/anchor text, detect form endpoints with method/HTTPS status.
   - **R5 (Release & Deploy)**: Bump version in `package.json`, update `CHANGELOG.md` with v2.1.0 entries, synchronize `version: '2.1.0'` across `osint.ts`, `reportingAgent.ts`, `centralOrchestrator.ts`, and `agents.test.ts`, commit to `main`, push to GitHub, verify Netlify deployment, and dispatch Discord notification.

---

## 5. Verification Method

To independently verify the architecture baseline and release prerequisites:

1. **Verify Test Baseline**:
   ```bash
   npm test
   ```
   *Expected*: 11 test suites passed, 67 tests passed, 0 failures.

2. **Verify Code Coverage**:
   ```bash
   npm run test:coverage
   ```
   *Expected*: Statements >= 80%, Branches >= 80%, Functions >= 80%, Lines >= 80%.

3. **Verify Typecheck**:
   ```bash
   npm run typecheck
   ```
   *Expected*: Exit code 0, no diagnostic errors.

4. **Verify ESLint**:
   ```bash
   npm run lint
   ```
   *Expected*: Exit code 0, no lint errors.

5. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: `✓ Compiled successfully`, static pages generated, exit code 0.

6. **Verify Git Remote & Branch**:
   ```bash
   git status
   git remote -v
   ```
   *Expected*: Branch `main`, tracking `origin/main` (`https://github.com/SohanV1/internet-archaeologist-platform.git`).

7. **Verify Live Netlify URL**:
   Fetch `https://internet-archaeologist-platform.netlify.app`
   *Expected*: HTTP 200, valid HTML response.

8. **Verify Discord Script Invocation Pattern**:
   Prepare payload JSON and execute via:
   ```cmd
   cmd.exe /c "type <path-to-payload.json> | node C:\Users\sohan\.gemini\config\scripts\discord-notify.js --stdin"
   ```
   *Expected*: `✅ Discord notification successfully dispatched.`
