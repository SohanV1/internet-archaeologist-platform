# Original User Request

## 2026-09-25T07:00:58Z

Build v2.1 of the Internet Archaeologist Platform — enhancing existing multi-agent OSINT workers with 5 new passive intelligence capabilities. All testing is strictly limited to domains the user owns or has explicit written authorization to assess. No credential stuffing, brute-force, or exploitation. Ponytail mode: minimal diffs, reuse existing agents.

Working directory: j:\osint_tool

## Requirements

### R1. Domain Owner Identity Resolution
Enhance the existing `passiveReconAgent` and `sourceEnrichmentAgent` to extract the **registrant name, organization, and country** from RDAP/WHOIS records. Currently these agents fetch RDAP data but only surface registrar and lifecycle dates. v2.1 must parse `vcardArray` and entity handles to resolve the actual owner name (or note privacy redaction). Display owner info in the existing `DomainIntelligenceView` component.

### R2. Deep Email Discovery & Role Categorization
Enhance `contactDiscoveryAgent` to discover all publicly exposed email addresses beyond just `security.txt`. Scrape the target's HTML pages (`/contact`, `/about`, `/team`, `/privacy`, `/imprint`, footer sections), parse `mailto:` links, and detect email patterns in visible text. Categorize each email by likely role (security, admin, sales, support, legal, executive, general). Display in the existing contact section UI with role badges.

### R3. Login Form Probe with Dummy Credential Error Capture
Enhance `websiteHealthAgent` to detect login/authentication forms, then submit a **single known-bad dummy credential** (`test@invalid.tld` / `invalidpassword123`) to capture the HTTP response status code, error message text, response timing, and whether the form leaks username-exists vs generic-error patterns. One attempt per form maximum. No brute-force, no real credentials. Add results to `WebsiteHealthCard` component under a new "Login Error Analysis" section.

### R4. Broken Link & Form Endpoint Discovery
The existing `websiteHealthAgent` already checks broken links. Enhance it to crawl deeper — parse not just the landing page but also linked same-domain pages (1 hop depth, max 20 pages). Report broken links with their anchor text, source page, and HTTP status. For any discovered form endpoints (action URLs), report their method, HTTPS status, and whether they're publicly accessible.

### R5. Version Bump, Push & Notification
Bump `package.json` to `2.1.0`, update `CHANGELOG.md` with v2.1 entries, commit all changes to `main`, push to GitHub, and verify the Netlify deployment goes live. Send a comprehensive Discord webhook notification listing all implemented features, impacted files, and verification status. The Discord notification must be sent using this exact command pattern:
```
cmd.exe /c "type <path-to-json-payload> | node C:\Users\sohan\.gemini\config\scripts\discord-notify.js --stdin"
```
The JSON payload must include: project, category, title, intent, summary, files array, and status fields.

## Acceptance Criteria

### Functionality
- [ ] RDAP owner name/org extraction works for at least 3 test domains (one with privacy proxy, one without)
- [ ] Email discovery finds emails from HTML pages, mailto links, and text patterns — not just security.txt
- [ ] Login probe submits exactly one dummy attempt and captures error response pattern without credential stuffing
- [ ] Broken link crawl goes 1 hop deep into same-domain pages (max 20 pages)
- [ ] All 5 features integrate into existing UI components without new page routes

### Quality
- [ ] All existing tests continue to pass (currently 67/67)
- [ ] New tests added for each enhanced agent capability
- [ ] TypeScript typecheck passes with zero errors
- [ ] ESLint passes with zero errors
- [ ] Next.js production build succeeds

### Deployment
- [ ] package.json version is 2.1.0
- [ ] CHANGELOG.md has v2.1.0 section
- [ ] Changes are committed and pushed to GitHub main
- [ ] Discord notification sent with full feature summary

## Follow-up — 2026-09-25T07:03:36Z

IMPORTANT UI bug found from live browser inspection — please fix as part of v2.1:

1. **Version label in header says "v1.5"** — must be updated to "v2.1" in the header component. Search for "v1.5" in `src/app/page.tsx` or any layout/header component and update to "v2.1".

2. When updating the `package.json` version to `2.1.0`, make sure the header version badge matches.

This is a quick fix but very visible to users. Don't create a separate PR — fold it into the v2.1 commit.

## Follow-up — 2026-09-25T12:20:54Z

URGENT USER OVERRIDE: The user has requested to "finish it quick and deploy it". Please immediately fast-track the remaining work. Skip the exhaustive multi-agent peer review swarms for M3 and M4 to save time. Wrap up whatever is currently in progress and proceed immediately to Milestone M5 (Release 2.1.0, Git Push, Netlify deployment verification, and Discord Webhook). Speed and deployment are the highest priority right now.
