-- ============================================================================
-- Table: designed_studies
-- Purpose: Persist studies created via the Study Designer AI flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS designed_studies (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID            NOT NULL,
    user_id         VARCHAR         NOT NULL,
    title           VARCHAR         NOT NULL,
    status          VARCHAR         NOT NULL DEFAULT 'DRAFT',

    -- Core study fields
    briefing                TEXT            DEFAULT '',
    emotion_detection       BOOLEAN         NOT NULL DEFAULT FALSE,
    participant_languages   JSONB           NOT NULL DEFAULT '["English"]'::jsonb,
    reporting_language      VARCHAR         NOT NULL DEFAULT 'English',

    -- Nested structures stored as JSON
    advanced_settings       JSONB           NOT NULL DEFAULT '{
        "maxDuration": 30,
        "recordVideo": true,
        "recordAudio": true,
        "allowSkipQuestions": false
    }'::jsonb,

    welcome_page            JSONB           NOT NULL DEFAULT '{
        "title": "",
        "description": ""
    }'::jsonb,

    -- Full topic guide: { introQuestions: [...], objectives: [...] }
    -- Each objective: { id, title, description, questions: [...] }
    -- Each question:  { id, text, type, context, participantCount, interviewMode, options?, probes?, stimulus? }
    topic_guide             JSONB           NOT NULL DEFAULT '{
        "introQuestions": [],
        "objectives": []
    }'::jsonb,

    -- Optional: persist AI conversation so user can resume designing
    conversation_history    JSONB           DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_designed_studies_company_id
    ON designed_studies (company_id);

CREATE INDEX IF NOT EXISTS idx_designed_studies_user_id
    ON designed_studies (user_id);

CREATE INDEX IF NOT EXISTS idx_designed_studies_status
    ON designed_studies (status);

-- ── Constraints ──────────────────────────────────────────────────────────────

-- Prevent duplicate study titles within a company
ALTER TABLE designed_studies
    ADD CONSTRAINT uq_company_study_title UNIQUE (company_id, title);

-- Valid status values
ALTER TABLE designed_studies
    ADD CONSTRAINT chk_designed_studies_status
    CHECK (status IN ('DRAFT', 'READY', 'ACTIVE', 'ARCHIVED'));

-- ── Auto-update trigger for updated_at ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_designed_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_designed_studies_updated_at ON designed_studies;
CREATE TRIGGER trg_designed_studies_updated_at
    BEFORE UPDATE ON designed_studies
    FOR EACH ROW
    EXECUTE FUNCTION update_designed_studies_updated_at();
