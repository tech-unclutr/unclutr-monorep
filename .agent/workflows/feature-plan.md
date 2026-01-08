---
description: Create a comprehensive implementation strategy for a new feature, covering all states and technical layers.
---
1. **Define Core Values & Constraints**:
    - Identify dominant themes (e.g., "Data Privacy", "Speed", "Simplicity").
    - Explicitly state how these will be upheld in both UI and API (e.g., using tooltips for privacy, Row-Level Security for safety).

2. **Map Functional States**:
    - Define exactly how the feature looks and behaves in:
        - **Empty State**: (e.g., No data from onboarding).
        - **In-Progress State**: (e.g., One integration connected, others pending).
        - **Full State**: (e.g., All datsources connected).
        - **Partial/Limbo state**: (e.g., External data added but not yet linked).
        - **Error State**: (e.g., API failure or invalid credentials).

3. **Data & Schema Audit**:
    - List all tables affected (e.g., `Company`, `Integration`, `OnboardingState`).
    - Define necessary schema changes or new JSON structures.
    - Plan how the "Source of Truth" is maintained (e.g., "Syncing from Company table").

4. **Component & Service Breakdown**:
    - **Frontend**: List new components to create and existing ones to modify.
    - **Backend**: List new endpoints, middleware changes, or service logic (CRUD operations).

5. **UX Journey & Friction Check**:
    - Outline the user journey for each state.
    - Identify "Encouragement Points" (e.g., prompting users to connect more datasources if partial).
    - Plan feedback loops (Toasts, loaders, success animations).

6. **Safety & Security Checklist**:
    - Verify data isolation (Stamping System).
    - Ensure sensitive credentials are never exposed to the frontend.

7. **Suggest "100x Magical Things"**:
    - Consider the psychology of the ICP (D2C Brand Owners).
    - What would make them feel 100% safe?
    - What would give them an "Aha!" moment in the first 10 seconds?
    - Suggest features that go way beyond the status quo (e.g., proactive data health checks, "Privacy Shield" visual indicators, automated mapping previews).

8. **Grade the Plan Depth (1-10)**:
    - **Criteria**: Technical depth, coverage of all states, alignment with core values, and the "Magic Factor".
    - **If Grade < 10**: Rework the plan immediately. Identify what's missing or "standard" and replace it with something "Magical" until the plan is a solid 10+.

9. **Sync with implementation_plan.md**:
    - Synthesize all the above into a standard `implementation_plan.md` for user approval.
    - **Boldly highlight the "Magical" features**.
