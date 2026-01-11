---
description: Perform a repeatable, in-depth E2E testing audit and strategy design for a feature (The "QA Architect" process).
---

# /qa-blueprint

Use this workflow to design exhaustive, repeatable test plans for mission-critical features without degrading existing UI/UX.

## 1. Context Gathering
Identify the core components of the feature:
- Product/App type
- Feature Description & UI Location
- Tech Stack (FE, BE, DB, Queue, Auth)
- Integrations (Shopify, Webhooks, etc.)
- Data Model & Permissions
- Performance/SLA & Historical risks

## 2. Produce Sections A-H
Draft the following sections in a dedicated `qa_plan.md` artifact:

### A) Test Strategy
- Scope vs. Non-Scope
- Risks & Mitigations
- Test Pyramid (Logic/Integration/E2E)
- Environment & Data Strategy

### B) Exhaustive Test Matrix
Create a table with:
- **ID & Title**
- **Category** (Happy/Edge/Negative/Security/etc)
- **Steps** (Click-by-click / API-by-API)
- **Expected Outcomes** (UI + Backend + Analytics)
- **P0/P1/P2 Priority**

### C) State Machine / Flow Coverage
- Enumerate all states (`PENDING`, `ACTIVE`, `FAILED`, etc.)
- Define transitions and triggers.
- Identify "impossible states" and guards.

### D) Edge Case & Failure Mode Library
- Network timeouts, partial responses, retries.
- Race conditions (double clicks, concurrent updates).
- Permission breaks, data corruption, schema drift.
- Webhook out-of-order delivery.

### E) Observability & Debug Plan
- Log masking rules (PII/Secret protection).
- Critical Traces/Spans.
- "Golden Signals" (Error rate, Latency, Queue depth).
- Kill switch/Feature flag strategy.

### F) Implementation Plan for Testing
- Stable selectors/Test IDs.
- Data factories/fixtures.
- Contract tests for 3rd party integrations.
- CI/CD integration and flake controls.

### G) Quality Gate: Score + Iteration
1. Rate the plan out of 10 based on **Coverage**, **Safety**, **Actionability**, and **Observability**.
2. Iterate until the plan reaches "15/10" by strengthening reliability controls.

### H) Final QA Verdict Report
- Summary of coverage.
- Top 10 risks.
- P0 Ship Blockers.
- Recommended Release Checklist.

### I) Coding Practices Audit (Full Stack)
- **Code Quality Assessment**: Audit against global best practices (clean code, SOLID, DRY).
- **Security Audit**: Check for hardcoded secrets, SQL injection vectors, and improper error handling.
- **Performance Audit**: Identify N+1 queries, heavy frontend re-renders, or unoptimized assets.
- **Maintenance Audit**: Evaluate documentation, naming consistency, and technical debt.
- **Improvement Roadmap**: 
  - Suggest non-breaking refactors.
  - Provide code snippets for "Premium" implementation.
  - Ensure zero regression safety by emphasizing backward compatibility.

## 3. Quality Gate: Score + Iteration
1. Rate the plan out of 10 based on **Coverage**, **Safety**, **Actionability**, **Observability**, and **Coding Excellence**.
2. **Global Best Practices Check**: If the Coding Practices Audit (Section I) score is below 9/10, you MUST:
   - Identify specific gaps in the current implementation.
   - Propose safe, non-invasive refactors that improve the score.
   - Iteratively improve the entire QA Blueprint until it reaches "15/10" status.
3. Ensure all suggested improvements are backward-compatible and do not alter working UI/UX flows unless strictly required for a critical bug fix.

## 4. Automation Strategy
Identify which P0 cases should be automated immediately (Playwright/Cypress/Pytest) vs. manual verification.
