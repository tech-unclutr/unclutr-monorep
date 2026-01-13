---
description: Start all development servers (Backend, Frontend, Ngrok)
---
This workflow starts the entire development stack. It ensures the Backend, Frontend, and Ngrok tunnel are running with the correct configurations to avoid connection errors.

1. Check if servers are already running.
// turbo
2. Start the Backend Server (if not running).
```bash
# In a new terminal tab/window
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

3. Start the Frontend Server (if not running).
```bash
# In a new terminal tab/window
cd frontend
npm run dev
```

4. Start Ngrok Tunnel (CRITICAL: Must use specific domain).
// turbo
```bash
# In a new terminal tab/window
ngrok http 8000 --domain=unwastable-godsent-see.ngrok-free.dev
```

5. Verify System Health.
// turbo
```bash
cd backend
source venv/bin/activate
python scripts/verify_system.py
```
