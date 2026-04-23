-- ================================================================
-- TABLE: study_executions
-- Purpose: One execution session per study. Created when the user
--          enters the Execute phase in Study Planner.
-- Prerequisite: designed_studies must exist.
-- Usage:  psql -U postgres -d postgres -f 006_create_study_executions.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS study_executions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id              UUID         NOT NULL REFERENCES designed_studies(id),
    company_id            UUID         NOT NULL,

    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',

    bolna_agent_id        VARCHAR,
    call_duration         INT          NOT NULL DEFAULT 600,

    cohort_interview_map  JSONB        NOT NULL DEFAULT '{}',
    execution_config      JSONB        NOT NULL DEFAULT '{"max_concurrent_calls": 2}',
    meta_data             JSONB        NOT NULL DEFAULT '{}',

    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_executions_study_id ON study_executions(study_id);

COMMIT;
