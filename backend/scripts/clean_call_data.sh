#!/bin/bash
# Clean all call-related data using SQL

echo "🧹 Cleaning all call-related data..."

# Load environment variables
source .env

# Execute cleanup SQL
psql "$DATABASE_URL" << 'EOF'
-- Delete all call logs
DELETE FROM call_logs;

-- Delete all Bolna execution maps
DELETE FROM bolna_execution_map;

-- Delete all campaign events  
DELETE FROM campaign_events;

-- Delete all call raw data
DELETE FROM call_raw_data;

-- Reset queue items to PENDING state
UPDATE queue_items 
SET 
    status = 'PENDING',
    outcome = NULL,
    execution_count = 0,
    scheduled_for = NULL,
    locked_by_user_id = NULL,
    locked_at = NULL
WHERE status NOT IN ('PENDING', 'SCHEDULED');

-- Show counts
SELECT 
    (SELECT COUNT(*) FROM call_logs) as call_logs,
    (SELECT COUNT(*) FROM bolna_execution_map) as exec_maps,
    (SELECT COUNT(*) FROM campaign_events) as events,
    (SELECT COUNT(*) FROM call_raw_data) as raw_data,
    (SELECT COUNT(*) FROM queue_items WHERE status = 'PENDING') as pending_items;
EOF

echo "✅ Cleanup complete!"
