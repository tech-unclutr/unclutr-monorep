---
description: Fix 500/CORS errors on the integrations page by repairing database constraints and healing the sync state.
---

1. Ensure the backend virtual environment is active.
// turbo
2. Run the integration healing script:
   ```bash
   cd backend && source venv/bin/activate && export PYTHONPATH=$PYTHONPATH:. && python3 scripts/heal_integrations.py
   ```
3. Verify that the integrations page loads correctly without errors.
