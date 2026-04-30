-- ================================================================
-- TABLE: agent_configurations
-- Purpose: Reusable execution-agent identity (name, voice, language),
--          company-scoped. A company can maintain multiple personas
--          (e.g. "Riya" for D2C consumer studies, "Jordan" for B2B
--          founder calls). Each ResearchCohort references one via
--          research_cohorts.agent_configuration_id.
-- Resolution chain (runtime): cohort.agent_configuration_id ->
--          company default (is_default=true) -> hardcoded fallback.
-- Prerequisite: research_cohorts must exist (002_create_research_cohorts.sql),
--          plus the `company` table.
-- Usage:  psql -U postgres -d postgres -f 009_create_agent_configurations.sql
-- ================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Voice provider enum ──────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voiceprovider') THEN
        CREATE TYPE voiceprovider AS ENUM ('bolna');
    END IF;
END$$;

-- ── Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_configurations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID         NOT NULL,

    name            VARCHAR(64)  NOT NULL,
    display_name    VARCHAR(128),
    description     VARCHAR(500),

    voice_id        TEXT         NOT NULL,
    voice_provider  voiceprovider NOT NULL DEFAULT 'bolna',
    language        TEXT         NOT NULL DEFAULT 'en-IN',

    is_default      BOOLEAN      NOT NULL DEFAULT false,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by      TEXT,

    CONSTRAINT uq_agent_configuration_company_name UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS ix_agent_configurations_company_id
    ON agent_configurations(company_id);

-- Exactly one default agent per company.
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_configuration_company_default
    ON agent_configurations(company_id)
    WHERE is_default = true;

-- ── FK on research_cohorts ──────────────────────────────────────
-- ON DELETE SET NULL preserves cohort data when an agent is deleted;
-- runtime falls back to the company default (or hardcoded fallback).
ALTER TABLE research_cohorts
    ADD COLUMN IF NOT EXISTS agent_configuration_id UUID
        REFERENCES agent_configurations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_research_cohorts_agent_configuration_id
    ON research_cohorts(agent_configuration_id);

-- ── Backfill: one default agent per existing company ────────────
INSERT INTO agent_configurations (
    company_id, name, display_name, description,
    voice_id, voice_provider, language, is_default
)
SELECT
    c.id,
    'Aditi',
    'Aditi — Default',
    'Auto-created default agent. Update name, voice, or language via the API.',
    'default',
    'bolna',
    'en-IN',
    true
FROM company c
ON CONFLICT (company_id, name) DO NOTHING;

-- ── Backfill: link existing cohorts to their company default ────
UPDATE research_cohorts rc
SET agent_configuration_id = ac.id
FROM agent_configurations ac
WHERE ac.company_id = rc.company_id
  AND ac.is_default = true
  AND rc.agent_configuration_id IS NULL;

COMMIT;
