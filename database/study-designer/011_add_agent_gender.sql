-- ================================================================
-- MIGRATION: add agent_configurations.gender
-- Purpose:  Codify agent persona gender ('female' | 'male' | 'neutral').
--           Existing rows backfill to 'female' via the column default.
-- Prerequisite: 009_create_agent_configurations.sql has been applied.
-- Usage:    psql -U postgres -d postgres -f 011_add_agent_gender.sql
-- ================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agentgender') THEN
        CREATE TYPE agentgender AS ENUM ('female', 'male', 'neutral');
    END IF;
END$$;

ALTER TABLE agent_configurations
    ADD COLUMN IF NOT EXISTS gender agentgender NOT NULL DEFAULT 'female';

COMMIT;
