-- ================================================================
-- TABLE: research_questions
-- Purpose: Individual questions created by the study designer.
--          Extracted from designed_studies.topic_guide JSON into
--          proper rows for relational linking.
-- Prerequisite: designed_studies table must exist.
-- Usage:  psql -U postgres -d postgres -f 001_create_research_questions.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS research_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id        UUID         NOT NULL REFERENCES designed_studies(id) ON DELETE CASCADE,
    company_id      UUID         NOT NULL,

    text            TEXT         NOT NULL,
    type            VARCHAR(40)  NOT NULL DEFAULT 'open_ended',   -- open_ended, single_select, multiselect
    context         TEXT,                                          -- interviewer guidance: probes, what to listen for
    interview_mode  VARCHAR(20),                                   -- video_call, audio_call, chat
    participant_count INTEGER,                                     -- recommended sample size
    sort_order      INTEGER      NOT NULL DEFAULT 0,

    options         JSONB        NOT NULL DEFAULT '[]',            -- for select-type questions
    probes          JSONB        NOT NULL DEFAULT '[]',            -- follow-up probes
    stimulus        JSONB        NOT NULL DEFAULT '[]',            -- visual/audio stimuli

    meta_data       JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_questions_study_id   ON research_questions(study_id);
CREATE INDEX idx_research_questions_company_id ON research_questions(company_id);

COMMIT;
