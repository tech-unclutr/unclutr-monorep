-- ================================================================
-- INDIA CONSUMER RESEARCH — SEED DATA
-- ================================================================
-- Inserts lookup table data into the schema created by create_schema.sql
-- Usage:  psql -U postgres -d postgres -f insert_schema.sql
-- ================================================================

BEGIN;

-- ── Study Categories ───────────────────────────
INSERT INTO study_categories (category_name, category_slug) VALUES
    ('Foundational Market Understanding',              'foundational-market-understanding'),
    ('Customer / Audience Understanding',              'customer-audience-understanding'),
    ('Need / Pain-point Discovery',                    'need-pain-point-discovery'),
    ('Concept / Proposition Validation',               'concept-proposition-validation'),
    ('Product / UX Research',                          'product-ux-research'),
    ('Pricing / Monetization Research',                'pricing-monetization-research'),
    ('Acquisition / Growth Research',                  'acquisition-growth-research'),
    ('Retention / Loyalty / Churn Research',            'retention-loyalty-churn-research'),
    ('Continuous Listening / VoC / Tracking',           'continuous-listening-voc-tracking'),
    ('Brand / Positioning / Comms Research',            'brand-positioning-comms-research'),
    ('Shopper / Path-to-purchase / Retail Research',    'shopper-path-to-purchase-retail-research'),
    ('QSR / Sensory / Menu / Store Experience Research','qsr-sensory-menu-store-experience-research'),
    ('Service & Operations Research',                  'service-operations-research'),
    ('Community / Sentiment / Trust Research',          'community-sentiment-trust-research');


-- ── Industries ─────────────────────────────────
INSERT INTO industries (industry_name, industry_slug, illustration_key, is_popular, display_order) VALUES
    ('Fintech',             'fintech',             'fintech.png',             true,  1),
    ('D2C / Ecommerce',     'd2c-ecommerce',       'd2c.png',                true,  2),
    ('FMCG',                'fmcg',                'fmcg.png',               true,  3),
    ('Beauty',              'beauty',              'beauty.png',             true,  4),
    ('Fashion',             'fashion',             'fashion.png',            true,  5),
    ('Quick Commerce',      'quick-commerce',      'quick_commerce.png',     false, 1),
    ('QSR',                 'qsr',                 'qsr.png',                false, 2),
    ('Healthtech',          'healthtech',          'healthtech.png',         false, 3),
    ('Edtech',              'edtech',              'edtech.png',             false, 4),
    ('Travel',              'travel',              'travel.png',             false, 5),
    ('Media / OTT',         'media-ott',           'media_ott.png',          false, 6),
    ('Omnichannel Retail',  'omnichannel-retail',  'omnichannel_retail.png', false, 7),
    ('Hyperlocal',          'hyperlocal',          'hyperlocal.png',         false, 8),
    ('Franchise',           'franchise',           'franchise.png',          false, 9);


-- ── Departments ────────────────────────────────
INSERT INTO departments (dept_name, display_order) VALUES
    ('Founder''s Office',         1),
    ('Product',                   2),
    ('UX / Design',               3),
    ('Growth',                    4),
    ('Marketing',                 5),
    ('Brand',                     6),
    ('Product Marketing',         7),
    ('CRM / Lifecycle',           8),
    ('CX / Support',              9),
    ('Operations',               10),
    ('Category / Merchandising', 11),
    ('Revenue / Pricing',        12),
    ('Data / Analytics',         13),
    ('Strategy',                 14),
    ('Insights',                 15);


-- ── Lifecycle Stages ───────────────────────────
INSERT INTO lifecycle_stages (stage_name, display_order) VALUES
    ('Pre-idea',                      1),
    ('Idea validation',               2),
    ('Launch',                        3),
    ('PMF scale-up',                  4),
    ('Expansion',                     5),
    ('New category/geo expansion',    6);


-- ── Startup Stages ─────────────────────────────
INSERT INTO startup_stages (stage_name, display_order) VALUES
    ('0→1',    1),
    ('1→10',   2),
    ('10→100', 3),
    ('scale',  4);


COMMIT;
