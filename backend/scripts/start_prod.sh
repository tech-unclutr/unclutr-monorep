#!/bin/sh
set -e

echo "=========================================="
echo "Starting SquareUp Backend Container"
echo "=========================================="
echo "Current User: $(whoami)"
echo "Current Directory: $(pwd)"
echo "Python Version: $(python3 --version)"

# Debug Environment
echo "PORT: ${PORT:-8080}"
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set!"
else
    echo "DATABASE_URL is set (length: ${#DATABASE_URL})"
fi

# Check critical files
if [ -f "app/main.py" ]; then
    echo "Found app/main.py"
else
    echo "ERROR: app/main.py not found!"
    ls -R
fi

# Dump environment (redacting sensitive vars)
echo "Environment Check:"
pip list | grep -E "uvicorn|fastapi|asyncpg|sqlalchemy" || echo "Warning: Some packages not found in pip list"

# Verify App Import works ISOLATED from Uvicorn
echo "Verifying App Import..."
if python3 -c "from app.main import app; print('>>> IMPORT SUCCESS <<<')"; then
    echo "App import check passed."
else
    echo "!!! APP IMPORT FAILED !!!"
    # We exit here to show the crash logs immediately
    exit 1
fi

echo "Starting Uvicorn..."
# Exec into python module to avoid PATH issues and replace shell
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips '*' --log-level debug
