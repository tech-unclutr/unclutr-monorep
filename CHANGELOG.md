# Changelog

All notable changes to this project will be documented in this file.

## [1.1.4-stable] - 2026-02-10
### MVP v1 - High Intent Call Scheduler

#### Backend
- **Scheduler**: Implemented `QueueWarmer` for dynamic, concurrency-aware lead orchestration.
- **Callbacks**: Added robust "Call me back" detection and automated scheduling system.
- **Priority Engine**: Scheduled leads automatically receive high priority (`Score: 999`) upon wake-up.
- **Campaign Control**: Introduced `Reset Campaign` logic that protects `INTENT_YES`, `SCHEDULED`, and `CONSUMED` states while retrying failures.
- **Dispositions**: Standardized granular call states across the entire ecosystem.
- **Service Layer**: Deep refactoring of `campaign_service`, `user_queue_service`, and `execution_service` for high-throughput stability.

#### Frontend
- **Execution Panel**: Premium real-time oversight for active campaigns with live status updates.
- **Campaign Management**: Integrated "Reset" and "Pause/Resume" controls with state safety.
- **UI/UX**: Refined `CampaignCard` and `CallLogTable` for better information density and visual clarity.
- **Auth & Onboarding**: Fixed flickering and timeout issues in `AuthProvider` and `OnboardingGuard`.
- **Transitions**: Polished page transitions and loading states for a premium "15/10" feel.

## [1.1.3-stable] - 2026-02-05
### Behind the Scene Execution Panel - Fully Working

#### Backend
- **Campaign Intelligence**: Fully implemented the background execution engine for campaigns.
- **Shopify Integration**: Robust stability overhaul and financial accuracy alignment (penny-perfect historical and delta sync).
- **Architecture**: Improved transaction handling and backend synchronization logic.
- **Sentry**: Optimized initialization for backend monitoring.

#### Frontend
- **UI Architecture**: Implemented premium "Behind the scene execution panel" for real-time campaign oversight.
- **Transitions**: Refined UI fluidity with abstract MagicLoader and premium transition effects.
- **State Management**: Enhanced auth context and onboarding guard reliability.
- **UX**: Eliminated UI flickering (FOUC) during authentication refreshes.

## [1.1.2] - 2026-02-01
### Stability & Documentation
- Added comprehensive local setup guide.
- Refined campaign intelligence for initial v1.1.2 release.

## [1.1.1-stable] - 2026-02-01
### Enhanced Campaign Management & Calendar Integration
- Premium UI polish for campaign dashboard and calendar views.

## [1.1.0-stable] - 2026-02-01
### Minimalist UI Refinements
- Bug fixes and transition to a more minimalist subtle aesthetic.

## [1.0.0-stable] - 2026-01-29
### Initial MVP Infrastructure
- Core Unclutr MVP release with foundational auth and integration support.

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
