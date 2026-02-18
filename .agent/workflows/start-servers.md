---
description: Robustly start all development servers (Force Restart)
---
This workflow performs a clean restart of the development stack. It forcefully terminates existing processes to resolve conflicts before starting the Backend, Frontend, and Ngrok.

1. Stop existing servers and free up ports.
// turbo
```bash
cd backend
venv/bin/python scripts/stop_servers.py
```

2. Start the Backend Server.
```bash
# In a new terminal tab/window
cd backend
export DATABASE_URL="postgresql+asyncpg://param@localhost:5432/unclutr"
./scripts/start_backend.sh
```

3. Start the Frontend Server.
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
venv/bin/python scripts/verify_system.py
```
