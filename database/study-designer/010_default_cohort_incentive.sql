-- ================================================================
-- MIGRATION: default research_cohorts.incentive to 'No Incentive'
-- Purpose: every cohort carries an incentive selection; "No Incentive"
--          is the sentinel for "nothing offered". Backfills existing
--          NULLs, then enforces NOT NULL with a server-side default.
-- Prerequisite: 002_create_research_cohorts.sql has been applied.
-- Usage:  psql -U postgres -d postgres -f 010_default_cohort_incentive.sql
-- ================================================================

BEGIN;

UPDATE research_cohorts
SET incentive = 'No Incentive'
WHERE incentive IS NULL;

ALTER TABLE research_cohorts
    ALTER COLUMN incentive SET DEFAULT 'No Incentive',
    ALTER COLUMN incentive SET NOT NULL;

COMMIT;
