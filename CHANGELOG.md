# Changelog

All notable changes to this project will be documented in this file.

## [0.0.5] - 2026-01-09
### Integrations Page v1 Completed

#### Frontend
- **Integrations Redesign**:
  - Implemented a premium "15/10" aesthetic across the entire Integrations page.
  - Added interactive empty state cards for "My Datastack" with redirection to the onboarding flow.
  - Refined the "Onboarding Data" summary card in Settings with a more professional placeholder UI.
  - Unified search functionality to filter both connected and available integrations globally.
  - Switched to a responsive 3-column grid layout for better spacing and content density.
  - Compacted the "Privacy Trust Bar" into a sleek, pill-shaped header with SOC 2/AES-256 badges.
- **Integration Cards**:
  - Added hover-reveal functionality for truncated integration descriptions.
  - Enhanced action buttons with vivid gradients, colored shadows, and smooth hover lifts.
  - Introduced a "Settings" gear icon for pre-connected tools to allow configuration before full connection.
  - Added a pulse-animated "In Your Stack" badge for visual feedback.
  - Implemented "Coming Soon" eyebrow labels for unreleased integrations.
- **Animations**:
  - Replaced "pop" animations with a smooth linear **slide-from-right** for the Integration Drawer.
  - Optimized Tailwind v4 theme keyframes for cleaner entrance and exit transitions.

#### Backend
- **Core Logic**:
  - Implemented a "Deep Disconnect" feature that recursively scrubs datasource slugs and IDs from Company records.
  - Updated `disconnect_integration` service to also clean up associated `onboarding_state` records for all company users.
  - Fixed a persistent issue where JSONB fields (stack/channels summaries) weren't being correctly persisted in the database by adding explicit mutation tracking (`flag_modified`).
- **Integration Service**:
  - Added automated stack reconciliation to ensure the dashboard reflects the user's latest onboarding choices.
- **API Improvements**:
  - Refined the `/integrations` router to handle manual datasource additions and stack cleanup.

#### Infrastructure
- **Sentry**:
  - Configured Sentry to initialize exclusively in production environments to avoid noise during local development.
