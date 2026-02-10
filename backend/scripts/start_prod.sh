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

echo "Starting Uvicorn..."
# Exec into uvicorn to replace the shell process
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips '*'
