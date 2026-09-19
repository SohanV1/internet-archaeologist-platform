# Contributing to Internet Archaeologist Platform

Thank you for your interest in contributing to the **Internet Archaeologist Platform**! This document provides guidelines for code contributions, commit conventions, branch workflows, and the pull request review process.

---

## 1. Code of Conduct & Principles

* **Passive OSINT Only**: All features must remain 100% passive. We never conduct port scans, vulnerability probes, or invasive exploits. We only consume public records (DNS-over-HTTPS RFC 8484, Certificate Transparency RFC 6962, Wayback Machine CDX API, and BGP/ASN routing tables).
* **Forensic Integrity**: All data observations must include provenance hashes (SHA-256), source timestamps, and confidence scores.
* **Strict Type Safety**: Full TypeScript coverage with strict mode; zero `any` types in production paths.

---

## 2. Branch Naming Conventions

All feature branches should branch from `main` and follow these prefix conventions:

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feat/` | New features or functional modules | `feat/d3-treemap-analytics` |
| `fix/` | Bug fixes or forensic calculation corrections | `fix/snapshot-key-collision` |
| `perf/` | Performance optimizations or bundle reduction | `perf/lazy-load-tab-views` |
| `refactor/` | Code refactoring without behavioral changes | `refactor/resilient-fetch-retry` |
| `docs/` | Documentation additions or updates | `docs/architecture-overview` |
| `test/` | Adding or updating unit/integration tests | `test/jest-coverage-suite` |
| `chore/` | Tooling, dependencies, or CI updates | `chore/eslint-prettier-upgrade` |

---

## 3. Commit Message Guidelines

We enforce the **Conventional Commits** specification:

```
<type>(<scope>): <short description in imperative mood>

[optional body explaining why and what changed]

[optional footer(s)]
```

### Types:
* `feat`: A new user-facing or forensic feature
* `fix`: A bug fix or patch
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (whitespace, formatting)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `build`: Changes that affect the build system or external dependencies
* `ci`: Changes to CI configuration files and scripts (GitHub Actions, Netlify)
* `chore`: Maintenance tasks and routine updates

### Examples:
```bash
feat(analytics): add D3 treemap and LOC velocity per git commit
fix(history): resolve snapshot ID key collisions with unique hash generator
test(crypto): add Web Crypto SHA-256 verification test suite
```

---

## 4. Development Workflow

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SohanV1/osint_tool.git
   cd osint_tool
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   # Open http://localhost:5006 in your browser
   ```

4. **Verify quality standards before committing**:
   ```bash
   # Run TypeScript compilation check
   npm run typecheck

   # Run ESLint static analysis
   npm run lint

   # Run Prettier code formatting
   npm run format

   # Run Jest test suite with coverage enforcement
   npm run test:coverage
   ```

---

## 5. Pull Request (PR) Review Process

When opening a Pull Request:

1. **Fill out the PR Template**:
   - Provide a clear summary of the changes.
   - Link related issue numbers or discussion threads.
   - Document testing steps with screenshots or reproduction scripts.

2. **CI Pipeline Requirements**:
   - The GitHub Actions CI pipeline must pass completely:
     - `npm run typecheck` (zero TypeScript errors)
     - `npm run lint` (zero ESLint warnings/errors)
     - `npm run test:coverage` (code coverage must stay at or above **80%**)
     - `npm run build` (Turbopack production build must compile without warnings)

3. **Code Review Criteria**:
   - Clean, readable, idiomatic React 19 / Next.js 16 code.
   - Component memoization (`React.memo`, `useMemo`, `useCallback`) on computationally intensive operations.
   - Proper error handling and retry mechanisms on network fetches.
   - Dark and Light theme compatibility across all interactive UI components.
