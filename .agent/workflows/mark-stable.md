---
description: Mark the current codebase and database state as 'stable' (Checkpoint).
---

This workflow creates a snapshot of the current database and tags the git repository, allowing you to revert to this exact state later.

1. Run the mark stable script.
// turbo
2. `python3 backend/scripts/mark_stable.py`
