## 2026-09-25T12:22:08Z

You are a Worker implementing Milestone M3 & M4 (Requirements R3 and R4) for Internet Archaeologist Platform v2.1.

Your working directory is: j:\osint_tool\.agents\teamwork_preview_worker_m3_m4_1
The authoritative user request is at: j:\osint_tool\.agents\ORIGINAL_REQUEST.md
The project master scope is at: j:\osint_tool\PROJECT.md
The Explorer 2 survey findings are at: j:\osint_tool\.agents\teamwork_preview_explorer_survey_2\handoff.md

You MUST read j:\osint_tool\.agents\ORIGINAL_REQUEST.md first.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership (exclusive to this worker):
- `src/types/osint.ts` (LoginProbeResult, FormEndpoint, WebsiteHealthReport updates)
- `src/lib/agents/websiteHealthAgent.ts`
- `src/components/WebsiteHealthCard.tsx`
- `src/__tests__/website_health_v21.test.ts`

Objectives:
1. Update `src/types/osint.ts`:
   - Add `LoginErrorPattern` ('generic_error' | 'username_enumeration_risk' | 'rate_limited' | 'redirected' | 'indeterminate').
   - Add `LoginProbeResult` interface (formAction, httpMethod, dummyCredentialUsed, httpStatus, responseTimeMs, extractedErrorText?, errorPattern, enumerationRiskDetected, notes).
   - Add `FormEndpoint` interface (actionUrl, httpMethod, isHttps, isPubliclyAccessible, sourcePage, statusCode?).
   - Extend `WebsiteHealthReport` with `loginProbeResults?: LoginProbeResult[]`, `crawledPagesCount?: number`, `formEndpoints?: FormEndpoint[]`.
2. Enhance `src/lib/agents/websiteHealthAgent.ts`:
   - 1-hop crawl: Parse landing page for same-domain `<a href="...">` links. Filter out static assets (.png, .jpg, .pdf, .css, etc.) and external domains. Select up to 20 unique same-domain pages and fetch them concurrently using `Promise.allSettled` and `isSafeUrlForFetch` with timeout 3000ms. Track `crawledPagesCount`.
   - Broken link discovery: Across landing page and all crawled pages, extract `<a href="...">` links with their anchor text. Probe candidates with HEAD/GET. If status >= 400 (excluding 403 WAF blocks) or network error, add to `brokenLinks: BrokenLinkItem[]` preserving `url`, `statusCode`, `anchorText`, and `sourcePage: pageUrl`.
   - Form endpoint discovery: Across landing page and all crawled pages, extract all `<form action="...">` tags. Resolve action URL against page URL. Record actionUrl, httpMethod (default GET if missing), isHttps (actionUrl.startsWith('https://')), sourcePage. Probe public accessibility using HEAD/GET (status < 500 confirms reachable endpoint).
   - Login form probe:
     - Detect login forms (contains `<input type="password">` or form action/name indicates login/auth).
     - Map inputs: identify `passwordField` (type `password`), `usernameField` (type `text`/`email` or attribute matching `user|login|email|account`, or the input before the password field), and collect `hiddenInputs` to preserve CSRF tokens.
     - Submit exactly ONE dummy credential probe per form:
       - Dummy credentials: `test@invalid.tld` / `invalidpassword123` (strictly dummy RFC 2606 credentials, zero credential stuffing, zero brute-force).
       - Method: POST (or form method).
       - Strict safeguards: `retries: 0`, 4000ms timeout, `isSafeUrlForFetch`.
       - Timing: Measure response time with `performance.now()`.
       - Capture HTTP status and error text (from JSON or HTML error elements/keywords).
       - Classify error pattern:
         - `username_enumeration_risk`: Error explicitly states user/email/account doesn't exist (e.g. "User not found", "No account registered with this email"). Set `enumerationRiskDetected: true`.
         - `generic_error`: Standard combined failure (e.g. "Invalid username or password", "Invalid credentials", "Authentication failed"). Set `enumerationRiskDetected: false`.
         - `rate_limited`: Status 429 or CAPTCHA/WAF response.
         - `redirected`: HTTP 301/302/303.
         - `indeterminate`: Ambiguous 200 or probe failure.
3. Enhance `src/components/WebsiteHealthCard.tsx`:
   - Under "Login Flow & Authentication Form Hygiene", add a dedicated "Login Error Analysis" section rendering:
     - Action URL and HTTP method badge
     - Dummy Credential Probe badge (`test@invalid.tld`)
     - HTTP Status Code & Response Latency (`${responseTimeMs}ms`)
     - Extracted error message text
     - OWASP Enumeration Risk badge (Green "Generic Error Pattern" vs Amber/Red "Leaks Account Existence (Enumeration Risk)")
   - In the Broken Links table/card, display `sourcePage` for each broken link.
   - Add a new "Discovered Form Endpoints & Action Targets" section displaying action URLs, method, HTTPS status, public accessibility status, and source page.
4. Create comprehensive tests in `src/__tests__/website_health_v21.test.ts`:
   - Test 1-hop crawl depth bounding (max 20 same-domain pages, asset exclusion)
   - Test broken link capture with anchorText, sourcePage, and statusCode
   - Test form endpoint discovery with method, HTTPS status, and accessibility
   - Test login form detection, input mapping (username, password, hidden CSRF)
   - Test single dummy probe execution with `test@invalid.tld` / `invalidpassword123` and zero retries
   - Test error classification (`generic_error` vs `username_enumeration_risk` vs `rate_limited`)
   - Test SSRF protection blocking private IPs from crawl and probe
5. Verification:
   - Run `npm test` (all test suites must pass, including `src/__tests__/e2e_requirements.test.ts`).
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run lint` (0 errors).
   - Run `npm run build` (succeeds).
6. Write handoff report to `j:\osint_tool\.agents\teamwork_preview_worker_m3_m4_1\handoff.md`.
7. Send a completion message via send_message to the orchestrator.
