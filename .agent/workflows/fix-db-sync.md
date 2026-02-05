---
description: Fix Database Sync 500 Error - Bulletproof Check & Restart
---

This workflow fixes persistent 500 errors on `/api/v1/auth/sync` and `/api/v1/onboarding/*` endpoints.
It addresses the root causes:
1. Python version incompatibilities (3.10 syntax in 3.9 env)
2. Missing database tables
3. Stale/Hung backend processes

**Steps:**

1. Check for Python 3.9 compatibility issues (Prevents silent startup crashes)
// turbo
2. cd backend && venv/bin/python3 check_compatibility.py

3. Initialize database tables (Ensures Schema Integrity)
// turbo
4. cd backend && venv/bin/python3 fix_db.py

5. Aggressively kill existing backend processes (Clears zombie processes on port 8000)
// turbo
6. lsof -t -i :8000 | xargs kill -9 2>/dev/null || true && pkill -f "uvicorn" || true

7. Start the backend server (Standard mode for stability)
// turbo
8. cd backend && /tmp/venv_unclutr/bin/uvicorn app.main:app --port 8000 > backend.log 2>&1 &

9. Wait for Health Check (Verifies server is ACTUALLY running)
// turbo
10. echo "Waiting for server..." && sh -c 'for i in $(seq 1 30); do if curl -s http://localhost:8000/health >/dev/null; then echo "Server is UP!"; exit 0; fi; sleep 1; done; echo "Server failed to start. Check backend.log"; exit 1'

11. Verify the fix (Mock Sync Request)
// turbo
12. cd backend && venv/bin/python3 test_auth_sync.py

**Expected Result:**
- ✓ Compatibility checks pass
- ✓ Database tables verified
- ✓ Old processes terminated
- ✓ Server explicitly confirmed "UP" via health check
- ✓ Auth sync simulation succeeds
