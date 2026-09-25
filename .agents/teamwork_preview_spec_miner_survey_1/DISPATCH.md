# Dispatch: Survey Spec Miner (R1 & R2)
Task: Investigate codebase for R1 (RDAP/WHOIS Domain Owner Identity Resolution) and R2 (Deep Email Discovery & Role Categorization).

## 2026-09-25T07:03:23Z
You are a Spec Miner investigating requirements R1 and R2 for v2.1 of the Internet Archaeologist Platform.

Your working directory is: j:\osint_tool\.agents\teamwork_preview_spec_miner_survey_1
The authoritative user request is at: j:\osint_tool\.agents\ORIGINAL_REQUEST.md

Objectives:
1. Thoroughly investigate the codebase regarding Requirement R1 (Domain Owner Identity Resolution):
   - Locate and examine `passiveReconAgent` and `sourceEnrichmentAgent`.
   - Analyze how RDAP/WHOIS data is currently fetched, parsed, and passed.
   - Determine how `vcardArray` and entity handles can be parsed to extract registrant name, organization, and country (or note privacy redaction).
   - Locate and examine `DomainIntelligenceView` component and how domain intelligence is displayed.
2. Thoroughly investigate the codebase regarding Requirement R2 (Deep Email Discovery & Role Categorization):
   - Locate and examine `contactDiscoveryAgent`.
   - Analyze current email discovery logic (how security.txt is currently handled).
   - Determine how to scrape HTML pages (`/contact`, `/about`, `/team`, `/privacy`, `/imprint`, footer), parse `mailto:` links, detect regex patterns in visible text.
   - Determine how to implement role categorization (security, admin, sales, support, legal, executive, general) and display in the UI with role badges.
3. Identify existing types, interfaces, state management, and file paths involved in R1 and R2.
4. Scope boundaries: You are READ-ONLY. Do NOT write code or modify files outside your working directory.
5. Write your complete findings and implementation specification to `j:\osint_tool\.agents\teamwork_preview_spec_miner_survey_1\handoff.md`.
6. Send a completion message via send_message to the orchestrator referencing your handoff.md.
