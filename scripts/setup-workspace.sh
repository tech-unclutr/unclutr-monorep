#!/bin/bash
# ================================================================
# scripts/setup-workspace.sh
#
# One-shot setup for a fresh Conductor workspace (or any clone):
#   - Copies .env files from your local stash (~/.config/squareup-dev/)
#   - Creates the backend venv and installs requirements (via uv)
#   - Installs frontend dependencies (npm install)
#
# First-time use: stash your env files once with
#     mkdir -p ~/.config/squareup-dev
#     cp backend/.env       ~/.config/squareup-dev/backend.env
#     cp frontend/.env.local ~/.config/squareup-dev/frontend.env.local
# Then in any new workspace:
#     ./scripts/setup-workspace.sh
# ================================================================

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_STASH="${HOME}/.config/squareup-dev"

echo "🛠  Setting up workspace at: $ROOT"

# ── 1. Copy env files from stash ────────────────────────────────
if [ -f "$ENV_STASH/backend.env" ]; then
    cp "$ENV_STASH/backend.env" "$ROOT/backend/.env"
    echo "✅ Copied backend/.env"
else
    echo "⚠️  Missing $ENV_STASH/backend.env — skipping backend env. Run:"
    echo "    mkdir -p $ENV_STASH && cp backend/.env $ENV_STASH/backend.env"
fi

if [ -f "$ENV_STASH/frontend.env.local" ]; then
    cp "$ENV_STASH/frontend.env.local" "$ROOT/frontend/.env.local"
    echo "✅ Copied frontend/.env.local"
else
    echo "⚠️  Missing $ENV_STASH/frontend.env.local — skipping frontend env. Run:"
    echo "    cp frontend/.env.local $ENV_STASH/frontend.env.local"
fi

# ── 2. Backend: venv + deps ─────────────────────────────────────
echo "🐍 Setting up backend venv..."
cd "$ROOT/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet uv
uv pip install -r requirements.txt
deactivate
echo "✅ Backend venv ready"

# ── 3. Frontend: npm install ────────────────────────────────────
echo "📦 Installing frontend dependencies..."
cd "$ROOT/frontend"
npm install --silent
echo "✅ Frontend dependencies installed"

cd "$ROOT"
echo ""
echo "🎉 Workspace ready. Start the apps with your Conductor Run configs:"
echo "    Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "    Frontend: cd frontend && npm run dev"
