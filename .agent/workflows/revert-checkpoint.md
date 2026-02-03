---
description: Revert the database to the last marked 'stable' checkpoint.
---

This workflow restores the database from the snapshot created by `/mark-stable`.
Note: This only restores the database. To revert the code, you must manually run `git reset --hard stable`.

1. Run the revert stable script.
// turbo
2. `python3 backend/scripts/revert_stable.py`
