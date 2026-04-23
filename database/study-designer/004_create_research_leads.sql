-- ================================================================
-- TABLE: research_leads
-- Purpose: Independent lead entity. A person who can participate
--          in multiple studies. Belongs to a cohort.
--          Company-scoped, deduplicated by contact_number.
-- Prerequisite: research_cohorts must exist.
-- Usage:  psql -U postgres -d postgres -f 004_create_research_leads.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS research_leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID         NOT NULL,
    cohort_id       UUID                  REFERENCES research_cohorts(id) ON DELETE SET NULL,

    first_name      TEXT         NOT NULL,
    last_name       TEXT,
    contact_number  VARCHAR(30)  NOT NULL,
    contact_profile JSONB        NOT NULL DEFAULT '{}',
    -- ^ first_name, email, company_name, linkedin_url, job_title, etc.

    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE, ARCHIVED
    meta_data       JSONB        NOT NULL DEFAULT '{}',

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_research_lead_company_phone UNIQUE (company_id, contact_number)
);

CREATE INDEX idx_research_leads_company_id ON research_leads(company_id);
CREATE INDEX idx_research_leads_cohort_id  ON research_leads(cohort_id);

COMMIT;
