-- ================================================================
-- TABLE: research_participants
-- Purpose: Links a lead to a study. Cohort comes from the lead,
--          not from this table. Same lead can participate in
--          multiple studies.
-- Prerequisite: research_leads and designed_studies must exist.
-- Usage:  psql -U postgres -d postgres -f 005_create_research_participants.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS research_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id         UUID         NOT NULL REFERENCES research_leads(id) ON DELETE CASCADE,
    study_id        UUID         NOT NULL REFERENCES designed_studies(id) ON DELETE CASCADE,

    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',   -- PENDING, READY, PROCESSING, COMPLETED, FAILED
    meta_data       JSONB        NOT NULL DEFAULT '{}',

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_research_participant_lead_study UNIQUE (lead_id, study_id)
);

CREATE INDEX idx_research_participants_lead_id  ON research_participants(lead_id);
CREATE INDEX idx_research_participants_study_id ON research_participants(study_id);

COMMIT;
