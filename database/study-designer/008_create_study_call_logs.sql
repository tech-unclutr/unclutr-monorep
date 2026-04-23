-- ================================================================
-- TABLE: study_call_logs
-- Purpose: One row per Bolna API call attempt. A queue item retried
--          twice produces two rows. The webhook updates these.
-- Prerequisite: study_call_queue, study_executions, research_leads.
-- Usage:  psql -U postgres -d postgres -f 008_create_study_call_logs.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS study_call_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_item_id       UUID         NOT NULL REFERENCES study_call_queue(id),
    execution_id        UUID         NOT NULL REFERENCES study_executions(id),
    lead_id             UUID         NOT NULL REFERENCES research_leads(id),

    bolna_call_id       VARCHAR      NOT NULL UNIQUE,
    bolna_agent_id      VARCHAR      NOT NULL,

    call_status         VARCHAR(30)  NOT NULL DEFAULT 'initiated',
    call_outcome        VARCHAR(30),
    call_duration       INT          NOT NULL DEFAULT 0,
    total_cost          FLOAT        NOT NULL DEFAULT 0.0,
    currency            VARCHAR(10)  NOT NULL DEFAULT 'USD',

    transcript_summary  TEXT,
    full_transcript     TEXT,
    extracted_data      JSONB,
    termination_reason  VARCHAR,
    recording_url       VARCHAR,

    webhook_payload     JSONB        NOT NULL DEFAULT '{}',

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_call_logs_bolna_call_id ON study_call_logs(bolna_call_id);
CREATE INDEX idx_study_call_logs_queue_item_id ON study_call_logs(queue_item_id);
CREATE INDEX idx_study_call_logs_execution_id ON study_call_logs(execution_id);

COMMIT;
