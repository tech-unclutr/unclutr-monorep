#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
VENV_PIP="$BACKEND_DIR/venv/bin/pip"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"
VENV_RUFF="$BACKEND_DIR/venv/bin/ruff"
VENV_UVICORN="$BACKEND_DIR/venv/bin/uvicorn"

echo "🚀 Starting Unclutr Backend..."
cd "$BACKEND_DIR"

# 1. Ensure Ruff is installed
if [ ! -f "$VENV_RUFF" ]; then
    echo "📦 Installing ruff for compatibility checks..."
    "$VENV_PIP" install ruff > /dev/null 2>&1
fi

# 2. Run Ruff to fix compatibility issues (Py3.10 syntax -> Py3.9)
echo "🧹 Checking & Fixing Python 3.9 compatibility..."
"$VENV_RUFF" check app --select UP,E,F --fix --target-version py39 > /dev/null 2>&1 || true

# 3. Kill existing processes on port 8000
echo "♻️  Cleaning up port 8000..."
lsof -t -i :8000 | xargs kill -9 2>/dev/null || true
pkill -f "uvicorn app.main:app" || true

# 4. Start Server
# 4. Start Server
echo "⚡ Starting Uvicorn Server..."
export PYTHONPATH=$PYTHONPATH:.
# We use standard mode (no --reload) for stability, but you can change it if needed.
"$VENV_UVICORN" app.main:app --port 8000 --reload > backend.log 2>&1
