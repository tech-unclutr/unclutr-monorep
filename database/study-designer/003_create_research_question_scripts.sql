-- ================================================================
-- TABLE: research_question_scripts
-- Purpose: Per-cohort, LLM-generated interview script. One row per
--          question, grouped by the study's Key Research Questions
--          (KRQs). Written by /study-planner/studies/{id}/cohorts/generate
--          and read by the Cohort Brief + Execution phases.
--          Replaces the legacy research_questions table.
-- Prerequisite: designed_studies and research_cohorts tables must exist.
-- Usage:  psql -U postgres -d postgres -f 003_create_research_question_scripts.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS research_question_scripts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id           UUID             NOT NULL REFERENCES research_cohorts(id)  ON DELETE CASCADE,
    study_id            UUID             NOT NULL REFERENCES designed_studies(id)  ON DELETE CASCADE,
    company_id          UUID             NOT NULL,

    -- KRQ grouping (1-based index into designed_studies.key_research_questions)
    krq_index           INTEGER          NOT NULL,
    krq_section_text    TEXT             NOT NULL,        -- frozen copy of the KRQ text at generation time
    krq_sort_order      INTEGER          NOT NULL DEFAULT 0,

    -- Question
    question_number     INTEGER          NOT NULL,        -- "QX" from the prompt
    sort_order          INTEGER          NOT NULL DEFAULT 0,   -- ordering within the KRQ group
    text                TEXT             NOT NULL,
    uncovers            TEXT             NOT NULL DEFAULT '',
    objective_link      TEXT             NOT NULL DEFAULT '',
    tag                 TEXT             NOT NULL DEFAULT '',
    depth               INTEGER          NOT NULL DEFAULT 1,   -- 1 = surface, 2 = deep
    type_descriptor     TEXT             NOT NULL DEFAULT '',
    probes              JSONB            NOT NULL DEFAULT '[]',
    estimated_minutes   DOUBLE PRECISION NOT NULL DEFAULT 0,
    priority            VARCHAR(40)      NOT NULL DEFAULT 'must_ask',  -- "must_ask" | "if_time_permits"

    created_at          TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_question_scripts_cohort_id  ON research_question_scripts(cohort_id);
CREATE INDEX idx_research_question_scripts_study_id   ON research_question_scripts(study_id);
CREATE INDEX idx_research_question_scripts_company_id ON research_question_scripts(company_id);

COMMIT;
