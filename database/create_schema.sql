-- ================================================================
-- INDIA CONSUMER RESEARCH — SCHEMA CREATION SCRIPT
-- ================================================================
-- Source: docs/design-docs/schema.txt
-- Target: PostgreSQL 14+
-- Usage:  psql -U postgres -d postgres -f create_schema.sql
-- ================================================================

BEGIN;

-- ── Enums ──────────────────────────────────────

CREATE TYPE ownership_type AS ENUM ('owned', 'co_owned', 'consumed');
CREATE TYPE recommendation_tier AS ENUM ('must_have', 'good_to_have', 'advanced', 'overkill_early');
CREATE TYPE cost_tier AS ENUM ('DIY', 'lean', 'assisted', 'agency');
CREATE TYPE cadence_type AS ENUM ('always_on', 'quarterly', 'biannual_annual');


-- ================================================================
-- TABLE 1: study_categories
-- Purpose: Lookup for short canonical category labels (badges)
-- ================================================================

CREATE TABLE study_categories (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(120) NOT NULL UNIQUE,
    category_slug VARCHAR(120) NOT NULL UNIQUE
);


-- ================================================================
-- TABLE 2: industries
-- Purpose: One row per industry vertical. Drives the homepage
--          industry grid and each industry detail page.
-- ================================================================

CREATE TABLE industries (
    industry_id      SERIAL PRIMARY KEY,
    industry_name    VARCHAR(80)  NOT NULL UNIQUE,
    industry_slug    VARCHAR(80)  NOT NULL UNIQUE,
    illustration_key VARCHAR(80),
    is_popular       BOOLEAN      NOT NULL DEFAULT false,
    display_order    SMALLINT     NOT NULL DEFAULT 0
);


-- ================================================================
-- TABLE 3: departments
-- Purpose: Lookup for all team/department owners.
-- ================================================================

CREATE TABLE departments (
    dept_id       SERIAL PRIMARY KEY,
    dept_name     VARCHAR(80) NOT NULL UNIQUE,
    display_order SMALLINT    NOT NULL DEFAULT 0
);


-- ================================================================
-- TABLE 4: lifecycle_stages
-- Purpose: Lookup for product lifecycle stages.
-- ================================================================

CREATE TABLE lifecycle_stages (
    stage_id      SERIAL PRIMARY KEY,
    stage_name    VARCHAR(80) NOT NULL UNIQUE,
    display_order SMALLINT    NOT NULL DEFAULT 0
);


-- ================================================================
-- TABLE 5: startup_stages
-- Purpose: Lookup for startup maturity stages.
--          is_scale_only is derivable from this table.
-- ================================================================

CREATE TABLE startup_stages (
    stage_id      SERIAL PRIMARY KEY,
    stage_name    VARCHAR(40) NOT NULL UNIQUE,
    display_order SMALLINT    NOT NULL DEFAULT 0
);


-- ================================================================
-- TABLE 6: studies
-- Purpose: Core table. One row per research study (~91 rows).
-- ================================================================

CREATE TABLE studies (
    study_id                     SERIAL PRIMARY KEY,
    category_id                  INTEGER REFERENCES study_categories(category_id),
    study_family                 VARCHAR(200),
    study_name                   VARCHAR(200) NOT NULL UNIQUE,
    alternate_names              TEXT,
    tagline                      VARCHAR(200),
    signal_type                  VARCHAR(20),            -- Direct / Indirect / Mixed
    primary_goal                 TEXT,
    questions_answered           TEXT,
    decisions_unlocked           TEXT,
    best_timing_trigger          TEXT,
    frequency_cadence            VARCHAR(120),
    urgency                      VARCHAR(4),             -- P0 / P1 / P2 / P3
    practice_level               VARCHAR(20),            -- Standard / Good / Best / Optional
    priority_label               VARCHAR(40),            -- High Priority / Recommended / Optional
    dri_role                     VARCHAR(120),
    method_type                  VARCHAR(30),            -- Qualitative / Quantitative / Mixed-method / Experimental
    typical_sample_type          TEXT,
    typical_sample_size          VARCHAR(40),
    best_execution_method        TEXT,
    scrappy_version              TEXT,
    gold_standard_version        TEXT,
    india_execution_notes        TEXT,
    language_regional_notes      TEXT,
    online_vs_offline            VARCHAR(20),            -- Online / Offline / Both
    key_success_criteria         TEXT,
    guardrails_validity_checks   TEXT,
    output_artifact              TEXT,
    main_kpis_metrics            TEXT,
    common_mistakes              TEXT,
    time_to_insight              VARCHAR(40),
    main_cost_drivers            TEXT,
    roi_conditions               TEXT,
    priority_score               SMALLINT,
    roi_score                    VARCHAR(10),            -- High / Medium / Low
    notes_nuances                TEXT,
    requires_direct_touchpoint   BOOLEAN DEFAULT false,
    is_featured                  BOOLEAN DEFAULT false,
    is_prioritization_pack       BOOLEAN DEFAULT false,
    priority_rank                SMALLINT,
    why_it_matters_short         TEXT,
    canonical_industry_buckets   VARCHAR(200),
    is_locked                    BOOLEAN NOT NULL DEFAULT true,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ================================================================
-- TABLE 7: study_departments
-- Purpose: Many-to-many mapping of studies to departments,
--          with ownership type.
-- ================================================================

CREATE TABLE study_departments (
    id              SERIAL PRIMARY KEY,
    study_id        INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    dept_id         INTEGER NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,
    ownership_type  ownership_type NOT NULL DEFAULT 'owned',

    UNIQUE (study_id, dept_id)
);


-- ================================================================
-- TABLE 8: study_lifecycle_stages
-- Purpose: Many-to-many mapping of studies to lifecycle stages.
-- ================================================================

CREATE TABLE study_lifecycle_stages (
    id        SERIAL PRIMARY KEY,
    study_id  INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    stage_id  INTEGER NOT NULL REFERENCES lifecycle_stages(stage_id) ON DELETE CASCADE,

    UNIQUE (study_id, stage_id)
);


-- ================================================================
-- TABLE 9: study_startup_stages
-- Purpose: Many-to-many mapping of studies to startup stages.
-- ================================================================

CREATE TABLE study_startup_stages (
    id        SERIAL PRIMARY KEY,
    study_id  INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    stage_id  INTEGER NOT NULL REFERENCES startup_stages(stage_id) ON DELETE CASCADE,

    UNIQUE (study_id, stage_id)
);


-- ================================================================
-- TABLE 10: study_industries
-- Purpose: Many-to-many mapping of studies to industries,
--          with must_do / can_skip flags.
-- ================================================================

CREATE TABLE study_industries (
    id           SERIAL PRIMARY KEY,
    study_id     INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    industry_id  INTEGER NOT NULL REFERENCES industries(industry_id) ON DELETE CASCADE,
    must_do      BOOLEAN NOT NULL DEFAULT false,
    can_skip     BOOLEAN NOT NULL DEFAULT false,

    UNIQUE (study_id, industry_id)
);


-- ================================================================
-- TABLE 11: industry_recommendations
-- Purpose: Editorial recommendation tiers per industry per study.
-- ================================================================

CREATE TABLE industry_recommendations (
    id                   SERIAL PRIMARY KEY,
    industry_id          INTEGER NOT NULL REFERENCES industries(industry_id) ON DELETE CASCADE,
    study_id             INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    recommendation_tier  recommendation_tier NOT NULL,
    unique_notes         TEXT,

    UNIQUE (industry_id, study_id)
);


-- ================================================================
-- TABLE 12: study_costs
-- Purpose: Structured cost breakdown by execution tier.
-- ================================================================

CREATE TABLE study_costs (
    id           SERIAL PRIMARY KEY,
    study_id     INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    cost_tier    cost_tier NOT NULL,
    cost_min_inr INTEGER NOT NULL DEFAULT 0,
    cost_max_inr INTEGER,

    UNIQUE (study_id, cost_tier)
);


-- ================================================================
-- TABLE 13: study_cadence
-- Purpose: Maps each study to its research cadence type.
-- ================================================================

CREATE TABLE study_cadence (
    id            SERIAL PRIMARY KEY,
    study_id      INTEGER NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
    cadence_type  cadence_type NOT NULL,

    UNIQUE (study_id, cadence_type)
);


-- ================================================================
-- INDEXES (beyond the automatic PK / UNIQUE indexes)
-- ================================================================

CREATE INDEX idx_studies_category       ON studies(category_id);
CREATE INDEX idx_studies_urgency        ON studies(urgency);
CREATE INDEX idx_study_depts_study      ON study_departments(study_id);
CREATE INDEX idx_study_depts_dept       ON study_departments(dept_id);
CREATE INDEX idx_study_industries_study ON study_industries(study_id);
CREATE INDEX idx_study_industries_ind   ON study_industries(industry_id);
CREATE INDEX idx_study_lifecycle_study  ON study_lifecycle_stages(study_id);
CREATE INDEX idx_study_startup_study    ON study_startup_stages(study_id);
CREATE INDEX idx_study_costs_study      ON study_costs(study_id);
CREATE INDEX idx_study_cadence_study    ON study_cadence(study_id);
CREATE INDEX idx_industry_recs_ind      ON industry_recommendations(industry_id);
CREATE INDEX idx_industry_recs_study    ON industry_recommendations(study_id);


COMMIT;

-- ================================================================
-- Done! All 13 tables created.
-- Run insert_schema.sql next to seed lookup table data.
-- ================================================================
