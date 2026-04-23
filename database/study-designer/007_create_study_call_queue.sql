-- ================================================================
-- TABLE: study_call_queue
-- Purpose: Work queue for voice calls. One row per (lead × interview_type).
--          A lead whose cohort maps to [15, 60] gets two rows.
-- Prerequisite: study_executions, research_participants, research_leads.
-- Usage:  psql -U postgres -d postgres -f 007_create_study_call_queue.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS study_call_queue (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id      UUID         NOT NULL REFERENCES study_executions(id) ON DELETE CASCADE,
    participant_id    UUID         NOT NULL REFERENCES research_participants(id),
    lead_id           UUID         NOT NULL REFERENCES research_leads(id),

    interview_type    INT          NOT NULL,
    cohort_name       VARCHAR(120) NOT NULL,
    prompt_text       TEXT,

    status            VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    execution_count   INT          NOT NULL DEFAULT 0,
    priority_score    INT          NOT NULL DEFAULT 0,
    outcome           TEXT,
    scheduled_for     TIMESTAMPTZ,

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_call_queue_execution_id ON study_call_queue(execution_id);
CREATE INDEX idx_study_call_queue_status ON study_call_queue(status);
CREATE INDEX idx_study_call_queue_lead_id ON study_call_queue(lead_id);

COMMIT;
