---
description: Revert the database to the last stable completely filled state.
---

This workflow wipes the current database and re-seeds it with all core entities, dev users, and stable mock data required for testing.

1. Run the unified restoration script.
// turbo
2. `python3 backend/scripts/restore_stable_state.py`

3. Verify System Health.
// turbo
4. `python3 backend/scripts/verify_system.py`
