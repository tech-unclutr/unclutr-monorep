-- ================================================================
-- TABLE: research_cohorts
-- Purpose: Independent cohort entity, company-scoped.
--          Cohorts are defined at the lead level — a lead belongs
--          to a cohort. Not tied to any specific study.
-- Usage:  psql -U postgres -d postgres -f 002_create_research_cohorts.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS research_cohorts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID         NOT NULL,

    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    incentive       TEXT,

    meta_data       JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_research_cohort_company_name UNIQUE (company_id, name)
);

CREATE INDEX idx_research_cohorts_company_id ON research_cohorts(company_id);

COMMIT;
