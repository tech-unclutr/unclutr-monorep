#!/bin/bash
set -e

# Load variables
LOCAL_DB_URL="postgresql://param@localhost:5432/postgres"
# Load Supabase URL from backend/.env.production if available, or ask user
# We will assume it is passed as an argument or set in ENV
SUPABASE_DB_URL="${SUPABASE_DB_URL}"

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL is not set."
  echo "Usage: SUPABASE_DB_URL='...' ./scripts/migrate_to_supabase.sh"
  exit 1
fi

echo "🚀 Starting Migration from Local to Supabase..."
echo "Source: Local Postgres"
echo "Target: Supabase"

# 1. Bump Data
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="dump_${TIMESTAMP}.sql"

echo "📦 Dumping local database to ${DUMP_FILE}..."
# Exclude ownership/privileges to avoid conflicts with Supabase roles
pg_dump "$LOCAL_DB_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --exclude-schema=information_schema \
  --exclude-schema=extensions \
  > "$DUMP_FILE"

echo "✅ Dump complete. Size: $(du -h "$DUMP_FILE" | cut -f1)"

# 2. Restore to Supabase
echo "📤 Restoring to Supabase..."
# We use psql to restore. The password must be provided in the connection string or via PGPASSWORD
psql "$SUPABASE_DB_URL" < "$DUMP_FILE"

echo "✅ Migration Complete!"
echo "🧹 Cleaning up dump file..."
rm "$DUMP_FILE"
