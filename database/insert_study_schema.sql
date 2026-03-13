-- ================================================================
-- INDIA CONSUMER RESEARCH — STUDY DATA SEED
-- ================================================================
-- Populates: studies, study_departments, study_industries
-- Prerequisite: Run create_schema.sql and insert_schema.sql first
-- Usage:  psql -U postgres -d postgres -f insert_study_schema.sql
-- ================================================================

BEGIN;

-- ── Studies ─────────────────────────────────────

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (1, 'Foundational market understanding', 'Usage & Attitude (U&A) study', 'Quantify who uses the category, for what occasions, and what drives choice', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (2, 'Foundational market understanding', 'Category entry points (CEP) / trigger moments study', 'Map real-life moments that trigger category consideration and purchase', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (3, 'Foundational market understanding', 'Need-gap / whitespace mapping', 'Identify unmet needs and underserved segments worth building for', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (4, 'Foundational market understanding', 'Market landscape & competitor mapping (India-first)', 'Understand category structure, competitor set, price bands and channels in India', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (5, 'Foundational market understanding', 'New geography entry research (city/state)', 'De-risk entry into a new city/region', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (6, 'Foundational market understanding', 'Seasonal / festive behavior study', 'Plan inventory, promos, and messaging around Indian seasonality', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (7, 'Customer / audience understanding', 'Consumer ICP definition (B2C ICP)', 'Define who you win with and who you should stop targeting', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (8, 'Customer / audience understanding', 'Persona / archetype development (behavior-grounded)', 'Create vivid, behavior-based personas for cross-functional alignment', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (9, 'Customer / audience understanding', 'Cohort profiling & behavioral segmentation', 'Segment users by actual behavior for targeting and personalization', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (10, 'Customer / audience understanding', 'Needs-based segmentation (quant + qual)', 'Create scalable segments for targeting and personalization', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (11, 'Customer / audience understanding', 'Psychographic segmentation', 'Understand deeper motivations beyond behavior', 'P3', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (12, 'Customer / audience understanding', 'Early adopter study', 'Find the first cohort that will tolerate MVP gaps and spread word', 'P1', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (13, 'Need / pain-point discovery', 'Exploratory discovery interviews', 'Learn what matters before you have a hypothesis', 'P0', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (14, 'Need / pain-point discovery', 'Ethnography / contextual inquiry (in-home/in-context)', 'Observe real behavior in context to find unarticulated needs', 'P1', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (15, 'Need / pain-point discovery', 'Focus groups / mini-groups', 'Surface language, norms, and reactions', 'P2', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (16, 'Need / pain-point discovery', 'Co-creation workshop', 'Generate solutions with customers and pressure-test feasibility', 'P2', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (17, 'Need / pain-point discovery', 'Day-in-the-life study', 'Understand routines and context deeply', 'P2', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (18, 'Need / pain-point discovery', 'JTBD interviews (jobs-to-be-done)', 'Learn why customers hire/fire products in their own language', 'P0', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (19, 'Concept / proposition validation', 'Concept test (monadic) + qual follow-up', 'Validate proposition resonance before committing to build', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (20, 'Concept / proposition validation', 'Claims test (credibility + proof needs)', 'Learn which claims resonate and which need proof', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (21, 'Concept / proposition validation', 'Naming test', 'Pick a name that conveys the right message', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (22, 'Concept / proposition validation', 'Message hierarchy test', 'Pick the best order of messages/benefits', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (23, 'Concept / proposition validation', 'PMF survey (Sean Ellis)', 'Quantify PMF signal with verbatims', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (24, 'Concept / proposition validation', 'Kano study', 'Classify features by impact on satisfaction', 'P2', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (25, 'Product / UX research', 'Usability testing (moderated, qualitative)', 'Find usability issues before they reach production', 'P0', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (26, 'Product / UX research', 'Prototype test (lo-fi to hi-fi)', 'Validate designs before dev commitment', 'P0', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (27, 'Product / UX research', 'Checkout / payment flow research', 'Reduce drop-off at the highest-leverage point', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (28, 'Product / UX research', 'First-time user experience (FTUE) / onboarding study', 'Optimize the first session for habit formation', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (29, 'Product / UX research', 'Session replay + funnel friction study', 'Spot UX friction from real session data', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (30, 'Product / UX research', 'Information architecture study (card sort + tree test)', 'Fix navigation and categorization before redesign', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (31, 'Product / UX research', 'Search/browse/navigation study', 'Fix discoverability and reduce bounce', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (32, 'Product / UX research', 'Form-fill friction study', 'Reduce friction in forms and documentation steps', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (33, 'Product / UX research', 'Accessibility study (mobile-first)', 'Ensure product works for users with accessibility needs', 'P3', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (34, 'Product / UX research', 'Localization & translation quality testing', 'Ensure translated content retains meaning and trust', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (35, 'Product / UX research', 'Diary study (7–21 days) / mobile ethnography', 'Track real usage over time to understand habits', 'P2', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (36, 'Pricing / monetization research', 'Gabor-Granger pricing', 'Find the price that maximizes revenue or volume', 'P0', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (37, 'Pricing / monetization research', 'Van Westendorp price sensitivity meter', 'Map the acceptable price band from the consumer''s POV', 'P0', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (38, 'Pricing / monetization research', 'Conjoint / discrete choice (DCE)', 'Simulate trade-offs between features, price, and brand', 'P2', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (39, 'Pricing / monetization research', 'Delivery fee sensitivity', 'Find the delivery fee sweet spot that doesn''t kill conversion', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (40, 'Pricing / monetization research', 'Bundle / plan architecture study', 'Design tiers that map to WTP and needs', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (41, 'Pricing / monetization research', 'Free-to-paid conversion research', 'Increase paid conversion without churn', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (42, 'Pricing / monetization research', 'Discount / promo sensitivity study', 'Understand elasticity and avoid a discount treadmill', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (43, 'Acquisition / growth research', 'Activation study (first value moment)', 'Identify what action predicts retention', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (44, 'Acquisition / growth research', 'Referral / advocacy study', 'Find what drives organic sharing and recommendation', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (45, 'Acquisition / growth research', 'Win/loss & switching interviews (consumer)', 'Learn why people choose or reject you vs alternatives', 'P0', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (46, 'Acquisition / growth research', 'New user acquisition source interviews', 'Learn how new users actually discovered you', 'P1', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (47, 'Acquisition / growth research', 'Landing page / fake-door validation', 'Test demand signals before building', 'P0', 'Experimental');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (48, 'Acquisition / growth research', 'A/B testing with diagnostic survey (post-exposure)', 'Add a ''why'' layer on top of experiment results', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (49, 'Acquisition / growth research', 'Offer / CTA testing research', 'Choose offers that lift conversion without killing retention', 'P1', 'Experimental');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (50, 'Acquisition / growth research', 'Incrementality / holdout tests (marketing)', 'Prove whether marketing spend is actually working', 'P2', 'Experimental');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (51, 'Acquisition / growth research', 'Marketplace listing / PDP research', 'Optimize product pages for conversion', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (52, 'Retention / loyalty / churn research', 'Churn interviews (recent churners)', 'Understand real reasons for leaving while memory is fresh', 'P0', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (53, 'Retention / loyalty / churn research', 'Win-back study (offer + message + channel)', 'Re-engage lapsed users with targeted offers', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (54, 'Retention / loyalty / churn research', 'Habit formation / stickiness study', 'Understand triggers and routines that build habits', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (55, 'Continuous listening / VoC / tracking', 'CSAT (transactional) with driver tagging', 'Track satisfaction on key touchpoints with actionable drivers', 'P0', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (56, 'Continuous listening / VoC / tracking', 'Voice of Customer (VoC) program (multi-channel)', 'Aggregate feedback across all channels into one signal', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (57, 'Continuous listening / VoC / tracking', 'Review mining & complaint mining program', 'Turn unstructured reviews into structured insights', 'P0', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (58, 'Continuous listening / VoC / tracking', 'Customer support contact reason taxonomy', 'Understand and categorize why customers contact support', 'P0', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (59, 'Continuous listening / VoC / tracking', 'NPS (relationship) + verbatims + close-the-loop', 'Track loyalty and follow up with detractors', 'P2', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (60, 'Continuous listening / VoC / tracking', 'Research community (online panel)', 'Maintain a recruited community for fast iteration', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (61, 'Continuous listening / VoC / tracking', 'Customer advisory board (CAB)', 'Get strategic feedback from key cohorts/power users', 'P3', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (62, 'Brand / positioning / comms research', 'Positioning study (territory + RTB)', 'Find your positioning territory and right to believe', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (63, 'Brand / positioning / comms research', 'Ad pre-test / copy test', 'Test ad creative before media spend', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (64, 'Brand / positioning / comms research', 'Brand health tracker', 'Track brand awareness, consideration, and perception over time', 'P2', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (65, 'Brand / positioning / comms research', 'Brand awareness study (aided/unaided)', 'Measure reach and salience', 'P2', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (66, 'Brand / positioning / comms research', 'Creative diagnostic study (why it works/fails)', 'Improve creatives with causal explanation', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (67, 'Brand / positioning / comms research', 'Creator / influencer fit study', 'Choose creators that drive trust and conversion', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (68, 'Brand / positioning / comms research', 'Packaging test (findability + comprehension)', 'Ensure pack design communicates right and is findable on shelf/screen', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (69, 'Brand / positioning / comms research', 'Social listening (creator + brand narratives)', 'Monitor what is being said organically about brand and category', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (70, 'Brand / positioning / comms research', 'Occasion / mission-based segmentation', 'Segment by usage occasion, not just demographics', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (71, 'Shopper / path-to-purchase / retail research', 'Path-to-purchase study (online + offline)', 'Map how consumers discover, evaluate, and buy', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (72, 'Shopper / path-to-purchase / retail research', 'Store intercepts', 'Quick in-store interviews for immediate purchase context', 'P1', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (73, 'Shopper / path-to-purchase / retail research', 'Assortment / shelf discoverability study', 'Optimize shelf/page presence for discoverability', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (74, 'Shopper / path-to-purchase / retail research', 'Shop-alongs (assisted shopping observation)', 'Walk the store with shoppers to see real decisions', 'P2', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (75, 'Shopper / path-to-purchase / retail research', 'Basket-build research', 'Understand what drives basket size and cross-purchase', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (76, 'Shopper / path-to-purchase / retail research', 'Kirana retailer interviews', 'Understand retailer constraints and what drives recommendation', 'P1', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (77, 'QSR / sensory / menu / store experience research', 'Menu comprehension test', 'Test whether customers understand menus and pricing structure', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (78, 'QSR / sensory / menu / store experience research', 'Menu engineering research (profit vs popularity)', 'Optimize menus by balancing popularity and profitability', 'P2', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (79, 'QSR / sensory / menu / store experience research', 'Taste test (blind + branded)', 'Separate intrinsic product quality from brand perception', 'P1', 'Experimental');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (80, 'QSR / sensory / menu / store experience research', 'Dine-in experience study', 'Audit and improve the in-store dining experience', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (81, 'QSR / sensory / menu / store experience research', 'Mystery shopping (stores/service)', 'Audit real service quality through covert visits', 'P1', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (82, 'Service & operations research', 'Service recovery research (failed experiences)', 'Turn service failures into retention opportunities', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (83, 'Service & operations research', 'Returns / refunds experience study', 'Fix the post-purchase experience that drives churn', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (84, 'Service & operations research', 'Delivery partner / field agent immersion (ride-alongs)', 'Understand ground-level execution reality', 'P1', 'Qualitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (85, 'Service & operations research', 'Service blueprinting (frontstage/backstage)', 'Map end-to-end service delivery including behind-the-scenes', 'P1', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (86, 'Service & operations research', 'Customer Effort Score (CES) at key tasks', 'Measure effort required at critical touchpoints', 'P2', 'Quantitative');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (87, 'Community / sentiment / trust research', 'Trust & reassurance / fraud perception study', 'Understand and address trust barriers in conversion', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (88, 'Community / sentiment / trust research', 'Privacy / consent perception study', 'Understand how users perceive data collection and consent flows', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (89, 'Community / sentiment / trust research', 'Comprehension study (fees/policies/consent)', 'Check whether users actually understand terms and fee structures', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (90, 'Community / sentiment / trust research', 'Onboarding trust & KYC perception study', 'Reduce drop-offs due to KYC anxiety', 'P0', 'Mixed-method');

INSERT INTO studies (study_id, study_family, study_name, tagline, urgency, method_type)
VALUES (91, 'Community / sentiment / trust research', 'Fraud / scam perception study', 'Understand and reduce fears around fraud and scams', 'P1', 'Mixed-method');


-- ── Study ↔ Department mappings ──────────────────

INSERT INTO study_departments (study_id, dept_id) VALUES (1, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (1, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (2, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (2, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (3, (SELECT dept_id FROM departments WHERE dept_name = 'Founder''s Office'));
INSERT INTO study_departments (study_id, dept_id) VALUES (3, (SELECT dept_id FROM departments WHERE dept_name = 'Strategy'));
INSERT INTO study_departments (study_id, dept_id) VALUES (3, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (4, (SELECT dept_id FROM departments WHERE dept_name = 'Founder''s Office'));
INSERT INTO study_departments (study_id, dept_id) VALUES (4, (SELECT dept_id FROM departments WHERE dept_name = 'Strategy'));
INSERT INTO study_departments (study_id, dept_id) VALUES (5, (SELECT dept_id FROM departments WHERE dept_name = 'Strategy'));
INSERT INTO study_departments (study_id, dept_id) VALUES (5, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (5, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (6, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (6, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (7, (SELECT dept_id FROM departments WHERE dept_name = 'Founder''s Office'));
INSERT INTO study_departments (study_id, dept_id) VALUES (7, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (8, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (8, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (9, (SELECT dept_id FROM departments WHERE dept_name = 'Data / Analytics'));
INSERT INTO study_departments (study_id, dept_id) VALUES (9, (SELECT dept_id FROM departments WHERE dept_name = 'CRM / Lifecycle'));
INSERT INTO study_departments (study_id, dept_id) VALUES (10, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (10, (SELECT dept_id FROM departments WHERE dept_name = 'Data / Analytics'));
INSERT INTO study_departments (study_id, dept_id) VALUES (11, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (11, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (12, (SELECT dept_id FROM departments WHERE dept_name = 'Founder''s Office'));
INSERT INTO study_departments (study_id, dept_id) VALUES (12, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (13, (SELECT dept_id FROM departments WHERE dept_name = 'Founder''s Office'));
INSERT INTO study_departments (study_id, dept_id) VALUES (13, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (14, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (14, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (15, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (15, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (16, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (16, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (17, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (17, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (18, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (18, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (19, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (19, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (20, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (20, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (21, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (21, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (22, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (22, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (23, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (23, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (24, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (25, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (25, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (26, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (26, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (27, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (27, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (28, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (28, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (29, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (29, (SELECT dept_id FROM departments WHERE dept_name = 'Data / Analytics'));
INSERT INTO study_departments (study_id, dept_id) VALUES (30, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (30, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (31, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (31, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (32, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (33, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (34, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (34, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (35, (SELECT dept_id FROM departments WHERE dept_name = 'UX / Design'));
INSERT INTO study_departments (study_id, dept_id) VALUES (35, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (36, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (37, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (38, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (38, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (39, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (39, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (40, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (40, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (41, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (41, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (42, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (42, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (43, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (43, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (44, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (44, (SELECT dept_id FROM departments WHERE dept_name = 'CRM / Lifecycle'));
INSERT INTO study_departments (study_id, dept_id) VALUES (45, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (45, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (46, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (46, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (47, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (47, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (48, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (48, (SELECT dept_id FROM departments WHERE dept_name = 'Data / Analytics'));
INSERT INTO study_departments (study_id, dept_id) VALUES (49, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (49, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (50, (SELECT dept_id FROM departments WHERE dept_name = 'Data / Analytics'));
INSERT INTO study_departments (study_id, dept_id) VALUES (50, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (51, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (51, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (52, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (52, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (53, (SELECT dept_id FROM departments WHERE dept_name = 'CRM / Lifecycle'));
INSERT INTO study_departments (study_id, dept_id) VALUES (53, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (54, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (54, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (55, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (55, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (56, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (56, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (57, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (57, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (58, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (58, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (59, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (59, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (60, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (60, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (61, (SELECT dept_id FROM departments WHERE dept_name = 'Founder''s Office'));
INSERT INTO study_departments (study_id, dept_id) VALUES (61, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (62, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (62, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (63, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (63, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (64, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (64, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (65, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (65, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (66, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (66, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (67, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (67, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (68, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (68, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (69, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (69, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (70, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (70, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (71, (SELECT dept_id FROM departments WHERE dept_name = 'Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (71, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (72, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (72, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (73, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (74, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (74, (SELECT dept_id FROM departments WHERE dept_name = 'Insights'));
INSERT INTO study_departments (study_id, dept_id) VALUES (75, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (75, (SELECT dept_id FROM departments WHERE dept_name = 'Growth'));
INSERT INTO study_departments (study_id, dept_id) VALUES (76, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (77, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (77, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (78, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (78, (SELECT dept_id FROM departments WHERE dept_name = 'Revenue / Pricing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (79, (SELECT dept_id FROM departments WHERE dept_name = 'Category / Merchandising'));
INSERT INTO study_departments (study_id, dept_id) VALUES (80, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (80, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (81, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (81, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (82, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (82, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (83, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (83, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (84, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (85, (SELECT dept_id FROM departments WHERE dept_name = 'Operations'));
INSERT INTO study_departments (study_id, dept_id) VALUES (85, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (86, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (86, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (87, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (87, (SELECT dept_id FROM departments WHERE dept_name = 'Brand'));
INSERT INTO study_departments (study_id, dept_id) VALUES (88, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (88, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (89, (SELECT dept_id FROM departments WHERE dept_name = 'Product Marketing'));
INSERT INTO study_departments (study_id, dept_id) VALUES (89, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (90, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (90, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));
INSERT INTO study_departments (study_id, dept_id) VALUES (91, (SELECT dept_id FROM departments WHERE dept_name = 'Product'));
INSERT INTO study_departments (study_id, dept_id) VALUES (91, (SELECT dept_id FROM departments WHERE dept_name = 'CX / Support'));

-- ── Study ↔ Industry mappings ────────────────────

INSERT INTO study_industries (study_id, industry_id) VALUES (1, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (1, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (1, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (2, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (2, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (2, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (2, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (3, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (4, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (5, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (6, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (6, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (6, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (6, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (7, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (8, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (8, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (8, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (9, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (9, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (9, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (10, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (10, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (11, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (11, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (12, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (12, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (12, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (12, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (12, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (13, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (14, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (14, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (14, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (14, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (15, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (16, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (16, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (16, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (17, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (17, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (18, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (18, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (18, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (18, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (19, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (20, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (20, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (20, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (20, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (21, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (21, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (21, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (22, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (23, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (23, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (23, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (23, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (24, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (24, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (24, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (25, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (26, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (26, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (26, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (26, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (26, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (27, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (27, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (27, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (28, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (28, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (28, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (28, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (29, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (29, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (29, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (30, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (30, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (31, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (31, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (32, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (33, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (33, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (33, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (34, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (34, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (34, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (35, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (35, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (35, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (35, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (36, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (36, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (36, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (37, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (37, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (37, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (38, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (38, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (39, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (39, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (39, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (40, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (40, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (40, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (41, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (41, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (41, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (41, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (42, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (42, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (42, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (43, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (43, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (43, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (43, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (44, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (44, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (44, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (45, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (45, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (46, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (46, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (46, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (47, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (47, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (47, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (48, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (48, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (48, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (48, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (49, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (49, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (50, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (50, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (51, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (51, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (52, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (53, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (53, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (53, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (53, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (54, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (54, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (54, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (54, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (54, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (55, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (56, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (57, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (58, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Edtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (59, (SELECT industry_id FROM industries WHERE industry_name = 'Travel'));
INSERT INTO study_industries (study_id, industry_id) VALUES (60, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (60, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (61, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (62, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (62, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (62, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (63, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (63, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (63, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (63, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (64, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (64, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (64, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (65, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (65, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (66, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (67, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (67, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (67, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (67, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (67, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (68, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (68, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (68, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (69, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (69, (SELECT industry_id FROM industries WHERE industry_name = 'Beauty'));
INSERT INTO study_industries (study_id, industry_id) VALUES (69, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (69, (SELECT industry_id FROM industries WHERE industry_name = 'Media / OTT'));
INSERT INTO study_industries (study_id, industry_id) VALUES (70, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (70, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (70, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (71, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (71, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (71, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (72, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (72, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (72, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (73, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (73, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (73, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (74, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (74, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (75, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (75, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (75, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (76, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (76, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (77, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (77, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (78, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (78, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (79, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (79, (SELECT industry_id FROM industries WHERE industry_name = 'FMCG'));
INSERT INTO study_industries (study_id, industry_id) VALUES (80, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (80, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (80, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (81, (SELECT industry_id FROM industries WHERE industry_name = 'Omnichannel Retail'));
INSERT INTO study_industries (study_id, industry_id) VALUES (81, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (81, (SELECT industry_id FROM industries WHERE industry_name = 'Franchise'));
INSERT INTO study_industries (study_id, industry_id) VALUES (82, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (82, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (82, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (83, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (83, (SELECT industry_id FROM industries WHERE industry_name = 'Fashion'));
INSERT INTO study_industries (study_id, industry_id) VALUES (83, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (84, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (84, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (84, (SELECT industry_id FROM industries WHERE industry_name = 'QSR'));
INSERT INTO study_industries (study_id, industry_id) VALUES (85, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (85, (SELECT industry_id FROM industries WHERE industry_name = 'Quick Commerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (85, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (86, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (86, (SELECT industry_id FROM industries WHERE industry_name = 'Hyperlocal'));
INSERT INTO study_industries (study_id, industry_id) VALUES (86, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (87, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (87, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));
INSERT INTO study_industries (study_id, industry_id) VALUES (87, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (88, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (88, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (89, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (89, (SELECT industry_id FROM industries WHERE industry_name = 'Healthtech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (90, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (91, (SELECT industry_id FROM industries WHERE industry_name = 'Fintech'));
INSERT INTO study_industries (study_id, industry_id) VALUES (91, (SELECT industry_id FROM industries WHERE industry_name = 'D2C / Ecommerce'));

COMMIT;

-- ================================================================
-- Done! 91 studies + department & industry mappings seeded.
-- ================================================================
