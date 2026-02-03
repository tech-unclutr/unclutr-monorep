---
description: Revert the database DATA ONLY to the last marked 'stable' checkpoint (Preserves Schema).
---

This workflow restores the database data from the snapshot created by `/mark-stable` but **DOES NOT** drop or recreate tables. It is safe to use when you have local schema changes.

1. Run the data-only restoration script.
// turbo
2. `python3 backend/scripts/restore_data_only.py`
