# Handoff Report: Investigation of Requirements R3 & R4 (v2.1)

## 1. Observation

Direct observations from the codebase investigation:

1. **`websiteHealthAgent.ts` implementation (`src/lib/agents/websiteHealthAgent.ts`)**:
   - Lines 36-410: Implements `websiteHealthAgent: WorkerAgent<WebsiteHealthResult>`.
   - Lines 218-264: Currently performs passive DOM inspection of `<form>` elements up to 3 forms (`/<form\b([^>]*)>([\s\S]*?)<\/form>/gi`). Checks `hasPasswordInput` (`/type=["']password["']/i`), `isHttps`, `hasCsrfToken`, `autocompleteConfigured`, and `cleartextRisk`.
   - Line 210 comment: `// 5. Login Form Hygiene Inspection (Strictly passive, NO submissions)`.
   - Lines 266-318: Broken link inspection currently only searches top 5 anchor targets on the landing page HTML (`testCandidates.length < 5`). Probes links via `HEAD` using `fetchWithRetry(candidate.url, { method: 'HEAD', ... }, { retries: 1, timeoutMs: 2500 })`. Adds broken links with `sourcePage: targetUrl`.
   - Lines 333-345: Assembles `WebsiteHealthReport` containing `overallHealthScore`, `targetAccessible`, `httpStatus`, `responseTimeMs`, `brokenLinks`, `redirectChain`, `mixedContentIssues`, `exposedErrorMessages`, `loginFormHygiene`, and `evidenceId`.

2. **`WebsiteHealthCard.tsx` implementation (`src/components/WebsiteHealthCard.tsx`)**:
   - Lines 18-21: Props interface: `{ healthReport?: WebsiteHealthReport; targetDomain: string; }`.
   - Lines 40-92: Overview card with Health Index score (0-100) and 4 metric blocks: Broken Links, Redirect Hops, Mixed Content, Latency.
   - Lines 94-146: "Login Flow & Authentication Form Hygiene" section, rendering `LoginFormHygiene` items with Lock/Unlock icons, action URLs, CSRF status, and notes.
   - Lines 149-206: Grid displaying Redirect Chain Analysis and Observed Broken Links (`url`, `anchorText`, `HTTP statusCode`). Note: `link.sourcePage` is currently present in the `BrokenLinkItem` interface but is not rendered in the UI.

3. **Data Types & Contracts (`src/types/osint.ts` & `src/lib/agents/types.ts`)**:
   - `BrokenLinkItem` (lines 355-360):
     ```ts
     export interface BrokenLinkItem {
       url: string;
       statusCode: number;
       anchorText?: string;
       sourcePage: string;
     }
     ```
   - `LoginFormHygiene` (lines 369-377):
     ```ts
     export interface LoginFormHygiene {
       formAction: string;
       isHttps: boolean;
       hasCsrfToken: boolean;
       hasPasswordInput: boolean;
       autocompleteConfigured: boolean;
       cleartextRisk: boolean;
       notes: string;
     }
     ```
   - `WebsiteHealthReport` (lines 379-391): Does not currently include login probe results, crawl depth metadata, or discovered general form endpoints.
   - `AgentSharedState` (`src/lib/agents/types.ts:62`): Includes `healthReport?: WebsiteHealthReport;`.

4. **Integration & Orchestration Flow**:
   - `src/lib/agents/centralOrchestrator.ts:337-348`: In Phase 2, runs `techHostingAgent`, `contactDiscoveryAgent`, and `websiteHealthAgent` concurrently via `Promise.all`. Updates `sharedState.healthReport = healthResult.healthReport`.
   - `src/lib/agents/reportingAgent.ts:75, 297`: Extracts `sharedState.healthReport` and embeds it into `Investigation.healthReport` and `Investigation.websiteHealth`.
   - `src/app/page.tsx:714-718`: Passes `healthReport={investigation.websiteHealth || investigation.healthReport}` to `WebsiteHealthCard`.

5. **Security Validation & Network Layer (`src/lib/osint/validator.ts` & `fetchWithRetry.ts`)**:
   - `isSafeUrlForFetch(url)` validates protocol (`http:` / `https:`), rejects internal IPs (`127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16`, etc.), and blocks reserved hostnames.
   - `fetchWithRetry` provides timeout, abort controller, and retry backoff.

6. **Quality & Test Baseline (`src/__tests__/agents.test.ts`)**:
   - Test suite currently contains 67 tests across 11 suites; all 67 pass cleanly (`npm test`).
   - Lines 196-222 test `websiteHealthAgent` by mocking `ctx.sharedState.htmlSample` and checking `mixedContentIssues` and `loginFormHygiene`.
   - `npm run typecheck` passes with zero errors.
   - `npm run lint` passes with zero errors.
   - `npm run build` succeeds in Turbopack production mode.

---

## 2. Logic Chain

From the observations to the recommended v2.1 implementation for R3 and R4:

### Requirement R3: Login Form Probe with Dummy Credential Error Capture

1. **Identification of Login Forms**:
   - By Observation 1, `websiteHealthAgent.ts` already extracts forms via `/<form\b([^>]*)>([\s\S]*?)<\/form>/gi` and flags `hasPasswordInput` or `isLoginOrAuth`.
   - To probe the form, we inspect child `<input>` tags:
     - Identify `passwordField`: `<input ... type=["']password["'] ...>` (defaulting name to `'password'`).
     - Identify `usernameField`: `<input ...>` where `type="text"|"email"` or without explicit type, matching `name`/`id`/`autocomplete` with `user|login|email|account|identity` (or the input preceding the password input; defaulting name to `'username'`).
     - Preserve `hiddenInputs`: `<input type=["']hidden["'] ...>` to retain CSRF/session tokens so backend validation does not prematurely fail at CSRF filters.
   - Action URL resolution: `new URL(formAction || targetUrl, targetUrl).toString()`. Validate with `isSafeUrlForFetch(actionUrl)`.

2. **Safe Single-Attempt Dummy Probe Execution**:
   - Credential constraint (Observation 1 & User Request): Exactly one probe per form using `test@invalid.tld` (RFC 2606 reserved TLD) and `invalidpassword123`.
   - Method: POST (or form action method). Body formatted as `application/x-www-form-urlencoded` containing hidden fields, `usernameField: 'test@invalid.tld'`, and `passwordField: 'invalidpassword123'`.
   - Strict safeguards:
     - `retries: 0` (no retry loops or credential stuffing).
     - Maximum 1 (or at most 2) login forms probed per domain.
     - Timeout: 4000ms.
     - Timing measured via `performance.now()` before and after fetch.

3. **Response & Pattern Analysis**:
   - Capture `httpStatus` (e.g. 401, 400, 200, 429, 302).
   - Capture error message text:
     - JSON: parse `error`, `message`, `detail`.
     - HTML: regex search for error containers (`class="...error|alert|invalid-feedback..."`) or failure phrases (`/(?:invalid|incorrect|unknown|failed|not found|does not exist|unregistered)[^<>\n\r]{2,80}/i`).
   - Pattern classification (OWASP WSTG-IDNT-04):
     - **Username-Exists Leak (`username_enumeration_risk`)**: Error mentions account/user/email non-existence (e.g., "User not found", "No account registered with this email", "Unknown user").
     - **Generic Error (`generic_error`)**: Error combines credentials uniformly (e.g., "Invalid username or password", "Invalid credentials", "Authentication failed").
     - **Rate Limited (`rate_limited`)**: Status 429 or CAPTCHA/WAF response.
     - **Redirected (`redirected`)**: HTTP 301/302/303.
     - **Indeterminate (`indeterminate`)**: 200 without recognized message or probe failure.

4. **UI Presentation in `WebsiteHealthCard.tsx`**:
   - By Observation 2, `WebsiteHealthCard` already has a "Login Flow & Authentication Form Hygiene" section.
   - Add a new dedicated card/section: **"Login Error Analysis"**:
     - Displays action URL, HTTP method, tested dummy credential badge (`test@invalid.tld`), response status code, latency in ms, and verbatim extracted error text.
     - Shows pattern badge:
       - Emerald: "✓ Generic Error Pattern (OWASP Compliant)"
       - Amber/Red: "⚠ Leaks Account Existence (Enumeration Risk)"
       - Blue/Zinc: "Rate Limited" / "Redirected"
     - Provides clear security explanation of the enumeration risk vs defensive best practice.

---

### Requirement R4: Broken Link & Form Endpoint Discovery

1. **Extending Crawling to 1 Hop Deep (Max 20 Pages)**:
   - By Observation 1, the current crawler only tests 5 links on the landing page (Hop 0).
   - Algorithm for 1-hop crawl:
     - Hop 0: Parse landing page `htmlSample`. Collect all `<a href="...">` links.
     - Filter for same-domain HTML pages:
       - Hostname matches `domain` or `*.domain`.
       - Scheme is `http:` or `https:`.
       - Exclude static assets (`.png`, `.jpg`, `.pdf`, `.css`, `.js`, `.svg`, etc.) and anchors (`#`).
       - Deduplicate normalized URLs.
     - Hop 1: Select up to 20 unique same-domain URLs.
     - Fetch Hop 1 pages concurrently in small batches (e.g. 4-5 pages, 2500ms timeout per page).
     - Track `crawledPagesCount`.

2. **Capturing Broken Links Across All Crawled Pages**:
   - On Hop 0 and every Hop 1 page:
     - Extract all `<a href="...">` links with their inner text (`anchorText`).
     - Resolve target URL against the current page URL.
     - Associate candidate link with `{ url, anchorText, sourcePage: pageUrl }`.
   - Probe candidate links using `fetchWithRetry` with `method: 'HEAD'` (or fallback `GET`).
   - If HTTP status >= 400 (excluding 403 WAF blocks) or network error:
     - Push to `brokenLinks: BrokenLinkItem[]` preserving `url`, `statusCode`, `anchorText`, and `sourcePage`.
   - By Observation 3, `BrokenLinkItem` already defines `anchorText?: string` and `sourcePage: string`.

3. **Discovering Form Endpoints Across All Crawled Pages**:
   - On Hop 0 and all Hop 1 pages, parse all `<form>` tags:
     - Resolve action URL: `new URL(formAction || pageUrl, pageUrl).toString()`.
     - Extract `method`: GET, POST, etc.
     - Determine `isHttps`: `actionUrl.startsWith('https://')`.
     - Record `sourcePage`: `pageUrl`.
   - Test Public Accessibility:
     - Check `isSafeUrlForFetch(actionUrl)`.
     - Perform lightweight non-destructive probe (`HEAD` or `OPTIONS` or `GET`):
       - If status < 500 (e.g. 200, 302, 401, 403, 405 Method Not Allowed), endpoint is reachable and active.
       - If status 404 or connection failure, endpoint is marked not publicly accessible.
   - Record in `formEndpoints: DiscoveredFormEndpoint[]`.

4. **UI Presentation in Existing Components**:
   - In `WebsiteHealthCard.tsx`:
     - **Observed Broken Links card**: Update the list to display `link.sourcePage` ("Found on: ...") alongside `link.anchorText` and `HTTP ${link.statusCode}`, plus crawl depth badge.
     - **New "Discovered Form Endpoints" card**: Displays a table/grid of all discovered form endpoints with action URL, method badge (`POST`/`GET`), HTTPS badge (`HTTPS` vs `Insecure HTTP`), accessibility badge (`Publicly Accessible (HTTP XXX)` vs `Unreachable`), and source page URL.
   - Integrates 100% inside `WebsiteHealthCard.tsx` on the existing `website-health` tab without adding any new page routes.

---

## 3. Caveats

1. **Single-Page Applications (Client-Side Rendered)**:
   - In SPAs built entirely with client-side JavaScript (e.g. React/Vue without SSR), HTML fetched via HTTP GET may contain minimal static DOM (e.g. `<div id="root"></div>`).
   - In such cases, login forms rendered purely via client-side JavaScript won't appear in static HTML; the agent gracefully reports that no static authentication forms were detected.
2. **Network / Rate Limiting during Crawl**:
   - Crawling up to 20 pages and probing links must respect network timeouts. To ensure agent execution completes within 5-10 seconds, Hop 1 fetching should be bounded with a 2500ms timeout per page, and broken link candidate testing should be capped at high-priority targets.
3. **No Brute Force Guarantee**:
   - The probe must strictly submit a single attempt per form. In unit tests and runtime, guards must enforce `retries: 0` and prevent multiple submissions.

---

## 4. Conclusion

- **Requirement R3** is straightforward to implement cleanly:
  - Add `LoginProbeResult` and `LoginErrorPattern` types to `src/types/osint.ts` and `src/lib/agents/types.ts`.
  - In `websiteHealthAgent.ts`: After detecting login forms in the DOM, execute exactly one POST probe per login form with `test@invalid.tld` / `invalidpassword123`, measuring timing, status, and extracting error messages to classify `generic_error` vs `username_enumeration_risk`.
  - In `WebsiteHealthCard.tsx`: Add a "Login Error Analysis" section displaying the probe parameters, response code, latency, extracted error text, and OWASP enumeration risk classification.
- **Requirement R4** integrates seamlessly with existing types:
  - Add `DiscoveredFormEndpoint` to `src/types/osint.ts` and attach `formEndpoints` and `crawledPagesCount` to `WebsiteHealthReport`.
  - In `websiteHealthAgent.ts`: Expand link extraction into a 1-hop crawl of same-domain pages (max 20 pages). Record all discovered `<form action="...">` endpoints and probe them for HTTPS status and public reachability. Aggregate broken links with their exact `sourcePage` and `anchorText`.
  - In `WebsiteHealthCard.tsx`: Render `sourcePage` for broken links, and add a "Discovered Form Endpoints & Action Targets" section.
- **Zero Architectural Drift**:
  - No new page routes or API endpoints needed.
  - Reuses existing `CentralOrchestrator`, `websiteHealthAgent`, `fetchWithRetry`, and `WebsiteHealthCard`.
  - Existing 67/67 tests will remain passing, with new unit tests added in `src/__tests__/agents.test.ts`.

---

## 5. Verification Method

To verify the implementation once applied:

1. **Unit & Integration Tests**:
   ```bash
   npm test
   ```
   - Must pass all existing tests (currently 67/67).
   - New tests in `src/__tests__/agents.test.ts` should assert:
     - `websiteHealthAgent` detects login form and executes single dummy probe with `test@invalid.tld` / `invalidpassword123`.
     - `websiteHealthAgent` correctly identifies `generic_error` vs `username_enumeration_risk`.
     - `websiteHealthAgent` crawls same-domain pages up to 20 pages and discovers form endpoints with action URL, method, HTTPS status, and reachability.
     - `websiteHealthAgent` populates `brokenLinks` with `anchorText` and `sourcePage`.

2. **TypeScript Typecheck**:
   ```bash
   npm run typecheck
   ```
   Must exit with code 0.

3. **Linting**:
   ```bash
   npm run lint
   ```
   Must exit with code 0.

4. **Production Build**:
   ```bash
   npm run build
   ```
   Must complete Turbopack production build successfully.

5. **Files to Inspect**:
   - `src/types/osint.ts` (new types: `LoginProbeResult`, `LoginErrorPattern`, `DiscoveredFormEndpoint`)
   - `src/lib/agents/types.ts` (re-exports)
   - `src/lib/agents/websiteHealthAgent.ts` (crawling, probe logic, form discovery)
   - `src/components/WebsiteHealthCard.tsx` (UI cards for Login Error Analysis and Form Endpoints)
   - `src/__tests__/agents.test.ts` (unit tests)
