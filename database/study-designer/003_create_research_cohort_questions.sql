-- ================================================================
-- TABLE: research_cohort_questions
-- Purpose: Links a question to a cohort with an interview type
--          bucket. Study context is implicit via question_id
--          (research_questions.study_id).
--          A question can appear in multiple cohorts/buckets.
-- Prerequisite: research_questions and research_cohorts must exist.
-- Usage:  psql -U postgres -d postgres -f 003_create_research_cohort_questions.sql
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS research_cohort_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id       UUID         NOT NULL REFERENCES research_cohorts(id) ON DELETE CASCADE,
    question_id     UUID         NOT NULL REFERENCES research_questions(id) ON DELETE CASCADE,

    interview_type  VARCHAR(20)  NOT NULL,   -- chat | audioA | audioB | audioC
    sort_order      INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT uq_research_cohort_question_type UNIQUE (cohort_id, question_id, interview_type)
);

CREATE INDEX idx_research_cohort_questions_cohort_id   ON research_cohort_questions(cohort_id);
CREATE INDEX idx_research_cohort_questions_question_id ON research_cohort_questions(question_id);

COMMIT;
