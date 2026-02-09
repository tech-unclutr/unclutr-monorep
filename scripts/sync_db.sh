#!/bin/bash
# scripts/sync_db.sh - Helper to run migrations on a specific environment

ENV=$1

if [ "$ENV" == "prod" ]; then
    echo "⚠️  Running migrations on PRODUCTION..."
    export DATABASE_URL=$(grep PROD_DATABASE_URL .github/workflows/deploy.yml | cut -d: -f2) # Note: Just an example, better to use env file
    # Direct method:
    export DATABASE_URL=$(cat backend/.env.production | grep DATABASE_URL | cut -d= -f2)
elif [ "$ENV" == "dev" ]; then
    echo "Running migrations on DEVELOPMENT..."
    export DATABASE_URL=$(cat backend/.env | grep DATABASE_URL | cut -d= -f2)
else
    echo "Usage: ./scripts/sync_db.sh [dev|prod]"
    exit 1
fi

cd backend
alembic upgrade head
echo "✅ Migrations complete for $ENV"
