# Dispatch: Worker M2 (Deep Email Discovery & Role Categorization - Requirement R2)
Task: Implement multi-path scraping, mailto & visible text extraction, 7-role categorization, and UI role badges.

## 2026-09-25T07:37:00Z
You are a Worker implementing Milestone M2: Deep Email Discovery & Role Categorization (Requirement R2) for Internet Archaeologist Platform v2.1.

Your working directory is: j:\osint_tool\.agents\teamwork_preview_worker_m2_1
The authoritative user request is at: j:\osint_tool\.agents\ORIGINAL_REQUEST.md
The project master scope is at: j:\osint_tool\PROJECT.md
The Spec Miner survey findings are at: j:\osint_tool\.agents\teamwork_preview_spec_miner_survey_1\handoff.md

Objectives:
1. Update `src/types/osint.ts`:
   - Expand `ContactRole` union to include the 7 canonical roles: `'security' | 'admin' | 'sales' | 'support' | 'legal' | 'executive' | 'general'` while keeping legacy strings (`'Security / CERT' | 'Abuse / Legal' | 'Technical / Webmaster' | 'Support / Sales' | 'General'`) for backward compatibility.
   - Expand `ExposedContact.source` to accept string so discovery source pages (e.g. `/contact`, `/about`, `/team`, `/privacy`, `/imprint`, footer) can be recorded.
2. Enhance `src/lib/agents/contactDiscoveryAgent.ts`:
   - Probing public subpages: `/contact`, `/about`, `/team`, `/privacy`, `/imprint`.
   - Concurrently fetch subpages with `Promise.allSettled`, using `isSafeUrlForFetch` and `fetchWithRetry` (retries: 0, timeoutMs: 3000). Truncate large documents (e.g. 100,000 chars) to prevent ReDoS.
   - Scrape `mailto:` links across HTML documents (stripping query parameters like `?subject=...`).
   - Extract emails from visible body text and isolated footer sections (`/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi`), stripping `<script>`, `<style>`, `<svg>`.
   - Filter false-positive noise: discard matches ending in `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.css`, `.js`, `.map`, and test/example domains (`example.com`, `example.org`, `domain.com`).
   - Implement 7-role categorization:
     - `security`: /security|cert|psirt|cve|bounty|vuln|disclosure/i
     - `admin`: /admin|administrator|root|postmaster|hostmaster|sysadmin|noc|webmaster|infra/i
     - `sales`: /sales|billing|pricing|revenue|deals|buy|account-manager/i
     - `support`: /support|help|desk|service|care|assistance|customerservice/i
     - `legal`: /legal|privacy|dpo|gdpr|compliance|copyright|dmca|law|terms/i
     - `executive`: /ceo|cto|cfo|coo|ciso|president|founder|executive|director|partner/i
     - `general`: fallback default (also /info|hello|contact|inquiries|office|team/i)
     - Maintain compatibility for the existing `categorizeContactRole` export so existing tests in `src/__tests__/agents.test.ts` continue to pass.
   - Ensure `maskEmail` privacy masking is preserved for the public report.
3. Enhance `src/components/DomainIntelligenceView.tsx`:
   - Update `ROLE_BADGES` mapping with styling for all 7 canonical roles + legacy roles.
   - Render the role badge in the Public Contact Directory section.
4. Create unit tests in `src/__tests__/contact_discovery.test.ts` covering:
   - Scraping `/contact`, `/about`, `/team`, `/privacy`, `/imprint`
   - Mailto links with query parameters
   - Regex visible text extraction and asset noise filtering
   - Correct classification across all 7 canonical roles
   - Subpage timeout/404 resilience
5. Verification:
   - Run `npm test` (all existing tests + new tests must pass).
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run lint` (0 errors).
   - Run `npm run build` (succeeds).
6. Write handoff report to `j:\osint_tool\.agents\teamwork_preview_worker_m2_1\handoff.md`.
7. Send a completion message via send_message to the orchestrator.
