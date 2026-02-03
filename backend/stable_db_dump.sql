--
-- PostgreSQL database dump
--

\restrict xstSRByoGwB9qNPN5QiTEdynl9JIOb0Day7qiIp1PO665urFG1y3hfvxdcyc1fy

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.workspace_membership DROP CONSTRAINT IF EXISTS workspace_membership_workspace_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workspace_membership DROP CONSTRAINT IF EXISTS workspace_membership_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workspace DROP CONSTRAINT IF EXISTS workspace_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workspace DROP CONSTRAINT IF EXISTS workspace_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_metric DROP CONSTRAINT IF EXISTS user_metric_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_transaction DROP CONSTRAINT IF EXISTS shopify_transaction_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_transaction DROP CONSTRAINT IF EXISTS shopify_transaction_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_transaction DROP CONSTRAINT IF EXISTS shopify_transaction_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report DROP CONSTRAINT IF EXISTS shopify_report_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report_data DROP CONSTRAINT IF EXISTS shopify_report_data_report_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report_data DROP CONSTRAINT IF EXISTS shopify_report_data_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report_data DROP CONSTRAINT IF EXISTS shopify_report_data_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report DROP CONSTRAINT IF EXISTS shopify_report_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_refund DROP CONSTRAINT IF EXISTS shopify_refund_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_refund DROP CONSTRAINT IF EXISTS shopify_refund_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_refund DROP CONSTRAINT IF EXISTS shopify_refund_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_raw_ingest DROP CONSTRAINT IF EXISTS shopify_raw_ingest_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_raw_ingest DROP CONSTRAINT IF EXISTS shopify_raw_ingest_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_variant DROP CONSTRAINT IF EXISTS shopify_product_variant_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_variant DROP CONSTRAINT IF EXISTS shopify_product_variant_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_variant DROP CONSTRAINT IF EXISTS shopify_product_variant_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product DROP CONSTRAINT IF EXISTS shopify_product_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_image DROP CONSTRAINT IF EXISTS shopify_product_image_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_image DROP CONSTRAINT IF EXISTS shopify_product_image_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_image DROP CONSTRAINT IF EXISTS shopify_product_image_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product DROP CONSTRAINT IF EXISTS shopify_product_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_price_rule DROP CONSTRAINT IF EXISTS shopify_price_rule_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_price_rule DROP CONSTRAINT IF EXISTS shopify_price_rule_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_payout DROP CONSTRAINT IF EXISTS shopify_payout_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_payout DROP CONSTRAINT IF EXISTS shopify_payout_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_order DROP CONSTRAINT IF EXISTS shopify_order_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_order DROP CONSTRAINT IF EXISTS shopify_order_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_order DROP CONSTRAINT IF EXISTS shopify_order_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_marketing_event DROP CONSTRAINT IF EXISTS shopify_marketing_event_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_marketing_event DROP CONSTRAINT IF EXISTS shopify_marketing_event_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_location DROP CONSTRAINT IF EXISTS shopify_location_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_location DROP CONSTRAINT IF EXISTS shopify_location_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_line_item DROP CONSTRAINT IF EXISTS shopify_line_item_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_line_item DROP CONSTRAINT IF EXISTS shopify_line_item_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_line_item DROP CONSTRAINT IF EXISTS shopify_line_item_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_level DROP CONSTRAINT IF EXISTS shopify_inventory_level_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_level DROP CONSTRAINT IF EXISTS shopify_inventory_level_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_item DROP CONSTRAINT IF EXISTS shopify_inventory_item_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_item DROP CONSTRAINT IF EXISTS shopify_inventory_item_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_fulfillment DROP CONSTRAINT IF EXISTS shopify_fulfillment_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_fulfillment DROP CONSTRAINT IF EXISTS shopify_fulfillment_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_fulfillment DROP CONSTRAINT IF EXISTS shopify_fulfillment_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_dispute DROP CONSTRAINT IF EXISTS shopify_dispute_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_dispute DROP CONSTRAINT IF EXISTS shopify_dispute_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_discount_code DROP CONSTRAINT IF EXISTS shopify_discount_code_price_rule_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_discount_code DROP CONSTRAINT IF EXISTS shopify_discount_code_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_discount_code DROP CONSTRAINT IF EXISTS shopify_discount_code_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_daily_metric DROP CONSTRAINT IF EXISTS shopify_daily_metric_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_daily_metric DROP CONSTRAINT IF EXISTS shopify_daily_metric_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_customer DROP CONSTRAINT IF EXISTS shopify_customer_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_customer DROP CONSTRAINT IF EXISTS shopify_customer_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_checkout DROP CONSTRAINT IF EXISTS shopify_checkout_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_checkout DROP CONSTRAINT IF EXISTS shopify_checkout_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_balance_transaction DROP CONSTRAINT IF EXISTS shopify_balance_transaction_payout_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_balance_transaction DROP CONSTRAINT IF EXISTS shopify_balance_transaction_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_balance_transaction DROP CONSTRAINT IF EXISTS shopify_balance_transaction_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_analytics_snapshot DROP CONSTRAINT IF EXISTS shopify_analytics_snapshot_report_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_analytics_snapshot DROP CONSTRAINT IF EXISTS shopify_analytics_snapshot_report_data_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_analytics_snapshot DROP CONSTRAINT IF EXISTS shopify_analytics_snapshot_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_analytics_snapshot DROP CONSTRAINT IF EXISTS shopify_analytics_snapshot_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_address DROP CONSTRAINT IF EXISTS shopify_address_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_address DROP CONSTRAINT IF EXISTS shopify_address_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopify_address DROP CONSTRAINT IF EXISTS shopify_address_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.onboarding_metric DROP CONSTRAINT IF EXISTS onboarding_metric_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration DROP CONSTRAINT IF EXISTS integration_workspace_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration_metric DROP CONSTRAINT IF EXISTS integration_metric_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration_metric DROP CONSTRAINT IF EXISTS integration_metric_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration DROP CONSTRAINT IF EXISTS integration_datasource_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration_daily_metric DROP CONSTRAINT IF EXISTS integration_daily_metric_integration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration_daily_metric DROP CONSTRAINT IF EXISTS integration_daily_metric_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration DROP CONSTRAINT IF EXISTS integration_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.insight_suppression DROP CONSTRAINT IF EXISTS insight_suppression_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.insight_impression DROP CONSTRAINT IF EXISTS insight_impression_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.insight_generation_log DROP CONSTRAINT IF EXISTS insight_generation_log_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_membership DROP CONSTRAINT IF EXISTS company_membership_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_membership DROP CONSTRAINT IF EXISTS company_membership_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_entitlement DROP CONSTRAINT IF EXISTS company_entitlement_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_entitlement DROP CONSTRAINT IF EXISTS company_entitlement_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaigns_goals_details DROP CONSTRAINT IF EXISTS campaigns_goals_details_campaign_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_campaign_id_fkey;
ALTER TABLE IF EXISTS ONLY public.brand_metric DROP CONSTRAINT IF EXISTS brand_metric_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.brand DROP CONSTRAINT IF EXISTS brand_company_id_fkey;
DROP INDEX IF EXISTS public.ix_workspace_updated_by;
DROP INDEX IF EXISTS public.ix_workspace_name;
DROP INDEX IF EXISTS public.ix_workspace_membership_workspace_id;
DROP INDEX IF EXISTS public.ix_workspace_membership_user_id;
DROP INDEX IF EXISTS public.ix_workspace_created_by;
DROP INDEX IF EXISTS public.ix_workspace_company_id;
DROP INDEX IF EXISTS public.ix_workspace_brand_id;
DROP INDEX IF EXISTS public.ix_user_metric_user_id;
DROP INDEX IF EXISTS public.ix_user_metric_metric_date;
DROP INDEX IF EXISTS public.ix_user_email;
DROP INDEX IF EXISTS public.ix_system_metric_timestamp;
DROP INDEX IF EXISTS public.ix_shopify_transaction_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_transaction_status;
DROP INDEX IF EXISTS public.ix_shopify_transaction_shopify_transaction_id;
DROP INDEX IF EXISTS public.ix_shopify_transaction_shopify_processed_at;
DROP INDEX IF EXISTS public.ix_shopify_transaction_shopify_order_id;
DROP INDEX IF EXISTS public.ix_shopify_transaction_order_id;
DROP INDEX IF EXISTS public.ix_shopify_transaction_kind;
DROP INDEX IF EXISTS public.ix_shopify_transaction_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_transaction_currency;
DROP INDEX IF EXISTS public.ix_shopify_transaction_created_by;
DROP INDEX IF EXISTS public.ix_shopify_transaction_company_id;
DROP INDEX IF EXISTS public.ix_shopify_report_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_report_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_report_shopify_report_id;
DROP INDEX IF EXISTS public.ix_shopify_report_name;
DROP INDEX IF EXISTS public.ix_shopify_report_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_report_data_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_report_data_report_id;
DROP INDEX IF EXISTS public.ix_shopify_report_data_query_name;
DROP INDEX IF EXISTS public.ix_shopify_report_data_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_report_data_created_by;
DROP INDEX IF EXISTS public.ix_shopify_report_data_company_id;
DROP INDEX IF EXISTS public.ix_shopify_report_data_captured_at;
DROP INDEX IF EXISTS public.ix_shopify_report_created_by;
DROP INDEX IF EXISTS public.ix_shopify_report_company_id;
DROP INDEX IF EXISTS public.ix_shopify_refund_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_refund_shopify_refund_id;
DROP INDEX IF EXISTS public.ix_shopify_refund_shopify_order_id;
DROP INDEX IF EXISTS public.ix_shopify_refund_processed_at;
DROP INDEX IF EXISTS public.ix_shopify_refund_order_id;
DROP INDEX IF EXISTS public.ix_shopify_refund_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_refund_created_by;
DROP INDEX IF EXISTS public.ix_shopify_refund_company_id;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_shopify_object_id;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_processing_status;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_object_type;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_dedupe_key;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_dedupe_hash_canonical;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_created_by;
DROP INDEX IF EXISTS public.ix_shopify_raw_ingest_company_id;
DROP INDEX IF EXISTS public.ix_shopify_product_vendor;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_title;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_sku;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_shopify_variant_id;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_shopify_inventory_item_id;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_product_id;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_created_by;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_company_id;
DROP INDEX IF EXISTS public.ix_shopify_product_variant_barcode;
DROP INDEX IF EXISTS public.ix_shopify_product_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_product_title;
DROP INDEX IF EXISTS public.ix_shopify_product_status;
DROP INDEX IF EXISTS public.ix_shopify_product_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_product_shopify_product_id;
DROP INDEX IF EXISTS public.ix_shopify_product_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_product_published_at;
DROP INDEX IF EXISTS public.ix_shopify_product_product_type;
DROP INDEX IF EXISTS public.ix_shopify_product_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_product_image_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_product_image_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_product_image_shopify_image_id;
DROP INDEX IF EXISTS public.ix_shopify_product_image_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_product_image_product_id;
DROP INDEX IF EXISTS public.ix_shopify_product_image_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_product_image_created_by;
DROP INDEX IF EXISTS public.ix_shopify_product_image_company_id;
DROP INDEX IF EXISTS public.ix_shopify_product_handle;
DROP INDEX IF EXISTS public.ix_shopify_product_created_by;
DROP INDEX IF EXISTS public.ix_shopify_product_company_id;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_value_type;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_title;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_target_type;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_target_selection;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_starts_at;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_shopify_price_rule_id;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_ends_at;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_created_by;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_company_id;
DROP INDEX IF EXISTS public.ix_shopify_price_rule_allocation_method;
DROP INDEX IF EXISTS public.ix_shopify_payout_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_payout_status;
DROP INDEX IF EXISTS public.ix_shopify_payout_shopify_payout_id;
DROP INDEX IF EXISTS public.ix_shopify_payout_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_payout_date;
DROP INDEX IF EXISTS public.ix_shopify_payout_created_by;
DROP INDEX IF EXISTS public.ix_shopify_payout_company_id;
DROP INDEX IF EXISTS public.ix_shopify_order_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_order_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_order_shopify_order_number;
DROP INDEX IF EXISTS public.ix_shopify_order_shopify_order_id;
DROP INDEX IF EXISTS public.ix_shopify_order_shopify_name;
DROP INDEX IF EXISTS public.ix_shopify_order_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_order_shopify_cancelled_at;
DROP INDEX IF EXISTS public.ix_shopify_order_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_order_fulfillment_status;
DROP INDEX IF EXISTS public.ix_shopify_order_financial_status;
DROP INDEX IF EXISTS public.ix_shopify_order_email;
DROP INDEX IF EXISTS public.ix_shopify_order_created_by;
DROP INDEX IF EXISTS public.ix_shopify_order_company_id;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_type;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_started_at;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_shopify_marketing_event_id;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_marketing_channel;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_ended_at;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_created_by;
DROP INDEX IF EXISTS public.ix_shopify_marketing_event_company_id;
DROP INDEX IF EXISTS public.ix_shopify_location_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_location_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_location_shopify_location_id;
DROP INDEX IF EXISTS public.ix_shopify_location_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_location_name;
DROP INDEX IF EXISTS public.ix_shopify_location_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_location_created_by;
DROP INDEX IF EXISTS public.ix_shopify_location_company_id;
DROP INDEX IF EXISTS public.ix_shopify_line_item_variant_id;
DROP INDEX IF EXISTS public.ix_shopify_line_item_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_line_item_sku;
DROP INDEX IF EXISTS public.ix_shopify_line_item_shopify_line_item_id;
DROP INDEX IF EXISTS public.ix_shopify_line_item_product_id;
DROP INDEX IF EXISTS public.ix_shopify_line_item_order_id;
DROP INDEX IF EXISTS public.ix_shopify_line_item_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_line_item_created_by;
DROP INDEX IF EXISTS public.ix_shopify_line_item_company_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_shopify_location_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_shopify_inventory_item_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_created_by;
DROP INDEX IF EXISTS public.ix_shopify_inventory_level_company_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_item_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_inventory_item_sku;
DROP INDEX IF EXISTS public.ix_shopify_inventory_item_shopify_inventory_item_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_item_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_inventory_item_created_by;
DROP INDEX IF EXISTS public.ix_shopify_inventory_item_company_id;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_tracking_number;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_status;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_shopify_order_id;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_shopify_fulfillment_id;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_shipment_status;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_order_id;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_created_by;
DROP INDEX IF EXISTS public.ix_shopify_fulfillment_company_id;
DROP INDEX IF EXISTS public.ix_shopify_dispute_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_dispute_type;
DROP INDEX IF EXISTS public.ix_shopify_dispute_status;
DROP INDEX IF EXISTS public.ix_shopify_dispute_shopify_dispute_id;
DROP INDEX IF EXISTS public.ix_shopify_dispute_order_id;
DROP INDEX IF EXISTS public.ix_shopify_dispute_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_dispute_created_by;
DROP INDEX IF EXISTS public.ix_shopify_dispute_company_id;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_shopify_price_rule_id;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_shopify_discount_code_id;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_price_rule_id;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_created_by;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_company_id;
DROP INDEX IF EXISTS public.ix_shopify_discount_code_code;
DROP INDEX IF EXISTS public.ix_shopify_daily_metric_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_daily_metric_snapshot_date;
DROP INDEX IF EXISTS public.ix_shopify_daily_metric_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_daily_metric_created_by;
DROP INDEX IF EXISTS public.ix_shopify_daily_metric_company_id;
DROP INDEX IF EXISTS public.ix_shopify_customer_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_customer_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_customer_shopify_customer_id;
DROP INDEX IF EXISTS public.ix_shopify_customer_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_customer_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_customer_email;
DROP INDEX IF EXISTS public.ix_shopify_customer_created_by;
DROP INDEX IF EXISTS public.ix_shopify_customer_company_id;
DROP INDEX IF EXISTS public.ix_shopify_checkout_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_checkout_token;
DROP INDEX IF EXISTS public.ix_shopify_checkout_shopify_updated_at;
DROP INDEX IF EXISTS public.ix_shopify_checkout_shopify_created_at;
DROP INDEX IF EXISTS public.ix_shopify_checkout_shopify_completed_at;
DROP INDEX IF EXISTS public.ix_shopify_checkout_shopify_checkout_id;
DROP INDEX IF EXISTS public.ix_shopify_checkout_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_checkout_email;
DROP INDEX IF EXISTS public.ix_shopify_checkout_created_by;
DROP INDEX IF EXISTS public.ix_shopify_checkout_company_id;
DROP INDEX IF EXISTS public.ix_shopify_checkout_cart_token;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_type;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_shopify_transaction_id;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_shopify_payout_id;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_processed_at;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_created_by;
DROP INDEX IF EXISTS public.ix_shopify_balance_transaction_company_id;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_timestamp;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_report_id;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_report_data_id;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_granularity;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_created_by;
DROP INDEX IF EXISTS public.ix_shopify_analytics_snapshot_company_id;
DROP INDEX IF EXISTS public.ix_shopify_address_updated_by;
DROP INDEX IF EXISTS public.ix_shopify_address_shopify_customer_id;
DROP INDEX IF EXISTS public.ix_shopify_address_shopify_address_id;
DROP INDEX IF EXISTS public.ix_shopify_address_integration_id;
DROP INDEX IF EXISTS public.ix_shopify_address_customer_id;
DROP INDEX IF EXISTS public.ix_shopify_address_created_by;
DROP INDEX IF EXISTS public.ix_shopify_address_company_id;
DROP INDEX IF EXISTS public.ix_onboarding_state_user_id;
DROP INDEX IF EXISTS public.ix_onboarding_state_updated_by;
DROP INDEX IF EXISTS public.ix_onboarding_state_created_by;
DROP INDEX IF EXISTS public.ix_onboarding_metric_user_id;
DROP INDEX IF EXISTS public.ix_interview_session_user_id;
DROP INDEX IF EXISTS public.ix_interview_session_company_id;
DROP INDEX IF EXISTS public.ix_integration_workspace_id;
DROP INDEX IF EXISTS public.ix_integration_metric_metric_date;
DROP INDEX IF EXISTS public.ix_integration_metric_integration_id;
DROP INDEX IF EXISTS public.ix_integration_metric_company_id;
DROP INDEX IF EXISTS public.ix_integration_datasource_id;
DROP INDEX IF EXISTS public.ix_integration_daily_metric_updated_by;
DROP INDEX IF EXISTS public.ix_integration_daily_metric_snapshot_date;
DROP INDEX IF EXISTS public.ix_integration_daily_metric_metric_type;
DROP INDEX IF EXISTS public.ix_integration_daily_metric_integration_id;
DROP INDEX IF EXISTS public.ix_integration_daily_metric_created_by;
DROP INDEX IF EXISTS public.ix_integration_daily_metric_company_id;
DROP INDEX IF EXISTS public.ix_integration_company_id;
DROP INDEX IF EXISTS public.ix_insight_suppression_suppressed_until;
DROP INDEX IF EXISTS public.ix_insight_suppression_brand_id;
DROP INDEX IF EXISTS public.ix_insight_impression_insight_id;
DROP INDEX IF EXISTS public.ix_insight_impression_brand_id;
DROP INDEX IF EXISTS public.ix_insight_generation_log_generated_at;
DROP INDEX IF EXISTS public.ix_insight_generation_log_brand_id;
DROP INDEX IF EXISTS public.ix_insight_feedback_insight_id;
DROP INDEX IF EXISTS public.ix_insight_feedback_brand_id;
DROP INDEX IF EXISTS public.ix_feedback_learning_brand_id;
DROP INDEX IF EXISTS public.ix_data_source_slug;
DROP INDEX IF EXISTS public.ix_data_source_name;
DROP INDEX IF EXISTS public.ix_data_source_category;
DROP INDEX IF EXISTS public.ix_company_updated_by;
DROP INDEX IF EXISTS public.ix_company_membership_user_id;
DROP INDEX IF EXISTS public.ix_company_membership_company_id;
DROP INDEX IF EXISTS public.ix_company_entitlement_module_id;
DROP INDEX IF EXISTS public.ix_company_entitlement_company_id;
DROP INDEX IF EXISTS public.ix_company_created_by;
DROP INDEX IF EXISTS public.ix_company_brand_name;
DROP INDEX IF EXISTS public.ix_campaigns_user_id;
DROP INDEX IF EXISTS public.ix_campaigns_goals_details_campaign_id;
DROP INDEX IF EXISTS public.ix_campaigns_goals_details_bolna_execution_id;
DROP INDEX IF EXISTS public.ix_campaigns_goals_details_agent_id;
DROP INDEX IF EXISTS public.ix_campaigns_company_id;
DROP INDEX IF EXISTS public.ix_campaign_leads_campaign_id;
DROP INDEX IF EXISTS public.ix_calendar_connection_user_id;
DROP INDEX IF EXISTS public.ix_calendar_connection_company_id;
DROP INDEX IF EXISTS public.ix_business_metric_metric_date;
DROP INDEX IF EXISTS public.ix_brand_updated_by;
DROP INDEX IF EXISTS public.ix_brand_name;
DROP INDEX IF EXISTS public.ix_brand_metric_metric_date;
DROP INDEX IF EXISTS public.ix_brand_metric_brand_id;
DROP INDEX IF EXISTS public.ix_brand_created_by;
DROP INDEX IF EXISTS public.ix_brand_company_id;
DROP INDEX IF EXISTS public.ix_audit_trail_workspace_id;
DROP INDEX IF EXISTS public.ix_audit_trail_company_id;
DROP INDEX IF EXISTS public.ix_audit_trail_brand_id;
DROP INDEX IF EXISTS public.ix_audit_trail_actor_id;
DROP INDEX IF EXISTS public.ix_audit_trail_action;
DROP INDEX IF EXISTS public.ix_archived_campaigns_user_id;
DROP INDEX IF EXISTS public.ix_archived_campaigns_original_campaign_id;
DROP INDEX IF EXISTS public.ix_archived_campaigns_company_id;
DROP INDEX IF EXISTS public.ix_archived_campaign_leads_original_campaign_id;
DROP INDEX IF EXISTS public.ix_all_requests_user_id;
DROP INDEX IF EXISTS public.ix_all_requests_request_type;
DROP INDEX IF EXISTS public.ix_all_requests_name;
DROP INDEX IF EXISTS public.idx_campaigns_source_file_hash;
ALTER TABLE IF EXISTS ONLY public.workspace DROP CONSTRAINT IF EXISTS workspace_pkey;
ALTER TABLE IF EXISTS ONLY public.workspace_membership DROP CONSTRAINT IF EXISTS workspace_membership_workspace_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.workspace_membership DROP CONSTRAINT IF EXISTS workspace_membership_pkey;
ALTER TABLE IF EXISTS ONLY public.workspace DROP CONSTRAINT IF EXISTS workspace_brand_id_name_key;
ALTER TABLE IF EXISTS ONLY public."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY public.user_metric DROP CONSTRAINT IF EXISTS user_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.system_metric DROP CONSTRAINT IF EXISTS system_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_transaction DROP CONSTRAINT IF EXISTS shopify_transaction_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report DROP CONSTRAINT IF EXISTS shopify_report_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report DROP CONSTRAINT IF EXISTS shopify_report_integration_id_shopify_report_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_report_data DROP CONSTRAINT IF EXISTS shopify_report_data_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_report_data DROP CONSTRAINT IF EXISTS shopify_report_data_integration_id_query_name_captured_at_key;
ALTER TABLE IF EXISTS ONLY public.shopify_refund DROP CONSTRAINT IF EXISTS shopify_refund_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_raw_ingest DROP CONSTRAINT IF EXISTS shopify_raw_ingest_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_variant DROP CONSTRAINT IF EXISTS shopify_product_variant_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_variant DROP CONSTRAINT IF EXISTS shopify_product_variant_integration_id_shopify_variant_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_product DROP CONSTRAINT IF EXISTS shopify_product_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product DROP CONSTRAINT IF EXISTS shopify_product_integration_id_shopify_product_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_product_image DROP CONSTRAINT IF EXISTS shopify_product_image_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_product_image DROP CONSTRAINT IF EXISTS shopify_product_image_integration_id_shopify_image_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_price_rule DROP CONSTRAINT IF EXISTS shopify_price_rule_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_price_rule DROP CONSTRAINT IF EXISTS shopify_price_rule_integration_id_shopify_price_rule_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_payout DROP CONSTRAINT IF EXISTS shopify_payout_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_payout DROP CONSTRAINT IF EXISTS shopify_payout_integration_id_shopify_payout_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_order DROP CONSTRAINT IF EXISTS shopify_order_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_order DROP CONSTRAINT IF EXISTS shopify_order_integration_id_shopify_order_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_marketing_event DROP CONSTRAINT IF EXISTS shopify_marketing_event_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_marketing_event DROP CONSTRAINT IF EXISTS shopify_marketing_event_integration_id_shopify_marketing_ev_key;
ALTER TABLE IF EXISTS ONLY public.shopify_location DROP CONSTRAINT IF EXISTS shopify_location_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_location DROP CONSTRAINT IF EXISTS shopify_location_integration_id_shopify_location_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_line_item DROP CONSTRAINT IF EXISTS shopify_line_item_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_level DROP CONSTRAINT IF EXISTS shopify_inventory_level_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_item DROP CONSTRAINT IF EXISTS shopify_inventory_item_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_inventory_item DROP CONSTRAINT IF EXISTS shopify_inventory_item_integration_id_shopify_inventory_ite_key;
ALTER TABLE IF EXISTS ONLY public.shopify_fulfillment DROP CONSTRAINT IF EXISTS shopify_fulfillment_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_fulfillment DROP CONSTRAINT IF EXISTS shopify_fulfillment_integration_id_shopify_fulfillment_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_dispute DROP CONSTRAINT IF EXISTS shopify_dispute_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_dispute DROP CONSTRAINT IF EXISTS shopify_dispute_integration_id_shopify_dispute_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_discount_code DROP CONSTRAINT IF EXISTS shopify_discount_code_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_discount_code DROP CONSTRAINT IF EXISTS shopify_discount_code_integration_id_shopify_discount_code__key;
ALTER TABLE IF EXISTS ONLY public.shopify_daily_metric DROP CONSTRAINT IF EXISTS shopify_daily_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_daily_metric DROP CONSTRAINT IF EXISTS shopify_daily_metric_integration_id_snapshot_date_key;
ALTER TABLE IF EXISTS ONLY public.shopify_customer DROP CONSTRAINT IF EXISTS shopify_customer_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_customer DROP CONSTRAINT IF EXISTS shopify_customer_integration_id_shopify_customer_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_checkout DROP CONSTRAINT IF EXISTS shopify_checkout_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_checkout DROP CONSTRAINT IF EXISTS shopify_checkout_integration_id_shopify_checkout_id_key;
ALTER TABLE IF EXISTS ONLY public.shopify_balance_transaction DROP CONSTRAINT IF EXISTS shopify_balance_transaction_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_balance_transaction DROP CONSTRAINT IF EXISTS shopify_balance_transaction_integration_id_shopify_transact_key;
ALTER TABLE IF EXISTS ONLY public.shopify_analytics_snapshot DROP CONSTRAINT IF EXISTS shopify_analytics_snapshot_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_analytics_snapshot DROP CONSTRAINT IF EXISTS shopify_analytics_snapshot_integration_id_report_data_id_ti_key;
ALTER TABLE IF EXISTS ONLY public.shopify_address DROP CONSTRAINT IF EXISTS shopify_address_pkey;
ALTER TABLE IF EXISTS ONLY public.shopify_address DROP CONSTRAINT IF EXISTS shopify_address_integration_id_shopify_address_id_key;
ALTER TABLE IF EXISTS ONLY public.permission DROP CONSTRAINT IF EXISTS permission_pkey;
ALTER TABLE IF EXISTS ONLY public.onboarding_state DROP CONSTRAINT IF EXISTS onboarding_state_pkey;
ALTER TABLE IF EXISTS ONLY public.onboarding_metric DROP CONSTRAINT IF EXISTS onboarding_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.module DROP CONSTRAINT IF EXISTS module_pkey;
ALTER TABLE IF EXISTS ONLY public.interview_session DROP CONSTRAINT IF EXISTS interview_session_pkey;
ALTER TABLE IF EXISTS ONLY public.integration DROP CONSTRAINT IF EXISTS integration_pkey;
ALTER TABLE IF EXISTS ONLY public.integration_metric DROP CONSTRAINT IF EXISTS integration_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.integration_daily_metric DROP CONSTRAINT IF EXISTS integration_daily_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.integration_daily_metric DROP CONSTRAINT IF EXISTS integration_daily_metric_integration_id_snapshot_date_metri_key;
ALTER TABLE IF EXISTS ONLY public.insight_suppression DROP CONSTRAINT IF EXISTS insight_suppression_pkey;
ALTER TABLE IF EXISTS ONLY public.insight_impression DROP CONSTRAINT IF EXISTS insight_impression_pkey;
ALTER TABLE IF EXISTS ONLY public.insight_generation_log DROP CONSTRAINT IF EXISTS insight_generation_log_pkey;
ALTER TABLE IF EXISTS ONLY public.insight_feedback DROP CONSTRAINT IF EXISTS insight_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.feedback_learning DROP CONSTRAINT IF EXISTS feedback_learning_pkey;
ALTER TABLE IF EXISTS ONLY public.data_source DROP CONSTRAINT IF EXISTS data_source_pkey;
ALTER TABLE IF EXISTS ONLY public.company DROP CONSTRAINT IF EXISTS company_pkey;
ALTER TABLE IF EXISTS ONLY public.company_membership DROP CONSTRAINT IF EXISTS company_membership_pkey;
ALTER TABLE IF EXISTS ONLY public.company_membership DROP CONSTRAINT IF EXISTS company_membership_company_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.company_entitlement DROP CONSTRAINT IF EXISTS company_entitlement_pkey;
ALTER TABLE IF EXISTS ONLY public.company_entitlement DROP CONSTRAINT IF EXISTS company_entitlement_company_id_module_id_key;
ALTER TABLE IF EXISTS ONLY public.campaigns DROP CONSTRAINT IF EXISTS campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public.campaigns_goals_details DROP CONSTRAINT IF EXISTS campaigns_goals_details_pkey;
ALTER TABLE IF EXISTS ONLY public.campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_pkey;
ALTER TABLE IF EXISTS ONLY public.calendar_connection DROP CONSTRAINT IF EXISTS calendar_connection_pkey;
ALTER TABLE IF EXISTS ONLY public.business_metric DROP CONSTRAINT IF EXISTS business_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.brand DROP CONSTRAINT IF EXISTS brand_pkey;
ALTER TABLE IF EXISTS ONLY public.brand_metric DROP CONSTRAINT IF EXISTS brand_metric_pkey;
ALTER TABLE IF EXISTS ONLY public.brand_metric DROP CONSTRAINT IF EXISTS brand_metric_brand_id_metric_date_key;
ALTER TABLE IF EXISTS ONLY public.brand DROP CONSTRAINT IF EXISTS brand_company_id_name_key;
ALTER TABLE IF EXISTS ONLY public.audit_trail DROP CONSTRAINT IF EXISTS audit_trail_pkey;
ALTER TABLE IF EXISTS ONLY public.archived_campaigns DROP CONSTRAINT IF EXISTS archived_campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public.archived_campaign_leads DROP CONSTRAINT IF EXISTS archived_campaign_leads_pkey;
ALTER TABLE IF EXISTS ONLY public.all_requests DROP CONSTRAINT IF EXISTS all_requests_pkey;
DROP TABLE IF EXISTS public.workspace_membership;
DROP TABLE IF EXISTS public.workspace;
DROP TABLE IF EXISTS public.user_metric;
DROP TABLE IF EXISTS public."user";
DROP TABLE IF EXISTS public.system_metric;
DROP TABLE IF EXISTS public.shopify_transaction;
DROP TABLE IF EXISTS public.shopify_report_data;
DROP TABLE IF EXISTS public.shopify_report;
DROP TABLE IF EXISTS public.shopify_refund;
DROP TABLE IF EXISTS public.shopify_raw_ingest;
DROP TABLE IF EXISTS public.shopify_product_variant;
DROP TABLE IF EXISTS public.shopify_product_image;
DROP TABLE IF EXISTS public.shopify_product;
DROP TABLE IF EXISTS public.shopify_price_rule;
DROP TABLE IF EXISTS public.shopify_payout;
DROP TABLE IF EXISTS public.shopify_order;
DROP TABLE IF EXISTS public.shopify_marketing_event;
DROP TABLE IF EXISTS public.shopify_location;
DROP TABLE IF EXISTS public.shopify_line_item;
DROP TABLE IF EXISTS public.shopify_inventory_level;
DROP TABLE IF EXISTS public.shopify_inventory_item;
DROP TABLE IF EXISTS public.shopify_fulfillment;
DROP TABLE IF EXISTS public.shopify_dispute;
DROP TABLE IF EXISTS public.shopify_discount_code;
DROP TABLE IF EXISTS public.shopify_daily_metric;
DROP TABLE IF EXISTS public.shopify_customer;
DROP TABLE IF EXISTS public.shopify_checkout;
DROP TABLE IF EXISTS public.shopify_balance_transaction;
DROP TABLE IF EXISTS public.shopify_analytics_snapshot;
DROP TABLE IF EXISTS public.shopify_address;
DROP TABLE IF EXISTS public.permission;
DROP TABLE IF EXISTS public.onboarding_state;
DROP TABLE IF EXISTS public.onboarding_metric;
DROP TABLE IF EXISTS public.module;
DROP TABLE IF EXISTS public.interview_session;
DROP TABLE IF EXISTS public.integration_metric;
DROP TABLE IF EXISTS public.integration_daily_metric;
DROP TABLE IF EXISTS public.integration;
DROP TABLE IF EXISTS public.insight_suppression;
DROP TABLE IF EXISTS public.insight_impression;
DROP TABLE IF EXISTS public.insight_generation_log;
DROP TABLE IF EXISTS public.insight_feedback;
DROP TABLE IF EXISTS public.feedback_learning;
DROP TABLE IF EXISTS public.data_source;
DROP TABLE IF EXISTS public.company_membership;
DROP TABLE IF EXISTS public.company_entitlement;
DROP TABLE IF EXISTS public.company;
DROP TABLE IF EXISTS public.campaigns_goals_details;
DROP TABLE IF EXISTS public.campaigns;
DROP TABLE IF EXISTS public.campaign_leads;
DROP TABLE IF EXISTS public.calendar_connection;
DROP TABLE IF EXISTS public.business_metric;
DROP TABLE IF EXISTS public.brand_metric;
DROP TABLE IF EXISTS public.brand;
DROP TABLE IF EXISTS public.audit_trail;
DROP TABLE IF EXISTS public.archived_campaigns;
DROP TABLE IF EXISTS public.archived_campaign_leads;
DROP TABLE IF EXISTS public.all_requests;
DROP TYPE IF EXISTS public.systemrole;
DROP TYPE IF EXISTS public.requesttype;
DROP TYPE IF EXISTS public.requeststatus;
DROP TYPE IF EXISTS public.datasourcecategory;
--
-- Name: datasourcecategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.datasourcecategory AS ENUM (
    'Storefront',
    'Marketplace',
    'QuickCommerce',
    'Network',
    'SocialCommerce',
    'Marketing',
    'Logistics',
    'Payment',
    'Accounting',
    'Analytics',
    'Communication',
    'Retention'
);


--
-- Name: requeststatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requeststatus AS ENUM (
    'PENDING',
    'REVIEWED',
    'APPROVED',
    'REJECTED'
);


--
-- Name: requesttype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requesttype AS ENUM (
    'DATASOURCE',
    'WORKSPACE_DELETION',
    'INTEGRATION_DISCONNECT'
);


--
-- Name: systemrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.systemrole AS ENUM (
    'OWNER',
    'ADMIN',
    'ANALYST',
    'VIEWER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: all_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.all_requests (
    id uuid NOT NULL,
    user_id character varying NOT NULL,
    email character varying,
    user_name character varying,
    request_type public.requesttype NOT NULL,
    name character varying NOT NULL,
    category character varying,
    payload json,
    status public.requeststatus NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: archived_campaign_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.archived_campaign_leads (
    id uuid NOT NULL,
    original_campaign_id uuid NOT NULL,
    campaign_name character varying NOT NULL,
    customer_name character varying NOT NULL,
    contact_number character varying NOT NULL,
    cohort character varying,
    meta_data jsonb,
    created_at timestamp without time zone NOT NULL,
    archived_at timestamp without time zone NOT NULL
);


--
-- Name: archived_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.archived_campaigns (
    id uuid NOT NULL,
    original_campaign_id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    status character varying NOT NULL,
    phone_number character varying,
    team_member_role character varying,
    team_member_department character varying,
    decision_context jsonb,
    quality_score integer NOT NULL,
    quality_gap character varying,
    brand_context text,
    customer_context text,
    team_member_context text,
    preliminary_questions jsonb,
    question_bank jsonb,
    incentive_bank jsonb,
    cohort_questions jsonb,
    cohort_incentives jsonb,
    incentive text,
    total_call_target integer,
    call_duration integer,
    cohort_config jsonb,
    selected_cohorts jsonb,
    execution_windows jsonb,
    cohort_data jsonb,
    goal_details jsonb,
    original_created_at timestamp without time zone NOT NULL,
    original_updated_at timestamp without time zone NOT NULL,
    archived_at timestamp without time zone NOT NULL
);


--
-- Name: audit_trail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_trail (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    brand_id uuid,
    workspace_id uuid,
    actor_id character varying NOT NULL,
    action character varying NOT NULL,
    resource_type character varying NOT NULL,
    resource_id character varying NOT NULL,
    event_data json,
    ip_address character varying,
    user_agent character varying,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: brand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: brand_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_metric (
    id uuid NOT NULL,
    brand_id uuid NOT NULL,
    metric_date date NOT NULL,
    total_revenue double precision NOT NULL,
    currency character varying NOT NULL,
    active_sources_count integer NOT NULL,
    total_inventory_value double precision NOT NULL,
    insights jsonb,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: business_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_metric (
    id uuid NOT NULL,
    metric_date date NOT NULL,
    total_users integer NOT NULL,
    active_users_daily integer NOT NULL,
    active_users_weekly integer NOT NULL,
    active_users_monthly integer NOT NULL,
    new_users integer NOT NULL,
    churned_users integer NOT NULL,
    total_companies integer NOT NULL,
    new_companies integer NOT NULL,
    active_companies integer NOT NULL,
    total_workspaces integer NOT NULL,
    new_workspaces integer NOT NULL,
    active_workspaces integer NOT NULL,
    total_integrations integer NOT NULL,
    new_integrations integer NOT NULL,
    active_integrations integer NOT NULL,
    onboarding_started integer NOT NULL,
    onboarding_completed integer NOT NULL,
    onboarding_completion_rate double precision NOT NULL,
    avg_session_duration_seconds double precision,
    avg_page_views_per_user double precision,
    mrr double precision,
    arr double precision,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: calendar_connection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_connection (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id character varying NOT NULL,
    provider character varying NOT NULL,
    credentials jsonb,
    status character varying NOT NULL,
    expiry timestamp without time zone,
    last_synced_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: campaign_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_leads (
    id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    customer_name character varying NOT NULL,
    contact_number character varying NOT NULL,
    cohort character varying,
    status character varying NOT NULL,
    meta_data jsonb,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    status character varying NOT NULL,
    phone_number character varying,
    team_member_role character varying,
    team_member_department character varying,
    decision_context jsonb,
    quality_score integer NOT NULL,
    quality_gap character varying,
    brand_context text,
    customer_context text,
    team_member_context text,
    preliminary_questions jsonb,
    question_bank jsonb,
    incentive_bank jsonb,
    cohort_questions jsonb,
    cohort_incentives jsonb,
    incentive text,
    total_call_target integer,
    call_duration integer,
    cohort_config jsonb,
    selected_cohorts jsonb,
    execution_windows jsonb,
    cohort_data jsonb,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    source_file_hash character varying
);


--
-- Name: campaigns_goals_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns_goals_details (
    id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    bolna_execution_id character varying NOT NULL,
    agent_id character varying NOT NULL,
    batch_id character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    scheduled_at timestamp without time zone,
    initiated_at timestamp without time zone,
    rescheduled_at timestamp without time zone,
    answered_by_voice_mail boolean,
    conversation_duration double precision NOT NULL,
    total_cost double precision NOT NULL,
    status character varying NOT NULL,
    smart_status character varying,
    user_number character varying,
    agent_number character varying,
    provider character varying,
    transcript text,
    summary text,
    error_message character varying,
    usage_breakdown jsonb,
    cost_breakdown jsonb,
    extracted_data jsonb,
    agent_extraction jsonb,
    custom_extractions jsonb,
    telephony_data jsonb,
    transfer_call_data jsonb,
    context_details jsonb,
    batch_run_details jsonb,
    latency_data jsonb,
    retry_config jsonb,
    retry_history jsonb,
    workflow_retries integer,
    retry_count integer NOT NULL,
    deleted boolean NOT NULL,
    raw_data jsonb,
    system_created_at timestamp without time zone NOT NULL,
    system_updated_at timestamp without time zone NOT NULL
);


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    created_by character varying,
    updated_by character varying,
    brand_name character varying NOT NULL,
    legal_name character varying,
    founded_year character varying,
    tagline character varying,
    tags json,
    presence_links json,
    currency character varying NOT NULL,
    timezone character varying NOT NULL,
    industry character varying,
    country character varying,
    hq_city character varying,
    brand_context text,
    support_email character varying,
    support_phone character varying,
    support_hours character varying,
    stack_data json,
    channels_data json,
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: company_entitlement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_entitlement (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    module_id character varying NOT NULL,
    is_enabled boolean NOT NULL,
    expires_at timestamp without time zone
);


--
-- Name: company_membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_membership (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id character varying NOT NULL,
    role public.systemrole NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: data_source; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_source (
    id uuid NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    category public.datasourcecategory NOT NULL,
    website_url character varying,
    logo_url character varying,
    description character varying,
    auth_method character varying,
    is_active boolean NOT NULL,
    is_coming_soon boolean NOT NULL,
    is_common boolean NOT NULL,
    is_implemented boolean NOT NULL,
    theme_color character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: feedback_learning; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_learning (
    id uuid NOT NULL,
    brand_id uuid NOT NULL,
    generator_type character varying NOT NULL,
    refusal_reason character varying NOT NULL,
    learning_vector jsonb,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: insight_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_feedback (
    id uuid NOT NULL,
    insight_id character varying NOT NULL,
    brand_id uuid NOT NULL,
    status character varying NOT NULL,
    verification_intent jsonb,
    verification_status character varying NOT NULL,
    user_comment character varying,
    created_at timestamp without time zone NOT NULL,
    verified_at timestamp without time zone
);


--
-- Name: insight_generation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_generation_log (
    id uuid NOT NULL,
    brand_id uuid NOT NULL,
    generated_at timestamp without time zone NOT NULL,
    insights jsonb,
    briefing character varying,
    generation_time_ms integer,
    validation_failures jsonb
);


--
-- Name: insight_impression; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_impression (
    id uuid NOT NULL,
    brand_id uuid NOT NULL,
    insight_id character varying NOT NULL,
    shown_at timestamp without time zone NOT NULL,
    clicked boolean NOT NULL,
    dismissed boolean NOT NULL,
    action_taken character varying
);


--
-- Name: insight_suppression; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_suppression (
    id uuid NOT NULL,
    brand_id uuid NOT NULL,
    insight_id character varying NOT NULL,
    suppressed_until timestamp without time zone NOT NULL,
    reason character varying
);


--
-- Name: integration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    datasource_id uuid NOT NULL,
    status character varying,
    credentials json,
    config json,
    metadata_info jsonb,
    app_version character varying,
    error_message character varying,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: integration_daily_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_daily_metric (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    metric_type character varying NOT NULL,
    total_sales numeric(20,2) NOT NULL,
    net_sales numeric(20,2) NOT NULL,
    gross_sales numeric(20,2) NOT NULL,
    count_primary integer NOT NULL,
    count_secondary integer NOT NULL,
    total_discounts numeric(20,2) NOT NULL,
    total_refunds numeric(20,2) NOT NULL,
    total_tax numeric(20,2) NOT NULL,
    total_shipping numeric(20,2) NOT NULL,
    average_value numeric(20,2) NOT NULL,
    currency character varying NOT NULL,
    meta_data jsonb
);


--
-- Name: integration_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_metric (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    metric_date date NOT NULL,
    sync_attempts integer NOT NULL,
    sync_successes integer NOT NULL,
    sync_failures integer NOT NULL,
    avg_sync_duration_seconds double precision,
    total_records_synced integer NOT NULL,
    total_data_volume_bytes integer NOT NULL,
    error_count integer NOT NULL,
    last_error_message character varying,
    last_error_at timestamp without time zone,
    health_score double precision NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: interview_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_session (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id character varying NOT NULL,
    status character varying NOT NULL,
    transcript character varying,
    metadata_info jsonb,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description character varying NOT NULL
);


--
-- Name: onboarding_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_metric (
    id uuid NOT NULL,
    user_id character varying NOT NULL,
    started_at timestamp without time zone NOT NULL,
    completed_at timestamp without time zone,
    abandoned_at timestamp without time zone,
    basics_completed_at timestamp without time zone,
    channels_completed_at timestamp without time zone,
    stack_completed_at timestamp without time zone,
    finish_completed_at timestamp without time zone,
    basics_duration_seconds integer,
    channels_duration_seconds integer,
    stack_duration_seconds integer,
    finish_duration_seconds integer,
    total_duration_seconds integer,
    drawer_opens integer NOT NULL,
    search_uses integer NOT NULL,
    datasources_selected integer NOT NULL,
    integration_requests integer NOT NULL,
    last_step_visited character varying NOT NULL,
    drop_off_reason character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: onboarding_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_state (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    user_id character varying NOT NULL,
    current_page character varying NOT NULL,
    current_step integer NOT NULL,
    is_completed boolean NOT NULL,
    basics_data json,
    channels_data json,
    stack_data json,
    finish_data json,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    last_saved_at timestamp without time zone NOT NULL
);


--
-- Name: permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission (
    id character varying NOT NULL,
    description character varying NOT NULL
);


--
-- Name: shopify_address; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_address (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_customer_id bigint NOT NULL,
    customer_id uuid,
    shopify_address_id bigint NOT NULL,
    first_name character varying,
    last_name character varying,
    company character varying,
    address1 character varying,
    address2 character varying,
    city character varying,
    province character varying,
    country character varying,
    zip character varying,
    phone character varying,
    name character varying,
    province_code character varying,
    country_code character varying,
    country_name character varying,
    "default" boolean NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_analytics_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_analytics_snapshot (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    report_data_id uuid,
    report_id uuid,
    "timestamp" timestamp without time zone NOT NULL,
    granularity character varying NOT NULL,
    data jsonb,
    meta_data jsonb
);


--
-- Name: shopify_balance_transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_balance_transaction (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_transaction_id bigint,
    payout_id uuid,
    shopify_payout_id bigint,
    type character varying NOT NULL,
    test boolean NOT NULL,
    amount numeric NOT NULL,
    currency character varying NOT NULL,
    fee numeric NOT NULL,
    net numeric NOT NULL,
    source_id bigint,
    source_type character varying,
    processed_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_checkout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_checkout (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_checkout_id bigint NOT NULL,
    token character varying NOT NULL,
    cart_token character varying,
    email character varying,
    abandoned_checkout_url character varying,
    subtotal_price numeric(20,2) NOT NULL,
    total_price numeric(20,2) NOT NULL,
    total_tax numeric(20,2) NOT NULL,
    currency character varying NOT NULL,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    shopify_completed_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_customer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_customer (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_customer_id bigint,
    email character varying,
    first_name character varying,
    last_name character varying,
    phone character varying,
    tags character varying,
    orders_count integer,
    total_spent double precision,
    currency character varying,
    last_order_id bigint,
    state character varying,
    verified_email boolean NOT NULL,
    accepts_marketing boolean NOT NULL,
    default_address jsonb,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_daily_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_daily_metric (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    total_sales numeric(20,2) NOT NULL,
    net_sales numeric(20,2) NOT NULL,
    order_count integer NOT NULL,
    customer_count_new integer NOT NULL,
    average_order_value numeric(20,2) NOT NULL,
    gross_sales numeric(20,2) NOT NULL,
    total_discounts numeric(20,2) NOT NULL,
    total_refunds numeric(20,2) NOT NULL,
    total_tax numeric(20,2) NOT NULL,
    total_shipping numeric(20,2) NOT NULL,
    currency character varying NOT NULL,
    meta_data jsonb
);


--
-- Name: shopify_discount_code; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_discount_code (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    price_rule_id uuid NOT NULL,
    shopify_price_rule_id bigint,
    shopify_discount_code_id bigint NOT NULL,
    code character varying NOT NULL,
    usage_count integer NOT NULL,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_dispute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_dispute (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_dispute_id bigint,
    order_id bigint,
    type character varying NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying NOT NULL,
    reason character varying NOT NULL,
    status character varying NOT NULL,
    evidence_due_by timestamp without time zone,
    evidence_sent_on timestamp without time zone,
    finalized_on timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_fulfillment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_fulfillment (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    order_id uuid NOT NULL,
    shopify_order_id bigint,
    shopify_fulfillment_id bigint NOT NULL,
    status character varying NOT NULL,
    shipment_status character varying,
    location_id bigint,
    tracking_company character varying,
    tracking_number character varying,
    tracking_url character varying,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_inventory_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_inventory_item (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_inventory_item_id bigint NOT NULL,
    sku character varying,
    tracked boolean NOT NULL,
    cost numeric(20,2),
    requires_shipping boolean NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_inventory_level; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_inventory_level (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_inventory_item_id bigint NOT NULL,
    shopify_location_id bigint NOT NULL,
    available integer NOT NULL,
    shopify_updated_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_line_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_line_item (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    order_id uuid NOT NULL,
    shopify_line_item_id bigint,
    product_id bigint,
    variant_id bigint,
    sku character varying,
    title character varying NOT NULL,
    variant_title character varying,
    vendor character varying,
    quantity integer NOT NULL,
    price numeric(20,2) NOT NULL,
    total_discount numeric(20,2) NOT NULL
);


--
-- Name: shopify_location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_location (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_location_id bigint NOT NULL,
    name character varying NOT NULL,
    address1 character varying,
    address2 character varying,
    city character varying,
    zip character varying,
    province character varying,
    country character varying,
    phone character varying,
    active boolean NOT NULL,
    is_primary boolean NOT NULL,
    shopify_created_at timestamp without time zone,
    shopify_updated_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_marketing_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_marketing_event (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_marketing_event_id bigint NOT NULL,
    type character varying NOT NULL,
    description character varying,
    marketing_channel character varying,
    paid boolean NOT NULL,
    manage_url character varying,
    preview_url character varying,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    scheduled_to_end_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_order (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_order_id bigint,
    shopify_order_number bigint,
    shopify_name character varying NOT NULL,
    financial_status character varying NOT NULL,
    fulfillment_status character varying,
    total_price numeric(20,2) NOT NULL,
    subtotal_price numeric(20,2) NOT NULL,
    total_tax numeric(20,2) NOT NULL,
    total_discounts numeric(20,2) NOT NULL,
    total_shipping numeric(20,2) NOT NULL,
    total_shipping_tax numeric(20,2) NOT NULL,
    refunded_subtotal numeric(20,2) NOT NULL,
    refunded_tax numeric(20,2) NOT NULL,
    currency character varying NOT NULL,
    customer_id uuid,
    email character varying,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    shopify_processed_at timestamp without time zone,
    shopify_closed_at timestamp without time zone,
    shopify_cancelled_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_payout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_payout (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_payout_id bigint,
    date timestamp without time zone NOT NULL,
    currency character varying NOT NULL,
    amount numeric(12,2) NOT NULL,
    status character varying NOT NULL,
    processed_at timestamp without time zone,
    summary jsonb,
    raw_payload jsonb
);


--
-- Name: shopify_price_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_price_rule (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_price_rule_id bigint NOT NULL,
    title character varying NOT NULL,
    value_type character varying NOT NULL,
    value double precision NOT NULL,
    target_type character varying NOT NULL,
    target_selection character varying NOT NULL,
    allocation_method character varying NOT NULL,
    usage_limit integer,
    once_per_customer boolean NOT NULL,
    starts_at timestamp without time zone NOT NULL,
    ends_at timestamp without time zone,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_product (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_product_id bigint NOT NULL,
    title character varying NOT NULL,
    handle character varying,
    vendor character varying,
    product_type character varying,
    status character varying NOT NULL,
    body_html character varying,
    tags character varying,
    published_at timestamp without time zone,
    shopify_created_at timestamp without time zone NOT NULL,
    shopify_updated_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_product_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_product_image (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    product_id uuid NOT NULL,
    shopify_image_id bigint NOT NULL,
    src character varying NOT NULL,
    alt character varying,
    "position" integer NOT NULL,
    width integer,
    height integer,
    shopify_created_at timestamp without time zone,
    shopify_updated_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_product_variant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_product_variant (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    product_id uuid NOT NULL,
    shopify_variant_id bigint NOT NULL,
    shopify_inventory_item_id bigint,
    title character varying NOT NULL,
    sku character varying,
    barcode character varying,
    price numeric(20,2) NOT NULL,
    compare_at_price numeric(20,2),
    weight numeric(20,2),
    weight_unit character varying,
    inventory_management character varying,
    inventory_policy character varying,
    inventory_quantity integer,
    shopify_created_at timestamp without time zone,
    shopify_updated_at timestamp without time zone,
    raw_payload jsonb
);


--
-- Name: shopify_raw_ingest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_raw_ingest (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    object_type character varying NOT NULL,
    shopify_object_id bigint,
    shopify_updated_at timestamp without time zone,
    dedupe_key character varying NOT NULL,
    dedupe_hash_canonical character varying NOT NULL,
    source character varying NOT NULL,
    topic character varying,
    api_version character varying NOT NULL,
    headers jsonb,
    payload jsonb,
    hmac_valid boolean NOT NULL,
    processing_status character varying NOT NULL,
    error_message character varying,
    diff_summary jsonb,
    fetched_at timestamp without time zone NOT NULL,
    processed_at timestamp without time zone
);


--
-- Name: shopify_refund; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_refund (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    order_id uuid NOT NULL,
    shopify_refund_id bigint,
    shopify_order_id bigint,
    note character varying,
    restock boolean NOT NULL,
    refund_line_items jsonb,
    raw_payload jsonb,
    processed_at timestamp without time zone NOT NULL
);


--
-- Name: shopify_report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_report (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    shopify_report_id bigint,
    name character varying NOT NULL,
    shopify_ql character varying,
    category character varying,
    shopify_updated_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: shopify_report_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_report_data (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    report_id uuid,
    query_name character varying NOT NULL,
    captured_at timestamp without time zone NOT NULL,
    data jsonb
);


--
-- Name: shopify_transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_transaction (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    integration_id uuid NOT NULL,
    company_id uuid NOT NULL,
    order_id uuid NOT NULL,
    shopify_transaction_id bigint,
    shopify_order_id bigint,
    parent_id bigint,
    amount numeric(10,2),
    currency character varying NOT NULL,
    kind character varying NOT NULL,
    status character varying NOT NULL,
    gateway character varying,
    "authorization" character varying,
    error_code character varying,
    message character varying,
    shopify_processed_at timestamp without time zone NOT NULL,
    raw_payload jsonb
);


--
-- Name: system_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_metric (
    id uuid NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    api_requests_total integer NOT NULL,
    api_requests_success integer NOT NULL,
    api_requests_error integer NOT NULL,
    avg_response_time_ms double precision,
    db_connections_active integer NOT NULL,
    db_query_avg_time_ms double precision,
    error_count integer NOT NULL,
    error_rate double precision NOT NULL,
    cpu_usage_percent double precision,
    memory_usage_percent double precision,
    overall_health_score double precision NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    email character varying NOT NULL,
    full_name character varying,
    linkedin_profile character varying,
    picture_url character varying,
    is_active boolean NOT NULL,
    is_superuser boolean NOT NULL,
    id character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    last_login_at timestamp without time zone NOT NULL,
    onboarding_completed boolean NOT NULL,
    current_company_id uuid,
    contact_number character varying,
    otp_verified boolean NOT NULL,
    designation character varying,
    team character varying,
    role character varying,
    settings json
);


--
-- Name: user_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_metric (
    id uuid NOT NULL,
    user_id character varying NOT NULL,
    metric_date date NOT NULL,
    session_count integer NOT NULL,
    total_session_duration_seconds integer NOT NULL,
    page_views integer NOT NULL,
    interactions integer NOT NULL,
    features_used json,
    engagement_score double precision NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: workspace; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace (
    created_by character varying,
    updated_by character varying,
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    name character varying NOT NULL,
    timezone character varying NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: workspace_membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_membership (
    id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    user_id character varying NOT NULL,
    role public.systemrole NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Data for Name: all_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.all_requests (id, user_id, email, user_name, request_type, name, category, payload, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: archived_campaign_leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.archived_campaign_leads (id, original_campaign_id, campaign_name, customer_name, contact_number, cohort, meta_data, created_at, archived_at) FROM stdin;
1325547c-d419-47ee-aea1-c287409cd62e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Menon	6760062769	Lost	{"cohort": "Lost", "customer_name": "Nikhil Menon", "contact_number": "6760062769"}	2026-02-01 02:37:10.401277	2026-02-01 04:02:59.831929
168fe35b-40b7-4d20-8db1-fecf704a0710	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sameer Iyer	7756343432	New Customers	{"cohort": "New Customers", "customer_name": "Sameer Iyer", "contact_number": "7756343432"}	2026-02-01 02:37:10.377343	2026-02-01 04:02:59.832077
6fcb1a91-ef89-4a74-933a-d2830a9a2002	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Gill	8872090747	Lost	{"cohort": "Lost", "customer_name": "Vivaan Gill", "contact_number": "8872090747"}	2026-02-01 02:37:10.383592	2026-02-01 04:02:59.832153
545e595d-241a-4277-b73b-329140c18699	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Mukherjee	9647026354	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Anika Mukherjee", "contact_number": "9647026354"}	2026-02-01 02:37:10.386599	2026-02-01 04:02:59.832224
cc55f959-aff1-4ded-b94a-08d5d43cc659	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Nair	8473722111	Need Attention	{"cohort": "Need Attention", "customer_name": "Myra Nair", "contact_number": "8473722111"}	2026-02-01 02:37:10.389261	2026-02-01 04:02:59.832292
f8270cdd-db6b-416f-8b98-9beb92446d45	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Reddy	7172575982	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ayush Reddy", "contact_number": "7172575982"}	2026-02-01 02:37:10.38931	2026-02-01 04:02:59.832359
4bda5186-6038-44c7-a5f1-7278cf0cc653	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Gill	8105295618	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Mohit Gill", "contact_number": "8105295618"}	2026-02-01 02:37:10.389321	2026-02-01 04:02:59.832427
3511a36e-583a-4ef5-8a41-718d29d68660	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Shetty	9102439281	Champions	{"cohort": "Champions", "customer_name": "Nandini Shetty", "contact_number": "9102439281"}	2026-02-01 02:37:10.394868	2026-02-01 04:02:59.832493
cb67afea-6a23-4a3e-bfc9-ce8c6063f7f5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Yadav	6406015391	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Sai Yadav", "contact_number": "6406015391"}	2026-02-01 02:37:10.394899	2026-02-01 04:02:59.832557
1a91a4e7-e6b2-4573-ab19-89126ec6eeaf	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Gupta	9672544893	Need Attention	{"cohort": "Need Attention", "customer_name": "Manav Gupta", "contact_number": "9672544893"}	2026-02-01 02:37:10.394934	2026-02-01 04:02:59.832623
955a22d1-a0bd-4e7f-900b-bbeb9673927f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Shah	6679226110	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Vivaan Shah", "contact_number": "6679226110"}	2026-02-01 02:37:10.394942	2026-02-01 04:02:59.832688
1ff33f03-46ff-435e-a0f5-0c76a36d42cc	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Chatterjee	6464022802	Champions	{"cohort": "Champions", "customer_name": "Ira Chatterjee", "contact_number": "6464022802"}	2026-02-01 02:37:10.394974	2026-02-01 04:02:59.832754
2da73169-8b26-4e1f-829e-390d6673c5f0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Chaudhary	8766945698	Lost	{"cohort": "Lost", "customer_name": "Neha Chaudhary", "contact_number": "8766945698"}	2026-02-01 02:37:10.394983	2026-02-01 04:02:59.832822
0c15e07e-7315-4368-aaac-c62e0c0c3d17	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Rao	6075894434	At Risk	{"cohort": "At Risk", "customer_name": "Vivaan Rao", "contact_number": "6075894434"}	2026-02-01 02:37:10.394989	2026-02-01 04:02:59.832887
b0b4fdbb-516e-4be4-b4de-50c3b55fa75d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Arora	8540043209	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Diya Arora", "contact_number": "8540043209"}	2026-02-01 02:37:10.39501	2026-02-01 04:02:59.832953
f1178eda-00a5-4da2-841e-4b9d4909da5a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Bhat	6962074691	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Bhat", "contact_number": "6962074691"}	2026-02-01 02:37:10.395021	2026-02-01 04:02:59.833018
844037a6-394d-4e98-8b78-33d6b1dce8ad	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sneha Tripathi	9640336836	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sneha Tripathi", "contact_number": "9640336836"}	2026-02-01 02:37:10.39504	2026-02-01 04:02:59.833081
aa89bd88-de89-4a74-ab36-ed34b3babee1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Tiwari	8647002178	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Myra Tiwari", "contact_number": "8647002178"}	2026-02-01 02:37:10.395078	2026-02-01 04:02:59.833147
86409a5e-a0ec-4a9c-a909-d9fb2e15ca49	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Saha	6654137672	Promising	{"cohort": "Promising", "customer_name": "Shreya Saha", "contact_number": "6654137672"}	2026-02-01 02:37:10.397951	2026-02-01 04:02:59.833213
e53455e3-ae21-4ebe-b3bb-16eaaa9130d0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Sharma	7946196215	New Customers	{"cohort": "New Customers", "customer_name": "Avni Sharma", "contact_number": "7946196215"}	2026-02-01 02:37:10.401043	2026-02-01 04:02:59.833279
5952b53c-f240-4ee5-8e65-59e59800b419	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Singh	9099418475	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Parth Singh", "contact_number": "9099418475"}	2026-02-01 02:37:10.401084	2026-02-01 04:02:59.833347
7e92a8d4-f19b-4527-b6af-e2d401ea033c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Mishra	8444411571	Need Attention	{"cohort": "Need Attention", "customer_name": "Harsh Mishra", "contact_number": "8444411571"}	2026-02-01 02:37:10.401088	2026-02-01 04:02:59.833412
210b28bb-974a-4eb2-80ae-e824712c5207	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Saha	6274958225	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rahul Saha", "contact_number": "6274958225"}	2026-02-01 02:37:10.401093	2026-02-01 04:02:59.833477
71ad93c2-e55b-44ca-ac57-7efe4f97a42d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Roy	9844373989	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ishaan Roy", "contact_number": "9844373989"}	2026-02-01 02:37:10.401097	2026-02-01 04:02:59.833542
d1d95625-305a-4b8f-8207-913b79c7fb44	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Bansal	7527077836	New Customers	{"cohort": "New Customers", "customer_name": "Parth Bansal", "contact_number": "7527077836"}	2026-02-01 02:37:10.401102	2026-02-01 04:02:59.833607
828ff887-de07-4139-b253-21072ca82b4c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Shah	7405588454	New Customers	{"cohort": "New Customers", "customer_name": "Reyansh Shah", "contact_number": "7405588454"}	2026-02-01 02:37:10.401106	2026-02-01 04:02:59.833677
8f379c9d-7894-4a45-bca5-c3332a2e0c94	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Reddy	7461493668	At Risk	{"cohort": "At Risk", "customer_name": "Varun Reddy", "contact_number": "7461493668"}	2026-02-01 02:37:10.40111	2026-02-01 04:02:59.833746
98f7ea6f-5fa4-4337-a0f1-1632cf41fc11	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kunal Aggarwal	9968456262	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kunal Aggarwal", "contact_number": "9968456262"}	2026-02-01 02:37:10.401114	2026-02-01 04:02:59.833811
cb66a35e-3468-470b-8956-a33c499955a3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Bose	7740684690	Promising	{"cohort": "Promising", "customer_name": "Naina Bose", "contact_number": "7740684690"}	2026-02-01 02:37:10.401118	2026-02-01 04:02:59.833878
bb6efe53-9ca5-4a21-99cc-71179ff450d3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Gupta	6231557108	Need Attention	{"cohort": "Need Attention", "customer_name": "Avni Gupta", "contact_number": "6231557108"}	2026-02-01 02:37:10.401122	2026-02-01 04:02:59.833943
459de5d2-a94b-44a4-8128-9314d541fe48	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Pandey	7452646842	Champions	{"cohort": "Champions", "customer_name": "Dev Pandey", "contact_number": "7452646842"}	2026-02-01 02:37:10.401126	2026-02-01 04:02:59.834008
5e8e5fc7-2a10-48f6-bdae-2832cb6c10c7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sneha Iyer	7099296439	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Iyer", "contact_number": "7099296439"}	2026-02-01 02:37:10.40113	2026-02-01 04:02:59.834073
2195f1c2-24a1-408d-8713-55ae6ef7351f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Malhotra	9133260830	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rupali Malhotra", "contact_number": "9133260830"}	2026-02-01 02:37:10.401134	2026-02-01 04:02:59.834139
1bf45a32-be6a-4153-a18d-fd7765a4cea6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Rao	6978972821	Champions	{"cohort": "Champions", "customer_name": "Sai Rao", "contact_number": "6978972821"}	2026-02-01 02:37:10.401138	2026-02-01 04:02:59.834231
4b8d4bae-1649-4ee5-82e8-d7ac6242b479	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kiara Srinivasan	8676869634	Hibernating	{"cohort": "Hibernating", "customer_name": "Kiara Srinivasan", "contact_number": "8676869634"}	2026-02-01 02:37:10.401142	2026-02-01 04:02:59.834297
4233dec6-c7b5-42bc-a4a5-cb191adc532e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Kapoor	8702711595	Lost	{"cohort": "Lost", "customer_name": "Aditi Kapoor", "contact_number": "8702711595"}	2026-02-01 02:37:10.401146	2026-02-01 04:02:59.834386
e061151f-5ded-483e-a872-86e1d5dc227b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kavya Das	8828487319	At Risk	{"cohort": "At Risk", "customer_name": "Kavya Das", "contact_number": "8828487319"}	2026-02-01 02:37:10.401149	2026-02-01 04:02:59.834539
4968d212-bc07-4252-9f12-8bc00a73f5bd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Patel	7726638503	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ritvik Patel", "contact_number": "7726638503"}	2026-02-01 02:37:10.401152	2026-02-01 04:02:59.834635
79db7423-dc7a-459e-8092-62d7a70257f1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditya Gowda	8546658912	Champions	{"cohort": "Champions", "customer_name": "Aditya Gowda", "contact_number": "8546658912"}	2026-02-01 02:37:10.401157	2026-02-01 04:02:59.834703
84c65e34-aabc-4f83-8766-50b70b7e5a49	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Bajaj	6693666476	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Myra Bajaj", "contact_number": "6693666476"}	2026-02-01 02:37:10.401161	2026-02-01 04:02:59.834771
556501ab-81ef-4399-a542-110caee67d40	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kiara Shah	6193408146	New Customers	{"cohort": "New Customers", "customer_name": "Kiara Shah", "contact_number": "6193408146"}	2026-02-01 02:37:10.401165	2026-02-01 04:02:59.834837
f4dbff14-6d74-41d2-b72b-eac823eed967	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Chatterjee	9578686926	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Pallavi Chatterjee", "contact_number": "9578686926"}	2026-02-01 02:37:10.401169	2026-02-01 04:02:59.834983
c293844c-db28-4b73-99b1-a54454fc481a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Reddy	7498065933	Promising	{"cohort": "Promising", "customer_name": "Trisha Reddy", "contact_number": "7498065933"}	2026-02-01 02:37:10.401172	2026-02-01 04:02:59.835175
e2ef3972-3e34-4493-94ba-5548f6f483b9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Saha	7998026903	Champions	{"cohort": "Champions", "customer_name": "Varun Saha", "contact_number": "7998026903"}	2026-02-01 02:37:10.401176	2026-02-01 04:02:59.83527
6887e4b3-0add-4cb4-857d-26175bde3f3b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Srinivasan	7728558277	Hibernating	{"cohort": "Hibernating", "customer_name": "Nikhil Srinivasan", "contact_number": "7728558277"}	2026-02-01 02:37:10.40118	2026-02-01 04:02:59.835369
aeb73304-b9ba-43d0-8829-b6e92a8bae17	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Kapoor	6299571813	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mansi Kapoor", "contact_number": "6299571813"}	2026-02-01 02:37:10.401184	2026-02-01 04:02:59.835441
5af6258b-0915-48f8-91e9-d8153ae5a814	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Kapoor	7502141043	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ananya Kapoor", "contact_number": "7502141043"}	2026-02-01 02:37:10.401188	2026-02-01 04:02:59.835508
8256ffd6-a644-4f92-9583-6c1dae2d116a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kunal Roy	6426796360	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Kunal Roy", "contact_number": "6426796360"}	2026-02-01 02:37:10.401191	2026-02-01 04:02:59.835575
3164bcfa-a7d9-4676-817d-067ffee052df	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Saha	9841748311	Promising	{"cohort": "Promising", "customer_name": "Gaurav Saha", "contact_number": "9841748311"}	2026-02-01 02:37:10.401195	2026-02-01 04:02:59.835643
f61fd5f7-a0de-4d72-806e-4451b3429b24	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Hegde	8352547168	Promising	{"cohort": "Promising", "customer_name": "Harsh Hegde", "contact_number": "8352547168"}	2026-02-01 02:37:10.401199	2026-02-01 04:02:59.835706
b3bfa9c0-a099-4454-9066-39ab6823869c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Patel	7484837332	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Patel", "contact_number": "7484837332"}	2026-02-01 02:37:10.401202	2026-02-01 04:02:59.835775
9653de27-bf94-4bd8-925f-c1ce5c7bd9e8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Srinivasan	7640047310	Lost	{"cohort": "Lost", "customer_name": "Naina Srinivasan", "contact_number": "7640047310"}	2026-02-01 02:37:10.401206	2026-02-01 04:02:59.835839
8d017ff1-0614-46bc-8bf7-77964837792a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Shetty	8648949023	At Risk	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "8648949023"}	2026-02-01 02:37:10.401209	2026-02-01 04:02:59.83594
88934216-1053-48c5-bb5c-94eb5a4531b9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Mukherjee	6526218375	Hibernating	{"cohort": "Hibernating", "customer_name": "Dev Mukherjee", "contact_number": "6526218375"}	2026-02-01 02:37:10.401213	2026-02-01 04:02:59.83601
252ff577-dc61-4899-bcc7-404099f99f7e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Pandey	9898660982	Hibernating	{"cohort": "Hibernating", "customer_name": "Ananya Pandey", "contact_number": "9898660982"}	2026-02-01 02:37:10.401217	2026-02-01 04:02:59.836076
32842b51-18cd-4bef-8b7e-507473c0d2ed	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Saha	7279311607	Need Attention	{"cohort": "Need Attention", "customer_name": "Varun Saha", "contact_number": "7279311607"}	2026-02-01 02:37:10.40122	2026-02-01 04:02:59.83614
b3edb227-de3a-4ddd-8792-4512c8c40bab	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Srinivasan	6053413395	Hibernating	{"cohort": "Hibernating", "customer_name": "Rupali Srinivasan", "contact_number": "6053413395"}	2026-02-01 02:37:10.401224	2026-02-01 04:02:59.836205
58ba31c1-86a5-413d-a117-a038b11f34e9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Rao	6170044642	Champions	{"cohort": "Champions", "customer_name": "Harsh Rao", "contact_number": "6170044642"}	2026-02-01 02:37:10.401228	2026-02-01 04:02:59.836271
9795036f-f112-4bb3-a8ff-8ce11de20506	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Hegde	6316553290	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Myra Hegde", "contact_number": "6316553290"}	2026-02-01 02:37:10.401231	2026-02-01 04:02:59.836335
43b52138-479f-4d7d-ae8b-172f6044731d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Bajaj	7321230713	Champions	{"cohort": "Champions", "customer_name": "Rohan Bajaj", "contact_number": "7321230713"}	2026-02-01 02:37:10.401235	2026-02-01 04:02:59.836398
199d61d4-3349-4ff2-b8a5-e2a8d915fbe1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Mehta	7588080098	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Mehta", "contact_number": "7588080098"}	2026-02-01 02:37:10.401239	2026-02-01 04:02:59.836464
95f89c46-c2e6-402e-b7b1-47c262a1ef03	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Gupta	9574103868	New Customers	{"cohort": "New Customers", "customer_name": "Myra Gupta", "contact_number": "9574103868"}	2026-02-01 02:37:10.401243	2026-02-01 04:02:59.836538
91297139-92d7-4a38-9ab6-4cb5bd3a3f97	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Jain	8082553333	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Jain", "contact_number": "8082553333"}	2026-02-01 02:37:10.401246	2026-02-01 04:02:59.836605
2b161050-3699-4582-9fca-4318bbae4952	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Saha	7065173961	At Risk	{"cohort": "At Risk", "customer_name": "Arnav Saha", "contact_number": "7065173961"}	2026-02-01 02:37:10.40125	2026-02-01 04:02:59.836672
5e7bf7e9-e817-48c9-a5ab-451f9d6fdfcf	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Roy	6116761747	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Roy", "contact_number": "6116761747"}	2026-02-01 02:37:10.401253	2026-02-01 04:02:59.83674
c30a88a8-c598-4b45-9d6c-0b49780dbf4a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anvi Prasad	9686939344	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Anvi Prasad", "contact_number": "9686939344"}	2026-02-01 02:37:10.401257	2026-02-01 04:02:59.836864
74ee19b2-0280-4b9e-b674-68852bd5b845	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Arora	8753040326	Promising	{"cohort": "Promising", "customer_name": "Sakshi Arora", "contact_number": "8753040326"}	2026-02-01 02:37:10.401261	2026-02-01 04:02:59.83699
390f52b2-74c1-4317-86c7-ee72d2d81c33	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Roy	6654578486	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rohan Roy", "contact_number": "6654578486"}	2026-02-01 02:37:10.401266	2026-02-01 04:02:59.837078
96283ad0-01b8-4e8c-aa67-1d1b287cb055	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Deshmukh	8659488906	At Risk	{"cohort": "At Risk", "customer_name": "Aman Deshmukh", "contact_number": "8659488906"}	2026-02-01 02:37:10.401269	2026-02-01 04:02:59.837341
a8b75e72-3c8c-40f1-9489-c4b862683090	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Narayan	6244513243	Champions	{"cohort": "Champions", "customer_name": "Arnav Narayan", "contact_number": "6244513243"}	2026-02-01 02:37:10.401273	2026-02-01 04:02:59.837411
43a4e465-fe24-4f54-a58d-704d46d5f6b1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Nair	7351396359	At Risk	{"cohort": "At Risk", "customer_name": "Aarohi Nair", "contact_number": "7351396359"}	2026-02-01 02:37:10.401281	2026-02-01 04:02:59.837491
b1944daa-188a-41e1-b3ed-8bcc3dd872c9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Gill	8563179990	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Saanvi Gill", "contact_number": "8563179990"}	2026-02-01 02:37:10.401285	2026-02-01 04:02:59.837567
d43b8b17-4abf-4977-859c-ec7522b37042	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pooja Shetty	9503937191	Champions	{"cohort": "Champions", "customer_name": "Pooja Shetty", "contact_number": "9503937191"}	2026-02-01 02:37:10.401289	2026-02-01 04:02:59.837652
1c30fca4-6532-4fce-b743-51e4922001cb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Gill	8817880371	At Risk	{"cohort": "At Risk", "customer_name": "Aarohi Gill", "contact_number": "8817880371"}	2026-02-01 02:37:10.401293	2026-02-01 04:02:59.837723
7166cd27-8b42-491e-98ae-8a3fdc552dff	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Mishra	9116697037	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Shreya Mishra", "contact_number": "9116697037"}	2026-02-01 02:37:10.401297	2026-02-01 04:02:59.837791
c2d69630-63d2-4aac-84b6-8349c8d87029	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Yadav	9677229791	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Yadav", "contact_number": "9677229791"}	2026-02-01 02:37:10.401302	2026-02-01 04:02:59.837868
d8581982-436e-48e5-91bb-bc10a173a814	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Kapoor	9423598812	At Risk	{"cohort": "At Risk", "customer_name": "Arnav Kapoor", "contact_number": "9423598812"}	2026-02-01 02:37:10.401305	2026-02-01 04:02:59.837934
99a951fc-572e-446d-8285-afb5e3b7c0c8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Nair	9851882729	Champions	{"cohort": "Champions", "customer_name": "Myra Nair", "contact_number": "9851882729"}	2026-02-01 02:37:10.40131	2026-02-01 04:02:59.838001
fe0ea7b5-fcec-42e2-8b1e-3648714c9ef8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Deshmukh	7809889433	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Deshmukh", "contact_number": "7809889433"}	2026-02-01 02:37:10.401313	2026-02-01 04:02:59.838064
645ca7e3-01bd-4616-a436-2515cb5f0a23	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Sood	9930986712	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9930986712"}	2026-02-01 02:37:10.401318	2026-02-01 04:02:59.838135
32a53d16-763e-415d-a6fb-f1e22a3be767	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Iyer	9617400285	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Vihaan Iyer", "contact_number": "9617400285"}	2026-02-01 02:37:10.401324	2026-02-01 04:02:59.838199
68ce33e6-233e-4272-9927-2014448fe916	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Srinivasan	9123047419	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Srinivasan", "contact_number": "9123047419"}	2026-02-01 02:37:10.401327	2026-02-01 04:02:59.838263
767e198d-fd55-482c-a544-98fc82851f5a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Hegde	6657203516	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ananya Hegde", "contact_number": "6657203516"}	2026-02-01 02:37:10.401331	2026-02-01 04:02:59.838388
0261e9d6-896e-4954-8a1b-f0c225e407aa	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Chaudhary	8055953469	Champions	{"cohort": "Champions", "customer_name": "Manav Chaudhary", "contact_number": "8055953469"}	2026-02-01 02:37:10.401335	2026-02-01 04:02:59.838472
1bf6e5ba-3e59-43fd-8ebb-6d2ef3d60822	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Malhotra	8730261571	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Malhotra", "contact_number": "8730261571"}	2026-02-01 02:37:10.401339	2026-02-01 04:02:59.838541
4231026b-1655-4228-8db1-a424c58d3f7a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Chaudhary	8581746680	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Varun Chaudhary", "contact_number": "8581746680"}	2026-02-01 02:37:10.401343	2026-02-01 04:02:59.838606
f82b806f-e461-4df1-b6b0-259ff59dabc5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Naik	9027833384	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nikhil Naik", "contact_number": "9027833384"}	2026-02-01 02:37:10.401347	2026-02-01 04:02:59.838674
f578557f-e4e3-473c-8a8b-c5b0041742da	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Rao	6713783138	Need Attention	{"cohort": "Need Attention", "customer_name": "Aarohi Rao", "contact_number": "6713783138"}	2026-02-01 02:37:10.40135	2026-02-01 04:02:59.838739
83c2edf8-67f4-43e7-b3a2-9cb8de52f006	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Sharma	9839449587	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Trisha Sharma", "contact_number": "9839449587"}	2026-02-01 02:37:10.401353	2026-02-01 04:02:59.838804
982ac3e6-5a23-40a8-ad3d-2c2181400048	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Kaur	6491213247	Promising	{"cohort": "Promising", "customer_name": "Mohit Kaur", "contact_number": "6491213247"}	2026-02-01 02:37:10.401357	2026-02-01 04:02:59.838869
c4b07101-fcfb-40fc-881e-cfce5f511de4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayaan Hegde	7630839299	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ayaan Hegde", "contact_number": "7630839299"}	2026-02-01 02:37:10.401361	2026-02-01 04:02:59.838933
3589cddc-dc34-4ec0-856f-39d9628ab26b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Shetty	6645710864	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Sakshi Shetty", "contact_number": "6645710864"}	2026-02-01 02:37:10.401365	2026-02-01 04:02:59.838996
2ea606e5-ac73-48df-8a3a-801f6db0b70c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Saha	7073356693	At Risk	{"cohort": "At Risk", "customer_name": "Parth Saha", "contact_number": "7073356693"}	2026-02-01 02:37:10.401368	2026-02-01 04:02:59.83906
4f0e4444-9097-462d-b7ab-c5592574cbd5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Narayan	6553621743	Need Attention	{"cohort": "Need Attention", "customer_name": "Dhruv Narayan", "contact_number": "6553621743"}	2026-02-01 02:37:10.401372	2026-02-01 04:02:59.839125
4e768878-c43f-429f-98de-36c7bdf0b841	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Iyer	6224929418	At Risk	{"cohort": "At Risk", "customer_name": "Rahul Iyer", "contact_number": "6224929418"}	2026-02-01 02:37:10.401376	2026-02-01 04:02:59.839189
981fc556-f1d0-42ad-9faa-5246ce908321	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kiara Mishra	9179899675	Promising	{"cohort": "Promising", "customer_name": "Kiara Mishra", "contact_number": "9179899675"}	2026-02-01 02:37:10.40138	2026-02-01 04:02:59.839252
ef758f8c-3fb4-414d-9b61-e87835603262	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Pandey	8887967512	Promising	{"cohort": "Promising", "customer_name": "Ananya Pandey", "contact_number": "8887967512"}	2026-02-01 02:37:10.401384	2026-02-01 04:02:59.839323
40f1888e-71ce-4117-80d7-4727a6e8ab98	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarav Kaur	7243549180	New Customers	{"cohort": "New Customers", "customer_name": "Aarav Kaur", "contact_number": "7243549180"}	2026-02-01 02:37:10.401387	2026-02-01 04:02:59.839389
4c03b00d-838e-4807-8b5b-537574b051a5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Kaur	9975780964	Champions	{"cohort": "Champions", "customer_name": "Sakshi Kaur", "contact_number": "9975780964"}	2026-02-01 02:37:10.401391	2026-02-01 04:02:59.839451
dd89e398-1289-47bb-a609-fe9486e90031	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Joshi	8185571588	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aarohi Joshi", "contact_number": "8185571588"}	2026-02-01 02:37:10.401395	2026-02-01 04:02:59.839514
270ea5dd-84ca-4116-b089-7025c1649713	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Khan	7319295201	Champions	{"cohort": "Champions", "customer_name": "Parth Khan", "contact_number": "7319295201"}	2026-02-01 02:37:10.401399	2026-02-01 04:02:59.839577
362e63cd-60f7-452e-880f-35b6ad410101	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Reddy	8135519167	Need Attention	{"cohort": "Need Attention", "customer_name": "Neha Reddy", "contact_number": "8135519167"}	2026-02-01 02:37:10.401403	2026-02-01 04:02:59.83964
6a1cd3b6-15d6-406e-93aa-c39900ce4695	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Srinivasan	8858006567	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Trisha Srinivasan", "contact_number": "8858006567"}	2026-02-01 02:37:10.401407	2026-02-01 04:02:59.839706
345f8adc-92ec-44db-ac22-de926ece3186	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Srinivasan	9608563284	Promising	{"cohort": "Promising", "customer_name": "Meera Srinivasan", "contact_number": "9608563284"}	2026-02-01 02:37:10.401411	2026-02-01 04:02:59.839771
924ada25-d106-4461-b439-536b2fbc0c0d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Chaudhary	9004426377	Hibernating	{"cohort": "Hibernating", "customer_name": "Neha Chaudhary", "contact_number": "9004426377"}	2026-02-01 02:37:10.401415	2026-02-01 04:02:59.839834
916babef-be2d-4e26-98fb-9c7bfe8cd04b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Menon	8913534220	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Diya Menon", "contact_number": "8913534220"}	2026-02-01 02:37:10.401419	2026-02-01 04:02:59.839899
d0115ad2-bd3a-4af7-a6a9-9bd8ba2eeab2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Siddharth Sood	8984998971	New Customers	{"cohort": "New Customers", "customer_name": "Siddharth Sood", "contact_number": "8984998971"}	2026-02-01 02:37:10.401422	2026-02-01 04:02:59.839963
e2219915-e94b-4d7a-80ad-07e025bc00e8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Shetty	7454309592	At Risk	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "7454309592"}	2026-02-01 02:37:10.401425	2026-02-01 04:02:59.840027
1efda335-71e3-4e18-b4b8-e891c9f40691	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Naik	8025862011	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dhruv Naik", "contact_number": "8025862011"}	2026-02-01 02:37:10.401429	2026-02-01 04:02:59.84009
eb1366fb-a798-4f72-aca3-2d6ce92c9bbf	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anvi Sharma	8773451505	Champions	{"cohort": "Champions", "customer_name": "Anvi Sharma", "contact_number": "8773451505"}	2026-02-01 02:37:10.401433	2026-02-01 04:02:59.840155
3029e596-9398-45a3-9e07-cb450fef8d41	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Jain	8866103953	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Naina Jain", "contact_number": "8866103953"}	2026-02-01 02:37:10.401436	2026-02-01 04:02:59.840218
94bf548e-2bac-4866-a65c-6dfeccb93d23	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Riya Verma	7155013446	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Riya Verma", "contact_number": "7155013446"}	2026-02-01 02:37:10.401439	2026-02-01 04:02:59.840281
0e069e05-65db-496c-a3b8-1238fa0618fe	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayaan Kapoor	7361972385	Hibernating	{"cohort": "Hibernating", "customer_name": "Ayaan Kapoor", "contact_number": "7361972385"}	2026-02-01 02:37:10.401443	2026-02-01 04:02:59.840363
d721b670-db72-4849-8c87-b23d7e6f5575	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Ghosh	8403143886	At Risk	{"cohort": "At Risk", "customer_name": "Sakshi Ghosh", "contact_number": "8403143886"}	2026-02-01 02:37:10.401447	2026-02-01 04:02:59.840428
52518547-13fa-4adb-b297-ee02bdd4c6e4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Mehta	9269520457	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Mehta", "contact_number": "9269520457"}	2026-02-01 02:37:10.401451	2026-02-01 04:02:59.840491
4be663e4-bdcc-46bf-a88b-750c7040e7b5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Prasad	9160910316	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Saanvi Prasad", "contact_number": "9160910316"}	2026-02-01 02:37:10.401455	2026-02-01 04:02:59.840554
cc80a311-7b6a-4634-98f2-f83c827a19b6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Shah	9564877559	At Risk	{"cohort": "At Risk", "customer_name": "Sai Shah", "contact_number": "9564877559"}	2026-02-01 02:37:10.401459	2026-02-01 04:02:59.840617
f060f5e3-6f44-4b33-974a-96f698279a77	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Deshmukh	9531933776	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dev Deshmukh", "contact_number": "9531933776"}	2026-02-01 02:37:10.401462	2026-02-01 04:02:59.84068
7df9d84a-f460-40b2-8c49-fa6e6091fc32	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rashmi Patel	8612529222	Hibernating	{"cohort": "Hibernating", "customer_name": "Rashmi Patel", "contact_number": "8612529222"}	2026-02-01 02:37:10.401465	2026-02-01 04:02:59.840745
ae1c9e65-4755-4b53-9c2f-fd9e32a0dbba	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Shetty	9339721639	Promising	{"cohort": "Promising", "customer_name": "Parth Shetty", "contact_number": "9339721639"}	2026-02-01 02:37:10.401469	2026-02-01 04:02:59.840817
9b43d414-ece0-49f2-aaf9-7aa439027d23	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Nair	8982273424	At Risk	{"cohort": "At Risk", "customer_name": "Dhruv Nair", "contact_number": "8982273424"}	2026-02-01 02:37:10.401473	2026-02-01 04:02:59.840881
d6dc35ef-88e3-45e5-a617-3441a3f32811	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Krishna Gowda	7825217209	Hibernating	{"cohort": "Hibernating", "customer_name": "Krishna Gowda", "contact_number": "7825217209"}	2026-02-01 02:37:10.401476	2026-02-01 04:02:59.840944
e5f7e1b6-1363-497a-bb20-e02442ebf11a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Priya Rao	7604717059	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Priya Rao", "contact_number": "7604717059"}	2026-02-01 02:37:10.401481	2026-02-01 04:02:59.841006
7ca05cc1-2f46-4916-996a-c30ecee9b838	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Bose	9684672207	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Bose", "contact_number": "9684672207"}	2026-02-01 02:37:10.401485	2026-02-01 04:02:59.841068
52ee9a62-d8bb-47c8-b237-f1fe0d624463	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Isha Chaudhary	7579918199	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Isha Chaudhary", "contact_number": "7579918199"}	2026-02-01 02:37:10.401489	2026-02-01 04:02:59.84113
25574ff6-7495-44a9-9744-0b76656f044c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Roy	9717820269	New Customers	{"cohort": "New Customers", "customer_name": "Manav Roy", "contact_number": "9717820269"}	2026-02-01 02:37:10.401492	2026-02-01 04:02:59.841195
198107df-e746-411a-b5c8-e14a997f3b8f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Shetty	8295498411	At Risk	{"cohort": "At Risk", "customer_name": "Rupali Shetty", "contact_number": "8295498411"}	2026-02-01 02:37:10.401496	2026-02-01 04:02:59.84126
722372b6-3b0a-4c71-b4ad-cb52dcdca877	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Kaur	7767032616	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Parth Kaur", "contact_number": "7767032616"}	2026-02-01 02:37:10.4015	2026-02-01 04:02:59.841323
fe656922-5625-4389-b757-ee3b8deef090	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Das	9850611322	Champions	{"cohort": "Champions", "customer_name": "Harsh Das", "contact_number": "9850611322"}	2026-02-01 02:37:10.401504	2026-02-01 04:02:59.841387
f5d23837-c385-43ee-ad71-1d487d40d179	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Ghosh	7423552326	Promising	{"cohort": "Promising", "customer_name": "Ritvik Ghosh", "contact_number": "7423552326"}	2026-02-01 02:37:10.401508	2026-02-01 04:02:59.841454
8cf0d00e-b111-4514-98b8-ff83afc09eb7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Gowda	9345873192	New Customers	{"cohort": "New Customers", "customer_name": "Arnav Gowda", "contact_number": "9345873192"}	2026-02-01 02:37:10.401513	2026-02-01 04:02:59.841516
c9254cc0-c0ea-4583-8b6a-1b8ba9fe4f54	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Kapoor	7211764545	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Kapoor", "contact_number": "7211764545"}	2026-02-01 02:37:10.401517	2026-02-01 04:02:59.84158
698524d5-6a52-4608-9dad-603bbd552a15	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Naik	7765755391	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Yash Naik", "contact_number": "7765755391"}	2026-02-01 02:37:10.401521	2026-02-01 04:02:59.841643
f650711e-1eab-4a74-9e75-51a724e18a23	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Iyer	7513512505	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Yash Iyer", "contact_number": "7513512505"}	2026-02-01 02:37:10.401525	2026-02-01 04:02:59.841708
8198b114-93e5-450e-bb75-5985257f117b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Chatterjee	6454048738	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Chatterjee", "contact_number": "6454048738"}	2026-02-01 02:37:10.40153	2026-02-01 04:02:59.841772
2498d9e7-1f19-47ce-861f-0c35a6f1b92e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Bansal	7503099090	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Bansal", "contact_number": "7503099090"}	2026-02-01 02:37:10.401535	2026-02-01 04:02:59.841835
ffb939f7-1126-4b86-8a57-9845a1cac0f0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Yadav	9116793849	Promising	{"cohort": "Promising", "customer_name": "Vivaan Yadav", "contact_number": "9116793849"}	2026-02-01 02:37:10.401539	2026-02-01 04:02:59.841898
70524913-dffd-44c4-9348-3b6d8af463ef	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pooja Chatterjee	9366563155	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Pooja Chatterjee", "contact_number": "9366563155"}	2026-02-01 02:37:10.401544	2026-02-01 04:02:59.841962
02ce843e-26ed-4c19-8ca5-44e94241f664	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Chatterjee	7879474324	New Customers	{"cohort": "New Customers", "customer_name": "Shreya Chatterjee", "contact_number": "7879474324"}	2026-02-01 02:37:10.401547	2026-02-01 04:02:59.842071
8862255a-a74a-4139-b1e8-1c2ce761ccb1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarav Patel	7297184780	Lost	{"cohort": "Lost", "customer_name": "Aarav Patel", "contact_number": "7297184780"}	2026-02-01 02:37:10.401552	2026-02-01 04:02:59.842138
32862890-7b53-4e18-8668-e86b03b52e24	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Srinivasan	7054682045	Lost	{"cohort": "Lost", "customer_name": "Ritvik Srinivasan", "contact_number": "7054682045"}	2026-02-01 02:37:10.401556	2026-02-01 04:02:59.842202
f1e38cf8-bc3f-4371-8e50-49a2258031c2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Chatterjee	6192955782	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Chatterjee", "contact_number": "6192955782"}	2026-02-01 02:37:10.40156	2026-02-01 04:02:59.842267
284e3a1d-8d72-484b-99e9-1facc1abab40	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Gupta	7954255716	Promising	{"cohort": "Promising", "customer_name": "Arjun Gupta", "contact_number": "7954255716"}	2026-02-01 02:37:10.401564	2026-02-01 04:02:59.84233
999ed17e-e98a-4c9e-9b22-4b8b8eea0de0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Bansal	9036356421	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Trisha Bansal", "contact_number": "9036356421"}	2026-02-01 02:37:10.401568	2026-02-01 04:02:59.842393
271b5336-d7ab-452f-b5f0-795578b3c13e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Joshi	9228140445	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Joshi", "contact_number": "9228140445"}	2026-02-01 02:37:10.401572	2026-02-01 04:02:59.842456
cd1f0d67-2033-45f0-8abb-2964cdf968ea	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Saha	9226980712	Champions	{"cohort": "Champions", "customer_name": "Saanvi Saha", "contact_number": "9226980712"}	2026-02-01 02:37:10.401575	2026-02-01 04:02:59.842519
15e0d9c4-3e38-42a8-9ef6-ea9d47f55eea	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Deshmukh	6817754839	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Deshmukh", "contact_number": "6817754839"}	2026-02-01 02:37:10.401579	2026-02-01 04:02:59.842582
a9534e7e-7494-449a-912e-2a0460c265e5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Shetty	6217779673	Promising	{"cohort": "Promising", "customer_name": "Ira Shetty", "contact_number": "6217779673"}	2026-02-01 02:37:10.401583	2026-02-01 04:02:59.842647
3d862dea-967f-4674-b863-b08863c1b58f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Krishna Kaur	7573532540	Champions	{"cohort": "Champions", "customer_name": "Krishna Kaur", "contact_number": "7573532540"}	2026-02-01 02:37:10.401589	2026-02-01 04:02:59.842709
e724d323-ea96-45fc-ba5d-b239d4b8edfb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Prasad	9732308705	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rupali Prasad", "contact_number": "9732308705"}	2026-02-01 02:37:10.401593	2026-02-01 04:02:59.842773
073e9a5a-339e-4f3f-982c-6da1cb52edf9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kavya Kulkarni	9212525937	Hibernating	{"cohort": "Hibernating", "customer_name": "Kavya Kulkarni", "contact_number": "9212525937"}	2026-02-01 02:37:10.401598	2026-02-01 04:02:59.842834
365a6ba6-1443-4241-869c-4d4bd3b18d01	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Kulkarni	9964171749	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Saanvi Kulkarni", "contact_number": "9964171749"}	2026-02-01 02:37:10.401604	2026-02-01 04:02:59.842897
0f675660-c377-4f1e-8f4e-6c736a09f4ae	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Tripathi	6580800160	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Avni Tripathi", "contact_number": "6580800160"}	2026-02-01 02:37:10.401608	2026-02-01 04:02:59.84296
99e526ad-037c-4fde-91fe-17ae7171539e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Reddy	7053666440	Promising	{"cohort": "Promising", "customer_name": "Diya Reddy", "contact_number": "7053666440"}	2026-02-01 02:37:10.401612	2026-02-01 04:02:59.843023
d2d74784-03e1-4819-b8b3-aac287d3e161	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Gowda	9052908689	Lost	{"cohort": "Lost", "customer_name": "Reyansh Gowda", "contact_number": "9052908689"}	2026-02-01 02:37:10.401617	2026-02-01 04:02:59.843085
edbd58d1-2ab6-4837-be83-45060aa312fc	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Aggarwal	6952623709	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Manav Aggarwal", "contact_number": "6952623709"}	2026-02-01 02:37:10.401621	2026-02-01 04:02:59.843148
ce6ba719-4015-4da5-aef8-969f9d07dab0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Tripathi	9592686870	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Tripathi", "contact_number": "9592686870"}	2026-02-01 02:37:10.401625	2026-02-01 04:02:59.843211
fcc0e98e-7922-4e94-b8e5-8a9e85f41ae8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Kaur	9346708639	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Kaur", "contact_number": "9346708639"}	2026-02-01 02:37:10.401629	2026-02-01 04:02:59.843273
ec11d425-91a6-4b4e-8523-718f90e51459	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Hegde	6892965296	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Vihaan Hegde", "contact_number": "6892965296"}	2026-02-01 02:37:10.401632	2026-02-01 04:02:59.843336
f4c94b4e-a005-4e7c-acfb-f66975327678	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Narayan	8850939577	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aman Narayan", "contact_number": "8850939577"}	2026-02-01 02:37:10.401636	2026-02-01 04:02:59.843399
b4cc485f-8c84-49a3-aad5-825dfdab6feb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Mehta	9925586537	New Customers	{"cohort": "New Customers", "customer_name": "Reyansh Mehta", "contact_number": "9925586537"}	2026-02-01 02:37:10.401639	2026-02-01 04:02:59.843461
556f97eb-4b25-44ef-ac86-2fd5a6b2d71f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Kaur	6590483793	Need Attention	{"cohort": "Need Attention", "customer_name": "Arnav Kaur", "contact_number": "6590483793"}	2026-02-01 02:37:10.401644	2026-02-01 04:02:59.843524
5452041f-55be-4f8f-af47-ed6ca1db7e8e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Reddy	8029439466	Need Attention	{"cohort": "Need Attention", "customer_name": "Rahul Reddy", "contact_number": "8029439466"}	2026-02-01 02:37:10.401648	2026-02-01 04:02:59.843589
04a2281a-bb88-4b16-93e5-9e487d079433	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Das	6722023713	Promising	{"cohort": "Promising", "customer_name": "Saanvi Das", "contact_number": "6722023713"}	2026-02-01 02:37:10.401652	2026-02-01 04:02:59.843652
7ce2d901-0177-4a12-ab82-8b373120f568	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Shetty	8103321145	Champions	{"cohort": "Champions", "customer_name": "Diya Shetty", "contact_number": "8103321145"}	2026-02-01 02:37:10.401656	2026-02-01 04:02:59.843714
67f9c0fe-6464-4421-8b79-825610f4ea3c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Nair	9105578047	At Risk	{"cohort": "At Risk", "customer_name": "Yash Nair", "contact_number": "9105578047"}	2026-02-01 02:37:10.401659	2026-02-01 04:02:59.843777
ad379dac-56b7-4748-a318-f68057dc53f4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Khan	7513134044	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Manav Khan", "contact_number": "7513134044"}	2026-02-01 02:37:10.401662	2026-02-01 04:02:59.843839
61db5e0c-efa1-469a-b5d6-873e124055bc	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Pandey	9739746410	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Pandey", "contact_number": "9739746410"}	2026-02-01 02:37:10.401668	2026-02-01 04:02:59.843902
a63a135c-748a-4b8b-b2dd-29d28729e69c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Patel	9368338891	Champions	{"cohort": "Champions", "customer_name": "Saanvi Patel", "contact_number": "9368338891"}	2026-02-01 02:37:10.401673	2026-02-01 04:02:59.843964
c94470bc-62b5-4f34-a89c-a2c0221a5616	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Rao	8664133769	Need Attention	{"cohort": "Need Attention", "customer_name": "Yash Rao", "contact_number": "8664133769"}	2026-02-01 02:37:10.401678	2026-02-01 04:02:59.844026
b362cb54-8bb9-47ca-9513-410a6c356c0c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Mehta	7327391917	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Reyansh Mehta", "contact_number": "7327391917"}	2026-02-01 02:37:10.401682	2026-02-01 04:02:59.844089
f94d405f-9692-4c7a-a979-28d190121ab0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Shetty	6947426874	Champions	{"cohort": "Champions", "customer_name": "Aman Shetty", "contact_number": "6947426874"}	2026-02-01 02:37:10.401687	2026-02-01 04:02:59.844154
0404e278-c93e-4159-8b6d-e52d37cfa4dd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Sharma	9132143455	Promising	{"cohort": "Promising", "customer_name": "Mansi Sharma", "contact_number": "9132143455"}	2026-02-01 02:37:10.401692	2026-02-01 04:02:59.844216
c9f793ff-7bff-449c-b679-2a273ccb3e16	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Sood	9573856076	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9573856076"}	2026-02-01 02:37:10.401696	2026-02-01 04:02:59.844281
9be46f81-057e-4e40-b966-930e984e9a28	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Mukherjee	8165669371	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Mukherjee", "contact_number": "8165669371"}	2026-02-01 02:37:10.4017	2026-02-01 04:02:59.844343
c24b0b8a-38f1-41f4-ae30-cc331b6ca17f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Tripathi	6255554375	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Tripathi", "contact_number": "6255554375"}	2026-02-01 02:37:10.401703	2026-02-01 04:02:59.844406
927e510b-1414-40cb-8114-0208e7a0b2c8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Riya Kulkarni	7301491913	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Riya Kulkarni", "contact_number": "7301491913"}	2026-02-01 02:37:10.401707	2026-02-01 04:02:59.844469
9d67573a-4b73-4640-a9f4-f65e25743181	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Saxena	9753074007	New Customers	{"cohort": "New Customers", "customer_name": "Ira Saxena", "contact_number": "9753074007"}	2026-02-01 02:37:10.401712	2026-02-01 04:02:59.844533
3c5fc3f2-f104-46eb-bb33-2e0bd9342bcd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Mehta	6866192115	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Mehta", "contact_number": "6866192115"}	2026-02-01 02:37:10.401717	2026-02-01 04:02:59.844595
4a13354e-e737-4275-ae0f-aa7f3aa89ed5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Malhotra	9241640615	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Malhotra", "contact_number": "9241640615"}	2026-02-01 02:37:10.401721	2026-02-01 04:02:59.844658
22fde6a4-e555-4d04-b510-1673cf7cff93	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarav Malhotra	9022775753	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aarav Malhotra", "contact_number": "9022775753"}	2026-02-01 02:37:10.401725	2026-02-01 04:02:59.84472
c533d26d-16c5-4d0c-96c0-bbe1fae7cfe1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Pandey	7428565653	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aarohi Pandey", "contact_number": "7428565653"}	2026-02-01 02:37:10.401729	2026-02-01 04:02:59.844783
d0c0b067-bfea-4d03-9cd4-8aeda5530f56	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kiara Mishra	9687260113	Hibernating	{"cohort": "Hibernating", "customer_name": "Kiara Mishra", "contact_number": "9687260113"}	2026-02-01 02:37:10.401734	2026-02-01 04:02:59.844846
0cd05a2e-728a-434c-89b2-ba67fc960f7f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Kaur	7313554459	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Harsh Kaur", "contact_number": "7313554459"}	2026-02-01 02:37:10.401738	2026-02-01 04:02:59.844907
deb6d042-762a-4cab-beba-dfd98b1b74c0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Rao	7541340301	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Tanvi Rao", "contact_number": "7541340301"}	2026-02-01 02:37:10.401741	2026-02-01 04:02:59.84497
b76c5303-e347-4c7f-8b66-f41f392ccd06	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Arora	9954648400	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Arora", "contact_number": "9954648400"}	2026-02-01 02:37:10.401746	2026-02-01 04:02:59.845032
6effe31d-13e5-4d1d-986d-7379686d580d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Riya Menon	7225147751	At Risk	{"cohort": "At Risk", "customer_name": "Riya Menon", "contact_number": "7225147751"}	2026-02-01 02:37:10.401749	2026-02-01 04:02:59.845094
3da39049-69d4-4258-8c7c-50eec94c0b08	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Banerjee	6259577424	Promising	{"cohort": "Promising", "customer_name": "Diya Banerjee", "contact_number": "6259577424"}	2026-02-01 02:37:10.401753	2026-02-01 04:02:59.845156
71adb63e-968f-4ccb-83ba-72081224253c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Mehta	7294384972	Promising	{"cohort": "Promising", "customer_name": "Ira Mehta", "contact_number": "7294384972"}	2026-02-01 02:37:10.401758	2026-02-01 04:02:59.845222
3e06f791-ad88-4de8-8e69-15dd4551fda1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Gill	8864678855	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Shreya Gill", "contact_number": "8864678855"}	2026-02-01 02:37:10.401763	2026-02-01 04:02:59.845288
d2b8fd4e-7b5d-4169-9e13-009107abdacb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sneha Mehta	7372289609	Champions	{"cohort": "Champions", "customer_name": "Sneha Mehta", "contact_number": "7372289609"}	2026-02-01 02:37:10.401767	2026-02-01 04:02:59.845353
125e914e-7810-4c04-b562-8d219438fc39	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Jain	9998182787	Hibernating	{"cohort": "Hibernating", "customer_name": "Ayush Jain", "contact_number": "9998182787"}	2026-02-01 02:37:10.401771	2026-02-01 04:02:59.845418
c04ae72a-3926-4d88-b2ba-e39cd1a9f5c9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Mehta	9452446805	Hibernating	{"cohort": "Hibernating", "customer_name": "Vihaan Mehta", "contact_number": "9452446805"}	2026-02-01 02:37:10.401778	2026-02-01 04:02:59.845483
4615a16b-decf-48f5-a1e0-2f712bbf2c71	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Kulkarni	8684458809	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Kulkarni", "contact_number": "8684458809"}	2026-02-01 02:37:10.401782	2026-02-01 04:02:59.845545
b7893718-9cf2-4a25-b0fd-1d32e18cc1a4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Naik	8873984325	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Naik", "contact_number": "8873984325"}	2026-02-01 02:37:10.401786	2026-02-01 04:02:59.845608
41634ec1-77ad-4c2f-bb7d-42b4ef89b71b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Mehta	7543600741	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ananya Mehta", "contact_number": "7543600741"}	2026-02-01 02:37:10.40179	2026-02-01 04:02:59.845671
077bef2f-df80-41d5-a0ca-34c4e2234867	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Shah	7409261619	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Shah", "contact_number": "7409261619"}	2026-02-01 02:37:10.401795	2026-02-01 04:02:59.845732
e8fc1300-0271-46e0-a9af-6d669f8ed693	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Khan	8030660677	Hibernating	{"cohort": "Hibernating", "customer_name": "Pallavi Khan", "contact_number": "8030660677"}	2026-02-01 02:37:10.401799	2026-02-01 04:02:59.845796
f226d5e8-eb79-4329-a0f5-801c95fae349	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Chaudhary	9670412606	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Arjun Chaudhary", "contact_number": "9670412606"}	2026-02-01 02:37:10.401802	2026-02-01 04:02:59.845859
fb43db7a-79cc-4711-bc8e-87124e17678b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Hegde	6941037138	At Risk	{"cohort": "At Risk", "customer_name": "Arjun Hegde", "contact_number": "6941037138"}	2026-02-01 02:37:10.401806	2026-02-01 04:02:59.845924
ac583dc4-5680-4a79-8b51-11c511d2fe44	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Mukherjee	7388660561	Need Attention	{"cohort": "Need Attention", "customer_name": "Trisha Mukherjee", "contact_number": "7388660561"}	2026-02-01 02:37:10.401809	2026-02-01 04:02:59.845987
45c33890-d1ff-44d7-a3e6-1032c2f42ad6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Iyer	8761468017	Champions	{"cohort": "Champions", "customer_name": "Arnav Iyer", "contact_number": "8761468017"}	2026-02-01 02:37:10.401813	2026-02-01 04:02:59.84605
2cc291f0-1126-456d-aea8-b9c8afd7f1be	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Prasad	9347262672	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sakshi Prasad", "contact_number": "9347262672"}	2026-02-01 02:37:10.401818	2026-02-01 04:02:59.846113
baf4f97b-ebe6-4be1-8485-75619e55c12c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Yadav	6863557208	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Yadav", "contact_number": "6863557208"}	2026-02-01 02:37:10.401821	2026-02-01 04:02:59.846175
903f2356-43a4-428f-ad01-b3eb0d00a111	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Gupta	7414559991	Need Attention	{"cohort": "Need Attention", "customer_name": "Naina Gupta", "contact_number": "7414559991"}	2026-02-01 02:37:10.401825	2026-02-01 04:02:59.846239
cb5a8d78-f5ba-4993-b440-c0f70e85ee7d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Shah	9367970020	Champions	{"cohort": "Champions", "customer_name": "Aditi Shah", "contact_number": "9367970020"}	2026-02-01 02:37:10.401828	2026-02-01 04:02:59.846302
df4e08a3-ec7a-4998-bf79-78869a372c19	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kabir Gowda	6932774465	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kabir Gowda", "contact_number": "6932774465"}	2026-02-01 02:37:10.401832	2026-02-01 04:02:59.846365
e36b9136-8a6c-4266-84f6-8be3b2c9a4d7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Prasad	7235285368	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Shreya Prasad", "contact_number": "7235285368"}	2026-02-01 02:37:10.401836	2026-02-01 04:02:59.846427
49cfdbf4-287c-4068-a9a0-12e7950f3286	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Isha Jain	6349229160	Champions	{"cohort": "Champions", "customer_name": "Isha Jain", "contact_number": "6349229160"}	2026-02-01 02:37:10.40184	2026-02-01 04:02:59.846536
3f9f6792-be12-42c3-a985-8ff6f5b3755f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Bose	7177195771	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rupali Bose", "contact_number": "7177195771"}	2026-02-01 02:37:10.401844	2026-02-01 04:02:59.846601
c9165806-9b55-43c6-ba7b-d0afbce3f261	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Gowda	7787183452	Promising	{"cohort": "Promising", "customer_name": "Ira Gowda", "contact_number": "7787183452"}	2026-02-01 02:37:10.401848	2026-02-01 04:02:59.846665
2db9534c-65b6-4683-8a9f-209046442b67	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Jain	6450811786	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ritvik Jain", "contact_number": "6450811786"}	2026-02-01 02:37:10.401854	2026-02-01 04:02:59.846728
8554594f-16c3-461c-a4ea-54287c8c3089	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Bose	6250824319	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Bose", "contact_number": "6250824319"}	2026-02-01 02:37:10.401858	2026-02-01 04:02:59.846791
9d32377a-a649-471f-a09d-0569657c9cdb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Nair	6597434720	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arnav Nair", "contact_number": "6597434720"}	2026-02-01 02:37:10.401862	2026-02-01 04:02:59.846855
a59ba015-0404-406c-b443-1c23cf027b86	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Narayan	8160250488	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Gaurav Narayan", "contact_number": "8160250488"}	2026-02-01 02:37:10.401866	2026-02-01 04:02:59.846918
dd815114-79dd-4571-94e4-77a5b13855d9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Pandey	8350253645	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Meera Pandey", "contact_number": "8350253645"}	2026-02-01 02:37:10.401871	2026-02-01 04:02:59.846981
0f6aeb84-c60f-472e-856e-a03bb19b98e4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Sood	9977571905	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rohan Sood", "contact_number": "9977571905"}	2026-02-01 02:37:10.401874	2026-02-01 04:02:59.847044
1382abff-81f3-4c86-bdaa-aaa067238f36	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Patel	6906871524	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Rupali Patel", "contact_number": "6906871524"}	2026-02-01 02:37:10.401878	2026-02-01 04:02:59.847108
d14e0478-23b2-44ec-a14f-16ca5aa01c04	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarav Pandey	6912028484	Need Attention	{"cohort": "Need Attention", "customer_name": "Aarav Pandey", "contact_number": "6912028484"}	2026-02-01 02:37:10.401882	2026-02-01 04:02:59.84718
59c32a85-f49f-421e-86a4-eb563e689e85	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Prasad	6556350612	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "6556350612"}	2026-02-01 02:37:10.401886	2026-02-01 04:02:59.847242
2cbf4676-cca1-4a51-a482-59dc4e1f9708	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Patel	8938342917	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Patel", "contact_number": "8938342917"}	2026-02-01 02:37:10.40189	2026-02-01 04:02:59.847304
aa502d56-fca0-4d13-92f4-538140d81bf9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sneha Roy	6114459232	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Roy", "contact_number": "6114459232"}	2026-02-01 02:37:10.401894	2026-02-01 04:02:59.847367
e16f6438-37cd-4cf1-9d5a-1ddb7b2619f9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Bose	6083762817	Champions	{"cohort": "Champions", "customer_name": "Neha Bose", "contact_number": "6083762817"}	2026-02-01 02:37:10.401897	2026-02-01 04:02:59.84743
03ffa2b6-8a10-4e11-849e-6c3f359097d9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Krishna Aggarwal	8302819855	New Customers	{"cohort": "New Customers", "customer_name": "Krishna Aggarwal", "contact_number": "8302819855"}	2026-02-01 02:37:10.4019	2026-02-01 04:02:59.847508
d8ada306-1f0c-45e1-b542-0d6b5b0b30be	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Patel	6481089183	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Patel", "contact_number": "6481089183"}	2026-02-01 02:37:10.401904	2026-02-01 04:02:59.847571
e5e222eb-ed45-4152-88d6-b76bbd884874	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Mukherjee	6528009419	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Mukherjee", "contact_number": "6528009419"}	2026-02-01 02:37:10.401908	2026-02-01 04:02:59.847633
725c47e5-9b6d-44bf-a5f3-e5e6c8ad4be8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Siddharth Banerjee	8190947434	Lost	{"cohort": "Lost", "customer_name": "Siddharth Banerjee", "contact_number": "8190947434"}	2026-02-01 02:37:10.401911	2026-02-01 04:02:59.847697
1a7b461b-6201-4f7d-acf9-7de13e1cd243	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Tiwari	8212806224	New Customers	{"cohort": "New Customers", "customer_name": "Ananya Tiwari", "contact_number": "8212806224"}	2026-02-01 02:37:10.401914	2026-02-01 04:02:59.84776
026db4e3-deec-47de-8887-175504c48e2a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Shetty	9021185687	Hibernating	{"cohort": "Hibernating", "customer_name": "Mansi Shetty", "contact_number": "9021185687"}	2026-02-01 02:37:10.401918	2026-02-01 04:02:59.847823
26d40b8b-23f5-4b18-9158-4f169cd6a235	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Ghosh	9735495313	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Ghosh", "contact_number": "9735495313"}	2026-02-01 02:37:10.401922	2026-02-01 04:02:59.847886
b802e2f3-a049-4531-98a1-b70520857a08	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Narayan	7082843521	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Narayan", "contact_number": "7082843521"}	2026-02-01 02:37:10.401925	2026-02-01 04:02:59.847959
6c61c089-41e3-464f-a520-efeb8e927e89	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Isha Sharma	7628909287	Promising	{"cohort": "Promising", "customer_name": "Isha Sharma", "contact_number": "7628909287"}	2026-02-01 02:37:10.401929	2026-02-01 04:02:59.848022
b7e6d616-b609-42b7-b373-de9a4292a9ce	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Rao	8991237357	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Rao", "contact_number": "8991237357"}	2026-02-01 02:37:10.401932	2026-02-01 04:02:59.848091
49868467-5147-4c4b-b590-0ed65aa9e791	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Gowda	8955198434	Promising	{"cohort": "Promising", "customer_name": "Meera Gowda", "contact_number": "8955198434"}	2026-02-01 02:37:10.401936	2026-02-01 04:02:59.848155
b1eac740-1773-4ceb-8b22-3401a07b464d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Nair	6060436831	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Reyansh Nair", "contact_number": "6060436831"}	2026-02-01 02:37:10.401939	2026-02-01 04:02:59.848218
38c496fe-d089-4e5c-95f3-7862730d67c4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Iyer	8017115307	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aarohi Iyer", "contact_number": "8017115307"}	2026-02-01 02:37:10.401943	2026-02-01 04:02:59.848281
74a93e2c-1f5f-478f-a839-df4de364b407	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Reddy	9533974643	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Reddy", "contact_number": "9533974643"}	2026-02-01 02:37:10.401946	2026-02-01 04:02:59.848343
b999dac3-ec52-46f6-b255-1f1605077923	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Rao	8251361799	Champions	{"cohort": "Champions", "customer_name": "Ayush Rao", "contact_number": "8251361799"}	2026-02-01 02:37:10.401949	2026-02-01 04:02:59.848405
99fad7b2-0f92-44fb-a76f-5ddb604a1724	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Saha	9875138661	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Saha", "contact_number": "9875138661"}	2026-02-01 02:37:10.401953	2026-02-01 04:02:59.848467
a16f277c-9986-4036-96a7-bf43c4c140b3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kiara Chaudhary	9172918076	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kiara Chaudhary", "contact_number": "9172918076"}	2026-02-01 02:37:10.401957	2026-02-01 04:02:59.84853
a7ec859b-9463-429d-a5f4-8abae7127dc1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Arora	8422021037	Hibernating	{"cohort": "Hibernating", "customer_name": "Ira Arora", "contact_number": "8422021037"}	2026-02-01 02:37:10.40196	2026-02-01 04:02:59.848593
4a3db4fc-0099-45bc-ac85-10a8a146ad79	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Roy	7843514866	Lost	{"cohort": "Lost", "customer_name": "Rahul Roy", "contact_number": "7843514866"}	2026-02-01 02:37:10.401964	2026-02-01 04:02:59.848656
51d5447a-34b3-4124-bd0f-1ac400d6365d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Srinivasan	7470021381	Hibernating	{"cohort": "Hibernating", "customer_name": "Mohit Srinivasan", "contact_number": "7470021381"}	2026-02-01 02:37:10.401967	2026-02-01 04:02:59.848718
620ccb29-c546-477c-8adc-33d809dd141d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Bose	6580564091	New Customers	{"cohort": "New Customers", "customer_name": "Pallavi Bose", "contact_number": "6580564091"}	2026-02-01 02:37:10.401971	2026-02-01 04:02:59.848781
429b766e-8fd9-4faa-bc09-b0060ad1adcd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Deshmukh	9112167722	Champions	{"cohort": "Champions", "customer_name": "Neha Deshmukh", "contact_number": "9112167722"}	2026-02-01 02:37:10.401975	2026-02-01 04:02:59.848844
05f6d514-23e2-44f1-bf1b-eebaa63c7731	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Mehta	7035400086	Hibernating	{"cohort": "Hibernating", "customer_name": "Aarohi Mehta", "contact_number": "7035400086"}	2026-02-01 02:37:10.401978	2026-02-01 04:02:59.848906
965825a2-096e-4f36-8769-ceb9eaca6f0b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Srinivasan	9101208334	New Customers	{"cohort": "New Customers", "customer_name": "Sai Srinivasan", "contact_number": "9101208334"}	2026-02-01 02:37:10.401981	2026-02-01 04:02:59.848969
c0a73162-9a63-4e32-94e7-efcb965d61e3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Saha	8051834242	Lost	{"cohort": "Lost", "customer_name": "Manav Saha", "contact_number": "8051834242"}	2026-02-01 02:37:10.401985	2026-02-01 04:02:59.849031
8b0592d6-a02f-4650-9e3b-8f598aa2f625	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditya Sharma	8516068472	Lost	{"cohort": "Lost", "customer_name": "Aditya Sharma", "contact_number": "8516068472"}	2026-02-01 02:37:10.401989	2026-02-01 04:02:59.849093
5050f212-30f7-445c-9d30-8fd63ed811a2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Bajaj	6884584840	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Rahul Bajaj", "contact_number": "6884584840"}	2026-02-01 02:37:10.401992	2026-02-01 04:02:59.849156
c4128068-147a-4d93-8128-3eceeea126f1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Krishna Srinivasan	6598661719	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Krishna Srinivasan", "contact_number": "6598661719"}	2026-02-01 02:37:10.401995	2026-02-01 04:02:59.849223
7ebc0ef5-75e6-46ea-81f2-4b7cca7e259e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Singh	7814949682	New Customers	{"cohort": "New Customers", "customer_name": "Aarohi Singh", "contact_number": "7814949682"}	2026-02-01 02:37:10.401999	2026-02-01 04:02:59.849286
5be592d4-a55c-413b-ae83-2fd4f9b8ba10	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Tiwari	6055859075	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ayush Tiwari", "contact_number": "6055859075"}	2026-02-01 02:37:10.402002	2026-02-01 04:02:59.849353
e2eeb028-91e2-4033-886f-1cd2478fd805	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pooja Arora	9115591177	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Pooja Arora", "contact_number": "9115591177"}	2026-02-01 02:37:10.402006	2026-02-01 04:02:59.849415
40ea158e-89b4-4de1-b555-458383250b61	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Rao	8826541466	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Manav Rao", "contact_number": "8826541466"}	2026-02-01 02:37:10.402009	2026-02-01 04:02:59.849478
1fca7511-f9c9-4f0d-9e35-e45005189ce3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarav Iyer	9083279808	Promising	{"cohort": "Promising", "customer_name": "Aarav Iyer", "contact_number": "9083279808"}	2026-02-01 02:37:10.402012	2026-02-01 04:02:59.849541
07bfb9b3-752d-48be-a049-7f71f990b0ed	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Bhat	8388692377	Hibernating	{"cohort": "Hibernating", "customer_name": "Arjun Bhat", "contact_number": "8388692377"}	2026-02-01 02:37:10.402016	2026-02-01 04:02:59.849603
04ba4a94-6d0c-4429-a9ac-35d919d216d3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Menon	8246128778	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Menon", "contact_number": "8246128778"}	2026-02-01 02:37:10.402019	2026-02-01 04:02:59.849672
0dedaca2-7c09-46a2-9a47-47acf53d3c9d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sneha Gupta	6513518801	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Gupta", "contact_number": "6513518801"}	2026-02-01 02:37:10.402023	2026-02-01 04:02:59.849736
15936e95-703e-4ee1-b1e1-938769117bc5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Kapoor	7824972856	Champions	{"cohort": "Champions", "customer_name": "Mansi Kapoor", "contact_number": "7824972856"}	2026-02-01 02:37:10.402026	2026-02-01 04:02:59.8498
f4d14c13-2e10-4422-ba2e-281b00cb3611	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Rao	6624494538	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Rao", "contact_number": "6624494538"}	2026-02-01 02:37:10.40203	2026-02-01 04:02:59.849863
20d43ed7-0f5b-4cd5-bb59-23e826668514	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Menon	6496141726	Lost	{"cohort": "Lost", "customer_name": "Ritvik Menon", "contact_number": "6496141726"}	2026-02-01 02:37:10.403074	2026-02-01 04:02:59.865216
e909a1fa-466e-457f-bf5b-da9ad681e908	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Mishra	8762315986	Lost	{"cohort": "Lost", "customer_name": "Ishaan Mishra", "contact_number": "8762315986"}	2026-02-01 02:37:10.402033	2026-02-01 04:02:59.849926
b9371317-f2f3-4c0d-9f71-5d789dbaa4a0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Krishna Gupta	7240770966	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Krishna Gupta", "contact_number": "7240770966"}	2026-02-01 02:37:10.402036	2026-02-01 04:02:59.849991
a9d2507e-6e5c-466d-ab79-c81e4c7dfa1d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Kapoor	6269772884	Promising	{"cohort": "Promising", "customer_name": "Meera Kapoor", "contact_number": "6269772884"}	2026-02-01 02:37:10.40204	2026-02-01 04:02:59.850054
cc94b154-b734-48c4-940e-296ed61fd94e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Gupta	7468315683	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Nandini Gupta", "contact_number": "7468315683"}	2026-02-01 02:37:10.402043	2026-02-01 04:02:59.850117
d1e2c232-8974-4b3f-9290-6cbe1bcf0bc8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Aggarwal	8210968278	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Aggarwal", "contact_number": "8210968278"}	2026-02-01 02:37:10.402047	2026-02-01 04:02:59.85018
54e76091-8ce8-420b-a4a5-ad22a5eaaea5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Hegde	8152088431	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ira Hegde", "contact_number": "8152088431"}	2026-02-01 02:37:10.40205	2026-02-01 04:02:59.850242
664d5e5c-7171-4bad-b1e5-8e14bdc2fda9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Gowda	6692430751	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Saanvi Gowda", "contact_number": "6692430751"}	2026-02-01 02:37:10.402054	2026-02-01 04:02:59.850305
4bac171b-de8f-4470-bf8d-bc8a0744bd89	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Aggarwal	7664933165	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Reyansh Aggarwal", "contact_number": "7664933165"}	2026-02-01 02:37:10.402058	2026-02-01 04:02:59.850368
8e35872c-787c-43eb-923d-00ab75c20a7c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Rao	8012871630	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Rao", "contact_number": "8012871630"}	2026-02-01 02:37:10.402062	2026-02-01 04:02:59.850432
8c956406-ee06-46b4-8dd0-64e8d0484ff8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Tripathi	8284835410	At Risk	{"cohort": "At Risk", "customer_name": "Sakshi Tripathi", "contact_number": "8284835410"}	2026-02-01 02:37:10.402065	2026-02-01 04:02:59.850494
a519a1f7-6d22-40f6-9e21-1fccba7fa578	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Gill	6411654819	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Gill", "contact_number": "6411654819"}	2026-02-01 02:37:10.402069	2026-02-01 04:02:59.85056
cd0d1eed-90fc-4504-8969-4afc0d7debce	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Mukherjee	8459437746	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ishaan Mukherjee", "contact_number": "8459437746"}	2026-02-01 02:37:10.402072	2026-02-01 04:02:59.850622
95697774-fcda-404d-90cb-e5473ef5923a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Singh	7304275177	Hibernating	{"cohort": "Hibernating", "customer_name": "Trisha Singh", "contact_number": "7304275177"}	2026-02-01 02:37:10.402076	2026-02-01 04:02:59.850685
7980faf5-25a2-4487-a1a6-2cf69c0413bf	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Khan	7664930130	Promising	{"cohort": "Promising", "customer_name": "Avni Khan", "contact_number": "7664930130"}	2026-02-01 02:37:10.402079	2026-02-01 04:02:59.850747
ab648115-22eb-4554-add8-31b24994bc12	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Tripathi	8750072831	Promising	{"cohort": "Promising", "customer_name": "Sakshi Tripathi", "contact_number": "8750072831"}	2026-02-01 02:37:10.402083	2026-02-01 04:02:59.850814
aaf0ad46-7ab0-4ac3-b68f-a5f7bfedd67a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Khan	8182275389	At Risk	{"cohort": "At Risk", "customer_name": "Vivaan Khan", "contact_number": "8182275389"}	2026-02-01 02:37:10.402086	2026-02-01 04:02:59.850879
d5a5f92c-45e0-4721-a355-7d85841d7ca9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Bansal	8947198029	Need Attention	{"cohort": "Need Attention", "customer_name": "Ayush Bansal", "contact_number": "8947198029"}	2026-02-01 02:37:10.40209	2026-02-01 04:02:59.850942
e07949ee-5753-458c-bba9-62041947adf7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Tripathi	7751360825	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Tanvi Tripathi", "contact_number": "7751360825"}	2026-02-01 02:37:10.402094	2026-02-01 04:02:59.85223
3c93c213-fe31-4ed0-bfcc-10f59d9949f0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Gowda	6501801412	At Risk	{"cohort": "At Risk", "customer_name": "Avni Gowda", "contact_number": "6501801412"}	2026-02-01 02:37:10.402097	2026-02-01 04:02:59.852348
c3e0852f-1358-4bb6-9fb1-8cbbde3326ee	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Gill	7260415674	Hibernating	{"cohort": "Hibernating", "customer_name": "Trisha Gill", "contact_number": "7260415674"}	2026-02-01 02:37:10.402101	2026-02-01 04:02:59.852424
f7b8850e-d283-4126-a039-5fe7845cdaca	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Mukherjee	6562746789	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Mukherjee", "contact_number": "6562746789"}	2026-02-01 02:37:10.402104	2026-02-01 04:02:59.852495
5e69f486-507a-41b7-92e1-1a1b4fb88b94	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Singh	8720429306	New Customers	{"cohort": "New Customers", "customer_name": "Anika Singh", "contact_number": "8720429306"}	2026-02-01 02:37:10.402108	2026-02-01 04:02:59.852562
830de210-7b59-40f5-992c-ebdeb95c7488	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Bhat	6861057122	Champions	{"cohort": "Champions", "customer_name": "Tanvi Bhat", "contact_number": "6861057122"}	2026-02-01 02:37:10.402112	2026-02-01 04:02:59.852628
dc56396c-3d89-40fd-a336-97924740c338	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Malhotra	8208883641	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Malhotra", "contact_number": "8208883641"}	2026-02-01 02:37:10.402115	2026-02-01 04:02:59.852692
758fac53-676a-4b30-b4ae-1fc3799689b9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Gupta	6016389273	Champions	{"cohort": "Champions", "customer_name": "Trisha Gupta", "contact_number": "6016389273"}	2026-02-01 02:37:10.402119	2026-02-01 04:02:59.852754
7d10cbda-c12a-4f0e-abee-1bd68918fd2e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Kulkarni	8149238767	Promising	{"cohort": "Promising", "customer_name": "Pallavi Kulkarni", "contact_number": "8149238767"}	2026-02-01 02:37:10.402123	2026-02-01 04:02:59.852817
313b0792-0dbd-46f5-96eb-238b00510c0b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Das	6179819454	Promising	{"cohort": "Promising", "customer_name": "Myra Das", "contact_number": "6179819454"}	2026-02-01 02:37:10.402126	2026-02-01 04:02:59.852879
915d4861-b2a6-4dfc-a30e-575326d8b4d2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rashmi Pandey	9768878448	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Pandey", "contact_number": "9768878448"}	2026-02-01 02:37:10.40213	2026-02-01 04:02:59.852941
2c57a93e-7ae7-4bfc-af50-b690ee2a15b9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kunal Ghosh	9023767559	Need Attention	{"cohort": "Need Attention", "customer_name": "Kunal Ghosh", "contact_number": "9023767559"}	2026-02-01 02:37:10.402134	2026-02-01 04:02:59.853003
bc024adf-c944-495e-bc27-3df3ba2d2b8d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rashmi Chatterjee	8566474661	Champions	{"cohort": "Champions", "customer_name": "Rashmi Chatterjee", "contact_number": "8566474661"}	2026-02-01 02:37:10.402137	2026-02-01 04:02:59.853065
2577e89f-2618-4831-9c3a-c1439bb0a0a0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Verma	6095441733	Champions	{"cohort": "Champions", "customer_name": "Myra Verma", "contact_number": "6095441733"}	2026-02-01 02:37:10.402141	2026-02-01 04:02:59.853126
a7cc4f1c-3967-48c5-b370-734229c5d245	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Das	8026424848	At Risk	{"cohort": "At Risk", "customer_name": "Gaurav Das", "contact_number": "8026424848"}	2026-02-01 02:37:10.402144	2026-02-01 04:02:59.853186
cc0af8fa-b0f8-4cbc-8b52-6d1d84af5a32	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Bansal	9397040587	New Customers	{"cohort": "New Customers", "customer_name": "Arnav Bansal", "contact_number": "9397040587"}	2026-02-01 02:37:10.402148	2026-02-01 04:02:59.85325
1490fb5a-718c-48be-adf5-6a5a9f072dce	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Patel	8856438883	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Patel", "contact_number": "8856438883"}	2026-02-01 02:37:10.402152	2026-02-01 04:02:59.853313
44bc063b-6809-4a52-b08f-988ce5c2b36b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Saha	9734060367	Promising	{"cohort": "Promising", "customer_name": "Dhruv Saha", "contact_number": "9734060367"}	2026-02-01 02:37:10.402155	2026-02-01 04:02:59.853378
cba47f17-4287-4a09-a18a-4f2cb9583338	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kunal Narayan	8701177161	At Risk	{"cohort": "At Risk", "customer_name": "Kunal Narayan", "contact_number": "8701177161"}	2026-02-01 02:37:10.402159	2026-02-01 04:02:59.853442
7295e971-6398-4650-b5e2-9c4f70891506	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Saxena	9281370661	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Neha Saxena", "contact_number": "9281370661"}	2026-02-01 02:37:10.402162	2026-02-01 04:02:59.853503
374ceb1e-25c8-4ec6-94a5-a78d0f8501fa	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Shetty	9455907545	Need Attention	{"cohort": "Need Attention", "customer_name": "Mohit Shetty", "contact_number": "9455907545"}	2026-02-01 02:37:10.402167	2026-02-01 04:02:59.853567
bac36831-50e4-4d03-a72e-51b12457ba01	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Verma	7618166384	Champions	{"cohort": "Champions", "customer_name": "Rahul Verma", "contact_number": "7618166384"}	2026-02-01 02:37:10.402171	2026-02-01 04:02:59.853629
795881f7-e341-4417-aaaa-9a3b70836f89	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayaan Bose	7299414772	Champions	{"cohort": "Champions", "customer_name": "Ayaan Bose", "contact_number": "7299414772"}	2026-02-01 02:37:10.402174	2026-02-01 04:02:59.85369
5145218c-b2e0-43a5-8d2c-ac94b91d7a3b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aadhya Yadav	8796262369	Promising	{"cohort": "Promising", "customer_name": "Aadhya Yadav", "contact_number": "8796262369"}	2026-02-01 02:37:10.402179	2026-02-01 04:02:59.85375
42915a98-d1bd-4158-ad23-800c9f67a390	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Gupta	7563134564	Promising	{"cohort": "Promising", "customer_name": "Aarohi Gupta", "contact_number": "7563134564"}	2026-02-01 02:37:10.402182	2026-02-01 04:02:59.853812
6e486182-ac1b-4fd9-a48e-1f2240d6915d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Chaudhary	8840130027	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Chaudhary", "contact_number": "8840130027"}	2026-02-01 02:37:10.402186	2026-02-01 04:02:59.853872
41ee35d1-8471-449a-b7c7-928cd549fd16	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Aggarwal	8610725346	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Aggarwal", "contact_number": "8610725346"}	2026-02-01 02:37:10.402189	2026-02-01 04:02:59.853935
df1d5763-3955-4c9e-b904-217c29a4b754	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Jain	7752772693	Lost	{"cohort": "Lost", "customer_name": "Dev Jain", "contact_number": "7752772693"}	2026-02-01 02:37:10.402193	2026-02-01 04:02:59.853995
9bb17d2b-32ad-4b68-8591-c6283707d529	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Chaudhary	8907288426	Promising	{"cohort": "Promising", "customer_name": "Manav Chaudhary", "contact_number": "8907288426"}	2026-02-01 02:37:10.402197	2026-02-01 04:02:59.854058
2d0b92a9-c665-4797-b352-4a56d17d96f0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Iyer	8756792161	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Iyer", "contact_number": "8756792161"}	2026-02-01 02:37:10.4022	2026-02-01 04:02:59.854119
52eb60e1-abfe-4405-9a9b-cf0daec7ebf3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Prasad	7710221804	At Risk	{"cohort": "At Risk", "customer_name": "Varun Prasad", "contact_number": "7710221804"}	2026-02-01 02:37:10.402204	2026-02-01 04:02:59.854181
8c3a75cc-8d73-4b7a-bced-b4eca25c566b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Bose	7095768375	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Diya Bose", "contact_number": "7095768375"}	2026-02-01 02:37:10.402208	2026-02-01 04:02:59.854249
2da3e350-f192-4fb7-af39-0788496ec08a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditya Arora	6732105450	New Customers	{"cohort": "New Customers", "customer_name": "Aditya Arora", "contact_number": "6732105450"}	2026-02-01 02:37:10.402211	2026-02-01 04:02:59.85431
dacc9f00-2a7c-48a1-bd78-296bc0df37ff	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Sharma	7863296457	Champions	{"cohort": "Champions", "customer_name": "Manav Sharma", "contact_number": "7863296457"}	2026-02-01 02:37:10.402215	2026-02-01 04:02:59.854371
193f1655-15ad-47bb-b132-139af00857b6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Isha Shetty	6132692083	Champions	{"cohort": "Champions", "customer_name": "Isha Shetty", "contact_number": "6132692083"}	2026-02-01 02:37:10.402218	2026-02-01 04:02:59.854442
be046464-b383-4be9-9eb2-cafb3c22c5c7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Kaur	6352983840	Lost	{"cohort": "Lost", "customer_name": "Mohit Kaur", "contact_number": "6352983840"}	2026-02-01 02:37:10.402222	2026-02-01 04:02:59.854504
4b8cff1d-c09a-48d2-a082-d5c6a167a3a0	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Gill	7300975626	At Risk	{"cohort": "At Risk", "customer_name": "Ayush Gill", "contact_number": "7300975626"}	2026-02-01 02:37:10.402226	2026-02-01 04:02:59.854564
93cb12ef-7224-4276-a523-ba21e8753a4e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Das	7841579769	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Gaurav Das", "contact_number": "7841579769"}	2026-02-01 02:37:10.402229	2026-02-01 04:02:59.854631
e12c1b5a-4ee7-44fb-bebf-2b0a956e9f69	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Siddharth Mishra	7070012089	New Customers	{"cohort": "New Customers", "customer_name": "Siddharth Mishra", "contact_number": "7070012089"}	2026-02-01 02:37:10.402233	2026-02-01 04:02:59.854692
214f892b-7b7b-431b-8474-96ea481d3a45	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Gowda	9364065667	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arjun Gowda", "contact_number": "9364065667"}	2026-02-01 02:37:10.402237	2026-02-01 04:02:59.854753
ab75d64f-f882-41c3-ad0c-adbe520efbe2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anvi Bansal	6709173074	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anvi Bansal", "contact_number": "6709173074"}	2026-02-01 02:37:10.40224	2026-02-01 04:02:59.854812
e9e91f3e-a66e-47b4-8f14-eb62f48dfa33	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Jain	9801277826	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Jain", "contact_number": "9801277826"}	2026-02-01 02:37:10.402244	2026-02-01 04:02:59.854873
bddb3034-e69c-4a97-94b8-7d33459a52eb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Iyer	8697739551	Promising	{"cohort": "Promising", "customer_name": "Gaurav Iyer", "contact_number": "8697739551"}	2026-02-01 02:37:10.402247	2026-02-01 04:02:59.854933
542369b4-b8be-4968-be3f-de50e1478e82	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Ghosh	6535027729	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Dev Ghosh", "contact_number": "6535027729"}	2026-02-01 02:37:10.40225	2026-02-01 04:02:59.854993
50e19b91-1bc2-45d3-8232-b6e8cfcf5179	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Ghosh	7128117889	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Ghosh", "contact_number": "7128117889"}	2026-02-01 02:37:10.402275	2026-02-01 04:02:59.855054
1402b561-7f3a-42c7-b3a0-c2da12254afa	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Tripathi	9606215936	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Tripathi", "contact_number": "9606215936"}	2026-02-01 02:37:10.402317	2026-02-01 04:02:59.855122
104e9eef-a937-47e2-bbf8-458e8b4db10b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Saxena	7169346355	Lost	{"cohort": "Lost", "customer_name": "Rohan Saxena", "contact_number": "7169346355"}	2026-02-01 02:37:10.402323	2026-02-01 04:02:59.855184
7554d61a-68f4-474d-9437-215b9cb1332c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Banerjee	8891377623	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Harsh Banerjee", "contact_number": "8891377623"}	2026-02-01 02:37:10.402329	2026-02-01 04:02:59.855249
ae4d76bf-1011-4b29-871c-a6b5a9b36da5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pooja Nair	8843351688	Promising	{"cohort": "Promising", "customer_name": "Pooja Nair", "contact_number": "8843351688"}	2026-02-01 02:37:10.402345	2026-02-01 04:02:59.85531
f1f8a840-4f68-4d43-92bd-1f77d4b55577	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Tripathi	7817678868	Need Attention	{"cohort": "Need Attention", "customer_name": "Diya Tripathi", "contact_number": "7817678868"}	2026-02-01 02:37:10.40235	2026-02-01 04:02:59.855369
fb67fd9b-ed1b-46a1-8a20-2ac36ea22341	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Malhotra	9720285613	New Customers	{"cohort": "New Customers", "customer_name": "Gaurav Malhotra", "contact_number": "9720285613"}	2026-02-01 02:37:10.402376	2026-02-01 04:02:59.85543
e0f6e197-f5b5-423a-967a-5ea6ec3c41de	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Gill	8150302996	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mohit Gill", "contact_number": "8150302996"}	2026-02-01 02:37:10.402383	2026-02-01 04:02:59.85549
69e23f63-a179-4b92-8bd1-4f4a0dfc31b5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Khan	7419697432	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Khan", "contact_number": "7419697432"}	2026-02-01 02:37:10.40241	2026-02-01 04:02:59.85555
9d4c78ad-afa9-4c23-84fd-75d3a13795cb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Prasad	9222657398	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "9222657398"}	2026-02-01 02:37:10.402449	2026-02-01 04:02:59.855612
16adaede-66fb-4082-bc06-6390d3c31292	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Saxena	6937588251	Champions	{"cohort": "Champions", "customer_name": "Meera Saxena", "contact_number": "6937588251"}	2026-02-01 02:37:10.402455	2026-02-01 04:02:59.855672
345eb18f-8dba-4273-8fae-0272bf6e81a2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pooja Sharma	9368539538	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Pooja Sharma", "contact_number": "9368539538"}	2026-02-01 02:37:10.402464	2026-02-01 04:02:59.855733
f1655473-b614-46b5-a409-4c35b3f9335d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Banerjee	9780842521	Champions	{"cohort": "Champions", "customer_name": "Meera Banerjee", "contact_number": "9780842521"}	2026-02-01 02:37:10.402468	2026-02-01 04:02:59.855794
4b6a104f-4723-4d84-8130-9c8549f82ff4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Mishra	7371287442	Champions	{"cohort": "Champions", "customer_name": "Ira Mishra", "contact_number": "7371287442"}	2026-02-01 02:37:10.402473	2026-02-01 04:02:59.855854
2ee361cb-c4ea-4195-b51e-464c2ba19213	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Yadav	7642151581	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Tanvi Yadav", "contact_number": "7642151581"}	2026-02-01 02:37:10.402485	2026-02-01 04:02:59.855914
c4d78e94-2523-4fd2-8b28-087efde723a3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Narayan	7219550762	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Naina Narayan", "contact_number": "7219550762"}	2026-02-01 02:37:10.40249	2026-02-01 04:02:59.855974
05368792-141c-455f-a525-008325a1db42	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Pandey	6264424157	Promising	{"cohort": "Promising", "customer_name": "Rohan Pandey", "contact_number": "6264424157"}	2026-02-01 02:37:10.402494	2026-02-01 04:02:59.856037
adb271dc-f578-4592-af63-8e5357f4bf4a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Tiwari	8169503105	Champions	{"cohort": "Champions", "customer_name": "Yash Tiwari", "contact_number": "8169503105"}	2026-02-01 02:37:10.402498	2026-02-01 04:02:59.856097
568da6ef-3c4e-4ca2-843a-747de8b51e17	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mohit Roy	9861958570	Promising	{"cohort": "Promising", "customer_name": "Mohit Roy", "contact_number": "9861958570"}	2026-02-01 02:37:10.402502	2026-02-01 04:02:59.856159
69ec4993-ab1a-4588-a747-7fea7ecba277	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Kulkarni	7950964486	Promising	{"cohort": "Promising", "customer_name": "Neha Kulkarni", "contact_number": "7950964486"}	2026-02-01 02:37:10.402506	2026-02-01 04:02:59.856222
c90bbfe5-1356-41f1-bb8d-bc64089461de	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Gill	9287357760	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Tanvi Gill", "contact_number": "9287357760"}	2026-02-01 02:37:10.40251	2026-02-01 04:02:59.856282
a16e4f1f-b1a5-42f0-878e-c7cc63ca4cce	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Gowda	7279055207	New Customers	{"cohort": "New Customers", "customer_name": "Ananya Gowda", "contact_number": "7279055207"}	2026-02-01 02:37:10.402514	2026-02-01 04:02:59.856342
fa2fc1a4-b5fd-495c-b9cd-bfa32d2c434b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Banerjee	6510663316	New Customers	{"cohort": "New Customers", "customer_name": "Sai Banerjee", "contact_number": "6510663316"}	2026-02-01 02:37:10.402518	2026-02-01 04:02:59.856402
36895915-2049-4c07-81a9-d6284b378640	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Gowda	8255693255	Need Attention	{"cohort": "Need Attention", "customer_name": "Neha Gowda", "contact_number": "8255693255"}	2026-02-01 02:37:10.402521	2026-02-01 04:02:59.856462
f0cc9f8f-9c8d-476d-8ef8-78c62bec1a95	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sameer Thakur	7352337786	Need Attention	{"cohort": "Need Attention", "customer_name": "Sameer Thakur", "contact_number": "7352337786"}	2026-02-01 02:37:10.402525	2026-02-01 04:02:59.856522
436cb40b-9cb7-46a2-9956-d52ca0b3866d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Shah	7461243567	Champions	{"cohort": "Champions", "customer_name": "Rahul Shah", "contact_number": "7461243567"}	2026-02-01 02:37:10.402529	2026-02-01 04:02:59.856582
6c70b074-8dc8-441c-8f59-d297fd664923	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rashmi Sood	7368846023	New Customers	{"cohort": "New Customers", "customer_name": "Rashmi Sood", "contact_number": "7368846023"}	2026-02-01 02:37:10.402533	2026-02-01 04:02:59.856687
75769da8-11ba-4ce3-8050-0b09f29c616c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Hegde	6794629071	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Hegde", "contact_number": "6794629071"}	2026-02-01 02:37:10.402537	2026-02-01 04:02:59.856753
6575b53c-7f8e-4381-beb3-cd7f9bddd8cc	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Chatterjee	9426820552	Promising	{"cohort": "Promising", "customer_name": "Meera Chatterjee", "contact_number": "9426820552"}	2026-02-01 02:37:10.40254	2026-02-01 04:02:59.856814
59485630-6cfb-456c-9f1b-b5a8e146de61	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Das	7636902364	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Avni Das", "contact_number": "7636902364"}	2026-02-01 02:37:10.402544	2026-02-01 04:02:59.856876
b31c0e01-ae05-4266-b1c9-fbb41eeed6e6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Verma	7570028939	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Verma", "contact_number": "7570028939"}	2026-02-01 02:37:10.402547	2026-02-01 04:02:59.856937
dcc92f59-ab7f-43af-8f4c-67614685a4b2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditya Mukherjee	8294401555	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aditya Mukherjee", "contact_number": "8294401555"}	2026-02-01 02:37:10.402551	2026-02-01 04:02:59.856999
a10aef25-f778-4276-ad23-a3d138887a30	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Priya Thakur	8989885695	Champions	{"cohort": "Champions", "customer_name": "Priya Thakur", "contact_number": "8989885695"}	2026-02-01 02:37:10.402556	2026-02-01 04:02:59.857059
7e0eed9f-2c97-47c6-b38b-ff30686bbb97	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Bajaj	7794450106	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Bajaj", "contact_number": "7794450106"}	2026-02-01 02:37:10.40256	2026-02-01 04:02:59.857119
91bbaa49-6e91-4086-8dc1-0545839caae7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Pandey	7623950820	Champions	{"cohort": "Champions", "customer_name": "Arjun Pandey", "contact_number": "7623950820"}	2026-02-01 02:37:10.402563	2026-02-01 04:02:59.857185
b0a3c997-d771-43f8-9b79-2d16510dc1ae	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kabir Srinivasan	8094382969	Need Attention	{"cohort": "Need Attention", "customer_name": "Kabir Srinivasan", "contact_number": "8094382969"}	2026-02-01 02:37:10.402567	2026-02-01 04:02:59.857246
83d0dfec-5445-4f71-ac96-bea70ffb1215	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kavya Das	9722228837	Hibernating	{"cohort": "Hibernating", "customer_name": "Kavya Das", "contact_number": "9722228837"}	2026-02-01 02:37:10.40257	2026-02-01 04:02:59.857306
50bd050f-7643-4451-93ca-1113abfb12ab	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Bhat	6966675046	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Bhat", "contact_number": "6966675046"}	2026-02-01 02:37:10.402574	2026-02-01 04:02:59.857367
33857971-bc3b-4d16-a44d-9f27ae06f45e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Deshmukh	9885217537	New Customers	{"cohort": "New Customers", "customer_name": "Varun Deshmukh", "contact_number": "9885217537"}	2026-02-01 02:37:10.402578	2026-02-01 04:02:59.857427
55d0c993-8c2f-4e26-b415-726654a97cb6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Mukherjee	7074553619	Need Attention	{"cohort": "Need Attention", "customer_name": "Arnav Mukherjee", "contact_number": "7074553619"}	2026-02-01 02:37:10.402581	2026-02-01 04:02:59.857487
56490748-a06a-4aab-aa10-4ae3b23f2e0d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Narayan	9306313812	New Customers	{"cohort": "New Customers", "customer_name": "Ishaan Narayan", "contact_number": "9306313812"}	2026-02-01 02:37:10.402585	2026-02-01 04:02:59.857548
d1d1509b-2184-48c3-907a-b8787e8312c6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Sharma	8463427382	Promising	{"cohort": "Promising", "customer_name": "Harsh Sharma", "contact_number": "8463427382"}	2026-02-01 02:37:10.402588	2026-02-01 04:02:59.857608
83545e2d-0fd6-4a80-808b-d9de4640b450	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Sood	7596878581	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Sood", "contact_number": "7596878581"}	2026-02-01 02:37:10.402592	2026-02-01 04:02:59.857679
28a35abf-0980-4279-aa21-b15b00b65411	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Bajaj	7404186534	New Customers	{"cohort": "New Customers", "customer_name": "Trisha Bajaj", "contact_number": "7404186534"}	2026-02-01 02:37:10.402595	2026-02-01 04:02:59.85774
5e4e4924-16f0-4df7-8e41-2a671f64361f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Reddy	8553608464	Lost	{"cohort": "Lost", "customer_name": "Sakshi Reddy", "contact_number": "8553608464"}	2026-02-01 02:37:10.402599	2026-02-01 04:02:59.8578
b4feb099-6235-4e8b-9e56-c107f877a919	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Mishra	8235834366	Hibernating	{"cohort": "Hibernating", "customer_name": "Dhruv Mishra", "contact_number": "8235834366"}	2026-02-01 02:37:10.402602	2026-02-01 04:02:59.857861
ca2857ea-4c72-46a0-9025-3e7538cd0266	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Khan	7923574064	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Myra Khan", "contact_number": "7923574064"}	2026-02-01 02:37:10.402606	2026-02-01 04:02:59.85792
5dfadd92-e8fe-4d3d-bc0f-c28809bbb952	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Bhat	7869464903	Champions	{"cohort": "Champions", "customer_name": "Avni Bhat", "contact_number": "7869464903"}	2026-02-01 02:37:10.402609	2026-02-01 04:02:59.85798
22279915-0bbe-448c-bf75-0803defd6842	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Isha Pandey	8322624835	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Isha Pandey", "contact_number": "8322624835"}	2026-02-01 02:37:10.402613	2026-02-01 04:02:59.85804
728f491b-6e2f-4b11-8569-6b808cd625f4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Rao	9410769701	Champions	{"cohort": "Champions", "customer_name": "Vihaan Rao", "contact_number": "9410769701"}	2026-02-01 02:37:10.402617	2026-02-01 04:02:59.858101
67bd59a1-76d6-42b1-8199-d41adb0d15f5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Iyer	6094075916	Champions	{"cohort": "Champions", "customer_name": "Saanvi Iyer", "contact_number": "6094075916"}	2026-02-01 02:37:10.402621	2026-02-01 04:02:59.858161
808a27ff-84e2-4e49-988d-5528707944ba	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Nair	6683226180	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nikhil Nair", "contact_number": "6683226180"}	2026-02-01 02:37:10.402624	2026-02-01 04:02:59.858221
841aacf2-f7ff-4294-b5a0-4dbf201a810d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Pandey	8834952496	Champions	{"cohort": "Champions", "customer_name": "Avni Pandey", "contact_number": "8834952496"}	2026-02-01 02:37:10.402627	2026-02-01 04:02:59.858281
858e62ad-f560-4f43-8315-014be75b8700	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Naik	7547846594	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Naik", "contact_number": "7547846594"}	2026-02-01 02:37:10.402631	2026-02-01 04:02:59.858341
56e7cb77-15dd-4d02-b186-3cc382c9f628	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pooja Chaudhary	7843230883	At Risk	{"cohort": "At Risk", "customer_name": "Pooja Chaudhary", "contact_number": "7843230883"}	2026-02-01 02:37:10.402635	2026-02-01 04:02:59.8584
797073be-e8c2-4a60-94bb-c44a1960fa8f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Sood	9564727757	Champions	{"cohort": "Champions", "customer_name": "Rohan Sood", "contact_number": "9564727757"}	2026-02-01 02:37:10.402639	2026-02-01 04:02:59.85846
ef6f017f-43de-4acb-975f-6cedf845c471	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Tiwari	8184276820	At Risk	{"cohort": "At Risk", "customer_name": "Nandini Tiwari", "contact_number": "8184276820"}	2026-02-01 02:37:10.402642	2026-02-01 04:02:59.85852
20c4afbf-6f5d-4d48-9894-3597d511e58c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Kaur	7576626521	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Kaur", "contact_number": "7576626521"}	2026-02-01 02:37:10.402645	2026-02-01 04:02:59.858582
6df930bd-e95a-4ecc-83a8-67dc5fd8dfb7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Joshi	6126626100	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Nandini Joshi", "contact_number": "6126626100"}	2026-02-01 02:37:10.402649	2026-02-01 04:02:59.858642
b7458064-db9a-4204-8e12-761d0316a389	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Rao	6112772143	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Rao", "contact_number": "6112772143"}	2026-02-01 02:37:10.402653	2026-02-01 04:02:59.858702
cc442d41-6586-4a84-b576-2d0d692136b3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Singh	8743600712	Need Attention	{"cohort": "Need Attention", "customer_name": "Yash Singh", "contact_number": "8743600712"}	2026-02-01 02:37:10.402657	2026-02-01 04:02:59.858763
77a92d67-7a6b-419a-bce1-6d2665271447	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Kulkarni	9041888172	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ayush Kulkarni", "contact_number": "9041888172"}	2026-02-01 02:37:10.40266	2026-02-01 04:02:59.858823
6a8d819e-aa4a-446f-b97c-b1fc83d5bdcd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Bose	9291706239	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Yash Bose", "contact_number": "9291706239"}	2026-02-01 02:37:10.402664	2026-02-01 04:02:59.858883
ed0262fc-ab15-46e4-8e23-e6e555ec8448	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Mukherjee	8177514230	At Risk	{"cohort": "At Risk", "customer_name": "Parth Mukherjee", "contact_number": "8177514230"}	2026-02-01 02:37:10.402667	2026-02-01 04:02:59.858942
c77c895b-77b0-4928-95af-837effe9536f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Srinivasan	7924075329	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mansi Srinivasan", "contact_number": "7924075329"}	2026-02-01 02:37:10.402671	2026-02-01 04:02:59.859007
bdd99a9c-1974-46d8-8279-86f5fe56ded3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Bajaj	9617246397	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Bajaj", "contact_number": "9617246397"}	2026-02-01 02:37:10.402674	2026-02-01 04:02:59.859067
b8c7bc60-6292-4491-a9bd-6dd9fc81f54c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Naik	6067712977	At Risk	{"cohort": "At Risk", "customer_name": "Dhruv Naik", "contact_number": "6067712977"}	2026-02-01 02:37:10.402678	2026-02-01 04:02:59.859127
3efdcbfa-a91d-4d11-9826-eeb5cb99a3ec	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Riya Srinivasan	9703720755	At Risk	{"cohort": "At Risk", "customer_name": "Riya Srinivasan", "contact_number": "9703720755"}	2026-02-01 02:37:10.402682	2026-02-01 04:02:59.859187
cee5dfd3-e44b-4b62-99ca-1c2eae606bba	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Saha	9113728950	Lost	{"cohort": "Lost", "customer_name": "Saanvi Saha", "contact_number": "9113728950"}	2026-02-01 02:37:10.402685	2026-02-01 04:02:59.859247
c1abbce5-6b4c-4875-a134-34e60ffdf654	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Yash Patel	7485475786	New Customers	{"cohort": "New Customers", "customer_name": "Yash Patel", "contact_number": "7485475786"}	2026-02-01 02:37:10.402689	2026-02-01 04:02:59.859308
cb80a701-2137-4afb-82e9-9a5a589a7da8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Banerjee	8727653545	New Customers	{"cohort": "New Customers", "customer_name": "Ritvik Banerjee", "contact_number": "8727653545"}	2026-02-01 02:37:10.402692	2026-02-01 04:02:59.859368
07695715-12c8-4937-8edb-babf4108f4c5	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Saha	8361508182	At Risk	{"cohort": "At Risk", "customer_name": "Saanvi Saha", "contact_number": "8361508182"}	2026-02-01 02:37:10.402696	2026-02-01 04:02:59.859428
4016639e-c6de-4520-9984-95096bd2712f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Jain	9106346502	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rahul Jain", "contact_number": "9106346502"}	2026-02-01 02:37:10.402718	2026-02-01 04:02:59.85949
c90f4bd7-5f91-4b0a-9649-656cb5063126	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Shetty	6096984637	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Shetty", "contact_number": "6096984637"}	2026-02-01 02:37:10.402722	2026-02-01 04:02:59.85955
f18fe99c-c20d-4cb6-96c2-65125d0fbe09	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Nair	9870657802	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Sai Nair", "contact_number": "9870657802"}	2026-02-01 02:37:10.402726	2026-02-01 04:02:59.859611
96f6961a-b9b8-489e-b647-3ec123ca7870	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Chatterjee	6123165955	New Customers	{"cohort": "New Customers", "customer_name": "Ishaan Chatterjee", "contact_number": "6123165955"}	2026-02-01 02:37:10.402729	2026-02-01 04:02:59.859671
45e8dbcc-c4da-438f-86dd-20267c42159d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Bhat	6756741755	At Risk	{"cohort": "At Risk", "customer_name": "Varun Bhat", "contact_number": "6756741755"}	2026-02-01 02:37:10.402733	2026-02-01 04:02:59.859732
c964953a-1b8f-418b-92a6-127ddb93869a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ishaan Arora	7559959846	At Risk	{"cohort": "At Risk", "customer_name": "Ishaan Arora", "contact_number": "7559959846"}	2026-02-01 02:37:10.402737	2026-02-01 04:02:59.859792
2cea2923-4123-46aa-afc3-bbae9a5d1162	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Patel	8652792943	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ira Patel", "contact_number": "8652792943"}	2026-02-01 02:37:10.402741	2026-02-01 04:02:59.859851
6afb0997-19d4-4a9a-9208-93da631b0c12	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kabir Tripathi	6955933280	Hibernating	{"cohort": "Hibernating", "customer_name": "Kabir Tripathi", "contact_number": "6955933280"}	2026-02-01 02:37:10.402745	2026-02-01 04:02:59.859912
d43a2be5-f3e8-4454-8653-94ed8367de91	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Shetty	8955504128	Promising	{"cohort": "Promising", "customer_name": "Rahul Shetty", "contact_number": "8955504128"}	2026-02-01 02:37:10.402749	2026-02-01 04:02:59.859971
3bd51230-04e2-4ce2-8c40-9762af3470a4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Tripathi	7280397771	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Tripathi", "contact_number": "7280397771"}	2026-02-01 02:37:10.402753	2026-02-01 04:02:59.86003
8adcbed2-a543-478b-9df1-63bef082cd37	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Roy	6537500738	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Roy", "contact_number": "6537500738"}	2026-02-01 02:37:10.402757	2026-02-01 04:02:59.860089
cf730ede-1c58-4f86-b6c9-926ef3f5f677	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Tripathi	9917789660	Hibernating	{"cohort": "Hibernating", "customer_name": "Mansi Tripathi", "contact_number": "9917789660"}	2026-02-01 02:37:10.402762	2026-02-01 04:02:59.860149
5d1e4e01-073f-4011-a468-0178dbe763d6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Bajaj	6353616997	New Customers	{"cohort": "New Customers", "customer_name": "Varun Bajaj", "contact_number": "6353616997"}	2026-02-01 02:37:10.402766	2026-02-01 04:02:59.860209
5c535894-ae2d-45ff-862f-acd811c832bd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Bhat	6223105030	Champions	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6223105030"}	2026-02-01 02:37:10.402769	2026-02-01 04:02:59.860269
ed287d54-3e29-4306-a823-caaa831f344d	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Sood	9711546167	Hibernating	{"cohort": "Hibernating", "customer_name": "Vivaan Sood", "contact_number": "9711546167"}	2026-02-01 02:37:10.402773	2026-02-01 04:02:59.860329
6c58dabc-b42f-4f79-a752-1e14eccf6a84	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kavya Malhotra	7224651431	Champions	{"cohort": "Champions", "customer_name": "Kavya Malhotra", "contact_number": "7224651431"}	2026-02-01 02:37:10.402777	2026-02-01 04:02:59.860389
5918d886-e567-4b90-95ed-ac6b33c8c46c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Priya Sharma	8503969410	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Priya Sharma", "contact_number": "8503969410"}	2026-02-01 02:37:10.40278	2026-02-01 04:02:59.860448
d504d4b2-0201-4236-99c5-b35d06bc37bb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kunal Ghosh	7137810998	Lost	{"cohort": "Lost", "customer_name": "Kunal Ghosh", "contact_number": "7137810998"}	2026-02-01 02:37:10.402784	2026-02-01 04:02:59.860508
169cb7d3-6b11-4d29-bb12-7b476662f55e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Malhotra	8061402525	Lost	{"cohort": "Lost", "customer_name": "Parth Malhotra", "contact_number": "8061402525"}	2026-02-01 02:37:10.402788	2026-02-01 04:02:59.860566
622639a4-c77d-4cdd-a6e5-dc4ea26024bc	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Tripathi	8569663952	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "8569663952"}	2026-02-01 02:37:10.402792	2026-02-01 04:02:59.860626
de27f639-663c-48ba-ab2b-14ea86c64686	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sneha Gill	6276060328	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Gill", "contact_number": "6276060328"}	2026-02-01 02:37:10.402798	2026-02-01 04:02:59.860685
e323c12a-c58c-4e35-af59-561ec1ea92bf	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Shetty	8808623903	New Customers	{"cohort": "New Customers", "customer_name": "Ayush Shetty", "contact_number": "8808623903"}	2026-02-01 02:37:10.402804	2026-02-01 04:02:59.860744
05e5a253-2c18-4713-b503-ef3c395f9a50	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Chaudhary	6154902533	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Chaudhary", "contact_number": "6154902533"}	2026-02-01 02:37:10.402807	2026-02-01 04:02:59.860804
f6a9c075-da6b-4f97-b59b-f084a92f9835	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Chatterjee	7063399202	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Chatterjee", "contact_number": "7063399202"}	2026-02-01 02:37:10.402811	2026-02-01 04:02:59.860863
3fcce27f-45ba-4f57-8dc1-0e5686813723	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Riya Chatterjee	9880521860	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Riya Chatterjee", "contact_number": "9880521860"}	2026-02-01 02:37:10.402814	2026-02-01 04:02:59.860961
4482a8d0-46fb-42f3-861a-8656fde53f81	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Mishra	9568645436	At Risk	{"cohort": "At Risk", "customer_name": "Anika Mishra", "contact_number": "9568645436"}	2026-02-01 02:37:10.402818	2026-02-01 04:02:59.861024
9d93a056-f777-4ab1-b63c-71f2c2494842	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Riya Verma	9521588375	At Risk	{"cohort": "At Risk", "customer_name": "Riya Verma", "contact_number": "9521588375"}	2026-02-01 02:37:10.402822	2026-02-01 04:02:59.861085
79834358-163f-4193-b4a7-7371216a5acb	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Varun Bansal	7497651057	At Risk	{"cohort": "At Risk", "customer_name": "Varun Bansal", "contact_number": "7497651057"}	2026-02-01 02:37:10.402825	2026-02-01 04:02:59.861146
1c71b498-3f45-494f-9fdd-abd780de2bc7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Hegde	7387784449	Champions	{"cohort": "Champions", "customer_name": "Gaurav Hegde", "contact_number": "7387784449"}	2026-02-01 02:37:10.402829	2026-02-01 04:02:59.861206
36dfece2-bdac-4df5-95b0-f62f180d563b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Avni Saxena	8111096665	Promising	{"cohort": "Promising", "customer_name": "Avni Saxena", "contact_number": "8111096665"}	2026-02-01 02:37:10.402833	2026-02-01 04:02:59.861271
0ea08f7f-f054-4191-80fc-0262a0207f43	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Singh	7636456738	Champions	{"cohort": "Champions", "customer_name": "Dev Singh", "contact_number": "7636456738"}	2026-02-01 02:37:10.402838	2026-02-01 04:02:59.861331
a7e3f60b-ba15-403c-9961-c919e08f78e1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Pandey	9412499926	Promising	{"cohort": "Promising", "customer_name": "Mansi Pandey", "contact_number": "9412499926"}	2026-02-01 02:37:10.402842	2026-02-01 04:02:59.861391
e2960d6a-8043-4c84-8c79-f401b8bf884c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anvi Nair	7709984342	New Customers	{"cohort": "New Customers", "customer_name": "Anvi Nair", "contact_number": "7709984342"}	2026-02-01 02:37:10.402845	2026-02-01 04:02:59.86145
18c0aca9-1f59-428b-bdea-de1c675a9852	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Shetty	9768739556	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Aditi Shetty", "contact_number": "9768739556"}	2026-02-01 02:37:10.402849	2026-02-01 04:02:59.861509
4cb52ebb-bdbe-4b4a-86bf-a863ce55ca85	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vivaan Saxena	6548095375	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vivaan Saxena", "contact_number": "6548095375"}	2026-02-01 02:37:10.402852	2026-02-01 04:02:59.861569
12b9639a-32d2-4a57-9140-041f14a415a4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Prasad	6148721296	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Shreya Prasad", "contact_number": "6148721296"}	2026-02-01 02:37:10.402857	2026-02-01 04:02:59.861629
7446ebd6-6226-4df6-aa2b-89902e1a6f10	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Gaurav Verma	7460515853	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Gaurav Verma", "contact_number": "7460515853"}	2026-02-01 02:37:10.402861	2026-02-01 04:02:59.861689
0a32a410-14bb-4810-91f1-a54afcb8c418	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sai Narayan	8415724269	At Risk	{"cohort": "At Risk", "customer_name": "Sai Narayan", "contact_number": "8415724269"}	2026-02-01 02:37:10.402866	2026-02-01 04:02:59.861749
9bed6fc8-5791-401d-b90a-b0a68b23c947	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Nair	7711435375	Need Attention	{"cohort": "Need Attention", "customer_name": "Manav Nair", "contact_number": "7711435375"}	2026-02-01 02:37:10.402869	2026-02-01 04:02:59.861809
1d6341a6-28e7-4fb0-8c52-103152120640	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Trisha Pandey	7337956181	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Trisha Pandey", "contact_number": "7337956181"}	2026-02-01 02:37:10.402873	2026-02-01 04:02:59.861868
5cb64ca2-aec1-4ff5-b4c9-461b3e3f944c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aadhya Mehta	6437461126	Champions	{"cohort": "Champions", "customer_name": "Aadhya Mehta", "contact_number": "6437461126"}	2026-02-01 02:37:10.402876	2026-02-01 04:02:59.861928
11dca461-b433-4a07-bad1-a51d27817b8c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Malhotra	8044864264	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aarohi Malhotra", "contact_number": "8044864264"}	2026-02-01 02:37:10.40288	2026-02-01 04:02:59.861988
e51156d8-345b-4e80-a62e-10e0327f603c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Roy	9062565801	Champions	{"cohort": "Champions", "customer_name": "Rohan Roy", "contact_number": "9062565801"}	2026-02-01 02:37:10.402883	2026-02-01 04:02:59.862048
980d9709-f16b-4b69-a7a2-d540c3632971	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Jain	8086829041	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Jain", "contact_number": "8086829041"}	2026-02-01 02:37:10.402887	2026-02-01 04:02:59.862107
0e0c46d1-c313-438f-8772-4bd26464ba6f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Sood	8665714590	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Rahul Sood", "contact_number": "8665714590"}	2026-02-01 02:37:10.40289	2026-02-01 04:02:59.862166
31e27ca1-1f8f-412a-9d85-8be8bcbc9398	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Sakshi Malhotra	8388780418	Champions	{"cohort": "Champions", "customer_name": "Sakshi Malhotra", "contact_number": "8388780418"}	2026-02-01 02:37:10.402897	2026-02-01 04:02:59.862225
025d142a-03f8-4f78-8046-bb4ab197d15c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Sood	8556617694	Champions	{"cohort": "Champions", "customer_name": "Anika Sood", "contact_number": "8556617694"}	2026-02-01 02:37:10.402903	2026-02-01 04:02:59.862285
17505bd8-6e81-47ee-b562-fd500493b2a6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Tripathi	8482569647	Lost	{"cohort": "Lost", "customer_name": "Mansi Tripathi", "contact_number": "8482569647"}	2026-02-01 02:37:10.402906	2026-02-01 04:02:59.862343
73f280c2-306a-4e2e-ae2e-76e8f2844965	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aarohi Shah	9416790061	New Customers	{"cohort": "New Customers", "customer_name": "Aarohi Shah", "contact_number": "9416790061"}	2026-02-01 02:37:10.40291	2026-02-01 04:02:59.862403
e32f0b5f-cc2e-4940-b4e4-33a296def160	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Priya Verma	7794356022	New Customers	{"cohort": "New Customers", "customer_name": "Priya Verma", "contact_number": "7794356022"}	2026-02-01 02:37:10.402913	2026-02-01 04:02:59.862463
4f66412f-c951-4312-8f01-71705dc1bdf3	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayush Shetty	6353063760	At Risk	{"cohort": "At Risk", "customer_name": "Ayush Shetty", "contact_number": "6353063760"}	2026-02-01 02:37:10.402916	2026-02-01 04:02:59.862522
0d7cfdf7-c14b-4ccf-983a-6930cb0bab19	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Vihaan Aggarwal	7189440114	Hibernating	{"cohort": "Hibernating", "customer_name": "Vihaan Aggarwal", "contact_number": "7189440114"}	2026-02-01 02:37:10.40292	2026-02-01 04:02:59.862582
5d9be208-b520-4979-82be-ae1fc8665f21	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Myra Narayan	8489055650	Lost	{"cohort": "Lost", "customer_name": "Myra Narayan", "contact_number": "8489055650"}	2026-02-01 02:37:10.402924	2026-02-01 04:02:59.862642
b4bc06a9-a103-43cd-b16f-24be8a7d9d50	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arjun Bajaj	8783920968	At Risk	{"cohort": "At Risk", "customer_name": "Arjun Bajaj", "contact_number": "8783920968"}	2026-02-01 02:37:10.402928	2026-02-01 04:02:59.862702
d028b502-e417-4ecc-858f-6951cc81ae96	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Gupta	9117387208	New Customers	{"cohort": "New Customers", "customer_name": "Aman Gupta", "contact_number": "9117387208"}	2026-02-01 02:37:10.402931	2026-02-01 04:02:59.862762
14e9baba-55c0-44ac-83cd-ad64fae49961	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Parth Verma	8492317794	Champions	{"cohort": "Champions", "customer_name": "Parth Verma", "contact_number": "8492317794"}	2026-02-01 02:37:10.402934	2026-02-01 04:02:59.862822
2c084d21-3549-4ed8-9c95-a52af977d25f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Das	6791348337	At Risk	{"cohort": "At Risk", "customer_name": "Saanvi Das", "contact_number": "6791348337"}	2026-02-01 02:37:10.402938	2026-02-01 04:02:59.862882
74c25dcc-48ef-4812-a6f5-854ea51d1053	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Verma	6896174750	Promising	{"cohort": "Promising", "customer_name": "Mansi Verma", "contact_number": "6896174750"}	2026-02-01 02:37:10.402941	2026-02-01 04:02:59.862942
bf3dcc0a-4de6-418f-8ab5-1301853c3a96	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Menon	6650405635	New Customers	{"cohort": "New Customers", "customer_name": "Aditi Menon", "contact_number": "6650405635"}	2026-02-01 02:37:10.402944	2026-02-01 04:02:59.863001
7b0fe32e-2a78-4c2c-9e9f-4e6bf104337f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Nair	8622257621	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Nair", "contact_number": "8622257621"}	2026-02-01 02:37:10.402948	2026-02-01 04:02:59.86306
0398851f-622d-4694-93c9-d9f0bb737912	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Priya Gowda	6065233172	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Priya Gowda", "contact_number": "6065233172"}	2026-02-01 02:37:10.402951	2026-02-01 04:02:59.86312
bfad4442-9698-4a4e-89ae-65d1bad31a21	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ayaan Prasad	7138500903	Promising	{"cohort": "Promising", "customer_name": "Ayaan Prasad", "contact_number": "7138500903"}	2026-02-01 02:37:10.402955	2026-02-01 04:02:59.86318
5f2b3e31-d707-4a89-9d7a-95fa256c7d0c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ira Pandey	6415586638	Champions	{"cohort": "Champions", "customer_name": "Ira Pandey", "contact_number": "6415586638"}	2026-02-01 02:37:10.402959	2026-02-01 04:02:59.863239
e42b8747-8f6c-4b05-ac17-ebecb1248405	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Bose	6974189446	Promising	{"cohort": "Promising", "customer_name": "Harsh Bose", "contact_number": "6974189446"}	2026-02-01 02:37:10.402962	2026-02-01 04:02:59.863301
11ada70a-a0d9-4f42-89b8-580892f96d2b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Kapoor	9491823193	Champions	{"cohort": "Champions", "customer_name": "Dhruv Kapoor", "contact_number": "9491823193"}	2026-02-01 02:37:10.402966	2026-02-01 04:02:59.86336
ab4a0178-6b83-457c-86ac-29b266dd4842	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ananya Chaudhary	8404341761	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Chaudhary", "contact_number": "8404341761"}	2026-02-01 02:37:10.40297	2026-02-01 04:02:59.86342
b5c82503-3234-47ec-bd80-7149188efb47	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Gill	6471503452	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Naina Gill", "contact_number": "6471503452"}	2026-02-01 02:37:10.402973	2026-02-01 04:02:59.86348
87af4e16-ed93-414b-b578-d74ab006503a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Ritvik Iyer	7593385747	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Iyer", "contact_number": "7593385747"}	2026-02-01 02:37:10.402977	2026-02-01 04:02:59.863539
6fca6fa4-88d3-4b69-8b84-cc809db8bfc1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Singh	7167781530	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Dhruv Singh", "contact_number": "7167781530"}	2026-02-01 02:37:10.40298	2026-02-01 04:02:59.863599
dc2ce56e-8070-4da1-a137-4eb28fcd9fe1	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Reddy	9190187346	Need Attention	{"cohort": "Need Attention", "customer_name": "Meera Reddy", "contact_number": "9190187346"}	2026-02-01 02:37:10.402984	2026-02-01 04:02:59.863658
e83b88ed-18b0-4073-a1e4-660ee16d3478	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Verma	6215787642	Lost	{"cohort": "Lost", "customer_name": "Shreya Verma", "contact_number": "6215787642"}	2026-02-01 02:37:10.402988	2026-02-01 04:02:59.863719
8f93558d-92cd-4673-a517-4b885c9ecf0b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rupali Ghosh	9163593949	New Customers	{"cohort": "New Customers", "customer_name": "Rupali Ghosh", "contact_number": "9163593949"}	2026-02-01 02:37:10.402991	2026-02-01 04:02:59.863781
56761ba4-7409-483f-a571-3d4237b0817e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kavya Hegde	8956588099	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Kavya Hegde", "contact_number": "8956588099"}	2026-02-01 02:37:10.402995	2026-02-01 04:02:59.863841
3078a4cc-6319-48e9-9c69-e4c98f2ba0e8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anvi Malhotra	6783882733	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Anvi Malhotra", "contact_number": "6783882733"}	2026-02-01 02:37:10.402998	2026-02-01 04:02:59.8639
50e7bcd4-7f5a-46ab-aac1-433d25f4cd32	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Arnav Arora	9442115834	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arnav Arora", "contact_number": "9442115834"}	2026-02-01 02:37:10.403002	2026-02-01 04:02:59.86396
d75b762f-a503-4e9d-ab1c-bc85dd0c34de	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Diya Patel	8961007449	Lost	{"cohort": "Lost", "customer_name": "Diya Patel", "contact_number": "8961007449"}	2026-02-01 02:37:10.403005	2026-02-01 04:02:59.864022
8c7b5e33-6597-4914-aa64-22f42f9d975c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Bhat	6188869644	Champions	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6188869644"}	2026-02-01 02:37:10.403008	2026-02-01 04:02:59.864083
2fc64d0b-3ffa-4bb4-beae-5227979559ba	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Srinivasan	9324047729	Lost	{"cohort": "Lost", "customer_name": "Mansi Srinivasan", "contact_number": "9324047729"}	2026-02-01 02:37:10.403012	2026-02-01 04:02:59.864143
186e67a1-0acf-4295-a708-a279475fa46b	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Saanvi Reddy	8004359075	Champions	{"cohort": "Champions", "customer_name": "Saanvi Reddy", "contact_number": "8004359075"}	2026-02-01 02:37:10.403015	2026-02-01 04:02:59.864203
bf0df7cb-6c86-4473-87ed-88f660ad37d8	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Harsh Bajaj	8408047906	Hibernating	{"cohort": "Hibernating", "customer_name": "Harsh Bajaj", "contact_number": "8408047906"}	2026-02-01 02:37:10.403019	2026-02-01 04:02:59.864263
5eb965a4-c3ff-422c-92d9-3976abeb9982	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Meera Hegde	8695049533	Promising	{"cohort": "Promising", "customer_name": "Meera Hegde", "contact_number": "8695049533"}	2026-02-01 02:37:10.403022	2026-02-01 04:02:59.864322
c39cc802-e8c3-4068-ad86-4ab81722a3be	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Naina Iyer	8209775041	Lost	{"cohort": "Lost", "customer_name": "Naina Iyer", "contact_number": "8209775041"}	2026-02-01 02:37:10.403026	2026-02-01 04:02:59.864382
23c2fbcf-2837-41ad-851f-ee8a62ae6319	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Prasad	6627041072	Champions	{"cohort": "Champions", "customer_name": "Tanvi Prasad", "contact_number": "6627041072"}	2026-02-01 02:37:10.403029	2026-02-01 04:02:59.864441
0f863c84-c865-4c45-93d8-4abc58bf9355	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Tanvi Gupta	8227697631	Promising	{"cohort": "Promising", "customer_name": "Tanvi Gupta", "contact_number": "8227697631"}	2026-02-01 02:37:10.403033	2026-02-01 04:02:59.864515
05c4c0e6-8828-4b01-9352-6f5b189a287c	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Kunal Shetty	7478301914	Lost	{"cohort": "Lost", "customer_name": "Kunal Shetty", "contact_number": "7478301914"}	2026-02-01 02:37:10.403037	2026-02-01 04:02:59.864576
dbf2c01e-2e79-4d5a-8ec5-54b55d81acb6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Gowda	9724627367	Promising	{"cohort": "Promising", "customer_name": "Manav Gowda", "contact_number": "9724627367"}	2026-02-01 02:37:10.403041	2026-02-01 04:02:59.864636
9da64289-e716-49c8-a35c-01424000fce6	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Siddharth Patel	6044499263	Need Attention	{"cohort": "Need Attention", "customer_name": "Siddharth Patel", "contact_number": "6044499263"}	2026-02-01 02:37:10.403044	2026-02-01 04:02:59.864695
b786baf4-a91b-49e8-ac20-11331c4c81a2	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Neha Narayan	8180946960	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Narayan", "contact_number": "8180946960"}	2026-02-01 02:37:10.403048	2026-02-01 04:02:59.864754
5853c346-5288-40af-b364-e2cd4b0516cd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rahul Sharma	8949832063	New Customers	{"cohort": "New Customers", "customer_name": "Rahul Sharma", "contact_number": "8949832063"}	2026-02-01 02:37:10.403053	2026-02-01 04:02:59.864815
c211f097-f67c-45dc-9dd1-0a988feed299	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Pallavi Tripathi	7751361568	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "7751361568"}	2026-02-01 02:37:10.403056	2026-02-01 04:02:59.864879
4765399e-667d-4c50-a4ab-d7fd47647d2a	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rashmi Deshmukh	6456372060	Need Attention	{"cohort": "Need Attention", "customer_name": "Rashmi Deshmukh", "contact_number": "6456372060"}	2026-02-01 02:37:10.40306	2026-02-01 04:02:59.86494
d4994970-855f-4d95-8b72-2ca4adcabb2e	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Reyansh Mishra	7967181685	Hibernating	{"cohort": "Hibernating", "customer_name": "Reyansh Mishra", "contact_number": "7967181685"}	2026-02-01 02:37:10.403063	2026-02-01 04:02:59.864999
21597ae3-4668-43c0-b8bc-98cabc08bc54	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Siddharth Srinivasan	7862496924	Champions	{"cohort": "Champions", "customer_name": "Siddharth Srinivasan", "contact_number": "7862496924"}	2026-02-01 02:37:10.403067	2026-02-01 04:02:59.865059
df9629ef-9ba1-4bac-9d9c-7ba00cf529de	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nandini Pandey	8272039281	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Pandey", "contact_number": "8272039281"}	2026-02-01 02:37:10.403071	2026-02-01 04:02:59.865118
76d5c51d-7267-488d-881a-d4814d75b2ac	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Manav Khan	9710524816	Hibernating	{"cohort": "Hibernating", "customer_name": "Manav Khan", "contact_number": "9710524816"}	2026-02-01 02:37:10.403078	2026-02-01 04:02:59.865277
dc46b826-b782-4762-90b9-e24b17820c6f	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dev Naik	6627955944	New Customers	{"cohort": "New Customers", "customer_name": "Dev Naik", "contact_number": "6627955944"}	2026-02-01 02:37:10.403081	2026-02-01 04:02:59.865338
c2c68adf-bbf0-4cab-a220-14c1b99b20c4	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aman Saha	6509845936	Need Attention	{"cohort": "Need Attention", "customer_name": "Aman Saha", "contact_number": "6509845936"}	2026-02-01 02:37:10.403085	2026-02-01 04:02:59.865398
2c011825-4f79-4569-960a-502e70ebc512	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Aditi Shetty	9096383872	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Shetty", "contact_number": "9096383872"}	2026-02-01 02:37:10.403088	2026-02-01 04:02:59.865458
e876caec-959f-4b02-ac49-75e963e70936	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Dhruv Kulkarni	7103168630	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dhruv Kulkarni", "contact_number": "7103168630"}	2026-02-01 02:37:10.403092	2026-02-01 04:02:59.865518
a6ab4f5d-03a9-403e-b335-525208f7e6e9	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Nikhil Mishra	9711754053	Promising	{"cohort": "Promising", "customer_name": "Nikhil Mishra", "contact_number": "9711754053"}	2026-02-01 02:37:10.403096	2026-02-01 04:02:59.865577
52c62141-a7cb-4537-a23a-e75bf8fc52a7	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rashmi Kaur	9903374265	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Kaur", "contact_number": "9903374265"}	2026-02-01 02:37:10.4031	2026-02-01 04:02:59.865637
fe29bc7c-bf0b-4162-8d68-22a3c7b4cf12	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Shreya Saha	7720740962	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Saha", "contact_number": "7720740962"}	2026-02-01 02:37:10.403104	2026-02-01 04:02:59.865698
a3db7ac2-5a6e-40ce-9c58-400f58b98533	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Rohan Mukherjee	7069806808	Champions	{"cohort": "Champions", "customer_name": "Rohan Mukherjee", "contact_number": "7069806808"}	2026-02-01 02:37:10.403108	2026-02-01 04:02:59.865759
e4e491df-a4b8-4dfe-9c3c-04e86a9a95fd	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Mansi Shah	6472848963	Lost	{"cohort": "Lost", "customer_name": "Mansi Shah", "contact_number": "6472848963"}	2026-02-01 02:37:10.403112	2026-02-01 04:02:59.865818
90112816-547f-4d74-a7a4-610eb1ead4df	67d26a4c-26a6-4a55-91da-e72f6449be94	AA	Anika Tiwari	7392010271	Lost	{"cohort": "Lost", "customer_name": "Anika Tiwari", "contact_number": "7392010271"}	2026-02-01 02:37:10.403116	2026-02-01 04:02:59.865878
9ddb13a8-cb45-4bb4-b69d-fb4d5d426534	042ac4bb-581a-4835-ba89-68f9884c5d72		Sameer Iyer	7756343432	New Customers	{"cohort": "New Customers", "customer_name": "Sameer Iyer", "contact_number": "7756343432"}	2026-02-01 06:36:53.565221	2026-02-01 06:44:42.401119
9becd05a-3b55-40e8-ac37-2a93f6340777	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Gill	8872090747	Lost	{"cohort": "Lost", "customer_name": "Vivaan Gill", "contact_number": "8872090747"}	2026-02-01 06:36:53.565282	2026-02-01 06:44:42.401186
4ed486d9-f721-45ec-9ad5-4c83b8cb1ef4	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Mukherjee	9647026354	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Anika Mukherjee", "contact_number": "9647026354"}	2026-02-01 06:36:53.565294	2026-02-01 06:44:42.401224
957e237f-c16f-4c4d-b4dd-11a650a8eba2	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Nair	8473722111	Need Attention	{"cohort": "Need Attention", "customer_name": "Myra Nair", "contact_number": "8473722111"}	2026-02-01 06:36:53.565298	2026-02-01 06:44:42.401258
98d7913c-4262-4eba-af1a-1a2d04ad3a9d	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Reddy	7172575982	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ayush Reddy", "contact_number": "7172575982"}	2026-02-01 06:36:53.565303	2026-02-01 06:44:42.401292
01ac76f8-003b-47c3-bb7e-8ac7b9d927e2	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Gill	8105295618	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Mohit Gill", "contact_number": "8105295618"}	2026-02-01 06:36:53.565307	2026-02-01 06:44:42.401324
eb04e7cb-34b2-4372-b3ae-6a634de7fd88	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Shetty	9102439281	Champions	{"cohort": "Champions", "customer_name": "Nandini Shetty", "contact_number": "9102439281"}	2026-02-01 06:36:53.565311	2026-02-01 06:44:42.401357
990a743d-5018-4a88-b222-648d7ff5d5a4	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Yadav	6406015391	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Sai Yadav", "contact_number": "6406015391"}	2026-02-01 06:36:53.565315	2026-02-01 06:44:42.401391
2bdf894d-549e-4a93-aa84-fbeade94b3b5	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Gupta	9672544893	Need Attention	{"cohort": "Need Attention", "customer_name": "Manav Gupta", "contact_number": "9672544893"}	2026-02-01 06:36:53.565318	2026-02-01 06:44:42.401424
f83358be-0eae-4ad4-9257-681e5132b3d3	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Shah	6679226110	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Vivaan Shah", "contact_number": "6679226110"}	2026-02-01 06:36:53.565322	2026-02-01 06:44:42.401456
1c72828b-7691-4a66-a638-ab7543d8cebd	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Chatterjee	6464022802	Champions	{"cohort": "Champions", "customer_name": "Ira Chatterjee", "contact_number": "6464022802"}	2026-02-01 06:36:53.565326	2026-02-01 06:44:42.401492
4f02a074-28c0-43ee-b700-3e4b1c051433	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Chaudhary	8766945698	Lost	{"cohort": "Lost", "customer_name": "Neha Chaudhary", "contact_number": "8766945698"}	2026-02-01 06:36:53.565329	2026-02-01 06:44:42.401525
717cad6e-3c7b-4190-8e95-2b1d06a056f6	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Rao	6075894434	At Risk	{"cohort": "At Risk", "customer_name": "Vivaan Rao", "contact_number": "6075894434"}	2026-02-01 06:36:53.565333	2026-02-01 06:44:42.401559
62362bbd-0733-42da-adb9-ad570964cf0f	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Arora	8540043209	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Diya Arora", "contact_number": "8540043209"}	2026-02-01 06:36:53.565336	2026-02-01 06:44:42.401595
cf3865f4-1c78-4020-8340-88361f6179a7	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Bhat	6962074691	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Bhat", "contact_number": "6962074691"}	2026-02-01 06:36:53.56534	2026-02-01 06:44:42.401627
e9ea9000-3297-44d1-9d97-ffdbb2d0cd22	042ac4bb-581a-4835-ba89-68f9884c5d72		Sneha Tripathi	9640336836	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sneha Tripathi", "contact_number": "9640336836"}	2026-02-01 06:36:53.565343	2026-02-01 06:44:42.401662
58aa0396-62f1-4ade-b313-1bc89d8a8c24	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Tiwari	8647002178	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Myra Tiwari", "contact_number": "8647002178"}	2026-02-01 06:36:53.565346	2026-02-01 06:44:42.401696
aa692ade-495d-4f79-b26a-9f3e47802950	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Saha	6654137672	Promising	{"cohort": "Promising", "customer_name": "Shreya Saha", "contact_number": "6654137672"}	2026-02-01 06:36:53.56535	2026-02-01 06:44:42.401735
35af2f3f-f3af-4b28-bb8d-18227b286b24	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Sharma	7946196215	New Customers	{"cohort": "New Customers", "customer_name": "Avni Sharma", "contact_number": "7946196215"}	2026-02-01 06:36:53.565354	2026-02-01 06:44:42.401767
9a284648-d5f3-4cae-8162-8da06bb30409	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Singh	9099418475	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Parth Singh", "contact_number": "9099418475"}	2026-02-01 06:36:53.565358	2026-02-01 06:44:42.401798
03a75e86-ea32-496f-a883-4614bf467d18	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Mishra	8444411571	Need Attention	{"cohort": "Need Attention", "customer_name": "Harsh Mishra", "contact_number": "8444411571"}	2026-02-01 06:36:53.565362	2026-02-01 06:44:42.401833
6bac0922-1ab8-40cf-bf12-725cf989c22a	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Saha	6274958225	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rahul Saha", "contact_number": "6274958225"}	2026-02-01 06:36:53.565366	2026-02-01 06:44:42.401866
aee93af7-0c18-40cd-a672-5045f58f6cf0	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Roy	9844373989	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ishaan Roy", "contact_number": "9844373989"}	2026-02-01 06:36:53.56537	2026-02-01 06:44:42.401902
c1b3a643-a021-4492-8c44-6f88e4ea73af	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Bansal	7527077836	New Customers	{"cohort": "New Customers", "customer_name": "Parth Bansal", "contact_number": "7527077836"}	2026-02-01 06:36:53.565373	2026-02-01 06:44:42.401938
bbfea471-9ec9-41ff-8aaa-c132fdd2db19	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Shah	7405588454	New Customers	{"cohort": "New Customers", "customer_name": "Reyansh Shah", "contact_number": "7405588454"}	2026-02-01 06:36:53.565376	2026-02-01 06:44:42.401976
2eee0bd4-1f97-44b0-a911-5747c17b0dfa	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Reddy	7461493668	At Risk	{"cohort": "At Risk", "customer_name": "Varun Reddy", "contact_number": "7461493668"}	2026-02-01 06:36:53.56538	2026-02-01 06:44:42.40201
5b2cc79e-6039-4982-84b5-572e4c6d59fb	042ac4bb-581a-4835-ba89-68f9884c5d72		Kunal Aggarwal	9968456262	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kunal Aggarwal", "contact_number": "9968456262"}	2026-02-01 06:36:53.565383	2026-02-01 06:44:42.402041
3703b980-c49c-4ee7-b291-5a39a04cece8	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Bose	7740684690	Promising	{"cohort": "Promising", "customer_name": "Naina Bose", "contact_number": "7740684690"}	2026-02-01 06:36:53.565386	2026-02-01 06:44:42.402072
3df87672-7ca8-4900-bef7-6296cf1d7f44	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Gupta	6231557108	Need Attention	{"cohort": "Need Attention", "customer_name": "Avni Gupta", "contact_number": "6231557108"}	2026-02-01 06:36:53.565389	2026-02-01 06:44:42.402106
b7101427-933f-4a41-a8fd-c7600c5462bf	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Pandey	7452646842	Champions	{"cohort": "Champions", "customer_name": "Dev Pandey", "contact_number": "7452646842"}	2026-02-01 06:36:53.565393	2026-02-01 06:44:42.402138
6fe29451-e594-4a6b-8979-e9e7b59e9f35	042ac4bb-581a-4835-ba89-68f9884c5d72		Sneha Iyer	7099296439	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Iyer", "contact_number": "7099296439"}	2026-02-01 06:36:53.565396	2026-02-01 06:44:42.402175
531c08c3-177d-49cb-890e-a28beeb3e370	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Malhotra	9133260830	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rupali Malhotra", "contact_number": "9133260830"}	2026-02-01 06:36:53.5654	2026-02-01 06:44:42.402206
5c9038ab-028e-4cd9-969e-2cb9fabd79fc	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Rao	6978972821	Champions	{"cohort": "Champions", "customer_name": "Sai Rao", "contact_number": "6978972821"}	2026-02-01 06:36:53.565403	2026-02-01 06:44:42.402237
dafa8611-b8e8-4ac2-811e-17d8bec632a5	042ac4bb-581a-4835-ba89-68f9884c5d72		Kiara Srinivasan	8676869634	Hibernating	{"cohort": "Hibernating", "customer_name": "Kiara Srinivasan", "contact_number": "8676869634"}	2026-02-01 06:36:53.565406	2026-02-01 06:44:42.402269
96601bc2-d321-4a34-9918-513faa239ddc	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Kapoor	8702711595	Lost	{"cohort": "Lost", "customer_name": "Aditi Kapoor", "contact_number": "8702711595"}	2026-02-01 06:36:53.565409	2026-02-01 06:44:42.4023
2bdf3be9-b9a5-4030-ad67-56ca91bebc56	042ac4bb-581a-4835-ba89-68f9884c5d72		Kavya Das	8828487319	At Risk	{"cohort": "At Risk", "customer_name": "Kavya Das", "contact_number": "8828487319"}	2026-02-01 06:36:53.565412	2026-02-01 06:44:42.402331
4d725bc3-6deb-4741-bff7-81da8b8c617b	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Patel	7726638503	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ritvik Patel", "contact_number": "7726638503"}	2026-02-01 06:36:53.565416	2026-02-01 06:44:42.402362
cd0d8818-4c23-4a09-8439-1a612e6e3118	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditya Gowda	8546658912	Champions	{"cohort": "Champions", "customer_name": "Aditya Gowda", "contact_number": "8546658912"}	2026-02-01 06:36:53.565419	2026-02-01 06:44:42.402396
a00598a3-7bf1-4723-a5a2-2f38cec7a760	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Bajaj	6693666476	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Myra Bajaj", "contact_number": "6693666476"}	2026-02-01 06:36:53.565422	2026-02-01 06:44:42.402428
f7433bea-3fad-442d-93be-cbc00a1ae0a6	042ac4bb-581a-4835-ba89-68f9884c5d72		Kiara Shah	6193408146	New Customers	{"cohort": "New Customers", "customer_name": "Kiara Shah", "contact_number": "6193408146"}	2026-02-01 06:36:53.565425	2026-02-01 06:44:42.402466
2c1706d9-b360-42b4-a027-6a4936eba62b	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Chatterjee	9578686926	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Pallavi Chatterjee", "contact_number": "9578686926"}	2026-02-01 06:36:53.565428	2026-02-01 06:44:42.402497
8f1912ec-7ba4-4432-a2e8-9d82b2967fc7	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Reddy	7498065933	Promising	{"cohort": "Promising", "customer_name": "Trisha Reddy", "contact_number": "7498065933"}	2026-02-01 06:36:53.565432	2026-02-01 06:44:42.402528
d0f2557a-073b-4b82-9aa8-0da2018e5bdb	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Saha	7998026903	Champions	{"cohort": "Champions", "customer_name": "Varun Saha", "contact_number": "7998026903"}	2026-02-01 06:36:53.565449	2026-02-01 06:44:42.402562
3851b713-909c-4552-b08d-ac5e8f2a05bc	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Srinivasan	7728558277	Hibernating	{"cohort": "Hibernating", "customer_name": "Nikhil Srinivasan", "contact_number": "7728558277"}	2026-02-01 06:36:53.565454	2026-02-01 06:44:42.402594
e5c1e26e-a21e-4b30-af8d-0a214f3dc420	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Kapoor	6299571813	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mansi Kapoor", "contact_number": "6299571813"}	2026-02-01 06:36:53.565457	2026-02-01 06:44:42.402634
59e4afc0-53a1-428e-9baa-1c38178aa2fc	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Kapoor	7502141043	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ananya Kapoor", "contact_number": "7502141043"}	2026-02-01 06:36:53.565461	2026-02-01 06:44:42.402667
a7f952c8-b53b-42fc-a015-b1c4a376615a	042ac4bb-581a-4835-ba89-68f9884c5d72		Kunal Roy	6426796360	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Kunal Roy", "contact_number": "6426796360"}	2026-02-01 06:36:53.565465	2026-02-01 06:44:42.402703
8aaaab45-9376-49b0-a149-bc368362c9be	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Saha	9841748311	Promising	{"cohort": "Promising", "customer_name": "Gaurav Saha", "contact_number": "9841748311"}	2026-02-01 06:36:53.565469	2026-02-01 06:44:42.402735
6da08611-6f36-4865-8343-dd73a870fca3	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Hegde	8352547168	Promising	{"cohort": "Promising", "customer_name": "Harsh Hegde", "contact_number": "8352547168"}	2026-02-01 06:36:53.565472	2026-02-01 06:44:42.402773
53cdb5a3-81a1-459b-b8af-f46c894af0f4	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Patel	7484837332	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Patel", "contact_number": "7484837332"}	2026-02-01 06:36:53.565476	2026-02-01 06:44:42.402805
86de9562-9801-4330-bd02-29095ea682e5	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Srinivasan	7640047310	Lost	{"cohort": "Lost", "customer_name": "Naina Srinivasan", "contact_number": "7640047310"}	2026-02-01 06:36:53.56548	2026-02-01 06:44:42.402836
d8b3fe82-fce9-4c56-ab61-381a51cae5a4	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Shetty	8648949023	At Risk	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "8648949023"}	2026-02-01 06:36:53.565483	2026-02-01 06:44:42.402868
43d0e484-df38-4a0a-b15c-bebf1b4dc57a	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Mukherjee	6526218375	Hibernating	{"cohort": "Hibernating", "customer_name": "Dev Mukherjee", "contact_number": "6526218375"}	2026-02-01 06:36:53.565487	2026-02-01 06:44:42.4029
0ec2bb03-9d38-4d8f-8a03-a611478de7ff	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Pandey	9898660982	Hibernating	{"cohort": "Hibernating", "customer_name": "Ananya Pandey", "contact_number": "9898660982"}	2026-02-01 06:36:53.565491	2026-02-01 06:44:42.402931
bc478002-47a9-4c0c-bf27-ad78a6b9fbd4	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Saha	7279311607	Need Attention	{"cohort": "Need Attention", "customer_name": "Varun Saha", "contact_number": "7279311607"}	2026-02-01 06:36:53.565494	2026-02-01 06:44:42.402962
a4332c4f-234c-42ad-80d1-e651c93b70af	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Srinivasan	6053413395	Hibernating	{"cohort": "Hibernating", "customer_name": "Rupali Srinivasan", "contact_number": "6053413395"}	2026-02-01 06:36:53.565498	2026-02-01 06:44:42.402994
70e339b8-60be-4dff-ac8a-57269c37a60a	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Rao	6170044642	Champions	{"cohort": "Champions", "customer_name": "Harsh Rao", "contact_number": "6170044642"}	2026-02-01 06:36:53.565501	2026-02-01 06:44:42.403025
fd17a1aa-e642-41f2-9e50-310a1f45a459	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Hegde	6316553290	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Myra Hegde", "contact_number": "6316553290"}	2026-02-01 06:36:53.565505	2026-02-01 06:44:42.403057
44701e5d-c732-41e5-ad2c-23bfbeb74898	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Bajaj	7321230713	Champions	{"cohort": "Champions", "customer_name": "Rohan Bajaj", "contact_number": "7321230713"}	2026-02-01 06:36:53.565508	2026-02-01 06:44:42.403091
a3fc2ba4-9d7f-4a35-bc43-f3f2e24907f9	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Mehta	7588080098	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Mehta", "contact_number": "7588080098"}	2026-02-01 06:36:53.565511	2026-02-01 06:44:42.403126
a0c86a67-95d4-483b-9b53-62df45b4112d	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Gupta	9574103868	New Customers	{"cohort": "New Customers", "customer_name": "Myra Gupta", "contact_number": "9574103868"}	2026-02-01 06:36:53.565515	2026-02-01 06:44:42.403162
7cb33c79-2f05-4b65-bab3-846ffca707ae	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Jain	8082553333	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Jain", "contact_number": "8082553333"}	2026-02-01 06:36:53.565518	2026-02-01 06:44:42.403194
3f0bde57-5a15-4159-855a-decd45b3cfcf	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Saha	7065173961	At Risk	{"cohort": "At Risk", "customer_name": "Arnav Saha", "contact_number": "7065173961"}	2026-02-01 06:36:53.565575	2026-02-01 06:44:42.403228
b422b0e3-acd1-4a77-a37c-9bec0c15090b	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Roy	6116761747	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Roy", "contact_number": "6116761747"}	2026-02-01 06:36:53.5656	2026-02-01 06:44:42.403261
a7e4bf60-81c1-4e19-8874-b603d04414ca	042ac4bb-581a-4835-ba89-68f9884c5d72		Anvi Prasad	9686939344	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Anvi Prasad", "contact_number": "9686939344"}	2026-02-01 06:36:53.565609	2026-02-01 06:44:42.403298
f9c30e19-6180-484f-9942-984d2f5477f6	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Arora	8753040326	Promising	{"cohort": "Promising", "customer_name": "Sakshi Arora", "contact_number": "8753040326"}	2026-02-01 06:36:53.565619	2026-02-01 06:44:42.403329
440d2a0c-7a1b-49d7-999b-5252db4af4f3	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Roy	6654578486	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rohan Roy", "contact_number": "6654578486"}	2026-02-01 06:36:53.565625	2026-02-01 06:44:42.403361
5fdc37d5-6f37-4204-9ec4-0c9582162de2	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Deshmukh	8659488906	At Risk	{"cohort": "At Risk", "customer_name": "Aman Deshmukh", "contact_number": "8659488906"}	2026-02-01 06:36:53.565632	2026-02-01 06:44:42.403392
e59caf9e-2dbb-4d1d-8def-39b534d3e960	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Narayan	6244513243	Champions	{"cohort": "Champions", "customer_name": "Arnav Narayan", "contact_number": "6244513243"}	2026-02-01 06:36:53.565639	2026-02-01 06:44:42.403466
19dd75bd-2c77-44c5-991f-4482f8879fbe	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Menon	6760062769	Lost	{"cohort": "Lost", "customer_name": "Nikhil Menon", "contact_number": "6760062769"}	2026-02-01 06:36:53.565646	2026-02-01 06:44:42.4035
a3ede89a-246e-4790-ac75-7b43ce493eac	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Nair	7351396359	At Risk	{"cohort": "At Risk", "customer_name": "Aarohi Nair", "contact_number": "7351396359"}	2026-02-01 06:36:53.565652	2026-02-01 06:44:42.403531
c5da154e-c387-47e3-90f9-46c014ebc592	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Gill	8563179990	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Saanvi Gill", "contact_number": "8563179990"}	2026-02-01 06:36:53.565659	2026-02-01 06:44:42.403562
0a5f4356-4d4a-4bca-a448-830c4c04fc5e	042ac4bb-581a-4835-ba89-68f9884c5d72		Pooja Shetty	9503937191	Champions	{"cohort": "Champions", "customer_name": "Pooja Shetty", "contact_number": "9503937191"}	2026-02-01 06:36:53.565665	2026-02-01 06:44:42.403594
248ba912-6e0f-44ea-82db-f220e2d498f3	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Gill	8817880371	At Risk	{"cohort": "At Risk", "customer_name": "Aarohi Gill", "contact_number": "8817880371"}	2026-02-01 06:36:53.565672	2026-02-01 06:44:42.403625
170f6448-c47a-479f-ac7d-435555fe55a2	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Mishra	9116697037	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Shreya Mishra", "contact_number": "9116697037"}	2026-02-01 06:36:53.565678	2026-02-01 06:44:42.403655
96031d06-c9ee-4bc5-9904-e3ccde17b869	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Yadav	9677229791	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Yadav", "contact_number": "9677229791"}	2026-02-01 06:36:53.565685	2026-02-01 06:44:42.403686
8e84e31c-41cb-469f-9b29-deb4ba4f6ee2	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Kapoor	9423598812	At Risk	{"cohort": "At Risk", "customer_name": "Arnav Kapoor", "contact_number": "9423598812"}	2026-02-01 06:36:53.565692	2026-02-01 06:44:42.403717
e0087569-e6b7-41c1-8e3f-a3b988df816a	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Nair	9851882729	Champions	{"cohort": "Champions", "customer_name": "Myra Nair", "contact_number": "9851882729"}	2026-02-01 06:36:53.565701	2026-02-01 06:44:42.403748
b40eb188-00e4-4750-b7b0-ad6db708297b	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Deshmukh	7809889433	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Deshmukh", "contact_number": "7809889433"}	2026-02-01 06:36:53.565707	2026-02-01 06:44:42.403779
702bbe8e-f5ee-431e-9a08-0ac3b18bff45	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Sood	9930986712	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9930986712"}	2026-02-01 06:36:53.565722	2026-02-01 06:44:42.40381
fc8c220d-5ed7-4b88-8f91-89c79660f002	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Iyer	9617400285	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Vihaan Iyer", "contact_number": "9617400285"}	2026-02-01 06:36:53.565729	2026-02-01 06:44:42.403841
7f5e274f-c7e3-45a4-8e9f-3dcf17470027	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Srinivasan	9123047419	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Srinivasan", "contact_number": "9123047419"}	2026-02-01 06:36:53.565735	2026-02-01 06:44:42.403872
3e511e0b-a6c9-4a74-bbee-d28811d25c04	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Hegde	6657203516	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ananya Hegde", "contact_number": "6657203516"}	2026-02-01 06:36:53.565742	2026-02-01 06:44:42.403906
8ea863fb-120a-4f39-93bd-a0cbfac384ae	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Chaudhary	8055953469	Champions	{"cohort": "Champions", "customer_name": "Manav Chaudhary", "contact_number": "8055953469"}	2026-02-01 06:36:53.565749	2026-02-01 06:44:42.403938
e53b0e1f-b340-4d15-9601-bcff320a328e	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Malhotra	8730261571	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Malhotra", "contact_number": "8730261571"}	2026-02-01 06:36:53.565756	2026-02-01 06:44:42.403976
f6c21224-418c-4378-a2fc-bd8b6bee0b86	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Chaudhary	8581746680	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Varun Chaudhary", "contact_number": "8581746680"}	2026-02-01 06:36:53.565762	2026-02-01 06:44:42.404008
c353e8b9-eaac-4b7a-b1b3-9946bc92cb28	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Naik	9027833384	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nikhil Naik", "contact_number": "9027833384"}	2026-02-01 06:36:53.565769	2026-02-01 06:44:42.404042
85fd628c-2571-48e9-a367-e4a476306c31	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Rao	6713783138	Need Attention	{"cohort": "Need Attention", "customer_name": "Aarohi Rao", "contact_number": "6713783138"}	2026-02-01 06:36:53.565784	2026-02-01 06:44:42.404074
53ca9428-d5a9-42b2-9a35-06ec6a32300e	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Sharma	9839449587	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Trisha Sharma", "contact_number": "9839449587"}	2026-02-01 06:36:53.565788	2026-02-01 06:44:42.40411
91df5c97-9258-4673-a7c8-2592186f47d2	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Kaur	6491213247	Promising	{"cohort": "Promising", "customer_name": "Mohit Kaur", "contact_number": "6491213247"}	2026-02-01 06:36:53.565791	2026-02-01 06:44:42.404143
6750b9d2-f66c-4a51-85da-8ecaff7de645	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayaan Hegde	7630839299	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ayaan Hegde", "contact_number": "7630839299"}	2026-02-01 06:36:53.565795	2026-02-01 06:44:42.404175
4aca6dbd-10c2-4a06-ac22-2fb761a22371	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Shetty	6645710864	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Sakshi Shetty", "contact_number": "6645710864"}	2026-02-01 06:36:53.565799	2026-02-01 06:44:42.404209
da2efd3d-aeb1-4366-b56e-b67402cead0b	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Saha	7073356693	At Risk	{"cohort": "At Risk", "customer_name": "Parth Saha", "contact_number": "7073356693"}	2026-02-01 06:36:53.565802	2026-02-01 06:44:42.40424
2e0dc85f-a90d-4d4a-a883-e6371219fd77	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Narayan	6553621743	Need Attention	{"cohort": "Need Attention", "customer_name": "Dhruv Narayan", "contact_number": "6553621743"}	2026-02-01 06:36:53.565807	2026-02-01 06:44:42.404271
0706e049-c115-4c78-bd46-e7fd13e299f4	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Iyer	6224929418	At Risk	{"cohort": "At Risk", "customer_name": "Rahul Iyer", "contact_number": "6224929418"}	2026-02-01 06:36:53.56581	2026-02-01 06:44:42.404303
60e15811-7323-41f6-9a12-7353dec9407f	042ac4bb-581a-4835-ba89-68f9884c5d72		Kiara Mishra	9179899675	Promising	{"cohort": "Promising", "customer_name": "Kiara Mishra", "contact_number": "9179899675"}	2026-02-01 06:36:53.565813	2026-02-01 06:44:42.404334
b82ad498-452d-430f-aec5-266a47996c89	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Pandey	8887967512	Promising	{"cohort": "Promising", "customer_name": "Ananya Pandey", "contact_number": "8887967512"}	2026-02-01 06:36:53.565848	2026-02-01 06:44:42.404365
96316692-297d-4b9d-94eb-3a201cf026bf	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarav Kaur	7243549180	New Customers	{"cohort": "New Customers", "customer_name": "Aarav Kaur", "contact_number": "7243549180"}	2026-02-01 06:36:53.56587	2026-02-01 06:44:42.404396
81034e45-3378-41a1-bd82-d70dd7a3855f	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Kaur	9975780964	Champions	{"cohort": "Champions", "customer_name": "Sakshi Kaur", "contact_number": "9975780964"}	2026-02-01 06:36:53.565877	2026-02-01 06:44:42.404428
e7b182ef-11d6-46ed-8dd5-416853d56264	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Joshi	8185571588	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aarohi Joshi", "contact_number": "8185571588"}	2026-02-01 06:36:53.565884	2026-02-01 06:44:42.404459
1152d3bc-060e-40bb-9690-65c9a064f539	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Khan	7319295201	Champions	{"cohort": "Champions", "customer_name": "Parth Khan", "contact_number": "7319295201"}	2026-02-01 06:36:53.56591	2026-02-01 06:44:42.404491
5453e2cc-d87f-4230-b7c0-939b89039531	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Reddy	8135519167	Need Attention	{"cohort": "Need Attention", "customer_name": "Neha Reddy", "contact_number": "8135519167"}	2026-02-01 06:36:53.565938	2026-02-01 06:44:42.404521
21ca70db-a0d4-4888-a5b4-029e6e7c9ad7	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Srinivasan	8858006567	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Trisha Srinivasan", "contact_number": "8858006567"}	2026-02-01 06:36:53.565945	2026-02-01 06:44:42.404553
5b9dfdf8-8085-45e4-bd56-e4aea15fe052	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Srinivasan	9608563284	Promising	{"cohort": "Promising", "customer_name": "Meera Srinivasan", "contact_number": "9608563284"}	2026-02-01 06:36:53.565951	2026-02-01 06:44:42.404584
5d2ed0d7-7f7d-4da5-b898-c436e5259dae	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Chaudhary	9004426377	Hibernating	{"cohort": "Hibernating", "customer_name": "Neha Chaudhary", "contact_number": "9004426377"}	2026-02-01 06:36:53.565957	2026-02-01 06:44:42.404615
a36307d3-dbf1-4def-850b-3a98db5544bc	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Menon	8913534220	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Diya Menon", "contact_number": "8913534220"}	2026-02-01 06:36:53.565964	2026-02-01 06:44:42.404646
6e93c5e8-81fc-4e0e-9468-d58a4c96f295	042ac4bb-581a-4835-ba89-68f9884c5d72		Siddharth Sood	8984998971	New Customers	{"cohort": "New Customers", "customer_name": "Siddharth Sood", "contact_number": "8984998971"}	2026-02-01 06:36:53.565971	2026-02-01 06:44:42.40468
a2b6562f-0b25-4df6-9597-e90e3bf4a779	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Shetty	7454309592	At Risk	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "7454309592"}	2026-02-01 06:36:53.565978	2026-02-01 06:44:42.404711
bc2a4499-5689-4488-b119-4ecaa2c5a81f	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Naik	8025862011	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dhruv Naik", "contact_number": "8025862011"}	2026-02-01 06:36:53.565984	2026-02-01 06:44:42.404745
29fa8dcd-7be3-4779-921a-030c435907d2	042ac4bb-581a-4835-ba89-68f9884c5d72		Anvi Sharma	8773451505	Champions	{"cohort": "Champions", "customer_name": "Anvi Sharma", "contact_number": "8773451505"}	2026-02-01 06:36:53.565992	2026-02-01 06:44:42.404777
580dacdb-75fd-4e61-b320-a5b01e4e9993	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Jain	8866103953	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Naina Jain", "contact_number": "8866103953"}	2026-02-01 06:36:53.566	2026-02-01 06:44:42.404815
774fb948-ec42-4151-b198-5ddbb2a15e1e	042ac4bb-581a-4835-ba89-68f9884c5d72		Riya Verma	7155013446	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Riya Verma", "contact_number": "7155013446"}	2026-02-01 06:36:53.566006	2026-02-01 06:44:42.404855
74dc2545-4108-4085-a073-035ac683748a	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayaan Kapoor	7361972385	Hibernating	{"cohort": "Hibernating", "customer_name": "Ayaan Kapoor", "contact_number": "7361972385"}	2026-02-01 06:36:53.566012	2026-02-01 06:44:42.404886
c210a8dd-3646-4cfd-b485-bcdd36d3fcb2	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Ghosh	8403143886	At Risk	{"cohort": "At Risk", "customer_name": "Sakshi Ghosh", "contact_number": "8403143886"}	2026-02-01 06:36:53.566018	2026-02-01 06:44:42.404919
21f08a4b-b392-4aa5-b067-d19d04ddca72	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Mehta	9269520457	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Mehta", "contact_number": "9269520457"}	2026-02-01 06:36:53.566037	2026-02-01 06:44:42.404952
a56b7f43-a2d4-49b7-800d-22f76a680e3d	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Prasad	9160910316	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Saanvi Prasad", "contact_number": "9160910316"}	2026-02-01 06:36:53.566045	2026-02-01 06:44:42.404985
48740ab0-b122-415a-8156-6d5031c8a32a	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Shah	9564877559	At Risk	{"cohort": "At Risk", "customer_name": "Sai Shah", "contact_number": "9564877559"}	2026-02-01 06:36:53.566051	2026-02-01 06:44:42.40502
56dd18d7-ffea-4806-82a0-32f25440a271	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Deshmukh	9531933776	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dev Deshmukh", "contact_number": "9531933776"}	2026-02-01 06:36:53.566057	2026-02-01 06:44:42.405057
6bd53ee7-bf30-432d-b918-855e40b5b710	042ac4bb-581a-4835-ba89-68f9884c5d72		Rashmi Patel	8612529222	Hibernating	{"cohort": "Hibernating", "customer_name": "Rashmi Patel", "contact_number": "8612529222"}	2026-02-01 06:36:53.566063	2026-02-01 06:44:42.405089
e8d01843-4407-4bbb-b66b-0784aeb009a6	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Shetty	9339721639	Promising	{"cohort": "Promising", "customer_name": "Parth Shetty", "contact_number": "9339721639"}	2026-02-01 06:36:53.56607	2026-02-01 06:44:42.405126
53a1e42f-90a0-431d-acd4-302b230674b4	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Nair	8982273424	At Risk	{"cohort": "At Risk", "customer_name": "Dhruv Nair", "contact_number": "8982273424"}	2026-02-01 06:36:53.566077	2026-02-01 06:44:42.405161
b1036f00-2ed0-45af-a225-d5ddba775142	042ac4bb-581a-4835-ba89-68f9884c5d72		Krishna Gowda	7825217209	Hibernating	{"cohort": "Hibernating", "customer_name": "Krishna Gowda", "contact_number": "7825217209"}	2026-02-01 06:36:53.566083	2026-02-01 06:44:42.405194
78aeff0e-d8d9-48dc-b672-0b16a7908838	042ac4bb-581a-4835-ba89-68f9884c5d72		Priya Rao	7604717059	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Priya Rao", "contact_number": "7604717059"}	2026-02-01 06:36:53.566089	2026-02-01 06:44:42.405225
811f1910-746e-4789-8ab6-577c9fc46045	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Bose	9684672207	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Bose", "contact_number": "9684672207"}	2026-02-01 06:36:53.566095	2026-02-01 06:44:42.405263
e7746a55-2b41-459a-865e-7342a6ec296e	042ac4bb-581a-4835-ba89-68f9884c5d72		Isha Chaudhary	7579918199	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Isha Chaudhary", "contact_number": "7579918199"}	2026-02-01 06:36:53.566109	2026-02-01 06:44:42.405298
e5ddd833-7c65-4b4a-a467-a1871130e2d4	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Roy	9717820269	New Customers	{"cohort": "New Customers", "customer_name": "Manav Roy", "contact_number": "9717820269"}	2026-02-01 06:36:53.566117	2026-02-01 06:44:42.405329
acc9aa43-d0c6-437c-8934-38a66dfc339d	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Shetty	8295498411	At Risk	{"cohort": "At Risk", "customer_name": "Rupali Shetty", "contact_number": "8295498411"}	2026-02-01 06:36:53.566121	2026-02-01 06:44:42.40536
259522f6-7740-4bbd-9110-cf0f40b35868	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Kaur	7767032616	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Parth Kaur", "contact_number": "7767032616"}	2026-02-01 06:36:53.566125	2026-02-01 06:44:42.405391
1371b1bc-ec11-4e09-a82c-0d218419158d	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Das	9850611322	Champions	{"cohort": "Champions", "customer_name": "Harsh Das", "contact_number": "9850611322"}	2026-02-01 06:36:53.566128	2026-02-01 06:44:42.405422
a320cabc-b1f6-4178-a777-634b4cc13d80	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Ghosh	7423552326	Promising	{"cohort": "Promising", "customer_name": "Ritvik Ghosh", "contact_number": "7423552326"}	2026-02-01 06:36:53.566133	2026-02-01 06:44:42.405453
a212d223-f436-43d5-a2bd-a688f49ec89a	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Gowda	9345873192	New Customers	{"cohort": "New Customers", "customer_name": "Arnav Gowda", "contact_number": "9345873192"}	2026-02-01 06:36:53.566136	2026-02-01 06:44:42.405484
8e1ed127-2bad-422e-8ff9-e33a3429f227	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Kapoor	7211764545	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Kapoor", "contact_number": "7211764545"}	2026-02-01 06:36:53.566171	2026-02-01 06:44:42.405515
c2be1fc9-d4c0-4a80-8d89-01b783ccbfe4	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Naik	7765755391	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Yash Naik", "contact_number": "7765755391"}	2026-02-01 06:36:53.566176	2026-02-01 06:44:42.405547
c4f85fc0-d412-48d0-8d23-24f156ed55ab	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Iyer	7513512505	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Yash Iyer", "contact_number": "7513512505"}	2026-02-01 06:36:53.56618	2026-02-01 06:44:42.40558
1bad6ea7-fd57-440a-9bba-a0b5b11deab2	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Chatterjee	6454048738	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Chatterjee", "contact_number": "6454048738"}	2026-02-01 06:36:53.566184	2026-02-01 06:44:42.405612
99b85047-16af-4cfe-85cc-766c088ce82f	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Bansal	7503099090	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Bansal", "contact_number": "7503099090"}	2026-02-01 06:36:53.566187	2026-02-01 06:44:42.405647
6003b909-4366-44b7-8476-a4679ec0b947	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Yadav	9116793849	Promising	{"cohort": "Promising", "customer_name": "Vivaan Yadav", "contact_number": "9116793849"}	2026-02-01 06:36:53.566192	2026-02-01 06:44:42.405682
50b1c6be-cb67-4806-8bee-5d29719dfacb	042ac4bb-581a-4835-ba89-68f9884c5d72		Pooja Chatterjee	9366563155	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Pooja Chatterjee", "contact_number": "9366563155"}	2026-02-01 06:36:53.566196	2026-02-01 06:44:42.405715
3db6e298-8952-4805-8714-192fb63ab243	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Chatterjee	7879474324	New Customers	{"cohort": "New Customers", "customer_name": "Shreya Chatterjee", "contact_number": "7879474324"}	2026-02-01 06:36:53.566199	2026-02-01 06:44:42.40577
1a8c338f-f2ec-49c6-9139-c886f7517e2d	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarav Patel	7297184780	Lost	{"cohort": "Lost", "customer_name": "Aarav Patel", "contact_number": "7297184780"}	2026-02-01 06:36:53.566203	2026-02-01 06:44:42.405805
b5488639-6337-4b1e-b8eb-0517091f266d	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Srinivasan	7054682045	Lost	{"cohort": "Lost", "customer_name": "Ritvik Srinivasan", "contact_number": "7054682045"}	2026-02-01 06:36:53.566206	2026-02-01 06:44:42.405837
c086d439-fc8e-4637-b791-a0846a8a4478	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Chatterjee	6192955782	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Chatterjee", "contact_number": "6192955782"}	2026-02-01 06:36:53.566209	2026-02-01 06:44:42.405868
879d421d-38fe-4529-a929-2f373514e73b	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Gupta	7954255716	Promising	{"cohort": "Promising", "customer_name": "Arjun Gupta", "contact_number": "7954255716"}	2026-02-01 06:36:53.566213	2026-02-01 06:44:42.405899
fe11980e-7db4-4d1a-a10d-d0db3b78a76f	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Bansal	9036356421	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Trisha Bansal", "contact_number": "9036356421"}	2026-02-01 06:36:53.566216	2026-02-01 06:44:42.405929
b0c54701-afdb-4841-8d7f-0efcaa57ae57	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Joshi	9228140445	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Joshi", "contact_number": "9228140445"}	2026-02-01 06:36:53.56622	2026-02-01 06:44:42.40596
12123269-b4c7-4073-861a-036a4be00fc1	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Saha	9226980712	Champions	{"cohort": "Champions", "customer_name": "Saanvi Saha", "contact_number": "9226980712"}	2026-02-01 06:36:53.582152	2026-02-01 06:44:42.405991
18aa375f-eb7d-4251-a656-64001e99a5ae	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Deshmukh	6817754839	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Deshmukh", "contact_number": "6817754839"}	2026-02-01 06:36:53.582178	2026-02-01 06:44:42.406022
d494f7d2-ebc4-4663-bf06-83a9f92bd531	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Shetty	6217779673	Promising	{"cohort": "Promising", "customer_name": "Ira Shetty", "contact_number": "6217779673"}	2026-02-01 06:36:53.582182	2026-02-01 06:44:42.406053
353c9550-3550-478f-8975-ca90816ea7ce	042ac4bb-581a-4835-ba89-68f9884c5d72		Krishna Kaur	7573532540	Champions	{"cohort": "Champions", "customer_name": "Krishna Kaur", "contact_number": "7573532540"}	2026-02-01 06:36:53.582186	2026-02-01 06:44:42.406084
70f0e58a-e809-4ad3-8bb0-0d5c2c1420cb	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Prasad	9732308705	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rupali Prasad", "contact_number": "9732308705"}	2026-02-01 06:36:53.582193	2026-02-01 06:44:42.406115
38f96c5f-1f81-490e-8259-1887d353f393	042ac4bb-581a-4835-ba89-68f9884c5d72		Kavya Kulkarni	9212525937	Hibernating	{"cohort": "Hibernating", "customer_name": "Kavya Kulkarni", "contact_number": "9212525937"}	2026-02-01 06:36:53.582196	2026-02-01 06:44:42.406146
447477d9-c836-4f1d-b97c-a4e0091a140c	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Kulkarni	9964171749	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Saanvi Kulkarni", "contact_number": "9964171749"}	2026-02-01 06:36:53.5822	2026-02-01 06:44:42.406177
6c49f35f-2737-4988-b99a-b53ef230400b	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Tripathi	6580800160	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Avni Tripathi", "contact_number": "6580800160"}	2026-02-01 06:36:53.582203	2026-02-01 06:44:42.406208
331c5eaf-7fe1-4ffc-8c2c-253af1e74da1	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Reddy	7053666440	Promising	{"cohort": "Promising", "customer_name": "Diya Reddy", "contact_number": "7053666440"}	2026-02-01 06:36:53.582206	2026-02-01 06:44:42.406245
0c1826b8-300a-465b-ae6c-d3864596b5a5	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Gowda	9052908689	Lost	{"cohort": "Lost", "customer_name": "Reyansh Gowda", "contact_number": "9052908689"}	2026-02-01 06:36:53.58221	2026-02-01 06:44:42.406276
f0e9e103-e81a-4abf-b6d6-b7cb73c7c201	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Aggarwal	6952623709	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Manav Aggarwal", "contact_number": "6952623709"}	2026-02-01 06:36:53.582213	2026-02-01 06:44:42.406308
4250bf5b-9d63-4fe0-a12a-4f5367d0b323	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Tripathi	9592686870	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Tripathi", "contact_number": "9592686870"}	2026-02-01 06:36:53.582216	2026-02-01 06:44:42.406341
9b084329-1abb-412b-9a35-d6eb68a9283f	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Kaur	9346708639	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Kaur", "contact_number": "9346708639"}	2026-02-01 06:36:53.582219	2026-02-01 06:44:42.40641
ae99b71f-6089-4184-b76b-1bca6d29520e	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Hegde	6892965296	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Vihaan Hegde", "contact_number": "6892965296"}	2026-02-01 06:36:53.582223	2026-02-01 06:44:42.406469
8af6d7cd-38c0-49a3-879b-5ef47e521467	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Narayan	8850939577	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aman Narayan", "contact_number": "8850939577"}	2026-02-01 06:36:53.582226	2026-02-01 06:44:42.40651
70c7d386-43cf-4f3e-80d4-65500b6f7969	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Mehta	9925586537	New Customers	{"cohort": "New Customers", "customer_name": "Reyansh Mehta", "contact_number": "9925586537"}	2026-02-01 06:36:53.58223	2026-02-01 06:44:42.406549
c75f05f7-c783-4cdf-9571-a6dee85f5f14	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Kaur	6590483793	Need Attention	{"cohort": "Need Attention", "customer_name": "Arnav Kaur", "contact_number": "6590483793"}	2026-02-01 06:36:53.582233	2026-02-01 06:44:42.406585
0c47d65c-2211-4239-b94a-aaa9258748c3	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Reddy	8029439466	Need Attention	{"cohort": "Need Attention", "customer_name": "Rahul Reddy", "contact_number": "8029439466"}	2026-02-01 06:36:53.582236	2026-02-01 06:44:42.406625
3c55ab0b-5384-4601-8d2a-d8335f1d460c	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Das	6722023713	Promising	{"cohort": "Promising", "customer_name": "Saanvi Das", "contact_number": "6722023713"}	2026-02-01 06:36:53.582239	2026-02-01 06:44:42.40666
1c5b3242-a68b-48e1-8d3a-89b24d345a82	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Shetty	8103321145	Champions	{"cohort": "Champions", "customer_name": "Diya Shetty", "contact_number": "8103321145"}	2026-02-01 06:36:53.582243	2026-02-01 06:44:42.406692
b4e1a5a7-7c0e-441e-a0be-a8b48250b19a	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Nair	9105578047	At Risk	{"cohort": "At Risk", "customer_name": "Yash Nair", "contact_number": "9105578047"}	2026-02-01 06:36:53.582246	2026-02-01 06:44:42.406726
7ca0447f-cd20-4c6f-8272-4fa0ea3a82c4	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Khan	7513134044	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Manav Khan", "contact_number": "7513134044"}	2026-02-01 06:36:53.582249	2026-02-01 06:44:42.406759
e5ae0e64-b07a-48ed-aeec-eb594bc9b68d	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Pandey	9739746410	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Pandey", "contact_number": "9739746410"}	2026-02-01 06:36:53.582253	2026-02-01 06:44:42.406791
2b0a605e-2194-44fe-90ee-d213129b2f0a	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Patel	9368338891	Champions	{"cohort": "Champions", "customer_name": "Saanvi Patel", "contact_number": "9368338891"}	2026-02-01 06:36:53.582256	2026-02-01 06:44:42.406827
46e8117f-9c62-4139-905f-e635903e0250	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Rao	8664133769	Need Attention	{"cohort": "Need Attention", "customer_name": "Yash Rao", "contact_number": "8664133769"}	2026-02-01 06:36:53.582259	2026-02-01 06:44:42.406862
04ffbb08-c552-448e-b7c8-6cc5c84fa939	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Mehta	7327391917	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Reyansh Mehta", "contact_number": "7327391917"}	2026-02-01 06:36:53.582262	2026-02-01 06:44:42.406894
258a021a-2c23-40a5-9cd7-3985135c5400	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Shetty	6947426874	Champions	{"cohort": "Champions", "customer_name": "Aman Shetty", "contact_number": "6947426874"}	2026-02-01 06:36:53.582265	2026-02-01 06:44:42.406927
05fcfc5c-8d6d-444d-b1ae-4866225a4662	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Sharma	9132143455	Promising	{"cohort": "Promising", "customer_name": "Mansi Sharma", "contact_number": "9132143455"}	2026-02-01 06:36:53.582268	2026-02-01 06:44:42.406959
3ec66d9a-d64a-4daa-bb16-6a4331a1e2c9	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Sood	9573856076	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9573856076"}	2026-02-01 06:36:53.582273	2026-02-01 06:44:42.406992
9471bc64-b2e7-4263-b4c6-2113da74ef63	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Mukherjee	8165669371	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Mukherjee", "contact_number": "8165669371"}	2026-02-01 06:36:53.582276	2026-02-01 06:44:42.407024
793d0230-68b2-4654-8af7-b6bf917eee49	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Tripathi	6255554375	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Tripathi", "contact_number": "6255554375"}	2026-02-01 06:36:53.582279	2026-02-01 06:44:42.407056
85780734-9796-4d75-820f-dbe1a7789655	042ac4bb-581a-4835-ba89-68f9884c5d72		Riya Kulkarni	7301491913	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Riya Kulkarni", "contact_number": "7301491913"}	2026-02-01 06:36:53.582282	2026-02-01 06:44:42.407088
5c4946eb-e180-43c7-9e31-931b7cc6d061	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Saxena	9753074007	New Customers	{"cohort": "New Customers", "customer_name": "Ira Saxena", "contact_number": "9753074007"}	2026-02-01 06:36:53.582286	2026-02-01 06:44:42.40712
fcc1782f-aa7d-42ed-9ef3-ffbdf49d4a94	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Mehta	6866192115	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Mehta", "contact_number": "6866192115"}	2026-02-01 06:36:53.582289	2026-02-01 06:44:42.407152
0196876e-8e2d-49a9-afbe-8662ae5edbc7	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Malhotra	9241640615	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Malhotra", "contact_number": "9241640615"}	2026-02-01 06:36:53.582292	2026-02-01 06:44:42.407184
24461ced-d45d-4821-b8f1-446ed2f019dd	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarav Malhotra	9022775753	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aarav Malhotra", "contact_number": "9022775753"}	2026-02-01 06:36:53.582296	2026-02-01 06:44:42.407216
f3f5b7cc-030d-4c46-b4e0-b78b674ae109	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Pandey	7428565653	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aarohi Pandey", "contact_number": "7428565653"}	2026-02-01 06:36:53.582299	2026-02-01 06:44:42.407248
01999dfc-28c4-462a-a49f-0eb3cd99cfaf	042ac4bb-581a-4835-ba89-68f9884c5d72		Kiara Mishra	9687260113	Hibernating	{"cohort": "Hibernating", "customer_name": "Kiara Mishra", "contact_number": "9687260113"}	2026-02-01 06:36:53.582302	2026-02-01 06:44:42.407279
3b81b206-aaee-4657-aab9-585209459e82	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Kaur	7313554459	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Harsh Kaur", "contact_number": "7313554459"}	2026-02-01 06:36:53.582306	2026-02-01 06:44:42.407312
cafef0a5-2f62-4a84-8990-644b937b919d	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Rao	7541340301	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Tanvi Rao", "contact_number": "7541340301"}	2026-02-01 06:36:53.582309	2026-02-01 06:44:42.407344
5e03aef2-ee63-446a-880a-d320509958d5	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Arora	9954648400	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Arora", "contact_number": "9954648400"}	2026-02-01 06:36:53.582312	2026-02-01 06:44:42.407376
b9acf3c0-d0f6-4535-9b82-15941591737f	042ac4bb-581a-4835-ba89-68f9884c5d72		Riya Menon	7225147751	At Risk	{"cohort": "At Risk", "customer_name": "Riya Menon", "contact_number": "7225147751"}	2026-02-01 06:36:53.582316	2026-02-01 06:44:42.407409
03df6224-9278-492b-903c-d223742bd080	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Banerjee	6259577424	Promising	{"cohort": "Promising", "customer_name": "Diya Banerjee", "contact_number": "6259577424"}	2026-02-01 06:36:53.582319	2026-02-01 06:44:42.407441
709122de-bbbc-4e08-995d-2fa4373d805a	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Mehta	7294384972	Promising	{"cohort": "Promising", "customer_name": "Ira Mehta", "contact_number": "7294384972"}	2026-02-01 06:36:53.582322	2026-02-01 06:44:42.407474
83309a13-31f2-4cfe-b0b6-4b0e459a5a52	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Gill	8864678855	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Shreya Gill", "contact_number": "8864678855"}	2026-02-01 06:36:53.582325	2026-02-01 06:44:42.407506
ead6b13e-3c66-4ead-9f44-6b4b985d6d74	042ac4bb-581a-4835-ba89-68f9884c5d72		Sneha Mehta	7372289609	Champions	{"cohort": "Champions", "customer_name": "Sneha Mehta", "contact_number": "7372289609"}	2026-02-01 06:36:53.582328	2026-02-01 06:44:42.407538
171f55e7-d137-45ce-af51-acd591140283	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Jain	9998182787	Hibernating	{"cohort": "Hibernating", "customer_name": "Ayush Jain", "contact_number": "9998182787"}	2026-02-01 06:36:53.582332	2026-02-01 06:44:42.40757
f5593162-35bf-4492-860e-e9176f9f309f	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Mehta	9452446805	Hibernating	{"cohort": "Hibernating", "customer_name": "Vihaan Mehta", "contact_number": "9452446805"}	2026-02-01 06:36:53.582336	2026-02-01 06:44:42.407603
0f8324ce-55ba-45b0-8659-3501a3b1223c	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Kulkarni	8684458809	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Kulkarni", "contact_number": "8684458809"}	2026-02-01 06:36:53.582339	2026-02-01 06:44:42.407637
73717119-e1c7-4011-89ac-748a123f2a3b	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Naik	8873984325	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Naik", "contact_number": "8873984325"}	2026-02-01 06:36:53.582342	2026-02-01 06:44:42.407673
5fe79fd4-4d18-42ef-ba37-d2b53333d342	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Mehta	7543600741	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ananya Mehta", "contact_number": "7543600741"}	2026-02-01 06:36:53.582346	2026-02-01 06:44:42.407706
4c77521e-2fde-4726-83e4-5ebfe62ee5b3	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Shah	7409261619	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Shah", "contact_number": "7409261619"}	2026-02-01 06:36:53.582349	2026-02-01 06:44:42.407738
02499007-5ffb-426e-af88-d6efc9a2867c	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Khan	8030660677	Hibernating	{"cohort": "Hibernating", "customer_name": "Pallavi Khan", "contact_number": "8030660677"}	2026-02-01 06:36:53.582353	2026-02-01 06:44:42.407771
50432612-ea6d-414c-9a6e-6c34a065177f	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Chaudhary	9670412606	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Arjun Chaudhary", "contact_number": "9670412606"}	2026-02-01 06:36:53.582356	2026-02-01 06:44:42.407803
e65168b2-4208-46cb-8ce3-b7027ca5199d	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Hegde	6941037138	At Risk	{"cohort": "At Risk", "customer_name": "Arjun Hegde", "contact_number": "6941037138"}	2026-02-01 06:36:53.582359	2026-02-01 06:44:42.407835
9778a817-05a7-4788-b7e5-62545e9b48dc	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Mukherjee	7388660561	Need Attention	{"cohort": "Need Attention", "customer_name": "Trisha Mukherjee", "contact_number": "7388660561"}	2026-02-01 06:36:53.582363	2026-02-01 06:44:42.407867
069fae03-c803-4c7a-a667-7a8ade61fcae	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Iyer	8761468017	Champions	{"cohort": "Champions", "customer_name": "Arnav Iyer", "contact_number": "8761468017"}	2026-02-01 06:36:53.582367	2026-02-01 06:44:42.4079
06502dd9-7907-4250-994d-31a70ce7a3f3	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Prasad	9347262672	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sakshi Prasad", "contact_number": "9347262672"}	2026-02-01 06:36:53.582371	2026-02-01 06:44:42.407932
5e747530-3c75-4bae-acf2-d8cfa1ba1c6c	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Yadav	6863557208	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Yadav", "contact_number": "6863557208"}	2026-02-01 06:36:53.582374	2026-02-01 06:44:42.407965
d014a3ed-fe16-4966-bb3a-aaab376d6596	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Gupta	7414559991	Need Attention	{"cohort": "Need Attention", "customer_name": "Naina Gupta", "contact_number": "7414559991"}	2026-02-01 06:36:53.582378	2026-02-01 06:44:42.407997
43a319fa-c476-44e3-8dd1-f42a463be597	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Shah	9367970020	Champions	{"cohort": "Champions", "customer_name": "Aditi Shah", "contact_number": "9367970020"}	2026-02-01 06:36:53.582383	2026-02-01 06:44:42.408029
d0c2be5e-6cdd-4806-a48a-1a084265c594	042ac4bb-581a-4835-ba89-68f9884c5d72		Kabir Gowda	6932774465	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kabir Gowda", "contact_number": "6932774465"}	2026-02-01 06:36:53.582386	2026-02-01 06:44:42.408061
10ce6a60-c5db-44dc-aecf-5f1af6387d5a	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Prasad	7235285368	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Shreya Prasad", "contact_number": "7235285368"}	2026-02-01 06:36:53.58239	2026-02-01 06:44:42.408093
f76fa17e-da0d-441a-966c-e6fa789f00f5	042ac4bb-581a-4835-ba89-68f9884c5d72		Isha Jain	6349229160	Champions	{"cohort": "Champions", "customer_name": "Isha Jain", "contact_number": "6349229160"}	2026-02-01 06:36:53.582393	2026-02-01 06:44:42.40815
4743834c-ea0c-4f71-bad3-f4ec8ca77142	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Bose	7177195771	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rupali Bose", "contact_number": "7177195771"}	2026-02-01 06:36:53.582396	2026-02-01 06:44:42.408184
5ec8f751-6e11-4f08-9fc7-174c18613fdc	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Gowda	7787183452	Promising	{"cohort": "Promising", "customer_name": "Ira Gowda", "contact_number": "7787183452"}	2026-02-01 06:36:53.582399	2026-02-01 06:44:42.408216
0daa7da5-e1bb-4f4b-9c7d-c0d4513901b7	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Jain	6450811786	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ritvik Jain", "contact_number": "6450811786"}	2026-02-01 06:36:53.582402	2026-02-01 06:44:42.408248
c2270c67-b39d-4abf-b71c-b9e41aed0ee6	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Bose	6250824319	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Bose", "contact_number": "6250824319"}	2026-02-01 06:36:53.582405	2026-02-01 06:44:42.40828
9a7d6305-e4f8-4680-8bb7-43c5e6ebbe29	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Nair	6597434720	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arnav Nair", "contact_number": "6597434720"}	2026-02-01 06:36:53.582409	2026-02-01 06:44:42.408312
1b2b5b89-2d3e-4005-90bf-8e0818b2c5e6	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Narayan	8160250488	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Gaurav Narayan", "contact_number": "8160250488"}	2026-02-01 06:36:53.582412	2026-02-01 06:44:42.408345
c35ccc24-a4c2-40d2-8ffd-378e827acb2d	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Pandey	8350253645	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Meera Pandey", "contact_number": "8350253645"}	2026-02-01 06:36:53.582415	2026-02-01 06:44:42.408377
c2cc6e0b-b730-488b-9179-34e0b2de5a20	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Sood	9977571905	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rohan Sood", "contact_number": "9977571905"}	2026-02-01 06:36:53.582419	2026-02-01 06:44:42.40841
eb020a34-f152-413a-ac55-2e3af3e5748b	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Patel	6906871524	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Rupali Patel", "contact_number": "6906871524"}	2026-02-01 06:36:53.582422	2026-02-01 06:44:42.408442
bca5c20b-31fb-4b40-9d0a-ee0a3c4dcf9a	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarav Pandey	6912028484	Need Attention	{"cohort": "Need Attention", "customer_name": "Aarav Pandey", "contact_number": "6912028484"}	2026-02-01 06:36:53.582426	2026-02-01 06:44:42.408474
ec927345-065e-4958-8176-2bed1d244544	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Prasad	6556350612	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "6556350612"}	2026-02-01 06:36:53.582429	2026-02-01 06:44:42.408506
6b004983-2f85-4acb-b41a-e7209ac5f9dc	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Patel	8938342917	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Patel", "contact_number": "8938342917"}	2026-02-01 06:36:53.582432	2026-02-01 06:44:42.408538
de877ce1-88b6-4e75-8d1e-b191eff89199	042ac4bb-581a-4835-ba89-68f9884c5d72		Sneha Roy	6114459232	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Roy", "contact_number": "6114459232"}	2026-02-01 06:36:53.582436	2026-02-01 06:44:42.40857
457d9d12-25dc-4b96-b886-3f749341112e	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Bose	6083762817	Champions	{"cohort": "Champions", "customer_name": "Neha Bose", "contact_number": "6083762817"}	2026-02-01 06:36:53.582439	2026-02-01 06:44:42.408602
40e94ee2-5ca8-449b-a1ce-1cdeaf0b9b1c	042ac4bb-581a-4835-ba89-68f9884c5d72		Krishna Aggarwal	8302819855	New Customers	{"cohort": "New Customers", "customer_name": "Krishna Aggarwal", "contact_number": "8302819855"}	2026-02-01 06:36:53.582443	2026-02-01 06:44:42.408634
ec59fd93-f2fa-4a81-8c66-6beabc43a919	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Patel	6481089183	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Patel", "contact_number": "6481089183"}	2026-02-01 06:36:53.582446	2026-02-01 06:44:42.408666
c7b65ce8-ad93-4cac-8b55-f02eb394db77	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Mukherjee	6528009419	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Mukherjee", "contact_number": "6528009419"}	2026-02-01 06:36:53.58245	2026-02-01 06:44:42.408698
ed06c0e2-7b4d-4872-82ca-28e99e31767e	042ac4bb-581a-4835-ba89-68f9884c5d72		Siddharth Banerjee	8190947434	Lost	{"cohort": "Lost", "customer_name": "Siddharth Banerjee", "contact_number": "8190947434"}	2026-02-01 06:36:53.582453	2026-02-01 06:44:42.40873
782c1587-3da7-4ce9-a015-1b2ec036afa2	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Tiwari	8212806224	New Customers	{"cohort": "New Customers", "customer_name": "Ananya Tiwari", "contact_number": "8212806224"}	2026-02-01 06:36:53.582456	2026-02-01 06:44:42.408762
06bfc03b-6789-40db-a72b-ac3614416ef3	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Shetty	9021185687	Hibernating	{"cohort": "Hibernating", "customer_name": "Mansi Shetty", "contact_number": "9021185687"}	2026-02-01 06:36:53.582459	2026-02-01 06:44:42.408795
90160051-e814-4e25-aaa7-4be2d6005990	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Ghosh	9735495313	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Ghosh", "contact_number": "9735495313"}	2026-02-01 06:36:53.582462	2026-02-01 06:44:42.408827
c46b0687-0d41-4712-b283-fc5f34d003fb	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Narayan	7082843521	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Narayan", "contact_number": "7082843521"}	2026-02-01 06:36:53.582466	2026-02-01 06:44:42.408859
ec45bc0d-9c03-48b1-9f5f-22c26595c275	042ac4bb-581a-4835-ba89-68f9884c5d72		Isha Sharma	7628909287	Promising	{"cohort": "Promising", "customer_name": "Isha Sharma", "contact_number": "7628909287"}	2026-02-01 06:36:53.582469	2026-02-01 06:44:42.408891
cde31f9e-b85e-4eae-accc-c69d4ff5ad1a	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Rao	8991237357	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Rao", "contact_number": "8991237357"}	2026-02-01 06:36:53.582472	2026-02-01 06:44:42.408923
5b3a9cf3-abe1-4265-b6b9-557d647645f2	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Gowda	8955198434	Promising	{"cohort": "Promising", "customer_name": "Meera Gowda", "contact_number": "8955198434"}	2026-02-01 06:36:53.582476	2026-02-01 06:44:42.408958
224861f8-29d0-4236-b745-ab0e53daff10	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Nair	6060436831	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Reyansh Nair", "contact_number": "6060436831"}	2026-02-01 06:36:53.582479	2026-02-01 06:44:42.408991
66776e26-436f-40b6-8538-f1d21820c903	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Iyer	8017115307	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aarohi Iyer", "contact_number": "8017115307"}	2026-02-01 06:36:53.582483	2026-02-01 06:44:42.409023
b894a3af-13c3-46bd-90f7-f8c97718c26a	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Reddy	9533974643	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Reddy", "contact_number": "9533974643"}	2026-02-01 06:36:53.582486	2026-02-01 06:44:42.409055
4daf4af4-a06a-44dd-8440-548ac0f75808	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Rao	8251361799	Champions	{"cohort": "Champions", "customer_name": "Ayush Rao", "contact_number": "8251361799"}	2026-02-01 06:36:53.58249	2026-02-01 06:44:42.409086
c6859320-8f0c-4fe6-a0b3-6f3ca29a5af2	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Saha	9875138661	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Saha", "contact_number": "9875138661"}	2026-02-01 06:36:53.582493	2026-02-01 06:44:42.409118
f7d94e52-3216-4c06-b510-a7aaa5cdfd91	042ac4bb-581a-4835-ba89-68f9884c5d72		Kiara Chaudhary	9172918076	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kiara Chaudhary", "contact_number": "9172918076"}	2026-02-01 06:36:53.582497	2026-02-01 06:44:42.409151
6f5a9703-f51c-4cf7-b0da-cf8f052da56a	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Arora	8422021037	Hibernating	{"cohort": "Hibernating", "customer_name": "Ira Arora", "contact_number": "8422021037"}	2026-02-01 06:36:53.5825	2026-02-01 06:44:42.409182
39ec45da-fda9-45e6-bd88-46be94d3dfda	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Roy	7843514866	Lost	{"cohort": "Lost", "customer_name": "Rahul Roy", "contact_number": "7843514866"}	2026-02-01 06:36:53.582503	2026-02-01 06:44:42.409216
72d9bf20-4d92-4d9c-bcd7-35819565b917	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Srinivasan	7470021381	Hibernating	{"cohort": "Hibernating", "customer_name": "Mohit Srinivasan", "contact_number": "7470021381"}	2026-02-01 06:36:53.582506	2026-02-01 06:44:42.409249
bad69023-248d-4fa4-95fc-f28e62c9bf40	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Bose	6580564091	New Customers	{"cohort": "New Customers", "customer_name": "Pallavi Bose", "contact_number": "6580564091"}	2026-02-01 06:36:53.582509	2026-02-01 06:44:42.409281
04bd462f-49b0-4b5a-9d51-26d3fffa93f6	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Deshmukh	9112167722	Champions	{"cohort": "Champions", "customer_name": "Neha Deshmukh", "contact_number": "9112167722"}	2026-02-01 06:36:53.582513	2026-02-01 06:44:42.409313
8034c987-72ca-4a53-98b3-de2fcbda1a9c	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Mehta	7035400086	Hibernating	{"cohort": "Hibernating", "customer_name": "Aarohi Mehta", "contact_number": "7035400086"}	2026-02-01 06:36:53.582516	2026-02-01 06:44:42.409344
ae0dfc66-923d-430e-8423-fd0ecfb2849c	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Srinivasan	9101208334	New Customers	{"cohort": "New Customers", "customer_name": "Sai Srinivasan", "contact_number": "9101208334"}	2026-02-01 06:36:53.58252	2026-02-01 06:44:42.409376
10f10ec2-1395-4cd2-b61a-d6167c824414	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Saha	8051834242	Lost	{"cohort": "Lost", "customer_name": "Manav Saha", "contact_number": "8051834242"}	2026-02-01 06:36:53.582523	2026-02-01 06:44:42.409409
dfecac03-aeb4-40ea-aefd-6d48fd0af804	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditya Sharma	8516068472	Lost	{"cohort": "Lost", "customer_name": "Aditya Sharma", "contact_number": "8516068472"}	2026-02-01 06:36:53.582526	2026-02-01 06:44:42.409441
2205b120-24d5-464d-ab3b-87729742cd47	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Bajaj	6884584840	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Rahul Bajaj", "contact_number": "6884584840"}	2026-02-01 06:36:53.582529	2026-02-01 06:44:42.409473
00d7f36a-e40f-46ef-b993-2be2c63d0c1c	042ac4bb-581a-4835-ba89-68f9884c5d72		Krishna Srinivasan	6598661719	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Krishna Srinivasan", "contact_number": "6598661719"}	2026-02-01 06:36:53.582533	2026-02-01 06:44:42.409505
384ff51e-c348-411b-8879-1d419f5091ea	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Singh	7814949682	New Customers	{"cohort": "New Customers", "customer_name": "Aarohi Singh", "contact_number": "7814949682"}	2026-02-01 06:36:53.582536	2026-02-01 06:44:42.409537
e46abbe0-57b3-4125-9eeb-8b95613a8f19	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Tiwari	6055859075	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ayush Tiwari", "contact_number": "6055859075"}	2026-02-01 06:36:53.582539	2026-02-01 06:44:42.409568
22307d09-1fda-456c-810f-22e38b20bd41	042ac4bb-581a-4835-ba89-68f9884c5d72		Pooja Arora	9115591177	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Pooja Arora", "contact_number": "9115591177"}	2026-02-01 06:36:53.582542	2026-02-01 06:44:42.4096
b98ee360-473b-4937-9ca4-5ed8537df72d	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Rao	8826541466	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Manav Rao", "contact_number": "8826541466"}	2026-02-01 06:36:53.582545	2026-02-01 06:44:42.409632
5bf3e853-b9ed-47de-bd87-1f79f92b74b6	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarav Iyer	9083279808	Promising	{"cohort": "Promising", "customer_name": "Aarav Iyer", "contact_number": "9083279808"}	2026-02-01 06:36:53.582549	2026-02-01 06:44:42.409664
d09ede43-1221-480e-9646-5fbd3e9e078c	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Bhat	8388692377	Hibernating	{"cohort": "Hibernating", "customer_name": "Arjun Bhat", "contact_number": "8388692377"}	2026-02-01 06:36:53.582552	2026-02-01 06:44:42.409696
833efe1c-7c93-4c56-b862-eba6deab958e	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Menon	8246128778	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Menon", "contact_number": "8246128778"}	2026-02-01 06:36:53.582555	2026-02-01 06:44:42.409728
68588f99-086c-4985-94b6-a48d9fa4739f	042ac4bb-581a-4835-ba89-68f9884c5d72		Sneha Gupta	6513518801	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Gupta", "contact_number": "6513518801"}	2026-02-01 06:36:53.582558	2026-02-01 06:44:42.40976
4bf703bf-63ae-4f47-8992-411baffc5bba	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Kapoor	7824972856	Champions	{"cohort": "Champions", "customer_name": "Mansi Kapoor", "contact_number": "7824972856"}	2026-02-01 06:36:53.582562	2026-02-01 06:44:42.409792
0b11add9-3117-49bf-b868-b6542610792f	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Rao	6624494538	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Rao", "contact_number": "6624494538"}	2026-02-01 06:36:53.582565	2026-02-01 06:44:42.409824
b37f06a4-ba54-4f2e-b7c6-7821ab2cc4e9	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Mishra	8762315986	Lost	{"cohort": "Lost", "customer_name": "Ishaan Mishra", "contact_number": "8762315986"}	2026-02-01 06:36:53.582569	2026-02-01 06:44:42.409856
ce0710d7-78ba-4dc6-b3fc-cc1bc2a1d038	042ac4bb-581a-4835-ba89-68f9884c5d72		Krishna Gupta	7240770966	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Krishna Gupta", "contact_number": "7240770966"}	2026-02-01 06:36:53.582572	2026-02-01 06:44:42.409888
e0dbf942-63b9-41f6-9b84-8b6f2a5dc3e1	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Kapoor	6269772884	Promising	{"cohort": "Promising", "customer_name": "Meera Kapoor", "contact_number": "6269772884"}	2026-02-01 06:36:53.582575	2026-02-01 06:44:42.40992
204f1c30-b6c0-45a0-b32d-973ea21db9e4	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Gupta	7468315683	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Nandini Gupta", "contact_number": "7468315683"}	2026-02-01 06:36:53.582578	2026-02-01 06:44:42.409952
3940f544-b28b-4e90-af8a-3db1bde730e2	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Aggarwal	8210968278	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Aggarwal", "contact_number": "8210968278"}	2026-02-01 06:36:53.582581	2026-02-01 06:44:42.409984
bd1bbab0-887f-4d7b-8136-24e62a91921d	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Hegde	8152088431	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ira Hegde", "contact_number": "8152088431"}	2026-02-01 06:36:53.582584	2026-02-01 06:44:42.410015
ee97125d-d3a8-4362-bdd0-45d277164d30	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Gowda	6692430751	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Saanvi Gowda", "contact_number": "6692430751"}	2026-02-01 06:36:53.582587	2026-02-01 06:44:42.410047
9a43944a-4853-432b-96e9-7d86336f3393	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Aggarwal	7664933165	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Reyansh Aggarwal", "contact_number": "7664933165"}	2026-02-01 06:36:53.582591	2026-02-01 06:44:42.410079
574d0c85-359e-4372-a946-e1af0c706015	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Rao	8012871630	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Rao", "contact_number": "8012871630"}	2026-02-01 06:36:53.582594	2026-02-01 06:44:42.410111
cf0cddbb-d3c8-472d-b465-be66e448cad9	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Tripathi	8284835410	At Risk	{"cohort": "At Risk", "customer_name": "Sakshi Tripathi", "contact_number": "8284835410"}	2026-02-01 06:36:53.582598	2026-02-01 06:44:42.410144
27945e00-64b9-4afb-98d0-6f9be99d87d9	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Gill	6411654819	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Gill", "contact_number": "6411654819"}	2026-02-01 06:36:53.582601	2026-02-01 06:44:42.410176
716c6eda-f9cb-40bb-a7b4-689137669a79	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Mukherjee	8459437746	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ishaan Mukherjee", "contact_number": "8459437746"}	2026-02-01 06:36:53.582605	2026-02-01 06:44:42.410209
67a9e516-0a20-47f4-8939-9a163038ba91	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Singh	7304275177	Hibernating	{"cohort": "Hibernating", "customer_name": "Trisha Singh", "contact_number": "7304275177"}	2026-02-01 06:36:53.582609	2026-02-01 06:44:42.41024
01afa91c-d1a0-4b70-8a7d-f448b700eff1	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Khan	7664930130	Promising	{"cohort": "Promising", "customer_name": "Avni Khan", "contact_number": "7664930130"}	2026-02-01 06:36:53.582629	2026-02-01 06:44:42.410274
a1e7a35b-0bf8-43fa-8a93-ad472df31c05	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Tripathi	8750072831	Promising	{"cohort": "Promising", "customer_name": "Sakshi Tripathi", "contact_number": "8750072831"}	2026-02-01 06:36:53.582636	2026-02-01 06:44:42.410307
735baa27-0e8a-47df-8626-97314559592d	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Khan	8182275389	At Risk	{"cohort": "At Risk", "customer_name": "Vivaan Khan", "contact_number": "8182275389"}	2026-02-01 06:36:53.58264	2026-02-01 06:44:42.410342
3f93091f-360a-47f9-b238-435530f060bc	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Bansal	8947198029	Need Attention	{"cohort": "Need Attention", "customer_name": "Ayush Bansal", "contact_number": "8947198029"}	2026-02-01 06:36:53.582644	2026-02-01 06:44:42.410379
983acbe5-1cda-406f-b64a-b9ba2db6ed1e	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Tripathi	7751360825	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Tanvi Tripathi", "contact_number": "7751360825"}	2026-02-01 06:36:53.582647	2026-02-01 06:44:42.410431
d5088f6e-2ebc-4587-9353-995149328c04	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Gowda	6501801412	At Risk	{"cohort": "At Risk", "customer_name": "Avni Gowda", "contact_number": "6501801412"}	2026-02-01 06:36:53.582651	2026-02-01 06:44:42.410465
2a0eef6d-8a98-4115-b315-78183d1e017d	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Gill	7260415674	Hibernating	{"cohort": "Hibernating", "customer_name": "Trisha Gill", "contact_number": "7260415674"}	2026-02-01 06:36:53.582654	2026-02-01 06:44:42.410497
d1bf2ea6-b93f-446d-a279-572eee1cbabf	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Mukherjee	6562746789	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Mukherjee", "contact_number": "6562746789"}	2026-02-01 06:36:53.582658	2026-02-01 06:44:42.410529
14e3916c-79ef-4de9-a8bb-03639b35421b	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Singh	8720429306	New Customers	{"cohort": "New Customers", "customer_name": "Anika Singh", "contact_number": "8720429306"}	2026-02-01 06:36:53.582662	2026-02-01 06:44:42.410561
1d2fd661-3882-44dd-8ef0-4a6c4146f9b8	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Bhat	6861057122	Champions	{"cohort": "Champions", "customer_name": "Tanvi Bhat", "contact_number": "6861057122"}	2026-02-01 06:36:53.582666	2026-02-01 06:44:42.410593
a3156b7b-036d-4885-8907-615cbf1154ed	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Malhotra	8208883641	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Malhotra", "contact_number": "8208883641"}	2026-02-01 06:36:53.582669	2026-02-01 06:44:42.410624
469bf0ee-eadb-4c1a-809c-271afb5250f4	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Gupta	6016389273	Champions	{"cohort": "Champions", "customer_name": "Trisha Gupta", "contact_number": "6016389273"}	2026-02-01 06:36:53.582673	2026-02-01 06:44:42.410656
0f3a876a-9bb6-45dc-9a93-b527183316ee	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Kulkarni	8149238767	Promising	{"cohort": "Promising", "customer_name": "Pallavi Kulkarni", "contact_number": "8149238767"}	2026-02-01 06:36:53.582676	2026-02-01 06:44:42.410687
283bc321-1294-4a8a-9561-591a0ffb2a8b	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Das	6179819454	Promising	{"cohort": "Promising", "customer_name": "Myra Das", "contact_number": "6179819454"}	2026-02-01 06:36:53.582679	2026-02-01 06:44:42.410719
c6300ac6-be71-426b-b869-13a8c77d2d8b	042ac4bb-581a-4835-ba89-68f9884c5d72		Rashmi Pandey	9768878448	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Pandey", "contact_number": "9768878448"}	2026-02-01 06:36:53.582682	2026-02-01 06:44:42.410754
265c8c54-eab2-404f-84e2-49054b5ce8ab	042ac4bb-581a-4835-ba89-68f9884c5d72		Kunal Ghosh	9023767559	Need Attention	{"cohort": "Need Attention", "customer_name": "Kunal Ghosh", "contact_number": "9023767559"}	2026-02-01 06:36:53.582686	2026-02-01 06:44:42.410787
73a40522-811e-4704-8aec-2d641caf1f25	042ac4bb-581a-4835-ba89-68f9884c5d72		Rashmi Chatterjee	8566474661	Champions	{"cohort": "Champions", "customer_name": "Rashmi Chatterjee", "contact_number": "8566474661"}	2026-02-01 06:36:53.582689	2026-02-01 06:44:42.410824
242ee688-b90f-4662-be78-71f047fbc782	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Verma	6095441733	Champions	{"cohort": "Champions", "customer_name": "Myra Verma", "contact_number": "6095441733"}	2026-02-01 06:36:53.582692	2026-02-01 06:44:42.410857
64458ea3-7686-4537-8faf-5b337e35ad8a	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Das	8026424848	At Risk	{"cohort": "At Risk", "customer_name": "Gaurav Das", "contact_number": "8026424848"}	2026-02-01 06:36:53.582696	2026-02-01 06:44:42.410889
8b4e053e-40e8-4ff3-b4e0-052d9af72cfa	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Bansal	9397040587	New Customers	{"cohort": "New Customers", "customer_name": "Arnav Bansal", "contact_number": "9397040587"}	2026-02-01 06:36:53.582699	2026-02-01 06:44:42.410921
95d003c4-586e-46e6-babf-3b173cbfee54	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Patel	8856438883	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Patel", "contact_number": "8856438883"}	2026-02-01 06:36:53.582703	2026-02-01 06:44:42.410953
c95d01fc-1751-4491-ad22-7f208605ed62	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Saha	9734060367	Promising	{"cohort": "Promising", "customer_name": "Dhruv Saha", "contact_number": "9734060367"}	2026-02-01 06:36:53.582706	2026-02-01 06:44:42.410985
07785421-f273-4e78-b4fa-736116b8f48c	042ac4bb-581a-4835-ba89-68f9884c5d72		Kunal Narayan	8701177161	At Risk	{"cohort": "At Risk", "customer_name": "Kunal Narayan", "contact_number": "8701177161"}	2026-02-01 06:36:53.582709	2026-02-01 06:44:42.411017
849963c3-924a-43d1-9ab3-b3598c712790	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Saxena	9281370661	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Neha Saxena", "contact_number": "9281370661"}	2026-02-01 06:36:53.582712	2026-02-01 06:44:42.411049
e589bebf-4874-4fd9-8663-646e4845fc60	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Shetty	9455907545	Need Attention	{"cohort": "Need Attention", "customer_name": "Mohit Shetty", "contact_number": "9455907545"}	2026-02-01 06:36:53.582715	2026-02-01 06:44:42.411081
b2f5445a-8db4-45a8-a3f4-3e35329ceb39	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Verma	7618166384	Champions	{"cohort": "Champions", "customer_name": "Rahul Verma", "contact_number": "7618166384"}	2026-02-01 06:36:53.582719	2026-02-01 06:44:42.411113
aa7a510d-0b64-48c1-8a4e-a717f8d4466f	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayaan Bose	7299414772	Champions	{"cohort": "Champions", "customer_name": "Ayaan Bose", "contact_number": "7299414772"}	2026-02-01 06:36:53.582722	2026-02-01 06:44:42.411145
30b47798-02ce-4f29-8037-e05d45bc11f6	042ac4bb-581a-4835-ba89-68f9884c5d72		Aadhya Yadav	8796262369	Promising	{"cohort": "Promising", "customer_name": "Aadhya Yadav", "contact_number": "8796262369"}	2026-02-01 06:36:53.582725	2026-02-01 06:44:42.411176
10e3735f-9843-4756-b2e0-58eadf8b446a	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Gupta	7563134564	Promising	{"cohort": "Promising", "customer_name": "Aarohi Gupta", "contact_number": "7563134564"}	2026-02-01 06:36:53.582729	2026-02-01 06:44:42.411208
06c9c9c7-dc90-4d70-8f54-2b2c1ba1f85c	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Chaudhary	8840130027	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Chaudhary", "contact_number": "8840130027"}	2026-02-01 06:36:53.582732	2026-02-01 06:44:42.41124
602f39f6-9ae0-4bb4-a0a2-92a54892b652	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Aggarwal	8610725346	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Aggarwal", "contact_number": "8610725346"}	2026-02-01 06:36:53.582736	2026-02-01 06:44:42.411271
67a604d4-b923-4ae0-a02c-9ecbab7b4f89	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Jain	7752772693	Lost	{"cohort": "Lost", "customer_name": "Dev Jain", "contact_number": "7752772693"}	2026-02-01 06:36:53.582739	2026-02-01 06:44:42.411304
1455e126-0656-4977-afe3-30c3a38b32cb	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Chaudhary	8907288426	Promising	{"cohort": "Promising", "customer_name": "Manav Chaudhary", "contact_number": "8907288426"}	2026-02-01 06:36:53.582743	2026-02-01 06:44:42.411336
abd1ca80-358d-482f-a277-a5a6ef8a37ca	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Iyer	8756792161	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Iyer", "contact_number": "8756792161"}	2026-02-01 06:36:53.582746	2026-02-01 06:44:42.411373
f2cfca7e-827d-4eb8-a7bd-3f4225f1ea28	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Prasad	7710221804	At Risk	{"cohort": "At Risk", "customer_name": "Varun Prasad", "contact_number": "7710221804"}	2026-02-01 06:36:53.58275	2026-02-01 06:44:42.411406
7a9cd6b2-2b6e-47d5-867c-bf83e5b6793e	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Bose	7095768375	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Diya Bose", "contact_number": "7095768375"}	2026-02-01 06:36:53.582755	2026-02-01 06:44:42.411445
38532c11-f482-4715-a449-4bc843296028	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditya Arora	6732105450	New Customers	{"cohort": "New Customers", "customer_name": "Aditya Arora", "contact_number": "6732105450"}	2026-02-01 06:36:53.582758	2026-02-01 06:44:42.411478
b0b39fe0-6bc0-44cb-b2bc-085ec167a007	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Sharma	7863296457	Champions	{"cohort": "Champions", "customer_name": "Manav Sharma", "contact_number": "7863296457"}	2026-02-01 06:36:53.582762	2026-02-01 06:44:42.411509
803e27cd-1559-4c8d-af6d-dff3b57d0882	042ac4bb-581a-4835-ba89-68f9884c5d72		Isha Shetty	6132692083	Champions	{"cohort": "Champions", "customer_name": "Isha Shetty", "contact_number": "6132692083"}	2026-02-01 06:36:53.582765	2026-02-01 06:44:42.411541
fd1ce06a-bfbc-4ca4-89b4-d3f3aa0a0a59	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Kaur	6352983840	Lost	{"cohort": "Lost", "customer_name": "Mohit Kaur", "contact_number": "6352983840"}	2026-02-01 06:36:53.582768	2026-02-01 06:44:42.411573
09b2d1a4-6d07-4438-a503-928df8de929a	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Gill	7300975626	At Risk	{"cohort": "At Risk", "customer_name": "Ayush Gill", "contact_number": "7300975626"}	2026-02-01 06:36:53.582772	2026-02-01 06:44:42.411605
8ffa34bd-ed29-44c3-b7b3-5921fca11877	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Das	7841579769	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Gaurav Das", "contact_number": "7841579769"}	2026-02-01 06:36:53.582775	2026-02-01 06:44:42.411637
6b7e6671-2221-42a5-b3ac-cfefcae5a478	042ac4bb-581a-4835-ba89-68f9884c5d72		Siddharth Mishra	7070012089	New Customers	{"cohort": "New Customers", "customer_name": "Siddharth Mishra", "contact_number": "7070012089"}	2026-02-01 06:36:53.582778	2026-02-01 06:44:42.411668
a250b0f8-2cc3-4cab-b6ef-9fd9da25fd6b	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Gowda	9364065667	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arjun Gowda", "contact_number": "9364065667"}	2026-02-01 06:36:53.582782	2026-02-01 06:44:42.411701
fc553154-ee70-47ca-b709-2046a3813143	042ac4bb-581a-4835-ba89-68f9884c5d72		Anvi Bansal	6709173074	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anvi Bansal", "contact_number": "6709173074"}	2026-02-01 06:36:53.582786	2026-02-01 06:44:42.411735
cdff140f-4216-41ff-84d6-1c325b18e151	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Jain	9801277826	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Jain", "contact_number": "9801277826"}	2026-02-01 06:36:53.582789	2026-02-01 06:44:42.411768
03aa34ae-305d-4113-999f-0ae1defadb14	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Iyer	8697739551	Promising	{"cohort": "Promising", "customer_name": "Gaurav Iyer", "contact_number": "8697739551"}	2026-02-01 06:36:53.582792	2026-02-01 06:44:42.411809
a6cebb6f-7089-4806-b0af-bc365e3b575b	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Ghosh	6535027729	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Dev Ghosh", "contact_number": "6535027729"}	2026-02-01 06:36:53.582796	2026-02-01 06:44:42.411842
d55a6965-985c-4099-b73f-2eef60c4efbc	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Ghosh	7128117889	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Ghosh", "contact_number": "7128117889"}	2026-02-01 06:36:53.582799	2026-02-01 06:44:42.411878
880a6bae-8e28-4f62-af51-aaab795e0925	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Tripathi	9606215936	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Tripathi", "contact_number": "9606215936"}	2026-02-01 06:36:53.582802	2026-02-01 06:44:42.411914
ddfc462f-b50f-4c83-8f49-ac3c7f75c41e	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Saxena	7169346355	Lost	{"cohort": "Lost", "customer_name": "Rohan Saxena", "contact_number": "7169346355"}	2026-02-01 06:36:53.582806	2026-02-01 06:44:42.411946
9ca9f960-d822-4a8c-aad2-85e2362a84ad	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Banerjee	8891377623	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Harsh Banerjee", "contact_number": "8891377623"}	2026-02-01 06:36:53.582809	2026-02-01 06:44:42.411977
ba8dd572-8854-4ebd-9d4a-d32d89e0a464	042ac4bb-581a-4835-ba89-68f9884c5d72		Pooja Nair	8843351688	Promising	{"cohort": "Promising", "customer_name": "Pooja Nair", "contact_number": "8843351688"}	2026-02-01 06:36:53.582812	2026-02-01 06:44:42.412012
69fae9b7-55fe-4919-9104-014d6fab92d5	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Tripathi	7817678868	Need Attention	{"cohort": "Need Attention", "customer_name": "Diya Tripathi", "contact_number": "7817678868"}	2026-02-01 06:36:53.582815	2026-02-01 06:44:42.412045
bfeb84dd-31be-43fe-9c53-3527a462c2a8	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Malhotra	9720285613	New Customers	{"cohort": "New Customers", "customer_name": "Gaurav Malhotra", "contact_number": "9720285613"}	2026-02-01 06:36:53.582819	2026-02-01 06:44:42.412084
1424de58-c912-4b3b-b488-f147bb49ee06	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Gill	8150302996	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mohit Gill", "contact_number": "8150302996"}	2026-02-01 06:36:53.582822	2026-02-01 06:44:42.412115
7d18c816-9d1d-4f3c-8d9b-d686acedf9d5	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Khan	7419697432	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Khan", "contact_number": "7419697432"}	2026-02-01 06:36:53.582826	2026-02-01 06:44:42.412147
23a07156-7964-4fe9-8b69-7a3dd3a458a2	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Prasad	9222657398	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "9222657398"}	2026-02-01 06:36:53.582829	2026-02-01 06:44:42.412179
82eba2e7-a521-4535-9aa8-005c4ad9320a	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Saxena	6937588251	Champions	{"cohort": "Champions", "customer_name": "Meera Saxena", "contact_number": "6937588251"}	2026-02-01 06:36:53.582833	2026-02-01 06:44:42.412211
cbd02071-5591-4d30-8c1d-11d3dcf92c57	042ac4bb-581a-4835-ba89-68f9884c5d72		Pooja Sharma	9368539538	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Pooja Sharma", "contact_number": "9368539538"}	2026-02-01 06:36:53.582836	2026-02-01 06:44:42.412243
6581f7e8-475b-42ef-943f-72b29904a7e8	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Banerjee	9780842521	Champions	{"cohort": "Champions", "customer_name": "Meera Banerjee", "contact_number": "9780842521"}	2026-02-01 06:36:53.582839	2026-02-01 06:44:42.412275
0a59aac1-185e-4b03-b67d-3f3761b43807	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Mishra	7371287442	Champions	{"cohort": "Champions", "customer_name": "Ira Mishra", "contact_number": "7371287442"}	2026-02-01 06:36:53.582842	2026-02-01 06:44:42.412307
531ca28a-1d77-44e4-b1b0-c6b38c26fec2	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Yadav	7642151581	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Tanvi Yadav", "contact_number": "7642151581"}	2026-02-01 06:36:53.582845	2026-02-01 06:44:42.412339
ec33405c-ca22-467d-bb59-b57855082a28	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Narayan	7219550762	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Naina Narayan", "contact_number": "7219550762"}	2026-02-01 06:36:53.582849	2026-02-01 06:44:42.412371
a26cef3f-9392-47f8-a32f-97010d027a61	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Pandey	6264424157	Promising	{"cohort": "Promising", "customer_name": "Rohan Pandey", "contact_number": "6264424157"}	2026-02-01 06:36:53.582853	2026-02-01 06:44:42.412405
1835051d-fd77-43c7-badd-4a5de21ef013	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Tiwari	8169503105	Champions	{"cohort": "Champions", "customer_name": "Yash Tiwari", "contact_number": "8169503105"}	2026-02-01 06:36:53.582857	2026-02-01 06:44:42.412438
ce4b3907-ce29-4606-b620-6ac6c6c16c32	042ac4bb-581a-4835-ba89-68f9884c5d72		Mohit Roy	9861958570	Promising	{"cohort": "Promising", "customer_name": "Mohit Roy", "contact_number": "9861958570"}	2026-02-01 06:36:53.582861	2026-02-01 06:44:42.412474
6ae13fc9-c50e-4342-ac91-3786603c2eb2	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Kulkarni	7950964486	Promising	{"cohort": "Promising", "customer_name": "Neha Kulkarni", "contact_number": "7950964486"}	2026-02-01 06:36:53.582864	2026-02-01 06:44:42.412512
c1e92c75-d10b-47c3-8fc4-0ccee3803364	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Gill	9287357760	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Tanvi Gill", "contact_number": "9287357760"}	2026-02-01 06:36:53.582868	2026-02-01 06:44:42.412553
683d3d5c-1cfc-465e-be7b-6d7a33013d08	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Gowda	7279055207	New Customers	{"cohort": "New Customers", "customer_name": "Ananya Gowda", "contact_number": "7279055207"}	2026-02-01 06:36:53.582872	2026-02-01 06:44:42.412586
d640fe2b-3421-4dc4-bd2f-1f72e198a763	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Banerjee	6510663316	New Customers	{"cohort": "New Customers", "customer_name": "Sai Banerjee", "contact_number": "6510663316"}	2026-02-01 06:36:53.582876	2026-02-01 06:44:42.412619
a34e4efd-628a-4c52-8a27-a58e5dc19a26	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Gowda	8255693255	Need Attention	{"cohort": "Need Attention", "customer_name": "Neha Gowda", "contact_number": "8255693255"}	2026-02-01 06:36:53.58288	2026-02-01 06:44:42.41265
678a61c3-5062-4f8d-a8e9-805d92c14c5e	042ac4bb-581a-4835-ba89-68f9884c5d72		Sameer Thakur	7352337786	Need Attention	{"cohort": "Need Attention", "customer_name": "Sameer Thakur", "contact_number": "7352337786"}	2026-02-01 06:36:53.582884	2026-02-01 06:44:42.412681
d81b1a8e-62c9-4ff3-bca2-51a40beef807	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Shah	7461243567	Champions	{"cohort": "Champions", "customer_name": "Rahul Shah", "contact_number": "7461243567"}	2026-02-01 06:36:53.582887	2026-02-01 06:44:42.412713
a692f1c1-0508-4d96-b7ec-5d49864f44a7	042ac4bb-581a-4835-ba89-68f9884c5d72		Rashmi Sood	7368846023	New Customers	{"cohort": "New Customers", "customer_name": "Rashmi Sood", "contact_number": "7368846023"}	2026-02-01 06:36:53.582891	2026-02-01 06:44:42.412765
de68a2df-285e-4546-8751-d273cd064aa3	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Hegde	6794629071	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Hegde", "contact_number": "6794629071"}	2026-02-01 06:36:53.582895	2026-02-01 06:44:42.412797
a30a5e01-6fbf-46db-a14d-62e6124e34ae	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Chatterjee	9426820552	Promising	{"cohort": "Promising", "customer_name": "Meera Chatterjee", "contact_number": "9426820552"}	2026-02-01 06:36:53.582898	2026-02-01 06:44:42.412829
c4801f9a-a45b-49b8-a6b5-cd7f8755c34a	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Das	7636902364	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Avni Das", "contact_number": "7636902364"}	2026-02-01 06:36:53.582902	2026-02-01 06:44:42.412862
928b3e66-3dfb-4fed-bb39-aaeffbc14a53	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Verma	7570028939	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Verma", "contact_number": "7570028939"}	2026-02-01 06:36:53.582906	2026-02-01 06:44:42.412894
b4833b1a-58b2-455a-8117-1d66bc214028	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditya Mukherjee	8294401555	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aditya Mukherjee", "contact_number": "8294401555"}	2026-02-01 06:36:53.58291	2026-02-01 06:44:42.412927
6ea0e9a7-c84a-4139-ab31-3b4af38a0f74	042ac4bb-581a-4835-ba89-68f9884c5d72		Priya Thakur	8989885695	Champions	{"cohort": "Champions", "customer_name": "Priya Thakur", "contact_number": "8989885695"}	2026-02-01 06:36:53.582914	2026-02-01 06:44:42.412959
ddd030ae-1a63-4f7b-b755-67111dc95290	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Bajaj	7794450106	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Bajaj", "contact_number": "7794450106"}	2026-02-01 06:36:53.582917	2026-02-01 06:44:42.412991
26454000-7e91-45cb-8f87-30ecd1444379	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Pandey	7623950820	Champions	{"cohort": "Champions", "customer_name": "Arjun Pandey", "contact_number": "7623950820"}	2026-02-01 06:36:53.582921	2026-02-01 06:44:42.413023
6917f7f4-9acf-4d36-b9d6-9a971722c325	042ac4bb-581a-4835-ba89-68f9884c5d72		Kabir Srinivasan	8094382969	Need Attention	{"cohort": "Need Attention", "customer_name": "Kabir Srinivasan", "contact_number": "8094382969"}	2026-02-01 06:36:53.582924	2026-02-01 06:44:42.413055
047d9955-d73c-492e-b5df-bf9ade0aa74a	042ac4bb-581a-4835-ba89-68f9884c5d72		Kavya Das	9722228837	Hibernating	{"cohort": "Hibernating", "customer_name": "Kavya Das", "contact_number": "9722228837"}	2026-02-01 06:36:53.582928	2026-02-01 06:44:42.413088
16b860e4-1eb5-4e15-bb10-8a7c76059f8c	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Bhat	6966675046	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Bhat", "contact_number": "6966675046"}	2026-02-01 06:36:53.582931	2026-02-01 06:44:42.41312
dae840d7-a140-48ee-a1cd-67c091cd1534	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Deshmukh	9885217537	New Customers	{"cohort": "New Customers", "customer_name": "Varun Deshmukh", "contact_number": "9885217537"}	2026-02-01 06:36:53.582934	2026-02-01 06:44:42.413151
ec707df4-f68f-422c-9d94-95a7ac88b9d0	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Mukherjee	7074553619	Need Attention	{"cohort": "Need Attention", "customer_name": "Arnav Mukherjee", "contact_number": "7074553619"}	2026-02-01 06:36:53.582938	2026-02-01 06:44:42.413183
2f6cd21a-f787-431e-b3fb-b66992fafa8e	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Narayan	9306313812	New Customers	{"cohort": "New Customers", "customer_name": "Ishaan Narayan", "contact_number": "9306313812"}	2026-02-01 06:36:53.582941	2026-02-01 06:44:42.413215
3f67ca6f-58fe-4c6c-89c7-51dff1abe73f	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Sharma	8463427382	Promising	{"cohort": "Promising", "customer_name": "Harsh Sharma", "contact_number": "8463427382"}	2026-02-01 06:36:53.582954	2026-02-01 06:44:42.413247
b8fc7079-3dd6-4dd4-a679-5218d8878656	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Sood	7596878581	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Sood", "contact_number": "7596878581"}	2026-02-01 06:36:53.58297	2026-02-01 06:44:42.413281
19d60c7e-7446-4a27-b141-c13ab9037d5b	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Bajaj	7404186534	New Customers	{"cohort": "New Customers", "customer_name": "Trisha Bajaj", "contact_number": "7404186534"}	2026-02-01 06:36:53.582975	2026-02-01 06:44:42.413313
0933d744-c6d3-4b4b-8dce-9aa9424d5933	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Reddy	8553608464	Lost	{"cohort": "Lost", "customer_name": "Sakshi Reddy", "contact_number": "8553608464"}	2026-02-01 06:36:53.58298	2026-02-01 06:44:42.413348
94fde9c3-1c7d-4fde-aed5-dd20e485cc48	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Mishra	8235834366	Hibernating	{"cohort": "Hibernating", "customer_name": "Dhruv Mishra", "contact_number": "8235834366"}	2026-02-01 06:36:53.582983	2026-02-01 06:44:42.413385
2f241f1e-0b71-4dc0-a7a6-dd5281d94fbc	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Khan	7923574064	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Myra Khan", "contact_number": "7923574064"}	2026-02-01 06:36:53.582987	2026-02-01 06:44:42.413417
76f4b0a6-9670-416c-8163-7486563b7b4a	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Bhat	7869464903	Champions	{"cohort": "Champions", "customer_name": "Avni Bhat", "contact_number": "7869464903"}	2026-02-01 06:36:53.583036	2026-02-01 06:44:42.413449
b61206a8-f629-46e8-8e89-113047639fe2	042ac4bb-581a-4835-ba89-68f9884c5d72		Isha Pandey	8322624835	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Isha Pandey", "contact_number": "8322624835"}	2026-02-01 06:36:53.583048	2026-02-01 06:44:42.41348
233af9bf-940f-4ca4-b043-f8c5da430396	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Rao	9410769701	Champions	{"cohort": "Champions", "customer_name": "Vihaan Rao", "contact_number": "9410769701"}	2026-02-01 06:36:53.583055	2026-02-01 06:44:42.413514
20c73b75-3c18-4f39-b809-4cdb57776099	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Iyer	6094075916	Champions	{"cohort": "Champions", "customer_name": "Saanvi Iyer", "contact_number": "6094075916"}	2026-02-01 06:36:53.583062	2026-02-01 06:44:42.413547
ab36d63b-e70d-4d8b-a1b5-c6001892d827	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Nair	6683226180	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nikhil Nair", "contact_number": "6683226180"}	2026-02-01 06:36:53.583068	2026-02-01 06:44:42.413585
b257cd25-58ef-429f-b5a6-5ed5e830bf18	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Pandey	8834952496	Champions	{"cohort": "Champions", "customer_name": "Avni Pandey", "contact_number": "8834952496"}	2026-02-01 06:36:53.583075	2026-02-01 06:44:42.413621
119788ae-a0c7-4c59-8518-6d9884bef348	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Naik	7547846594	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Naik", "contact_number": "7547846594"}	2026-02-01 06:36:53.583082	2026-02-01 06:44:42.413654
47fee0dd-8a84-4b71-8215-66679adfd750	042ac4bb-581a-4835-ba89-68f9884c5d72		Pooja Chaudhary	7843230883	At Risk	{"cohort": "At Risk", "customer_name": "Pooja Chaudhary", "contact_number": "7843230883"}	2026-02-01 06:36:53.583088	2026-02-01 06:44:42.413691
bfa825b8-d4eb-4ed7-8a9d-9e0fdfe73b99	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Sood	9564727757	Champions	{"cohort": "Champions", "customer_name": "Rohan Sood", "contact_number": "9564727757"}	2026-02-01 06:36:53.583095	2026-02-01 06:44:42.413726
6d6f348a-e183-4d23-8808-9eeb56cd9e37	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Tiwari	8184276820	At Risk	{"cohort": "At Risk", "customer_name": "Nandini Tiwari", "contact_number": "8184276820"}	2026-02-01 06:36:53.583102	2026-02-01 06:44:42.413758
9d3605da-3efb-4dd3-b7e9-c5b3e307df77	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Kaur	7576626521	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Kaur", "contact_number": "7576626521"}	2026-02-01 06:36:53.583108	2026-02-01 06:44:42.413789
1f0560d6-cac1-4906-a2d9-44e3fd6213d7	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Joshi	6126626100	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Nandini Joshi", "contact_number": "6126626100"}	2026-02-01 06:36:53.583115	2026-02-01 06:44:42.413821
1164eb4a-b571-46dc-804c-9b0549c656ee	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Rao	6112772143	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Rao", "contact_number": "6112772143"}	2026-02-01 06:36:53.583122	2026-02-01 06:44:42.413856
2e4c2cf0-c2c5-4600-b8b7-adf7e1109b18	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Singh	8743600712	Need Attention	{"cohort": "Need Attention", "customer_name": "Yash Singh", "contact_number": "8743600712"}	2026-02-01 06:36:53.583149	2026-02-01 06:44:42.413889
39d169d4-63f6-4dbc-b749-47dbd338516f	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Kulkarni	9041888172	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ayush Kulkarni", "contact_number": "9041888172"}	2026-02-01 06:36:53.583166	2026-02-01 06:44:42.413928
4aeedd8f-2bdc-450b-b546-cc1a48cd4c38	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Bose	9291706239	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Yash Bose", "contact_number": "9291706239"}	2026-02-01 06:36:53.583174	2026-02-01 06:44:42.41396
85142342-d2fc-482d-8ad4-d2890e2ca330	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Mukherjee	8177514230	At Risk	{"cohort": "At Risk", "customer_name": "Parth Mukherjee", "contact_number": "8177514230"}	2026-02-01 06:36:53.583182	2026-02-01 06:44:42.413996
1da5b9fe-e785-4cc3-8b68-75e7aa80e017	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Srinivasan	7924075329	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mansi Srinivasan", "contact_number": "7924075329"}	2026-02-01 06:36:53.583189	2026-02-01 06:44:42.414029
7abbd596-2091-44f8-89a1-1d5f5c012491	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Bajaj	9617246397	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Bajaj", "contact_number": "9617246397"}	2026-02-01 06:36:53.583196	2026-02-01 06:44:42.414061
a4aba58e-9d54-4cf2-adf5-956ddea18559	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Naik	6067712977	At Risk	{"cohort": "At Risk", "customer_name": "Dhruv Naik", "contact_number": "6067712977"}	2026-02-01 06:36:53.583202	2026-02-01 06:44:42.414093
855939ef-a150-4af0-835d-0ae00ea14b7e	042ac4bb-581a-4835-ba89-68f9884c5d72		Riya Srinivasan	9703720755	At Risk	{"cohort": "At Risk", "customer_name": "Riya Srinivasan", "contact_number": "9703720755"}	2026-02-01 06:36:53.583209	2026-02-01 06:44:42.414125
ecac42f2-ae2a-4b72-a8be-a80add1ceae1	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Saha	9113728950	Lost	{"cohort": "Lost", "customer_name": "Saanvi Saha", "contact_number": "9113728950"}	2026-02-01 06:36:53.583216	2026-02-01 06:44:42.414156
726e4ce5-fb37-45dd-8f31-4a84e80deba2	042ac4bb-581a-4835-ba89-68f9884c5d72		Yash Patel	7485475786	New Customers	{"cohort": "New Customers", "customer_name": "Yash Patel", "contact_number": "7485475786"}	2026-02-01 06:36:53.583222	2026-02-01 06:44:42.414188
5025e955-0a8c-4dd3-90de-5400768f33ab	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Banerjee	8727653545	New Customers	{"cohort": "New Customers", "customer_name": "Ritvik Banerjee", "contact_number": "8727653545"}	2026-02-01 06:36:53.583229	2026-02-01 06:44:42.414219
3125d18a-4b3b-4889-b4d8-83f8a2154811	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Saha	8361508182	At Risk	{"cohort": "At Risk", "customer_name": "Saanvi Saha", "contact_number": "8361508182"}	2026-02-01 06:36:53.583235	2026-02-01 06:44:42.414251
0f1b3568-d5f8-4fff-9a8f-0e0b23a501f8	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Jain	9106346502	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rahul Jain", "contact_number": "9106346502"}	2026-02-01 06:36:53.583242	2026-02-01 06:44:42.414283
df5804ab-ffb0-4e33-92e1-1b62a1e74fc0	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Shetty	6096984637	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Shetty", "contact_number": "6096984637"}	2026-02-01 06:36:53.583248	2026-02-01 06:44:42.414315
2cdb8c82-0b65-4c73-a488-8f136cb86c37	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Nair	9870657802	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Sai Nair", "contact_number": "9870657802"}	2026-02-01 06:36:53.583254	2026-02-01 06:44:42.414347
022a59e7-5822-4862-b4d7-be3aff6d9849	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Chatterjee	6123165955	New Customers	{"cohort": "New Customers", "customer_name": "Ishaan Chatterjee", "contact_number": "6123165955"}	2026-02-01 06:36:53.583279	2026-02-01 06:44:42.414379
fa64cbd4-8edf-4662-b316-1bd95b3c274b	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Bhat	6756741755	At Risk	{"cohort": "At Risk", "customer_name": "Varun Bhat", "contact_number": "6756741755"}	2026-02-01 06:36:53.583291	2026-02-01 06:44:42.414412
232d3c1e-c8ad-4473-be27-feb0da85a89c	042ac4bb-581a-4835-ba89-68f9884c5d72		Ishaan Arora	7559959846	At Risk	{"cohort": "At Risk", "customer_name": "Ishaan Arora", "contact_number": "7559959846"}	2026-02-01 06:36:53.583299	2026-02-01 06:44:42.414444
e912603d-7d14-43f7-afe7-1b6bbdb86b32	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Patel	8652792943	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ira Patel", "contact_number": "8652792943"}	2026-02-01 06:36:53.583314	2026-02-01 06:44:42.414475
d0e1ac74-2abf-47cb-9cef-2efbe8e9eb56	042ac4bb-581a-4835-ba89-68f9884c5d72		Kabir Tripathi	6955933280	Hibernating	{"cohort": "Hibernating", "customer_name": "Kabir Tripathi", "contact_number": "6955933280"}	2026-02-01 06:36:53.583326	2026-02-01 06:44:42.414508
eaacf7bd-edaa-4c84-96a6-cecb83da1112	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Shetty	8955504128	Promising	{"cohort": "Promising", "customer_name": "Rahul Shetty", "contact_number": "8955504128"}	2026-02-01 06:36:53.583333	2026-02-01 06:44:42.414539
1df6b122-e46e-4806-a9ea-a5afd2273215	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Tripathi	7280397771	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Tripathi", "contact_number": "7280397771"}	2026-02-01 06:36:53.583339	2026-02-01 06:44:42.414571
c4abc0d4-17d4-4a26-8f4c-7072ba06883d	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Roy	6537500738	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Roy", "contact_number": "6537500738"}	2026-02-01 06:36:53.583346	2026-02-01 06:44:42.414603
fd048463-0758-4459-865b-1d80a15c6d84	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Tripathi	9917789660	Hibernating	{"cohort": "Hibernating", "customer_name": "Mansi Tripathi", "contact_number": "9917789660"}	2026-02-01 06:36:53.583353	2026-02-01 06:44:42.414635
9f1354eb-394a-46f0-87c0-95f3bfec8f03	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Bajaj	6353616997	New Customers	{"cohort": "New Customers", "customer_name": "Varun Bajaj", "contact_number": "6353616997"}	2026-02-01 06:36:53.583359	2026-02-01 06:44:42.414667
b5736623-f7f9-456c-ae11-19c41705dbda	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Bhat	6223105030	Champions	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6223105030"}	2026-02-01 06:36:53.583365	2026-02-01 06:44:42.414702
2fe7e0db-64a3-4b8a-9862-1669ff0cf595	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Sood	9711546167	Hibernating	{"cohort": "Hibernating", "customer_name": "Vivaan Sood", "contact_number": "9711546167"}	2026-02-01 06:36:53.583372	2026-02-01 06:44:42.414734
ed5b4c0b-9cf4-4517-90d6-69df8eba8d60	042ac4bb-581a-4835-ba89-68f9884c5d72		Kavya Malhotra	7224651431	Champions	{"cohort": "Champions", "customer_name": "Kavya Malhotra", "contact_number": "7224651431"}	2026-02-01 06:36:53.583378	2026-02-01 06:44:42.41477
455d3130-54dc-4816-aea1-d9dd81e055bc	042ac4bb-581a-4835-ba89-68f9884c5d72		Priya Sharma	8503969410	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Priya Sharma", "contact_number": "8503969410"}	2026-02-01 06:36:53.583384	2026-02-01 06:44:42.414806
9df88339-fbd4-4d7c-b437-c8b16eff8ed5	042ac4bb-581a-4835-ba89-68f9884c5d72		Kunal Ghosh	7137810998	Lost	{"cohort": "Lost", "customer_name": "Kunal Ghosh", "contact_number": "7137810998"}	2026-02-01 06:36:53.58339	2026-02-01 06:44:42.414837
d667a779-0191-4bbc-8b67-cf66832acbba	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Malhotra	8061402525	Lost	{"cohort": "Lost", "customer_name": "Parth Malhotra", "contact_number": "8061402525"}	2026-02-01 06:36:53.583396	2026-02-01 06:44:42.414869
88ec2156-430c-4320-9a88-991f39a3737b	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Tripathi	8569663952	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "8569663952"}	2026-02-01 06:36:53.583402	2026-02-01 06:44:42.414901
8f1d5c16-0ae1-4ac5-bf39-54d018b7a719	042ac4bb-581a-4835-ba89-68f9884c5d72		Sneha Gill	6276060328	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Gill", "contact_number": "6276060328"}	2026-02-01 06:36:53.583418	2026-02-01 06:44:42.414939
7ad3020a-2ba9-4df8-a078-bcd3c5498f66	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Shetty	8808623903	New Customers	{"cohort": "New Customers", "customer_name": "Ayush Shetty", "contact_number": "8808623903"}	2026-02-01 06:36:53.583425	2026-02-01 06:44:42.414971
8c11b6d1-8a44-481c-a2ab-794508492308	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Chaudhary	6154902533	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Chaudhary", "contact_number": "6154902533"}	2026-02-01 06:36:53.583432	2026-02-01 06:44:42.415003
6e3cb202-d84a-498c-a436-65753450f932	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Chatterjee	7063399202	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Chatterjee", "contact_number": "7063399202"}	2026-02-01 06:36:53.583439	2026-02-01 06:44:42.415037
2c471454-817a-482f-b7f8-dd583fdead76	042ac4bb-581a-4835-ba89-68f9884c5d72		Riya Chatterjee	9880521860	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Riya Chatterjee", "contact_number": "9880521860"}	2026-02-01 06:36:53.583446	2026-02-01 06:44:42.415404
5b2c7481-6126-478e-b3ca-403cf182015d	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Mishra	9568645436	At Risk	{"cohort": "At Risk", "customer_name": "Anika Mishra", "contact_number": "9568645436"}	2026-02-01 06:36:53.583453	2026-02-01 06:44:42.415438
ef8b1943-401d-4bf9-af37-acc4332092eb	042ac4bb-581a-4835-ba89-68f9884c5d72		Riya Verma	9521588375	At Risk	{"cohort": "At Risk", "customer_name": "Riya Verma", "contact_number": "9521588375"}	2026-02-01 06:36:53.583459	2026-02-01 06:44:42.41547
076589ee-f8e2-46c5-aa92-a50b080b748c	042ac4bb-581a-4835-ba89-68f9884c5d72		Varun Bansal	7497651057	At Risk	{"cohort": "At Risk", "customer_name": "Varun Bansal", "contact_number": "7497651057"}	2026-02-01 06:36:53.583467	2026-02-01 06:44:42.415506
d1a03da6-1826-4cd2-90f0-b49e933cd19a	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Hegde	7387784449	Champions	{"cohort": "Champions", "customer_name": "Gaurav Hegde", "contact_number": "7387784449"}	2026-02-01 06:36:53.583474	2026-02-01 06:44:42.415538
cb1e88fc-2fe6-4568-8135-0900064a6e50	042ac4bb-581a-4835-ba89-68f9884c5d72		Avni Saxena	8111096665	Promising	{"cohort": "Promising", "customer_name": "Avni Saxena", "contact_number": "8111096665"}	2026-02-01 06:36:53.58348	2026-02-01 06:44:42.415578
25882148-42b7-4eb4-88dc-f3ebdd6dd823	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Singh	7636456738	Champions	{"cohort": "Champions", "customer_name": "Dev Singh", "contact_number": "7636456738"}	2026-02-01 06:36:53.583487	2026-02-01 06:44:42.415609
906a6b0f-2b48-4dbf-b4ed-84cacb7da75c	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Pandey	9412499926	Promising	{"cohort": "Promising", "customer_name": "Mansi Pandey", "contact_number": "9412499926"}	2026-02-01 06:36:53.583493	2026-02-01 06:44:42.415641
d2916936-d8e3-4a40-b48f-c7eb6ec49c7d	042ac4bb-581a-4835-ba89-68f9884c5d72		Anvi Nair	7709984342	New Customers	{"cohort": "New Customers", "customer_name": "Anvi Nair", "contact_number": "7709984342"}	2026-02-01 06:36:53.5835	2026-02-01 06:44:42.415673
3dce7d35-460b-4806-a2c2-856ab227b26e	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Shetty	9768739556	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Aditi Shetty", "contact_number": "9768739556"}	2026-02-01 06:36:53.583507	2026-02-01 06:44:42.415704
6aacc390-e9a6-40bf-a82f-2ac387bf8d0e	042ac4bb-581a-4835-ba89-68f9884c5d72		Vivaan Saxena	6548095375	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vivaan Saxena", "contact_number": "6548095375"}	2026-02-01 06:36:53.583515	2026-02-01 06:44:42.415736
b36fda87-76ab-4321-8ed5-91d75f1756b7	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Prasad	6148721296	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Shreya Prasad", "contact_number": "6148721296"}	2026-02-01 06:36:53.583522	2026-02-01 06:44:42.415768
5963b70d-5b16-48cc-826d-7efb74b9858d	042ac4bb-581a-4835-ba89-68f9884c5d72		Gaurav Verma	7460515853	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Gaurav Verma", "contact_number": "7460515853"}	2026-02-01 06:36:53.583528	2026-02-01 06:44:42.415799
65e7bb46-f37f-402c-b142-432a045c7558	042ac4bb-581a-4835-ba89-68f9884c5d72		Sai Narayan	8415724269	At Risk	{"cohort": "At Risk", "customer_name": "Sai Narayan", "contact_number": "8415724269"}	2026-02-01 06:36:53.583534	2026-02-01 06:44:42.41583
7140cf57-b0bc-4b2d-83a3-f9ff659c78d4	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Nair	7711435375	Need Attention	{"cohort": "Need Attention", "customer_name": "Manav Nair", "contact_number": "7711435375"}	2026-02-01 06:36:53.583541	2026-02-01 06:44:42.415862
6398cdb1-36fc-42ff-862f-e15986403ae2	042ac4bb-581a-4835-ba89-68f9884c5d72		Trisha Pandey	7337956181	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Trisha Pandey", "contact_number": "7337956181"}	2026-02-01 06:36:53.583547	2026-02-01 06:44:42.415894
ffce3525-b63a-4633-b186-8ef7e5a0d451	042ac4bb-581a-4835-ba89-68f9884c5d72		Aadhya Mehta	6437461126	Champions	{"cohort": "Champions", "customer_name": "Aadhya Mehta", "contact_number": "6437461126"}	2026-02-01 06:36:53.583553	2026-02-01 06:44:42.415925
074f2c19-5a80-46b4-bba2-58c36fed7ef5	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Malhotra	8044864264	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aarohi Malhotra", "contact_number": "8044864264"}	2026-02-01 06:36:53.583559	2026-02-01 06:44:42.415957
06169175-7a5b-44d0-825d-e998c5542871	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Roy	9062565801	Champions	{"cohort": "Champions", "customer_name": "Rohan Roy", "contact_number": "9062565801"}	2026-02-01 06:36:53.583565	2026-02-01 06:44:42.415989
43e90354-f17e-4a1c-a399-45592252da73	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Jain	8086829041	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Jain", "contact_number": "8086829041"}	2026-02-01 06:36:53.583572	2026-02-01 06:44:42.41602
bcd584cf-5e3d-4aeb-ae3e-f6e083cccda0	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Sood	8665714590	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Rahul Sood", "contact_number": "8665714590"}	2026-02-01 06:36:53.583578	2026-02-01 06:44:42.416053
8dc154d4-b3e8-429c-b04d-1413513a36fc	042ac4bb-581a-4835-ba89-68f9884c5d72		Sakshi Malhotra	8388780418	Champions	{"cohort": "Champions", "customer_name": "Sakshi Malhotra", "contact_number": "8388780418"}	2026-02-01 06:36:53.583585	2026-02-01 06:44:42.416085
19be0f95-238d-40dc-80d4-579bcbd5fc29	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Sood	8556617694	Champions	{"cohort": "Champions", "customer_name": "Anika Sood", "contact_number": "8556617694"}	2026-02-01 06:36:53.583591	2026-02-01 06:44:42.416117
97ae586b-f83b-47cf-a867-ff2a100251ce	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Tripathi	8482569647	Lost	{"cohort": "Lost", "customer_name": "Mansi Tripathi", "contact_number": "8482569647"}	2026-02-01 06:36:53.583597	2026-02-01 06:44:42.416149
b306e71b-d090-4ddc-8596-ee2c5c775cdf	042ac4bb-581a-4835-ba89-68f9884c5d72		Aarohi Shah	9416790061	New Customers	{"cohort": "New Customers", "customer_name": "Aarohi Shah", "contact_number": "9416790061"}	2026-02-01 06:36:53.583604	2026-02-01 06:44:42.41618
18c768c1-bdb5-4239-a8d2-d4512aabdcbb	042ac4bb-581a-4835-ba89-68f9884c5d72		Priya Verma	7794356022	New Customers	{"cohort": "New Customers", "customer_name": "Priya Verma", "contact_number": "7794356022"}	2026-02-01 06:36:53.583611	2026-02-01 06:44:42.416212
8e5c1631-72a6-485d-8ff3-f7ddcd3a6730	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayush Shetty	6353063760	At Risk	{"cohort": "At Risk", "customer_name": "Ayush Shetty", "contact_number": "6353063760"}	2026-02-01 06:36:53.583617	2026-02-01 06:44:42.416244
0f8ab1b3-2c84-4a2b-a367-2043b02b6be2	042ac4bb-581a-4835-ba89-68f9884c5d72		Vihaan Aggarwal	7189440114	Hibernating	{"cohort": "Hibernating", "customer_name": "Vihaan Aggarwal", "contact_number": "7189440114"}	2026-02-01 06:36:53.583623	2026-02-01 06:44:42.416276
c1c0fbab-587c-48bb-9705-66d7046737b7	042ac4bb-581a-4835-ba89-68f9884c5d72		Myra Narayan	8489055650	Lost	{"cohort": "Lost", "customer_name": "Myra Narayan", "contact_number": "8489055650"}	2026-02-01 06:36:53.583629	2026-02-01 06:44:42.416308
f38a6cb6-3b3a-4649-84d7-6a94b5fd5bde	042ac4bb-581a-4835-ba89-68f9884c5d72		Arjun Bajaj	8783920968	At Risk	{"cohort": "At Risk", "customer_name": "Arjun Bajaj", "contact_number": "8783920968"}	2026-02-01 06:36:53.583635	2026-02-01 06:44:42.416343
e56c4063-8eb4-410b-a192-4f224446d303	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Gupta	9117387208	New Customers	{"cohort": "New Customers", "customer_name": "Aman Gupta", "contact_number": "9117387208"}	2026-02-01 06:36:53.583641	2026-02-01 06:44:42.416376
2bd7dbea-85ed-40b3-aae2-4a476922311e	042ac4bb-581a-4835-ba89-68f9884c5d72		Parth Verma	8492317794	Champions	{"cohort": "Champions", "customer_name": "Parth Verma", "contact_number": "8492317794"}	2026-02-01 06:36:53.583647	2026-02-01 06:44:42.416414
2ca46cb5-b5b7-4966-9d01-ba58d9653dd4	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Das	6791348337	At Risk	{"cohort": "At Risk", "customer_name": "Saanvi Das", "contact_number": "6791348337"}	2026-02-01 06:36:53.583653	2026-02-01 06:44:42.416447
2792b6c1-970e-4559-bbdc-17c41b90ab62	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Verma	6896174750	Promising	{"cohort": "Promising", "customer_name": "Mansi Verma", "contact_number": "6896174750"}	2026-02-01 06:36:53.583659	2026-02-01 06:44:42.416478
d75efefc-6dff-4b31-a9d3-4ac65b39ad2d	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Menon	6650405635	New Customers	{"cohort": "New Customers", "customer_name": "Aditi Menon", "contact_number": "6650405635"}	2026-02-01 06:36:53.583666	2026-02-01 06:44:42.41651
51e82e4b-88b0-4a81-b262-52c37b5afb48	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Nair	8622257621	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Nair", "contact_number": "8622257621"}	2026-02-01 06:36:53.583673	2026-02-01 06:44:42.416541
5486a1a6-bfe8-4188-b5f5-e90e49df4971	042ac4bb-581a-4835-ba89-68f9884c5d72		Priya Gowda	6065233172	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Priya Gowda", "contact_number": "6065233172"}	2026-02-01 06:36:53.58368	2026-02-01 06:44:42.416573
02521426-945f-4ba6-aef3-df566043956d	042ac4bb-581a-4835-ba89-68f9884c5d72		Ayaan Prasad	7138500903	Promising	{"cohort": "Promising", "customer_name": "Ayaan Prasad", "contact_number": "7138500903"}	2026-02-01 06:36:53.583687	2026-02-01 06:44:42.416605
568a04ca-01fa-467c-be6d-6ab707223ee8	042ac4bb-581a-4835-ba89-68f9884c5d72		Ira Pandey	6415586638	Champions	{"cohort": "Champions", "customer_name": "Ira Pandey", "contact_number": "6415586638"}	2026-02-01 06:36:53.583694	2026-02-01 06:44:42.416637
63186559-6a92-4825-8d9c-995f85cfaf7f	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Bose	6974189446	Promising	{"cohort": "Promising", "customer_name": "Harsh Bose", "contact_number": "6974189446"}	2026-02-01 06:36:53.583705	2026-02-01 06:44:42.416669
cb56a4ef-1f45-4b05-8b99-08230fe9a2c5	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Kapoor	9491823193	Champions	{"cohort": "Champions", "customer_name": "Dhruv Kapoor", "contact_number": "9491823193"}	2026-02-01 06:36:53.583713	2026-02-01 06:44:42.4167
45ca99f5-cdec-438f-9e3c-0e6a5ad18c24	042ac4bb-581a-4835-ba89-68f9884c5d72		Ananya Chaudhary	8404341761	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Chaudhary", "contact_number": "8404341761"}	2026-02-01 06:36:53.583721	2026-02-01 06:44:42.416733
4afcbb72-dd97-470f-af91-fa23613edab3	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Gill	6471503452	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Naina Gill", "contact_number": "6471503452"}	2026-02-01 06:36:53.583728	2026-02-01 06:44:42.416765
b2bbc6b4-4507-407e-9350-23998f7cbd8e	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Iyer	7593385747	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Iyer", "contact_number": "7593385747"}	2026-02-01 06:36:53.583734	2026-02-01 06:44:42.416797
ed9c96ab-626d-4031-a3aa-ef1f2e6c9308	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Singh	7167781530	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Dhruv Singh", "contact_number": "7167781530"}	2026-02-01 06:36:53.583741	2026-02-01 06:44:42.416829
3aece5b2-b432-4a59-be5a-78c86ccbb9b6	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Reddy	9190187346	Need Attention	{"cohort": "Need Attention", "customer_name": "Meera Reddy", "contact_number": "9190187346"}	2026-02-01 06:36:53.583748	2026-02-01 06:44:42.416861
dd300ce0-394c-48a4-af9d-1f1fe98836a6	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Verma	6215787642	Lost	{"cohort": "Lost", "customer_name": "Shreya Verma", "contact_number": "6215787642"}	2026-02-01 06:36:53.583755	2026-02-01 06:44:42.416892
de897f80-d75c-497f-940d-62eaf5ae33f4	042ac4bb-581a-4835-ba89-68f9884c5d72		Rupali Ghosh	9163593949	New Customers	{"cohort": "New Customers", "customer_name": "Rupali Ghosh", "contact_number": "9163593949"}	2026-02-01 06:36:53.583761	2026-02-01 06:44:42.416925
d65d162e-3106-406e-9da3-6403a4a5ad8f	042ac4bb-581a-4835-ba89-68f9884c5d72		Kavya Hegde	8956588099	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Kavya Hegde", "contact_number": "8956588099"}	2026-02-01 06:36:53.583795	2026-02-01 06:44:42.416959
4aee8a8b-a8e5-4bd9-b996-27d84beb6a1e	042ac4bb-581a-4835-ba89-68f9884c5d72		Anvi Malhotra	6783882733	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Anvi Malhotra", "contact_number": "6783882733"}	2026-02-01 06:36:53.583825	2026-02-01 06:44:42.416994
ea8616bd-3d17-4be8-810d-75ad0db2e09c	042ac4bb-581a-4835-ba89-68f9884c5d72		Arnav Arora	9442115834	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arnav Arora", "contact_number": "9442115834"}	2026-02-01 06:36:53.583833	2026-02-01 06:44:42.417027
591ec954-8825-4516-ae4f-6a173057cbc4	042ac4bb-581a-4835-ba89-68f9884c5d72		Diya Patel	8961007449	Lost	{"cohort": "Lost", "customer_name": "Diya Patel", "contact_number": "8961007449"}	2026-02-01 06:36:53.583872	2026-02-01 06:44:42.417059
de63436a-0128-46e7-a39b-f2f485a9f380	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Bhat	6188869644	Champions	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6188869644"}	2026-02-01 06:36:53.583881	2026-02-01 06:44:42.417091
32acf827-69e2-441e-a2db-893f7cea6fdf	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Srinivasan	9324047729	Lost	{"cohort": "Lost", "customer_name": "Mansi Srinivasan", "contact_number": "9324047729"}	2026-02-01 06:36:53.583888	2026-02-01 06:44:42.417126
73996419-bf9e-43de-9ab5-c1688c711c48	042ac4bb-581a-4835-ba89-68f9884c5d72		Saanvi Reddy	8004359075	Champions	{"cohort": "Champions", "customer_name": "Saanvi Reddy", "contact_number": "8004359075"}	2026-02-01 06:36:53.583895	2026-02-01 06:44:42.417158
9077d5e9-2dbc-4ec9-bc57-318076cca96a	042ac4bb-581a-4835-ba89-68f9884c5d72		Harsh Bajaj	8408047906	Hibernating	{"cohort": "Hibernating", "customer_name": "Harsh Bajaj", "contact_number": "8408047906"}	2026-02-01 06:36:53.583902	2026-02-01 06:44:42.417196
4beb45c7-c9c4-475e-bcab-83c5a7cce2af	042ac4bb-581a-4835-ba89-68f9884c5d72		Meera Hegde	8695049533	Promising	{"cohort": "Promising", "customer_name": "Meera Hegde", "contact_number": "8695049533"}	2026-02-01 06:36:53.583909	2026-02-01 06:44:42.41723
90f215cd-c364-4606-9959-af7ce64ea1df	042ac4bb-581a-4835-ba89-68f9884c5d72		Naina Iyer	8209775041	Lost	{"cohort": "Lost", "customer_name": "Naina Iyer", "contact_number": "8209775041"}	2026-02-01 06:36:53.583916	2026-02-01 06:44:42.417261
21ae27c7-56c2-4d88-8a78-d95bb953e956	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Prasad	6627041072	Champions	{"cohort": "Champions", "customer_name": "Tanvi Prasad", "contact_number": "6627041072"}	2026-02-01 06:36:53.583923	2026-02-01 06:44:42.417294
a37fe60b-1f1a-4a64-96b7-e84a49a3cac9	042ac4bb-581a-4835-ba89-68f9884c5d72		Tanvi Gupta	8227697631	Promising	{"cohort": "Promising", "customer_name": "Tanvi Gupta", "contact_number": "8227697631"}	2026-02-01 06:36:53.58393	2026-02-01 06:44:42.417326
7c4c3d7f-2c20-4ee3-ba35-73d714f27403	042ac4bb-581a-4835-ba89-68f9884c5d72		Kunal Shetty	7478301914	Lost	{"cohort": "Lost", "customer_name": "Kunal Shetty", "contact_number": "7478301914"}	2026-02-01 06:36:53.583938	2026-02-01 06:44:42.417358
f64956c0-7d90-415b-9f3f-0d7920a744e5	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Gowda	9724627367	Promising	{"cohort": "Promising", "customer_name": "Manav Gowda", "contact_number": "9724627367"}	2026-02-01 06:36:53.583945	2026-02-01 06:44:42.417389
35580782-0593-405e-93ff-6b01c511a000	042ac4bb-581a-4835-ba89-68f9884c5d72		Siddharth Patel	6044499263	Need Attention	{"cohort": "Need Attention", "customer_name": "Siddharth Patel", "contact_number": "6044499263"}	2026-02-01 06:36:53.583951	2026-02-01 06:44:42.417421
ad256d52-81bc-4c18-8b09-0dcafeb58b93	042ac4bb-581a-4835-ba89-68f9884c5d72		Neha Narayan	8180946960	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Narayan", "contact_number": "8180946960"}	2026-02-01 06:36:53.583959	2026-02-01 06:44:42.417453
481bbd89-9777-4d32-a226-b1ea0ebdacff	042ac4bb-581a-4835-ba89-68f9884c5d72		Rahul Sharma	8949832063	New Customers	{"cohort": "New Customers", "customer_name": "Rahul Sharma", "contact_number": "8949832063"}	2026-02-01 06:36:53.583966	2026-02-01 06:44:42.417488
17739ce1-5426-48d9-8776-1e54f5a764d7	042ac4bb-581a-4835-ba89-68f9884c5d72		Pallavi Tripathi	7751361568	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "7751361568"}	2026-02-01 06:36:53.583973	2026-02-01 06:44:42.417522
3c93ad99-562e-4559-92ed-3d8b8073e360	042ac4bb-581a-4835-ba89-68f9884c5d72		Rashmi Deshmukh	6456372060	Need Attention	{"cohort": "Need Attention", "customer_name": "Rashmi Deshmukh", "contact_number": "6456372060"}	2026-02-01 06:36:53.58398	2026-02-01 06:44:42.417559
09304d85-e6a2-4272-ad6d-2c3dd8582732	042ac4bb-581a-4835-ba89-68f9884c5d72		Reyansh Mishra	7967181685	Hibernating	{"cohort": "Hibernating", "customer_name": "Reyansh Mishra", "contact_number": "7967181685"}	2026-02-01 06:36:53.583987	2026-02-01 06:44:42.417591
fd8536a2-01ef-4df2-a683-266e5f7c9d34	042ac4bb-581a-4835-ba89-68f9884c5d72		Siddharth Srinivasan	7862496924	Champions	{"cohort": "Champions", "customer_name": "Siddharth Srinivasan", "contact_number": "7862496924"}	2026-02-01 06:36:53.583994	2026-02-01 06:44:42.417626
67b33137-3abf-4cfb-b6d8-f6dfc490642f	042ac4bb-581a-4835-ba89-68f9884c5d72		Nandini Pandey	8272039281	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Pandey", "contact_number": "8272039281"}	2026-02-01 06:36:53.584001	2026-02-01 06:44:42.417661
2d8b5f99-11d7-4ae0-a600-cdc26b2f3641	042ac4bb-581a-4835-ba89-68f9884c5d72		Ritvik Menon	6496141726	Lost	{"cohort": "Lost", "customer_name": "Ritvik Menon", "contact_number": "6496141726"}	2026-02-01 06:36:53.584007	2026-02-01 06:44:42.417715
87fed07f-957f-45d8-9383-980f2279d863	042ac4bb-581a-4835-ba89-68f9884c5d72		Manav Khan	9710524816	Hibernating	{"cohort": "Hibernating", "customer_name": "Manav Khan", "contact_number": "9710524816"}	2026-02-01 06:36:53.584014	2026-02-01 06:44:42.417754
b0277be1-02a1-4dd9-ada7-dbc54c9aaf1c	042ac4bb-581a-4835-ba89-68f9884c5d72		Dev Naik	6627955944	New Customers	{"cohort": "New Customers", "customer_name": "Dev Naik", "contact_number": "6627955944"}	2026-02-01 06:36:53.584021	2026-02-01 06:44:42.417786
23b8bf50-c4e3-4c8f-aaf7-c5c7d5042a52	042ac4bb-581a-4835-ba89-68f9884c5d72		Aman Saha	6509845936	Need Attention	{"cohort": "Need Attention", "customer_name": "Aman Saha", "contact_number": "6509845936"}	2026-02-01 06:36:53.584028	2026-02-01 06:44:42.417818
8f2dd17c-26fc-453f-ac2b-1e8dbc0e2e63	042ac4bb-581a-4835-ba89-68f9884c5d72		Aditi Shetty	9096383872	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Shetty", "contact_number": "9096383872"}	2026-02-01 06:36:53.584036	2026-02-01 06:44:42.41785
30e35b93-4d15-442b-9dea-669f9bed87e1	042ac4bb-581a-4835-ba89-68f9884c5d72		Dhruv Kulkarni	7103168630	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dhruv Kulkarni", "contact_number": "7103168630"}	2026-02-01 06:36:53.584042	2026-02-01 06:44:42.417881
2fc153a6-2a08-49a8-8527-c5b899fc0c80	042ac4bb-581a-4835-ba89-68f9884c5d72		Nikhil Mishra	9711754053	Promising	{"cohort": "Promising", "customer_name": "Nikhil Mishra", "contact_number": "9711754053"}	2026-02-01 06:36:53.58405	2026-02-01 06:44:42.417913
cd6e233f-c1b0-4368-b0a9-a496761601b0	042ac4bb-581a-4835-ba89-68f9884c5d72		Rashmi Kaur	9903374265	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Kaur", "contact_number": "9903374265"}	2026-02-01 06:36:53.584057	2026-02-01 06:44:42.417944
3319011a-f548-41f6-a6ea-daae9dda945f	042ac4bb-581a-4835-ba89-68f9884c5d72		Shreya Saha	7720740962	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Saha", "contact_number": "7720740962"}	2026-02-01 06:36:53.584064	2026-02-01 06:44:42.417979
95f0418b-7b08-487a-91ed-6d761044b12e	042ac4bb-581a-4835-ba89-68f9884c5d72		Rohan Mukherjee	7069806808	Champions	{"cohort": "Champions", "customer_name": "Rohan Mukherjee", "contact_number": "7069806808"}	2026-02-01 06:36:53.58407	2026-02-01 06:44:42.418016
3a7313a4-7a51-40a3-9971-ce8ef94cf063	042ac4bb-581a-4835-ba89-68f9884c5d72		Mansi Shah	6472848963	Lost	{"cohort": "Lost", "customer_name": "Mansi Shah", "contact_number": "6472848963"}	2026-02-01 06:36:53.584089	2026-02-01 06:44:42.41805
e934f044-7779-4a7c-a709-b6f05c4d04ed	042ac4bb-581a-4835-ba89-68f9884c5d72		Anika Tiwari	7392010271	Lost	{"cohort": "Lost", "customer_name": "Anika Tiwari", "contact_number": "7392010271"}	2026-02-01 06:36:53.584112	2026-02-01 06:44:42.418087
e9cc5801-f9f4-4ddc-89d2-53c938ef552c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditya Sharma	8516068472	Lost	{"cohort": "Lost", "customer_name": "Aditya Sharma", "contact_number": "8516068472"}	2026-02-01 10:33:59.079013	2026-02-01 10:34:37.334441
1437f31d-d16a-4ab6-b36c-d4e909d67039	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Das	6179819454	Promising	{"cohort": "Promising", "customer_name": "Myra Das", "contact_number": "6179819454"}	2026-02-01 10:33:59.079123	2026-02-01 10:34:37.334543
3bcecce9-8b01-4d64-8ab9-af8fc3dd5b30	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sameer Iyer	7756343432	New Customers	{"cohort": "New Customers", "customer_name": "Sameer Iyer", "contact_number": "7756343432"}	2026-02-01 10:33:59.078077	2026-02-01 10:34:37.334594
42e2666b-ef09-48cb-9476-c88531156a6e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Gill	8872090747	Lost	{"cohort": "Lost", "customer_name": "Vivaan Gill", "contact_number": "8872090747"}	2026-02-01 10:33:59.078083	2026-02-01 10:34:37.33464
e7cfbee9-d808-4434-9f40-9282efe82bc4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Mukherjee	9647026354	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Anika Mukherjee", "contact_number": "9647026354"}	2026-02-01 10:33:59.078087	2026-02-01 10:34:37.334686
f09e502d-c1c2-453f-aff8-0e2e78a71419	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Nair	8473722111	Need Attention	{"cohort": "Need Attention", "customer_name": "Myra Nair", "contact_number": "8473722111"}	2026-02-01 10:33:59.078091	2026-02-01 10:34:37.334731
c5dfef32-2730-48ff-8dd9-39cda87911ec	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Reddy	7172575982	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ayush Reddy", "contact_number": "7172575982"}	2026-02-01 10:33:59.078094	2026-02-01 10:34:37.334775
63431469-ef88-4e71-9f44-4859e550d777	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Gill	8105295618	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Mohit Gill", "contact_number": "8105295618"}	2026-02-01 10:33:59.078097	2026-02-01 10:34:37.334819
02c022ec-43db-44c9-89cb-022f0eed122f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Shetty	9102439281	Champions	{"cohort": "Champions", "customer_name": "Nandini Shetty", "contact_number": "9102439281"}	2026-02-01 10:33:59.078101	2026-02-01 10:34:37.334862
9f00a8af-0796-469a-a244-39c353d4c99f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Yadav	6406015391	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Sai Yadav", "contact_number": "6406015391"}	2026-02-01 10:33:59.078104	2026-02-01 10:34:37.334908
165c4399-38b9-4d36-8fe8-9b94f1780efa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Gupta	9672544893	Need Attention	{"cohort": "Need Attention", "customer_name": "Manav Gupta", "contact_number": "9672544893"}	2026-02-01 10:33:59.078107	2026-02-01 10:34:37.334954
71433e66-4a7c-49bc-819c-12aa63a07eb0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Shah	6679226110	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Vivaan Shah", "contact_number": "6679226110"}	2026-02-01 10:33:59.07811	2026-02-01 10:34:37.334998
b0bebdef-63fa-4f67-8a20-48f8728d76a9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Chatterjee	6464022802	Champions	{"cohort": "Champions", "customer_name": "Ira Chatterjee", "contact_number": "6464022802"}	2026-02-01 10:33:59.078113	2026-02-01 10:34:37.335042
fa053a2c-9c4f-433f-a5b4-cd26b64e77c8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Chaudhary	8766945698	Lost	{"cohort": "Lost", "customer_name": "Neha Chaudhary", "contact_number": "8766945698"}	2026-02-01 10:33:59.078116	2026-02-01 10:34:37.335085
4a2f7f85-ecc2-47a5-b6c8-28f9c2bcb2ab	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Rao	6075894434	At Risk	{"cohort": "At Risk", "customer_name": "Vivaan Rao", "contact_number": "6075894434"}	2026-02-01 10:33:59.078119	2026-02-01 10:34:37.335128
d206f132-980b-4ac5-b29a-d44b5b68d44e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Arora	8540043209	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Diya Arora", "contact_number": "8540043209"}	2026-02-01 10:33:59.078122	2026-02-01 10:34:37.335172
06636925-79d6-4fa6-86ee-0183dabf08d0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Bhat	6962074691	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Bhat", "contact_number": "6962074691"}	2026-02-01 10:33:59.078125	2026-02-01 10:34:37.335215
6d5ddf22-7608-41f9-9c3a-fb60cc742783	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sneha Tripathi	9640336836	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sneha Tripathi", "contact_number": "9640336836"}	2026-02-01 10:33:59.078128	2026-02-01 10:34:37.335259
d3e0880a-65df-4b97-8cb1-41e11075c785	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Tiwari	8647002178	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Myra Tiwari", "contact_number": "8647002178"}	2026-02-01 10:33:59.078131	2026-02-01 10:34:37.335304
798a9de5-a0c6-4a0c-9ed6-76590baa7fa4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Saha	6654137672	Promising	{"cohort": "Promising", "customer_name": "Shreya Saha", "contact_number": "6654137672"}	2026-02-01 10:33:59.078134	2026-02-01 10:34:37.335348
0c7e4057-b23e-44a2-a582-933527a150ed	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Sharma	7946196215	New Customers	{"cohort": "New Customers", "customer_name": "Avni Sharma", "contact_number": "7946196215"}	2026-02-01 10:33:59.078137	2026-02-01 10:34:37.335391
fc70518d-cc23-4db0-bc83-4515a1b7eeac	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Singh	9099418475	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Parth Singh", "contact_number": "9099418475"}	2026-02-01 10:33:59.078139	2026-02-01 10:34:37.335433
32aa62fd-95b4-4694-832e-7acd815d58a2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Mishra	8444411571	Need Attention	{"cohort": "Need Attention", "customer_name": "Harsh Mishra", "contact_number": "8444411571"}	2026-02-01 10:33:59.078143	2026-02-01 10:34:37.335476
bb391ba7-7379-4322-99bc-de1a37d59aec	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Saha	6274958225	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rahul Saha", "contact_number": "6274958225"}	2026-02-01 10:33:59.078145	2026-02-01 10:34:37.335518
6c8b9b93-4c89-45fe-8ce8-8c5a08b9b4b4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Roy	9844373989	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ishaan Roy", "contact_number": "9844373989"}	2026-02-01 10:33:59.078149	2026-02-01 10:34:37.335561
4cca4288-068f-43ea-bdf1-6d6da566a698	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Bansal	7527077836	New Customers	{"cohort": "New Customers", "customer_name": "Parth Bansal", "contact_number": "7527077836"}	2026-02-01 10:33:59.078152	2026-02-01 10:34:37.335603
73c8c2fd-e823-4c03-9929-625a21bcc17b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Shah	7405588454	New Customers	{"cohort": "New Customers", "customer_name": "Reyansh Shah", "contact_number": "7405588454"}	2026-02-01 10:33:59.078155	2026-02-01 10:34:37.335646
4d68f823-42f7-4e37-803c-a87f6157d1f1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Reddy	7461493668	At Risk	{"cohort": "At Risk", "customer_name": "Varun Reddy", "contact_number": "7461493668"}	2026-02-01 10:33:59.078158	2026-02-01 10:34:37.335688
bd2f16e8-f8a7-4d73-9fbf-0ff6e17d6801	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kunal Aggarwal	9968456262	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kunal Aggarwal", "contact_number": "9968456262"}	2026-02-01 10:33:59.078161	2026-02-01 10:34:37.335731
dc124aa1-4282-4688-8b89-27fdb00c718a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Bose	7740684690	Promising	{"cohort": "Promising", "customer_name": "Naina Bose", "contact_number": "7740684690"}	2026-02-01 10:33:59.078163	2026-02-01 10:34:37.335773
837e8b96-8a79-461e-9cb6-c6b24cd06298	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Gupta	6231557108	Need Attention	{"cohort": "Need Attention", "customer_name": "Avni Gupta", "contact_number": "6231557108"}	2026-02-01 10:33:59.078166	2026-02-01 10:34:37.335815
b93bc15e-ff2a-4595-be93-a62063a7c1c8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Pandey	7452646842	Champions	{"cohort": "Champions", "customer_name": "Dev Pandey", "contact_number": "7452646842"}	2026-02-01 10:33:59.078169	2026-02-01 10:34:37.335857
fd3ee728-a040-4e2e-a19f-3e932d09019d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sneha Iyer	7099296439	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Iyer", "contact_number": "7099296439"}	2026-02-01 10:33:59.078172	2026-02-01 10:34:37.335899
7d210dfb-1e63-46fe-8d6d-38d66e7aae6d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Malhotra	9133260830	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rupali Malhotra", "contact_number": "9133260830"}	2026-02-01 10:33:59.078175	2026-02-01 10:34:37.335941
a82cef3b-7e19-4de7-bc26-c37f8aa256e1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Rao	6978972821	Champions	{"cohort": "Champions", "customer_name": "Sai Rao", "contact_number": "6978972821"}	2026-02-01 10:33:59.078177	2026-02-01 10:34:37.335983
d178810f-fee6-48d6-8bba-2d0281c5d2de	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kiara Srinivasan	8676869634	Hibernating	{"cohort": "Hibernating", "customer_name": "Kiara Srinivasan", "contact_number": "8676869634"}	2026-02-01 10:33:59.07818	2026-02-01 10:34:37.336025
d7c98670-ff6d-447c-9428-bdd7e37868ab	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Kapoor	8702711595	Lost	{"cohort": "Lost", "customer_name": "Aditi Kapoor", "contact_number": "8702711595"}	2026-02-01 10:33:59.078183	2026-02-01 10:34:37.336067
4ea72295-3726-40ed-8f78-c8ae62f38ba9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kavya Das	8828487319	At Risk	{"cohort": "At Risk", "customer_name": "Kavya Das", "contact_number": "8828487319"}	2026-02-01 10:33:59.078186	2026-02-01 10:34:37.33611
d48e0245-6934-4eec-91f5-b5179c378a0e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Patel	7726638503	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ritvik Patel", "contact_number": "7726638503"}	2026-02-01 10:33:59.078189	2026-02-01 10:34:37.336152
62f5dd93-774a-48f6-99ef-b67d0a0ad865	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditya Gowda	8546658912	Champions	{"cohort": "Champions", "customer_name": "Aditya Gowda", "contact_number": "8546658912"}	2026-02-01 10:33:59.078191	2026-02-01 10:34:37.336194
57c6a541-1045-46b5-9dc0-afa8c733fbc9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Bajaj	6693666476	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Myra Bajaj", "contact_number": "6693666476"}	2026-02-01 10:33:59.078195	2026-02-01 10:34:37.336239
04018a67-a9d2-49f7-804c-3013a89c1cf5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kiara Shah	6193408146	New Customers	{"cohort": "New Customers", "customer_name": "Kiara Shah", "contact_number": "6193408146"}	2026-02-01 10:33:59.078197	2026-02-01 10:34:37.336282
6ae90be1-30a7-4347-a843-9a5f24d7b2d5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Chatterjee	9578686926	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Pallavi Chatterjee", "contact_number": "9578686926"}	2026-02-01 10:33:59.0782	2026-02-01 10:34:37.336324
c0ade813-3abb-4af9-8286-4e5d7f6db8e3	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Reddy	7498065933	Promising	{"cohort": "Promising", "customer_name": "Trisha Reddy", "contact_number": "7498065933"}	2026-02-01 10:33:59.078204	2026-02-01 10:34:37.336366
e444feba-b028-4602-9991-0fdd03e2d50a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Saha	7998026903	Champions	{"cohort": "Champions", "customer_name": "Varun Saha", "contact_number": "7998026903"}	2026-02-01 10:33:59.078207	2026-02-01 10:34:37.336408
823e195e-8592-40fc-818b-ccf22d299eff	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Srinivasan	7728558277	Hibernating	{"cohort": "Hibernating", "customer_name": "Nikhil Srinivasan", "contact_number": "7728558277"}	2026-02-01 10:33:59.078209	2026-02-01 10:34:37.33645
f6b13969-e22d-4bba-8ec0-c244b5c0860e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Kapoor	6299571813	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mansi Kapoor", "contact_number": "6299571813"}	2026-02-01 10:33:59.078213	2026-02-01 10:34:37.336491
ff043162-b8cf-4461-88cf-5c4dd84c5789	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Kapoor	7502141043	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ananya Kapoor", "contact_number": "7502141043"}	2026-02-01 10:33:59.078215	2026-02-01 10:34:37.336533
9ea54a26-b8ba-41e6-91f0-7c94ac6305ea	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kunal Roy	6426796360	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Kunal Roy", "contact_number": "6426796360"}	2026-02-01 10:33:59.078218	2026-02-01 10:34:37.336574
b356638f-fcda-408c-8256-97b8e1f4ef9e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Saha	9841748311	Promising	{"cohort": "Promising", "customer_name": "Gaurav Saha", "contact_number": "9841748311"}	2026-02-01 10:33:59.078221	2026-02-01 10:34:37.336616
67b5ab21-75bd-4a32-8c64-c7b63b136ea1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Hegde	8352547168	Promising	{"cohort": "Promising", "customer_name": "Harsh Hegde", "contact_number": "8352547168"}	2026-02-01 10:33:59.078224	2026-02-01 10:34:37.336658
d12bfd7e-e08a-47dc-afe4-5832138ee946	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Patel	7484837332	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Patel", "contact_number": "7484837332"}	2026-02-01 10:33:59.078227	2026-02-01 10:34:37.3367
1354ef49-3549-415b-ad4b-6dd41188fb67	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Srinivasan	7640047310	Lost	{"cohort": "Lost", "customer_name": "Naina Srinivasan", "contact_number": "7640047310"}	2026-02-01 10:33:59.07823	2026-02-01 10:34:37.336741
bc2e0d9e-222e-42e4-a89e-be2c83fb12f4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Shetty	8648949023	At Risk	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "8648949023"}	2026-02-01 10:33:59.078233	2026-02-01 10:34:37.336783
269c7363-01e3-4c5a-a06d-dc394236146d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Mukherjee	6526218375	Hibernating	{"cohort": "Hibernating", "customer_name": "Dev Mukherjee", "contact_number": "6526218375"}	2026-02-01 10:33:59.078236	2026-02-01 10:34:37.336825
a81b81a1-1f67-4331-9468-e0f4e4f33268	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Pandey	9898660982	Hibernating	{"cohort": "Hibernating", "customer_name": "Ananya Pandey", "contact_number": "9898660982"}	2026-02-01 10:33:59.078239	2026-02-01 10:34:37.336867
193d5eaa-e1ac-4add-8905-772266239c37	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Saha	7279311607	Need Attention	{"cohort": "Need Attention", "customer_name": "Varun Saha", "contact_number": "7279311607"}	2026-02-01 10:33:59.078242	2026-02-01 10:34:37.336909
b6d6aa00-14bf-42dd-acba-b8379be0c30a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Srinivasan	6053413395	Hibernating	{"cohort": "Hibernating", "customer_name": "Rupali Srinivasan", "contact_number": "6053413395"}	2026-02-01 10:33:59.078245	2026-02-01 10:34:37.336951
38946f68-7038-4885-a5d7-a26a13665e80	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Rao	6170044642	Champions	{"cohort": "Champions", "customer_name": "Harsh Rao", "contact_number": "6170044642"}	2026-02-01 10:33:59.078248	2026-02-01 10:34:37.336992
e3c722fd-ca3e-4dc8-a6cb-255b555b28a9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Hegde	6316553290	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Myra Hegde", "contact_number": "6316553290"}	2026-02-01 10:33:59.078251	2026-02-01 10:34:37.337034
87a47a88-d410-4599-8a58-60b0d63612f8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Bajaj	7321230713	Champions	{"cohort": "Champions", "customer_name": "Rohan Bajaj", "contact_number": "7321230713"}	2026-02-01 10:33:59.078254	2026-02-01 10:34:37.337077
bf757847-53d8-44db-a1b1-249bbaeca3a6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Mehta	7588080098	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Mehta", "contact_number": "7588080098"}	2026-02-01 10:33:59.078257	2026-02-01 10:34:37.33712
70d26d71-5274-4034-a482-77db8372c3f2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Gupta	9574103868	New Customers	{"cohort": "New Customers", "customer_name": "Myra Gupta", "contact_number": "9574103868"}	2026-02-01 10:33:59.078261	2026-02-01 10:34:37.337161
a75fa177-adea-421f-ae7c-2dcd5e9ecf57	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Jain	8082553333	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Jain", "contact_number": "8082553333"}	2026-02-01 10:33:59.078264	2026-02-01 10:34:37.337203
7c432be5-32de-488c-be85-557c7fe61362	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Saha	7065173961	At Risk	{"cohort": "At Risk", "customer_name": "Arnav Saha", "contact_number": "7065173961"}	2026-02-01 10:33:59.078285	2026-02-01 10:34:37.337244
2599aa24-ead1-448a-9501-38730db91100	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Roy	6116761747	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Roy", "contact_number": "6116761747"}	2026-02-01 10:33:59.078289	2026-02-01 10:34:37.337286
b7452f16-f7d0-43e3-a4ce-e28627f2a415	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anvi Prasad	9686939344	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Anvi Prasad", "contact_number": "9686939344"}	2026-02-01 10:33:59.078292	2026-02-01 10:34:37.337329
0e76500e-744f-40b9-a828-ef0ca394a7e8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Arora	8753040326	Promising	{"cohort": "Promising", "customer_name": "Sakshi Arora", "contact_number": "8753040326"}	2026-02-01 10:33:59.078311	2026-02-01 10:34:37.337371
8f410264-9fc9-4a19-b302-7535520ec0f2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Roy	6654578486	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rohan Roy", "contact_number": "6654578486"}	2026-02-01 10:33:59.078315	2026-02-01 10:34:37.337467
d5883690-9e43-4239-8637-b13e42481b31	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Deshmukh	8659488906	At Risk	{"cohort": "At Risk", "customer_name": "Aman Deshmukh", "contact_number": "8659488906"}	2026-02-01 10:33:59.078318	2026-02-01 10:34:37.337513
4d18d6bd-8e0f-4d84-bc5b-ef3c7c7fa90f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Narayan	6244513243	Champions	{"cohort": "Champions", "customer_name": "Arnav Narayan", "contact_number": "6244513243"}	2026-02-01 10:33:59.078321	2026-02-01 10:34:37.337556
3d77b538-d063-4864-81c9-b43b029e3c8a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Menon	6760062769	Lost	{"cohort": "Lost", "customer_name": "Nikhil Menon", "contact_number": "6760062769"}	2026-02-01 10:33:59.078324	2026-02-01 10:34:37.337599
ebd418d8-6338-4e9c-8b52-8af0550c5c9e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Nair	7351396359	At Risk	{"cohort": "At Risk", "customer_name": "Aarohi Nair", "contact_number": "7351396359"}	2026-02-01 10:33:59.078327	2026-02-01 10:34:37.337643
6457b323-0ce4-497c-a7ab-af4fe11d09fa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Gill	8563179990	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Saanvi Gill", "contact_number": "8563179990"}	2026-02-01 10:33:59.07833	2026-02-01 10:34:37.337685
b5de480b-d201-4af2-a9e2-560960bb4227	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pooja Shetty	9503937191	Champions	{"cohort": "Champions", "customer_name": "Pooja Shetty", "contact_number": "9503937191"}	2026-02-01 10:33:59.078333	2026-02-01 10:34:37.337728
f9bfcfd1-3063-407d-a19b-34e67efb560f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Gill	8817880371	At Risk	{"cohort": "At Risk", "customer_name": "Aarohi Gill", "contact_number": "8817880371"}	2026-02-01 10:33:59.078336	2026-02-01 10:34:37.33777
b27ce19c-e486-4b05-87d7-bf3a2baf679e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Mishra	9116697037	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Shreya Mishra", "contact_number": "9116697037"}	2026-02-01 10:33:59.078339	2026-02-01 10:34:37.337812
2306ca4a-2b31-482f-a77f-a95a71dbb45f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Yadav	9677229791	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Yadav", "contact_number": "9677229791"}	2026-02-01 10:33:59.078341	2026-02-01 10:34:37.337854
593501b3-244b-4714-8d3c-48c980528e6e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Kapoor	9423598812	At Risk	{"cohort": "At Risk", "customer_name": "Arnav Kapoor", "contact_number": "9423598812"}	2026-02-01 10:33:59.078344	2026-02-01 10:34:37.337896
91bb41ba-bfc3-4fa0-9573-937a7628de72	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Nair	9851882729	Champions	{"cohort": "Champions", "customer_name": "Myra Nair", "contact_number": "9851882729"}	2026-02-01 10:33:59.078348	2026-02-01 10:34:37.337939
be3d44dd-09a2-4adb-b7fc-31f594973078	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Deshmukh	7809889433	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Deshmukh", "contact_number": "7809889433"}	2026-02-01 10:33:59.078351	2026-02-01 10:34:37.337981
447c1975-58ea-4a44-a0af-25227e7d5194	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Sood	9930986712	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9930986712"}	2026-02-01 10:33:59.078354	2026-02-01 10:34:37.338023
a19823c9-426c-405e-a53d-d287cccb6def	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Iyer	9617400285	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Vihaan Iyer", "contact_number": "9617400285"}	2026-02-01 10:33:59.078357	2026-02-01 10:34:37.338066
fdaab3f7-c3e9-4a16-8ce0-c428e4ee53e6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Srinivasan	9123047419	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Srinivasan", "contact_number": "9123047419"}	2026-02-01 10:33:59.07836	2026-02-01 10:34:37.338108
058d95ca-08ce-4e6e-8f84-a2b275119bfc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Hegde	6657203516	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ananya Hegde", "contact_number": "6657203516"}	2026-02-01 10:33:59.078363	2026-02-01 10:34:37.338151
146dba79-5635-4f34-81c8-d3a3250d4ccd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Chaudhary	8055953469	Champions	{"cohort": "Champions", "customer_name": "Manav Chaudhary", "contact_number": "8055953469"}	2026-02-01 10:33:59.078365	2026-02-01 10:34:37.338193
27f579b8-aec0-4af2-b268-36306a1c1883	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Malhotra	8730261571	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Malhotra", "contact_number": "8730261571"}	2026-02-01 10:33:59.078368	2026-02-01 10:34:37.338235
10980d3b-695d-48f5-a95f-4a2135c133c2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Chaudhary	8581746680	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Varun Chaudhary", "contact_number": "8581746680"}	2026-02-01 10:33:59.078371	2026-02-01 10:34:37.338277
93541d9d-a070-4390-b8a9-7f20e411be53	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Naik	9027833384	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nikhil Naik", "contact_number": "9027833384"}	2026-02-01 10:33:59.078374	2026-02-01 10:34:37.338319
6b195d46-62de-4488-af2f-ecfcf3bf2d15	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Rao	6713783138	Need Attention	{"cohort": "Need Attention", "customer_name": "Aarohi Rao", "contact_number": "6713783138"}	2026-02-01 10:33:59.078376	2026-02-01 10:34:37.33836
fbcf4f99-c80a-4a7f-8100-6e049e5fde94	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Sharma	9839449587	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Trisha Sharma", "contact_number": "9839449587"}	2026-02-01 10:33:59.078379	2026-02-01 10:34:37.338401
53d0af11-1bae-48f1-8953-a1c8263cde18	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Kaur	6491213247	Promising	{"cohort": "Promising", "customer_name": "Mohit Kaur", "contact_number": "6491213247"}	2026-02-01 10:33:59.078382	2026-02-01 10:34:37.338442
905e7b3b-caed-4c4e-b12b-5be80cd5b92a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayaan Hegde	7630839299	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ayaan Hegde", "contact_number": "7630839299"}	2026-02-01 10:33:59.078385	2026-02-01 10:34:37.338483
2a60a3b2-6b31-4ba5-84c8-c5d6939b02c7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Shetty	6645710864	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Sakshi Shetty", "contact_number": "6645710864"}	2026-02-01 10:33:59.078387	2026-02-01 10:34:37.338526
f4942ec2-e3f0-4f92-89c8-03e4fc668e80	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Saha	7073356693	At Risk	{"cohort": "At Risk", "customer_name": "Parth Saha", "contact_number": "7073356693"}	2026-02-01 10:33:59.078391	2026-02-01 10:34:37.338567
6f365eed-7873-4066-8844-8b6ce1082577	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Narayan	6553621743	Need Attention	{"cohort": "Need Attention", "customer_name": "Dhruv Narayan", "contact_number": "6553621743"}	2026-02-01 10:33:59.078395	2026-02-01 10:34:37.338609
94b14454-270b-4bb6-96ed-7ca28507b090	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Iyer	6224929418	At Risk	{"cohort": "At Risk", "customer_name": "Rahul Iyer", "contact_number": "6224929418"}	2026-02-01 10:33:59.078398	2026-02-01 10:34:37.33865
a8ddea6b-72b6-4053-89c6-46117c6cc6eb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kiara Mishra	9179899675	Promising	{"cohort": "Promising", "customer_name": "Kiara Mishra", "contact_number": "9179899675"}	2026-02-01 10:33:59.0784	2026-02-01 10:34:37.338691
4ed7afb3-fe7c-4eff-a68f-178636411bf5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Pandey	8887967512	Promising	{"cohort": "Promising", "customer_name": "Ananya Pandey", "contact_number": "8887967512"}	2026-02-01 10:33:59.078403	2026-02-01 10:34:37.338733
3ae9d4b2-aec2-4f9d-9a42-f447944ee903	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarav Kaur	7243549180	New Customers	{"cohort": "New Customers", "customer_name": "Aarav Kaur", "contact_number": "7243549180"}	2026-02-01 10:33:59.078406	2026-02-01 10:34:37.338775
41714f26-c3f5-4576-b7fc-e9a92e96af70	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Kaur	9975780964	Champions	{"cohort": "Champions", "customer_name": "Sakshi Kaur", "contact_number": "9975780964"}	2026-02-01 10:33:59.078409	2026-02-01 10:34:37.338815
75122980-8e8c-489a-8a9f-6732a7809bd9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Joshi	8185571588	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aarohi Joshi", "contact_number": "8185571588"}	2026-02-01 10:33:59.078412	2026-02-01 10:34:37.338854
57757b09-754c-48ef-9c4b-27aa3e8f9932	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Khan	7319295201	Champions	{"cohort": "Champions", "customer_name": "Parth Khan", "contact_number": "7319295201"}	2026-02-01 10:33:59.078415	2026-02-01 10:34:37.338893
566fc78f-9674-4bc9-bfda-6c0aa6e3183e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Reddy	8135519167	Need Attention	{"cohort": "Need Attention", "customer_name": "Neha Reddy", "contact_number": "8135519167"}	2026-02-01 10:33:59.078418	2026-02-01 10:34:37.338933
de283995-1078-4639-a488-0033435f150d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Srinivasan	8858006567	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Trisha Srinivasan", "contact_number": "8858006567"}	2026-02-01 10:33:59.078421	2026-02-01 10:34:37.338972
10724570-68cd-4429-9492-77bb25b6c83b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Srinivasan	9608563284	Promising	{"cohort": "Promising", "customer_name": "Meera Srinivasan", "contact_number": "9608563284"}	2026-02-01 10:33:59.078424	2026-02-01 10:34:37.339011
fdb05b94-da0d-40d3-80d4-8813d3f9e747	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Chaudhary	9004426377	Hibernating	{"cohort": "Hibernating", "customer_name": "Neha Chaudhary", "contact_number": "9004426377"}	2026-02-01 10:33:59.078427	2026-02-01 10:34:37.339051
42833f83-0825-4ff8-bb41-5ac651c59432	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Menon	8913534220	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Diya Menon", "contact_number": "8913534220"}	2026-02-01 10:33:59.07843	2026-02-01 10:34:37.339089
4032dae7-a488-401c-9df4-cdb32a6f3134	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Siddharth Sood	8984998971	New Customers	{"cohort": "New Customers", "customer_name": "Siddharth Sood", "contact_number": "8984998971"}	2026-02-01 10:33:59.078455	2026-02-01 10:34:37.339129
91ec3535-417b-45d5-a791-5c9f633f05f1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Shetty	7454309592	At Risk	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "7454309592"}	2026-02-01 10:33:59.078478	2026-02-01 10:34:37.339168
c94928c9-0c0b-40c3-81ce-e0759a86db96	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Naik	8025862011	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dhruv Naik", "contact_number": "8025862011"}	2026-02-01 10:33:59.078497	2026-02-01 10:34:37.339208
6a802611-b1a3-4c0b-bdc9-168416e048e0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anvi Sharma	8773451505	Champions	{"cohort": "Champions", "customer_name": "Anvi Sharma", "contact_number": "8773451505"}	2026-02-01 10:33:59.078506	2026-02-01 10:34:37.339257
53737646-33c4-48be-92b7-393eca9d5cbe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Jain	8866103953	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Naina Jain", "contact_number": "8866103953"}	2026-02-01 10:33:59.07851	2026-02-01 10:34:37.339297
e77bb119-cda1-41ee-99f6-b1f636f32c29	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Riya Verma	7155013446	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Riya Verma", "contact_number": "7155013446"}	2026-02-01 10:33:59.078514	2026-02-01 10:34:37.339338
d0012e92-67e2-4276-8c97-651521bac86a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayaan Kapoor	7361972385	Hibernating	{"cohort": "Hibernating", "customer_name": "Ayaan Kapoor", "contact_number": "7361972385"}	2026-02-01 10:33:59.078517	2026-02-01 10:34:37.339377
0d143515-c7ee-4d1d-be3c-12dc85c9d5e6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Ghosh	8403143886	At Risk	{"cohort": "At Risk", "customer_name": "Sakshi Ghosh", "contact_number": "8403143886"}	2026-02-01 10:33:59.07852	2026-02-01 10:34:37.339416
a24998de-78c9-4c43-917a-5aa8ba0bbf99	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Mehta	9269520457	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Mehta", "contact_number": "9269520457"}	2026-02-01 10:33:59.078523	2026-02-01 10:34:37.339455
e848801d-330c-4ba5-8b15-9059448db9e7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Prasad	9160910316	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Saanvi Prasad", "contact_number": "9160910316"}	2026-02-01 10:33:59.078527	2026-02-01 10:34:37.3395
5d012e5d-f9e1-44e1-898a-d388c9cf9287	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Shah	9564877559	At Risk	{"cohort": "At Risk", "customer_name": "Sai Shah", "contact_number": "9564877559"}	2026-02-01 10:33:59.078529	2026-02-01 10:34:37.33954
dbd923b7-b20a-4182-a7fc-2694032f9c6f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Deshmukh	9531933776	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dev Deshmukh", "contact_number": "9531933776"}	2026-02-01 10:33:59.078532	2026-02-01 10:34:37.339585
56ae0c50-8924-4c2b-a63e-b89020cf50db	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rashmi Patel	8612529222	Hibernating	{"cohort": "Hibernating", "customer_name": "Rashmi Patel", "contact_number": "8612529222"}	2026-02-01 10:33:59.078535	2026-02-01 10:34:37.339636
e19b8910-c31a-4a9a-b701-d8b9155c3eeb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Shetty	9339721639	Promising	{"cohort": "Promising", "customer_name": "Parth Shetty", "contact_number": "9339721639"}	2026-02-01 10:33:59.078538	2026-02-01 10:34:37.339677
9018bb2d-5382-4fce-8143-162fbe27da90	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Nair	8982273424	At Risk	{"cohort": "At Risk", "customer_name": "Dhruv Nair", "contact_number": "8982273424"}	2026-02-01 10:33:59.078542	2026-02-01 10:34:37.339717
ff51c576-a1a8-46ad-b006-1ba16adcc61f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Krishna Gowda	7825217209	Hibernating	{"cohort": "Hibernating", "customer_name": "Krishna Gowda", "contact_number": "7825217209"}	2026-02-01 10:33:59.078565	2026-02-01 10:34:37.339757
49a3ad6a-6755-43a9-a74c-0dc12e95f47f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Priya Rao	7604717059	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Priya Rao", "contact_number": "7604717059"}	2026-02-01 10:33:59.078586	2026-02-01 10:34:37.339797
52f97884-2f55-47b7-8799-8657e15dee4f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Bose	9684672207	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Bose", "contact_number": "9684672207"}	2026-02-01 10:33:59.07859	2026-02-01 10:34:37.339836
fe3852ab-5497-4d2c-b8f7-ca3bc2f45470	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Isha Chaudhary	7579918199	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Isha Chaudhary", "contact_number": "7579918199"}	2026-02-01 10:33:59.078593	2026-02-01 10:34:37.339876
92e42cda-e23c-4883-a0f9-4d8fbb22d8ed	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Roy	9717820269	New Customers	{"cohort": "New Customers", "customer_name": "Manav Roy", "contact_number": "9717820269"}	2026-02-01 10:33:59.078596	2026-02-01 10:34:37.339915
790afa28-a703-4094-a641-f5a10dcb972d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Shetty	8295498411	At Risk	{"cohort": "At Risk", "customer_name": "Rupali Shetty", "contact_number": "8295498411"}	2026-02-01 10:33:59.078599	2026-02-01 10:34:37.339954
eab875d6-6faa-48c7-be6d-df9c5c5fc361	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Kaur	7767032616	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Parth Kaur", "contact_number": "7767032616"}	2026-02-01 10:33:59.078602	2026-02-01 10:34:37.339994
e195ae8f-8d98-4e3e-b595-8d6447c08e01	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Das	9850611322	Champions	{"cohort": "Champions", "customer_name": "Harsh Das", "contact_number": "9850611322"}	2026-02-01 10:33:59.078605	2026-02-01 10:34:37.340033
fc0c3c9e-ce3f-4aed-a1a2-34b8e4faf081	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Ghosh	7423552326	Promising	{"cohort": "Promising", "customer_name": "Ritvik Ghosh", "contact_number": "7423552326"}	2026-02-01 10:33:59.078608	2026-02-01 10:34:37.340074
dd499e4a-7eae-49bc-ab5a-4eafa4c53fb2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Gowda	9345873192	New Customers	{"cohort": "New Customers", "customer_name": "Arnav Gowda", "contact_number": "9345873192"}	2026-02-01 10:33:59.078611	2026-02-01 10:34:37.340114
5dff1d27-22d9-430a-aeda-6ca4850b817e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Kapoor	7211764545	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aman Kapoor", "contact_number": "7211764545"}	2026-02-01 10:33:59.078614	2026-02-01 10:34:37.340153
243e1b4b-b061-4a3e-a5d3-300c4c1bedf4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Naik	7765755391	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Yash Naik", "contact_number": "7765755391"}	2026-02-01 10:33:59.078617	2026-02-01 10:34:37.340192
15bd0c04-6f09-4b15-a20e-1f727bcaa056	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Iyer	7513512505	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Yash Iyer", "contact_number": "7513512505"}	2026-02-01 10:33:59.07862	2026-02-01 10:34:37.340231
36042911-5fb2-4717-825e-6438ae3eb20d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Chatterjee	6454048738	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Chatterjee", "contact_number": "6454048738"}	2026-02-01 10:33:59.078623	2026-02-01 10:34:37.340271
9a8c6514-9278-4701-8e31-ea17824ae60e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Bansal	7503099090	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Bansal", "contact_number": "7503099090"}	2026-02-01 10:33:59.078626	2026-02-01 10:34:37.34031
9341970b-9fe7-4746-94d6-61e47acb673c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Yadav	9116793849	Promising	{"cohort": "Promising", "customer_name": "Vivaan Yadav", "contact_number": "9116793849"}	2026-02-01 10:33:59.078629	2026-02-01 10:34:37.340375
796310fd-edf6-4805-99ed-70f6350670a0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pooja Chatterjee	9366563155	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Pooja Chatterjee", "contact_number": "9366563155"}	2026-02-01 10:33:59.078631	2026-02-01 10:34:37.340416
59c08a41-cbc3-42c6-82af-d3609cbdd52e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Chatterjee	7879474324	New Customers	{"cohort": "New Customers", "customer_name": "Shreya Chatterjee", "contact_number": "7879474324"}	2026-02-01 10:33:59.078634	2026-02-01 10:34:37.340456
89dca330-a4cc-431d-a607-badd6f225cd0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarav Patel	7297184780	Lost	{"cohort": "Lost", "customer_name": "Aarav Patel", "contact_number": "7297184780"}	2026-02-01 10:33:59.078637	2026-02-01 10:34:37.340495
036c5159-79c0-49b4-8ec3-d3a673be64d4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Srinivasan	7054682045	Lost	{"cohort": "Lost", "customer_name": "Ritvik Srinivasan", "contact_number": "7054682045"}	2026-02-01 10:33:59.07864	2026-02-01 10:34:37.340534
fcc66b56-e1f0-454f-8344-4682181e6fd5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Chatterjee	6192955782	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Chatterjee", "contact_number": "6192955782"}	2026-02-01 10:33:59.078643	2026-02-01 10:34:37.34058
78977f6c-f874-4a80-92b9-e2c5456ad977	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Gupta	7954255716	Promising	{"cohort": "Promising", "customer_name": "Arjun Gupta", "contact_number": "7954255716"}	2026-02-01 10:33:59.078646	2026-02-01 10:34:37.340619
bfb4ae32-62b0-455b-a501-75748b0606b4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Bansal	9036356421	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Trisha Bansal", "contact_number": "9036356421"}	2026-02-01 10:33:59.078648	2026-02-01 10:34:37.340659
a49699b5-c21a-4362-aa47-eb3afc6006c0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Joshi	9228140445	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Arjun Joshi", "contact_number": "9228140445"}	2026-02-01 10:33:59.078651	2026-02-01 10:34:37.340698
aaf91baa-6ded-40a4-bdf4-26a158fb009b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Saha	9226980712	Champions	{"cohort": "Champions", "customer_name": "Saanvi Saha", "contact_number": "9226980712"}	2026-02-01 10:33:59.078654	2026-02-01 10:34:37.340737
c0e7ed36-f159-41b1-8629-69e6cd5b26f5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Deshmukh	6817754839	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Deshmukh", "contact_number": "6817754839"}	2026-02-01 10:33:59.078657	2026-02-01 10:34:37.340777
fd4543c8-f696-47ff-a50e-89bafe3fcbe8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Shetty	6217779673	Promising	{"cohort": "Promising", "customer_name": "Ira Shetty", "contact_number": "6217779673"}	2026-02-01 10:33:59.078659	2026-02-01 10:34:37.340817
38180add-491b-4636-9d9b-1c6cbb1048ce	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Krishna Kaur	7573532540	Champions	{"cohort": "Champions", "customer_name": "Krishna Kaur", "contact_number": "7573532540"}	2026-02-01 10:33:59.078662	2026-02-01 10:34:37.340856
c4ffa5ee-fe40-4c98-92e0-1646497bb101	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Prasad	9732308705	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rupali Prasad", "contact_number": "9732308705"}	2026-02-01 10:33:59.078666	2026-02-01 10:34:37.340896
a03f0796-13b1-4af0-a322-9c19078f2f00	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kavya Kulkarni	9212525937	Hibernating	{"cohort": "Hibernating", "customer_name": "Kavya Kulkarni", "contact_number": "9212525937"}	2026-02-01 10:33:59.078668	2026-02-01 10:34:37.340936
63af1b29-be4e-4ddb-a040-b17e765341ef	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Kulkarni	9964171749	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Saanvi Kulkarni", "contact_number": "9964171749"}	2026-02-01 10:33:59.078671	2026-02-01 10:34:37.340976
40e922fc-0a71-4122-81b4-3e58981dd8fe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Tripathi	6580800160	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Avni Tripathi", "contact_number": "6580800160"}	2026-02-01 10:33:59.078674	2026-02-01 10:34:37.341014
74239a84-c83d-4a76-9cc2-e6391f81d2b8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Reddy	7053666440	Promising	{"cohort": "Promising", "customer_name": "Diya Reddy", "contact_number": "7053666440"}	2026-02-01 10:33:59.078677	2026-02-01 10:34:37.341053
0123561c-ce3e-473d-89bc-daae95c06e84	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Gowda	9052908689	Lost	{"cohort": "Lost", "customer_name": "Reyansh Gowda", "contact_number": "9052908689"}	2026-02-01 10:33:59.07868	2026-02-01 10:34:37.341092
552542fa-a651-4ff8-a9bd-cdb74620cefe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Aggarwal	6952623709	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Manav Aggarwal", "contact_number": "6952623709"}	2026-02-01 10:33:59.078683	2026-02-01 10:34:37.341131
87525692-5b78-460a-adb7-f251a4ef9a85	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Tripathi	9592686870	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Tripathi", "contact_number": "9592686870"}	2026-02-01 10:33:59.078685	2026-02-01 10:34:37.34117
2927e320-08e0-45fa-9f83-35f72e6f1921	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Kaur	9346708639	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Kaur", "contact_number": "9346708639"}	2026-02-01 10:33:59.078688	2026-02-01 10:34:37.34121
23b4c5d8-b46c-491a-bf86-9fc144340f47	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Hegde	6892965296	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Vihaan Hegde", "contact_number": "6892965296"}	2026-02-01 10:33:59.078691	2026-02-01 10:34:37.34125
1830fb8d-f6c7-42f9-af3f-6f8ae161abf2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Narayan	8850939577	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aman Narayan", "contact_number": "8850939577"}	2026-02-01 10:33:59.078694	2026-02-01 10:34:37.341289
974e7930-21cb-44a6-9410-ee67794f9b65	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Mehta	9925586537	New Customers	{"cohort": "New Customers", "customer_name": "Reyansh Mehta", "contact_number": "9925586537"}	2026-02-01 10:33:59.078697	2026-02-01 10:34:37.341328
8e01fab2-131f-4688-a790-80cb5ceb611a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Kaur	6590483793	Need Attention	{"cohort": "Need Attention", "customer_name": "Arnav Kaur", "contact_number": "6590483793"}	2026-02-01 10:33:59.0787	2026-02-01 10:34:37.341367
35b49f91-e451-4332-8b9c-9f47ecd9c1e7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Reddy	8029439466	Need Attention	{"cohort": "Need Attention", "customer_name": "Rahul Reddy", "contact_number": "8029439466"}	2026-02-01 10:33:59.078703	2026-02-01 10:34:37.341406
d6faf97b-e71e-44b9-b69f-2352506b7dc6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Das	6722023713	Promising	{"cohort": "Promising", "customer_name": "Saanvi Das", "contact_number": "6722023713"}	2026-02-01 10:33:59.078705	2026-02-01 10:34:37.341445
c4e33453-745e-43b3-8beb-78d31f134557	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Shetty	8103321145	Champions	{"cohort": "Champions", "customer_name": "Diya Shetty", "contact_number": "8103321145"}	2026-02-01 10:33:59.078708	2026-02-01 10:34:37.341484
7b19644d-2ac1-425f-99b0-5a59571571a1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Nair	9105578047	At Risk	{"cohort": "At Risk", "customer_name": "Yash Nair", "contact_number": "9105578047"}	2026-02-01 10:33:59.078711	2026-02-01 10:34:37.341523
e729703b-0fb3-4936-8125-b9d039145ce3	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Khan	7513134044	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Manav Khan", "contact_number": "7513134044"}	2026-02-01 10:33:59.078714	2026-02-01 10:34:37.341561
628fdf5f-cd30-4cb1-94c9-8e9a30169cc6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Pandey	9739746410	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Pandey", "contact_number": "9739746410"}	2026-02-01 10:33:59.078716	2026-02-01 10:34:37.3416
4810fc14-ff0a-4ff0-abb6-f1f4bd74c13d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Patel	9368338891	Champions	{"cohort": "Champions", "customer_name": "Saanvi Patel", "contact_number": "9368338891"}	2026-02-01 10:33:59.07873	2026-02-01 10:34:37.341639
99b19b5a-9ef6-45ab-9361-d6d403a99603	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Rao	8664133769	Need Attention	{"cohort": "Need Attention", "customer_name": "Yash Rao", "contact_number": "8664133769"}	2026-02-01 10:33:59.078741	2026-02-01 10:34:37.341678
5cc12023-520f-40e1-99e7-45eb8f75080f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Mehta	7327391917	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Reyansh Mehta", "contact_number": "7327391917"}	2026-02-01 10:33:59.078747	2026-02-01 10:34:37.341717
ccd1ff1c-e080-42c2-b413-bf99f3d4db57	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Shetty	6947426874	Champions	{"cohort": "Champions", "customer_name": "Aman Shetty", "contact_number": "6947426874"}	2026-02-01 10:33:59.078756	2026-02-01 10:34:37.341756
f2bc26fa-89ff-4f75-b87a-f6664e4fcbb2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Sharma	9132143455	Promising	{"cohort": "Promising", "customer_name": "Mansi Sharma", "contact_number": "9132143455"}	2026-02-01 10:33:59.078763	2026-02-01 10:34:37.341795
93e8e8a2-a963-49f3-8a0f-68aeb0719148	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Sood	9573856076	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9573856076"}	2026-02-01 10:33:59.078778	2026-02-01 10:34:37.341834
29ed5ed7-1775-4fb5-8530-cc9ec6d51dfb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Mukherjee	8165669371	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Mukherjee", "contact_number": "8165669371"}	2026-02-01 10:33:59.078784	2026-02-01 10:34:37.341874
3771ecba-d095-4cf7-8381-33e251696fec	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Tripathi	6255554375	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Tripathi", "contact_number": "6255554375"}	2026-02-01 10:33:59.078787	2026-02-01 10:34:37.341912
8eff842e-4bfb-4c4e-8396-d8b90e3bfcfa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Riya Kulkarni	7301491913	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Riya Kulkarni", "contact_number": "7301491913"}	2026-02-01 10:33:59.07879	2026-02-01 10:34:37.341952
5f821c4b-2c9a-43f6-8f8a-93a4a3d2ec55	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Saxena	9753074007	New Customers	{"cohort": "New Customers", "customer_name": "Ira Saxena", "contact_number": "9753074007"}	2026-02-01 10:33:59.078793	2026-02-01 10:34:37.341992
d598329a-47ca-4ef4-a100-7e08ed2b89fc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Mehta	6866192115	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Mehta", "contact_number": "6866192115"}	2026-02-01 10:33:59.078796	2026-02-01 10:34:37.342031
69add7ec-9a99-4dc8-bb0f-8a1cbb898757	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Malhotra	9241640615	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Malhotra", "contact_number": "9241640615"}	2026-02-01 10:33:59.078799	2026-02-01 10:34:37.34207
6543db8e-2b3b-4d8e-9e44-8fe217960e4b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarav Malhotra	9022775753	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aarav Malhotra", "contact_number": "9022775753"}	2026-02-01 10:33:59.078802	2026-02-01 10:34:37.342109
dba78c9f-27c1-4710-a6a2-162da08a7889	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Pandey	7428565653	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aarohi Pandey", "contact_number": "7428565653"}	2026-02-01 10:33:59.078805	2026-02-01 10:34:37.342157
465aa828-0317-478b-afd8-23c27a585400	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kiara Mishra	9687260113	Hibernating	{"cohort": "Hibernating", "customer_name": "Kiara Mishra", "contact_number": "9687260113"}	2026-02-01 10:33:59.078807	2026-02-01 10:34:37.342196
c277a065-b8ad-4915-81eb-012e4f8c0a77	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Kaur	7313554459	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Harsh Kaur", "contact_number": "7313554459"}	2026-02-01 10:33:59.07881	2026-02-01 10:34:37.342235
52600453-9396-4a0b-aaa9-a5295ef414f4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Rao	7541340301	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Tanvi Rao", "contact_number": "7541340301"}	2026-02-01 10:33:59.078813	2026-02-01 10:34:37.342274
d2254267-6b81-4659-a418-11b4a75920e9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Arora	9954648400	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Arora", "contact_number": "9954648400"}	2026-02-01 10:33:59.078816	2026-02-01 10:34:37.342313
efba8a0d-e407-47b3-bb7c-84a602a7b43e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Riya Menon	7225147751	At Risk	{"cohort": "At Risk", "customer_name": "Riya Menon", "contact_number": "7225147751"}	2026-02-01 10:33:59.078819	2026-02-01 10:34:37.342352
735049a3-e795-4edf-9d85-f44d5f14492b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Banerjee	6259577424	Promising	{"cohort": "Promising", "customer_name": "Diya Banerjee", "contact_number": "6259577424"}	2026-02-01 10:33:59.078822	2026-02-01 10:34:37.342391
886582ad-c1bf-41a9-91d8-d118a10b3fc2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Mehta	7294384972	Promising	{"cohort": "Promising", "customer_name": "Ira Mehta", "contact_number": "7294384972"}	2026-02-01 10:33:59.078825	2026-02-01 10:34:37.34243
b9ea7820-fb0c-4bd6-b442-4f9e3b3291c2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Gill	8864678855	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Shreya Gill", "contact_number": "8864678855"}	2026-02-01 10:33:59.078827	2026-02-01 10:34:37.34247
ac4f0d60-b02c-45a3-a3d5-2f22a176d9c4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sneha Mehta	7372289609	Champions	{"cohort": "Champions", "customer_name": "Sneha Mehta", "contact_number": "7372289609"}	2026-02-01 10:33:59.07883	2026-02-01 10:34:37.342509
072f2868-0da0-4505-9831-a215c620a3d2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Jain	9998182787	Hibernating	{"cohort": "Hibernating", "customer_name": "Ayush Jain", "contact_number": "9998182787"}	2026-02-01 10:33:59.078834	2026-02-01 10:34:37.342548
76f7fb8f-3599-43fc-a21f-0991becf7df8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Mehta	9452446805	Hibernating	{"cohort": "Hibernating", "customer_name": "Vihaan Mehta", "contact_number": "9452446805"}	2026-02-01 10:33:59.078836	2026-02-01 10:34:37.342587
9ed200de-fa25-4c55-bf7a-be0ae743126b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Kulkarni	8684458809	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Kulkarni", "contact_number": "8684458809"}	2026-02-01 10:33:59.078839	2026-02-01 10:34:37.342626
52942a3e-b655-4738-991b-09ca9d269dc9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Naik	8873984325	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Naik", "contact_number": "8873984325"}	2026-02-01 10:33:59.078842	2026-02-01 10:34:37.342665
9cbc8753-0091-40f4-9147-3a4d73b739bd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Mehta	7543600741	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Ananya Mehta", "contact_number": "7543600741"}	2026-02-01 10:33:59.078845	2026-02-01 10:34:37.342708
a8067357-1ace-4a51-9f15-6a40d506579b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Shah	7409261619	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Shah", "contact_number": "7409261619"}	2026-02-01 10:33:59.078848	2026-02-01 10:34:37.342747
33c448b5-e422-4f45-9f00-474f8aa264c2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Khan	8030660677	Hibernating	{"cohort": "Hibernating", "customer_name": "Pallavi Khan", "contact_number": "8030660677"}	2026-02-01 10:33:59.07885	2026-02-01 10:34:37.342787
14a4bd65-775a-40ed-8f50-2cb79c941613	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Chaudhary	9670412606	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Arjun Chaudhary", "contact_number": "9670412606"}	2026-02-01 10:33:59.078853	2026-02-01 10:34:37.342827
8ac2d35e-5acc-4da2-8d9d-fdbf8a6f1d18	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Hegde	6941037138	At Risk	{"cohort": "At Risk", "customer_name": "Arjun Hegde", "contact_number": "6941037138"}	2026-02-01 10:33:59.078856	2026-02-01 10:34:37.342866
c35327e6-eaa4-4427-b157-b6bec30d0bf2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Mukherjee	7388660561	Need Attention	{"cohort": "Need Attention", "customer_name": "Trisha Mukherjee", "contact_number": "7388660561"}	2026-02-01 10:33:59.078859	2026-02-01 10:34:37.342906
aec41281-5ea2-4315-84bf-e9f179bd644b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Iyer	8761468017	Champions	{"cohort": "Champions", "customer_name": "Arnav Iyer", "contact_number": "8761468017"}	2026-02-01 10:33:59.078862	2026-02-01 10:34:37.342945
e3f9146b-65cd-4400-a1e1-cc6a94231d8f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Prasad	9347262672	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Sakshi Prasad", "contact_number": "9347262672"}	2026-02-01 10:33:59.078865	2026-02-01 10:34:37.342985
88d5e969-4ed5-4c25-b4b4-9f7be485dfd4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Yadav	6863557208	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Yadav", "contact_number": "6863557208"}	2026-02-01 10:33:59.078868	2026-02-01 10:34:37.343024
0eabacbd-254a-4e08-80bc-3c04f38131c4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Gupta	7414559991	Need Attention	{"cohort": "Need Attention", "customer_name": "Naina Gupta", "contact_number": "7414559991"}	2026-02-01 10:33:59.07887	2026-02-01 10:34:37.343063
1fb8a659-4d17-486f-b624-f99112a8464e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Shah	9367970020	Champions	{"cohort": "Champions", "customer_name": "Aditi Shah", "contact_number": "9367970020"}	2026-02-01 10:33:59.078873	2026-02-01 10:34:37.343102
0bb37f65-7347-4dbc-a449-77cc13433fcc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kabir Gowda	6932774465	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kabir Gowda", "contact_number": "6932774465"}	2026-02-01 10:33:59.078876	2026-02-01 10:34:37.343165
7b2698fe-f53a-4ae1-b3c4-f0e3269a87b6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Prasad	7235285368	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Shreya Prasad", "contact_number": "7235285368"}	2026-02-01 10:33:59.078879	2026-02-01 10:34:37.343205
84da1c38-2cea-4255-8636-01c91566688d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Isha Jain	6349229160	Champions	{"cohort": "Champions", "customer_name": "Isha Jain", "contact_number": "6349229160"}	2026-02-01 10:33:59.078881	2026-02-01 10:34:37.343245
200e58bd-59ad-4f37-9a44-8059a2f70163	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Saha	8051834242	Lost	{"cohort": "Lost", "customer_name": "Manav Saha", "contact_number": "8051834242"}	2026-02-01 10:33:59.07901	2026-02-01 10:34:37.343284
08cf68ba-a6be-4aaa-8de5-6a0b6a7f42c6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Bose	7177195771	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Rupali Bose", "contact_number": "7177195771"}	2026-02-01 10:33:59.078884	2026-02-01 10:34:37.343323
188f77ab-4741-44bf-9f67-6a0f8c35291a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Gowda	7787183452	Promising	{"cohort": "Promising", "customer_name": "Ira Gowda", "contact_number": "7787183452"}	2026-02-01 10:33:59.078887	2026-02-01 10:34:37.343363
a5e2338a-1e16-450f-959f-bd762d95e4f1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Jain	6450811786	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ritvik Jain", "contact_number": "6450811786"}	2026-02-01 10:33:59.07889	2026-02-01 10:34:37.343402
1153c2c4-ed08-4810-a2f8-ee07a22d363b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Bose	6250824319	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Bose", "contact_number": "6250824319"}	2026-02-01 10:33:59.078893	2026-02-01 10:34:37.34344
ddeff5af-3083-4d60-9eb1-8f1a35dbe100	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Nair	6597434720	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arnav Nair", "contact_number": "6597434720"}	2026-02-01 10:33:59.078895	2026-02-01 10:34:37.343479
518becf0-3c4d-417e-8224-bc1b005ac5c5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Narayan	8160250488	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Gaurav Narayan", "contact_number": "8160250488"}	2026-02-01 10:33:59.078898	2026-02-01 10:34:37.343523
9a36f815-eff6-4a2c-b16d-69ef8154cfbe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Pandey	8350253645	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Meera Pandey", "contact_number": "8350253645"}	2026-02-01 10:33:59.078901	2026-02-01 10:34:37.343562
32a84412-f0a0-4f52-8f47-c5b4d9d579d3	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Sood	9977571905	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rohan Sood", "contact_number": "9977571905"}	2026-02-01 10:33:59.078904	2026-02-01 10:34:37.343601
b5b77b0e-cdc7-43b8-91e3-bf41addcf740	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Patel	6906871524	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Rupali Patel", "contact_number": "6906871524"}	2026-02-01 10:33:59.078906	2026-02-01 10:34:37.34364
f939a4e8-0741-49df-99c3-1d991e5d25c4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarav Pandey	6912028484	Need Attention	{"cohort": "Need Attention", "customer_name": "Aarav Pandey", "contact_number": "6912028484"}	2026-02-01 10:33:59.078909	2026-02-01 10:34:37.343679
2f4a66a7-e7c9-4417-bc34-8df8afb07f21	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Prasad	6556350612	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "6556350612"}	2026-02-01 10:33:59.078912	2026-02-01 10:34:37.343718
c608ea0c-1313-446a-9c54-aeaefe3086a1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Patel	8938342917	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Patel", "contact_number": "8938342917"}	2026-02-01 10:33:59.078915	2026-02-01 10:34:37.343758
c22d9168-94de-4852-b913-2b97c79bff97	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sneha Roy	6114459232	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Roy", "contact_number": "6114459232"}	2026-02-01 10:33:59.078918	2026-02-01 10:34:37.343798
622aff62-3455-4a75-917d-1f65a17aef1d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Bose	6083762817	Champions	{"cohort": "Champions", "customer_name": "Neha Bose", "contact_number": "6083762817"}	2026-02-01 10:33:59.07892	2026-02-01 10:34:37.343837
49a18999-fea5-40b3-bc56-c681c87f7bbe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Krishna Aggarwal	8302819855	New Customers	{"cohort": "New Customers", "customer_name": "Krishna Aggarwal", "contact_number": "8302819855"}	2026-02-01 10:33:59.078923	2026-02-01 10:34:37.343887
71864d48-a7bd-41d5-8aa8-56142b7d93a0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Patel	6481089183	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Patel", "contact_number": "6481089183"}	2026-02-01 10:33:59.078926	2026-02-01 10:34:37.343926
5c52778a-f4d7-4cf5-b268-1d3f70f751cc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Mukherjee	6528009419	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Mukherjee", "contact_number": "6528009419"}	2026-02-01 10:33:59.078929	2026-02-01 10:34:37.343965
6fec3275-e2cb-47ba-ac6f-ee086d9f0645	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Siddharth Banerjee	8190947434	Lost	{"cohort": "Lost", "customer_name": "Siddharth Banerjee", "contact_number": "8190947434"}	2026-02-01 10:33:59.078932	2026-02-01 10:34:37.344004
9c8c21b4-bb0b-43d6-af5f-2e9e8affa9aa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Tiwari	8212806224	New Customers	{"cohort": "New Customers", "customer_name": "Ananya Tiwari", "contact_number": "8212806224"}	2026-02-01 10:33:59.078935	2026-02-01 10:34:37.344043
f92d1d62-4660-4d60-966d-0f2a8dc65b21	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Shetty	9021185687	Hibernating	{"cohort": "Hibernating", "customer_name": "Mansi Shetty", "contact_number": "9021185687"}	2026-02-01 10:33:59.078938	2026-02-01 10:34:37.344082
c3efd3a1-8486-4431-b0e8-3735b4e717b5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Ghosh	9735495313	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Ghosh", "contact_number": "9735495313"}	2026-02-01 10:33:59.078941	2026-02-01 10:34:37.344122
8ba50942-b559-40fd-b84e-2914edebf5a4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Narayan	7082843521	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Narayan", "contact_number": "7082843521"}	2026-02-01 10:33:59.078943	2026-02-01 10:34:37.344161
6e2305ac-80c7-429f-bf28-cfa2bf36e6d8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Isha Sharma	7628909287	Promising	{"cohort": "Promising", "customer_name": "Isha Sharma", "contact_number": "7628909287"}	2026-02-01 10:33:59.078946	2026-02-01 10:34:37.344201
96409841-ce73-44b1-8966-8a362e4973a1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Rao	8991237357	Need Attention	{"cohort": "Need Attention", "customer_name": "Gaurav Rao", "contact_number": "8991237357"}	2026-02-01 10:33:59.078949	2026-02-01 10:34:37.34424
e97c4f58-3d8e-4040-b3aa-220f9f0461ed	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Gowda	8955198434	Promising	{"cohort": "Promising", "customer_name": "Meera Gowda", "contact_number": "8955198434"}	2026-02-01 10:33:59.07897	2026-02-01 10:34:37.34428
51c91141-5078-40ea-b105-6af118a4e21f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Nair	6060436831	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Reyansh Nair", "contact_number": "6060436831"}	2026-02-01 10:33:59.078974	2026-02-01 10:34:37.34432
cf237e73-a9ae-402e-9006-6917937327d4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Iyer	8017115307	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aarohi Iyer", "contact_number": "8017115307"}	2026-02-01 10:33:59.078977	2026-02-01 10:34:37.344359
d3d03998-c442-4c31-9800-d61dac6cf7bd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Reddy	9533974643	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Reddy", "contact_number": "9533974643"}	2026-02-01 10:33:59.07898	2026-02-01 10:34:37.344398
2d30dc85-3d5b-479a-9452-d9047b425eca	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Rao	8251361799	Champions	{"cohort": "Champions", "customer_name": "Ayush Rao", "contact_number": "8251361799"}	2026-02-01 10:33:59.078983	2026-02-01 10:34:37.344441
a207c54e-4e46-4b5a-9311-75ed8bd0882c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Saha	9875138661	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Saha", "contact_number": "9875138661"}	2026-02-01 10:33:59.078985	2026-02-01 10:34:37.34448
fc0a8086-de50-4bc5-98bb-20672035774e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kiara Chaudhary	9172918076	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Kiara Chaudhary", "contact_number": "9172918076"}	2026-02-01 10:33:59.078988	2026-02-01 10:34:37.344587
2e428c22-eef4-4d4b-9390-eba1caf0c3bd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Arora	8422021037	Hibernating	{"cohort": "Hibernating", "customer_name": "Ira Arora", "contact_number": "8422021037"}	2026-02-01 10:33:59.078991	2026-02-01 10:34:37.344649
9dc70c1c-9598-4dd0-9779-530c1931c5d0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Roy	7843514866	Lost	{"cohort": "Lost", "customer_name": "Rahul Roy", "contact_number": "7843514866"}	2026-02-01 10:33:59.078994	2026-02-01 10:34:37.344697
32fdfa94-efc8-4c41-8d1e-92781a69f0a0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Srinivasan	7470021381	Hibernating	{"cohort": "Hibernating", "customer_name": "Mohit Srinivasan", "contact_number": "7470021381"}	2026-02-01 10:33:59.078996	2026-02-01 10:34:37.344741
09ebcc0d-1544-41c3-bba2-ed4e480bfb05	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Bose	6580564091	New Customers	{"cohort": "New Customers", "customer_name": "Pallavi Bose", "contact_number": "6580564091"}	2026-02-01 10:33:59.078999	2026-02-01 10:34:37.344784
797e9ea2-6710-444e-83c3-ffa9431251a7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Deshmukh	9112167722	Champions	{"cohort": "Champions", "customer_name": "Neha Deshmukh", "contact_number": "9112167722"}	2026-02-01 10:33:59.079002	2026-02-01 10:34:37.344827
bd3d3d1b-944b-458a-8223-1aeb3647e678	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Mehta	7035400086	Hibernating	{"cohort": "Hibernating", "customer_name": "Aarohi Mehta", "contact_number": "7035400086"}	2026-02-01 10:33:59.079005	2026-02-01 10:34:37.34487
762d9385-d4db-4317-9458-449364b26ce5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Srinivasan	9101208334	New Customers	{"cohort": "New Customers", "customer_name": "Sai Srinivasan", "contact_number": "9101208334"}	2026-02-01 10:33:59.079008	2026-02-01 10:34:37.344913
ad60ae45-5468-4f15-9a6e-4bd10ccc5cc5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Bajaj	6884584840	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Rahul Bajaj", "contact_number": "6884584840"}	2026-02-01 10:33:59.079016	2026-02-01 10:34:37.344956
29fa7350-0369-4771-9428-a266b52f3630	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Krishna Srinivasan	6598661719	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Krishna Srinivasan", "contact_number": "6598661719"}	2026-02-01 10:33:59.079018	2026-02-01 10:34:37.344997
22c64bd8-0ee9-4bdc-a198-8dd0e2173235	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Singh	7814949682	New Customers	{"cohort": "New Customers", "customer_name": "Aarohi Singh", "contact_number": "7814949682"}	2026-02-01 10:33:59.079021	2026-02-01 10:34:37.345039
fb005759-e9d8-4dd0-9662-c72a5553a579	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Tiwari	6055859075	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ayush Tiwari", "contact_number": "6055859075"}	2026-02-01 10:33:59.079024	2026-02-01 10:34:37.34508
1ce457b6-abf0-4947-8926-fc5a0df2b22d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pooja Arora	9115591177	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Pooja Arora", "contact_number": "9115591177"}	2026-02-01 10:33:59.079027	2026-02-01 10:34:37.345121
e12912be-cf19-44e6-8398-b5f5cf4439d1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Rao	8826541466	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Manav Rao", "contact_number": "8826541466"}	2026-02-01 10:33:59.07903	2026-02-01 10:34:37.345163
af58fb50-52cb-4379-8957-ecfcb02365cf	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarav Iyer	9083279808	Promising	{"cohort": "Promising", "customer_name": "Aarav Iyer", "contact_number": "9083279808"}	2026-02-01 10:33:59.079032	2026-02-01 10:34:37.345205
55432465-34ae-4736-a429-a1b050d42a56	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Bhat	8388692377	Hibernating	{"cohort": "Hibernating", "customer_name": "Arjun Bhat", "contact_number": "8388692377"}	2026-02-01 10:33:59.079035	2026-02-01 10:34:37.345246
954c7d21-bd61-4bce-ae73-3c794e314dbf	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Menon	8246128778	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Menon", "contact_number": "8246128778"}	2026-02-01 10:33:59.079038	2026-02-01 10:34:37.345288
96f98472-50d2-4f78-a2f3-ba480f669aeb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sneha Gupta	6513518801	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Gupta", "contact_number": "6513518801"}	2026-02-01 10:33:59.079041	2026-02-01 10:34:37.345329
3862fa18-173e-4e3c-8cec-a69ac9c4eb3d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Kapoor	7824972856	Champions	{"cohort": "Champions", "customer_name": "Mansi Kapoor", "contact_number": "7824972856"}	2026-02-01 10:33:59.079044	2026-02-01 10:34:37.34537
4132e305-ebdd-4458-a1f7-c90096f2de83	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Rao	6624494538	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Rao", "contact_number": "6624494538"}	2026-02-01 10:33:59.079046	2026-02-01 10:34:37.345411
63d0e5e0-5d52-42c1-9fc3-7a6116fd85aa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Mishra	8762315986	Lost	{"cohort": "Lost", "customer_name": "Ishaan Mishra", "contact_number": "8762315986"}	2026-02-01 10:33:59.079049	2026-02-01 10:34:37.345452
d7c3fb1b-2e79-40ce-aed5-dadb189ecfb7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Krishna Gupta	7240770966	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Krishna Gupta", "contact_number": "7240770966"}	2026-02-01 10:33:59.079052	2026-02-01 10:34:37.345492
4bb5b94c-bec3-4860-a9ae-868144dc52ae	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Kapoor	6269772884	Promising	{"cohort": "Promising", "customer_name": "Meera Kapoor", "contact_number": "6269772884"}	2026-02-01 10:33:59.079055	2026-02-01 10:34:37.345533
61782e3f-1c0b-4d08-996c-186f9cdb0de0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Gupta	7468315683	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Nandini Gupta", "contact_number": "7468315683"}	2026-02-01 10:33:59.079058	2026-02-01 10:34:37.345574
71a002c5-9077-42e5-8498-ca38cd2cef3a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Aggarwal	8210968278	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nandini Aggarwal", "contact_number": "8210968278"}	2026-02-01 10:33:59.079061	2026-02-01 10:34:37.345615
fd409dbe-e9f9-498e-b1cb-764ff192ac40	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Hegde	8152088431	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Ira Hegde", "contact_number": "8152088431"}	2026-02-01 10:33:59.079064	2026-02-01 10:34:37.345657
95f4d29c-86f3-4041-bb4b-65adb4314aaa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Gowda	6692430751	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Saanvi Gowda", "contact_number": "6692430751"}	2026-02-01 10:33:59.079066	2026-02-01 10:34:37.345699
99e1d8fc-cf5e-4f00-872a-ba2fdb968636	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Aggarwal	7664933165	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Reyansh Aggarwal", "contact_number": "7664933165"}	2026-02-01 10:33:59.079069	2026-02-01 10:34:37.345747
ac78fe8c-1630-4bb5-996a-451d1af91992	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Rao	8012871630	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Rao", "contact_number": "8012871630"}	2026-02-01 10:33:59.079072	2026-02-01 10:34:37.345789
4a3b2dcc-8295-4013-b099-442f00adb89d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Tripathi	8284835410	At Risk	{"cohort": "At Risk", "customer_name": "Sakshi Tripathi", "contact_number": "8284835410"}	2026-02-01 10:33:59.079075	2026-02-01 10:34:37.345829
6866c470-d1ca-406d-8c05-f9a0e433f7ad	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Gill	6411654819	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Gill", "contact_number": "6411654819"}	2026-02-01 10:33:59.079078	2026-02-01 10:34:37.345869
a2a59ef2-8550-43d1-a1a8-927ea5f80c92	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Mukherjee	8459437746	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ishaan Mukherjee", "contact_number": "8459437746"}	2026-02-01 10:33:59.079081	2026-02-01 10:34:37.34591
93cc56d2-ee4b-48f9-b3a1-15a6ca41d5bd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Singh	7304275177	Hibernating	{"cohort": "Hibernating", "customer_name": "Trisha Singh", "contact_number": "7304275177"}	2026-02-01 10:33:59.079083	2026-02-01 10:34:37.34595
fc5efb8c-2d9d-4e78-8427-2172890e320b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Khan	7664930130	Promising	{"cohort": "Promising", "customer_name": "Avni Khan", "contact_number": "7664930130"}	2026-02-01 10:33:59.079086	2026-02-01 10:34:37.345991
af48c8ea-f6e6-462c-bdde-02d416c483a9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Tripathi	8750072831	Promising	{"cohort": "Promising", "customer_name": "Sakshi Tripathi", "contact_number": "8750072831"}	2026-02-01 10:33:59.079089	2026-02-01 10:34:37.346032
7b3ce374-5966-454e-8b48-3714f15098b2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Khan	8182275389	At Risk	{"cohort": "At Risk", "customer_name": "Vivaan Khan", "contact_number": "8182275389"}	2026-02-01 10:33:59.079092	2026-02-01 10:34:37.346074
f3f1f6e5-a9ca-43ba-bdf4-68eacd385c86	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Bansal	8947198029	Need Attention	{"cohort": "Need Attention", "customer_name": "Ayush Bansal", "contact_number": "8947198029"}	2026-02-01 10:33:59.079094	2026-02-01 10:34:37.346159
8e802e47-928c-47e9-9ae1-7b18ece66fb8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Tripathi	7751360825	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Tanvi Tripathi", "contact_number": "7751360825"}	2026-02-01 10:33:59.079097	2026-02-01 10:34:37.346202
562a308a-c173-47d9-ad18-d016230d0f59	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Gowda	6501801412	At Risk	{"cohort": "At Risk", "customer_name": "Avni Gowda", "contact_number": "6501801412"}	2026-02-01 10:33:59.0791	2026-02-01 10:34:37.346244
035ceb47-422a-4194-aca0-cb3c37ca666b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Gill	7260415674	Hibernating	{"cohort": "Hibernating", "customer_name": "Trisha Gill", "contact_number": "7260415674"}	2026-02-01 10:33:59.079102	2026-02-01 10:34:37.346286
540b1aa8-8578-474d-97d2-b4e32b86dca0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Mukherjee	6562746789	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Mukherjee", "contact_number": "6562746789"}	2026-02-01 10:33:59.079105	2026-02-01 10:34:37.346327
e7025fca-4e57-4efb-8c47-356495cfcaca	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Singh	8720429306	New Customers	{"cohort": "New Customers", "customer_name": "Anika Singh", "contact_number": "8720429306"}	2026-02-01 10:33:59.079108	2026-02-01 10:34:37.346369
9c8d6d3d-020e-4a45-a1b4-3787a8b859f3	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Bhat	6861057122	Champions	{"cohort": "Champions", "customer_name": "Tanvi Bhat", "contact_number": "6861057122"}	2026-02-01 10:33:59.079111	2026-02-01 10:34:37.346409
27006ab8-57c4-419a-b7fa-6217c44a4785	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Malhotra	8208883641	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Malhotra", "contact_number": "8208883641"}	2026-02-01 10:33:59.079114	2026-02-01 10:34:37.34645
60f774b8-89cc-40df-a9aa-131656f5d1a6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Gupta	6016389273	Champions	{"cohort": "Champions", "customer_name": "Trisha Gupta", "contact_number": "6016389273"}	2026-02-01 10:33:59.079117	2026-02-01 10:34:37.346491
e2db2031-c025-494b-aa95-fe8dc7a2002a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Kulkarni	8149238767	Promising	{"cohort": "Promising", "customer_name": "Pallavi Kulkarni", "contact_number": "8149238767"}	2026-02-01 10:33:59.07912	2026-02-01 10:34:37.346531
aa3d7e6b-45ea-4a2f-89f8-dea98b6d5ee1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rashmi Pandey	9768878448	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Pandey", "contact_number": "9768878448"}	2026-02-01 10:33:59.079125	2026-02-01 10:34:37.346572
468ebd1a-f80d-4e6b-ac33-6b59b85a7f55	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kunal Ghosh	9023767559	Need Attention	{"cohort": "Need Attention", "customer_name": "Kunal Ghosh", "contact_number": "9023767559"}	2026-02-01 10:33:59.079128	2026-02-01 10:34:37.346614
f27a386a-abda-40d6-b8d4-beeb94be96ad	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rashmi Chatterjee	8566474661	Champions	{"cohort": "Champions", "customer_name": "Rashmi Chatterjee", "contact_number": "8566474661"}	2026-02-01 10:33:59.079131	2026-02-01 10:34:37.346655
6ddc9588-f0c1-43ca-abef-e30974ed876c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Verma	6095441733	Champions	{"cohort": "Champions", "customer_name": "Myra Verma", "contact_number": "6095441733"}	2026-02-01 10:33:59.079134	2026-02-01 10:34:37.346696
9f0d56bc-48a6-4085-b72d-edc2265cb9aa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Das	8026424848	At Risk	{"cohort": "At Risk", "customer_name": "Gaurav Das", "contact_number": "8026424848"}	2026-02-01 10:33:59.079136	2026-02-01 10:34:37.346735
71d18c6f-5398-4ec1-bf18-2f12e68d0dba	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Bansal	9397040587	New Customers	{"cohort": "New Customers", "customer_name": "Arnav Bansal", "contact_number": "9397040587"}	2026-02-01 10:33:59.079139	2026-02-01 10:34:37.346774
d75e573e-d730-451a-96f0-aa71ffbf4531	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Patel	8856438883	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Patel", "contact_number": "8856438883"}	2026-02-01 10:33:59.08145	2026-02-01 10:34:37.346813
2d069144-24a8-4671-bef0-9bab849a117f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Saha	9734060367	Promising	{"cohort": "Promising", "customer_name": "Dhruv Saha", "contact_number": "9734060367"}	2026-02-01 10:33:59.081468	2026-02-01 10:34:37.346851
4fe60425-73e7-49c4-846c-855850267ac3	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kunal Narayan	8701177161	At Risk	{"cohort": "At Risk", "customer_name": "Kunal Narayan", "contact_number": "8701177161"}	2026-02-01 10:33:59.081472	2026-02-01 10:34:37.34689
06a1cde8-f785-457e-982a-e8d56a3c789d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Saxena	9281370661	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Neha Saxena", "contact_number": "9281370661"}	2026-02-01 10:33:59.081475	2026-02-01 10:34:37.346935
ae256cb1-e10c-4799-8fa4-e8c4b7b97083	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Shetty	9455907545	Need Attention	{"cohort": "Need Attention", "customer_name": "Mohit Shetty", "contact_number": "9455907545"}	2026-02-01 10:33:59.081478	2026-02-01 10:34:37.346973
d2819356-7fd1-48f0-871e-e596812b3f81	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Verma	7618166384	Champions	{"cohort": "Champions", "customer_name": "Rahul Verma", "contact_number": "7618166384"}	2026-02-01 10:33:59.081481	2026-02-01 10:34:37.347012
4500d031-d9d5-4f0a-80ca-87d63cb237c4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayaan Bose	7299414772	Champions	{"cohort": "Champions", "customer_name": "Ayaan Bose", "contact_number": "7299414772"}	2026-02-01 10:33:59.081484	2026-02-01 10:34:37.347051
296bf0d8-843b-4dbe-97f5-86bcf1bcecc6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aadhya Yadav	8796262369	Promising	{"cohort": "Promising", "customer_name": "Aadhya Yadav", "contact_number": "8796262369"}	2026-02-01 10:33:59.081487	2026-02-01 10:34:37.347089
c7141817-bb88-4239-a417-48cde369a6e4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Gupta	7563134564	Promising	{"cohort": "Promising", "customer_name": "Aarohi Gupta", "contact_number": "7563134564"}	2026-02-01 10:33:59.08149	2026-02-01 10:34:37.347128
7571da92-f3c2-49bb-b737-76201fc4c151	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Chaudhary	8840130027	Need Attention	{"cohort": "Need Attention", "customer_name": "Reyansh Chaudhary", "contact_number": "8840130027"}	2026-02-01 10:33:59.081492	2026-02-01 10:34:37.347166
435bcda4-dd19-4071-9023-b9e568df3d69	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Aggarwal	8610725346	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Aggarwal", "contact_number": "8610725346"}	2026-02-01 10:33:59.081495	2026-02-01 10:34:37.347204
7d4d65df-0f69-4813-86b8-6810270e70c2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Jain	7752772693	Lost	{"cohort": "Lost", "customer_name": "Dev Jain", "contact_number": "7752772693"}	2026-02-01 10:33:59.081498	2026-02-01 10:34:37.347242
ecded089-cfe4-4a25-adbc-6922eb82d717	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Chaudhary	8907288426	Promising	{"cohort": "Promising", "customer_name": "Manav Chaudhary", "contact_number": "8907288426"}	2026-02-01 10:33:59.081501	2026-02-01 10:34:37.34728
d4b5b9c0-66ba-46ec-855f-a84ea0fbbd82	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Iyer	8756792161	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Neha Iyer", "contact_number": "8756792161"}	2026-02-01 10:33:59.081503	2026-02-01 10:34:37.347319
f651a054-f40d-4814-9e27-fa0d5e17339d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Prasad	7710221804	At Risk	{"cohort": "At Risk", "customer_name": "Varun Prasad", "contact_number": "7710221804"}	2026-02-01 10:33:59.081506	2026-02-01 10:34:37.347357
a585e058-5e4c-4006-b72e-ff8680b77723	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Bose	7095768375	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Diya Bose", "contact_number": "7095768375"}	2026-02-01 10:33:59.08151	2026-02-01 10:34:37.347396
1cd69bd2-a4c5-49fe-a5df-4b55ff32849b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditya Arora	6732105450	New Customers	{"cohort": "New Customers", "customer_name": "Aditya Arora", "contact_number": "6732105450"}	2026-02-01 10:33:59.081513	2026-02-01 10:34:37.347434
1272ebf9-c6c8-435e-91b5-eabefbc5b86d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Sharma	7863296457	Champions	{"cohort": "Champions", "customer_name": "Manav Sharma", "contact_number": "7863296457"}	2026-02-01 10:33:59.081516	2026-02-01 10:34:37.347473
df167a83-b4cd-4955-be47-7b7b5e549249	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Isha Shetty	6132692083	Champions	{"cohort": "Champions", "customer_name": "Isha Shetty", "contact_number": "6132692083"}	2026-02-01 10:33:59.081518	2026-02-01 10:34:37.347511
04f8f6e1-ffd3-490b-b491-da4f4d077a18	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Kaur	6352983840	Lost	{"cohort": "Lost", "customer_name": "Mohit Kaur", "contact_number": "6352983840"}	2026-02-01 10:33:59.081521	2026-02-01 10:34:37.34755
0a1ecfdc-f5fc-4f18-8bbd-6023482d1aea	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Gill	7300975626	At Risk	{"cohort": "At Risk", "customer_name": "Ayush Gill", "contact_number": "7300975626"}	2026-02-01 10:33:59.081524	2026-02-01 10:34:37.347588
2509ba1c-73c6-4e54-a66f-5389ea598277	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Das	7841579769	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Gaurav Das", "contact_number": "7841579769"}	2026-02-01 10:33:59.081526	2026-02-01 10:34:37.347632
04c6d1d1-55eb-4c5f-ba61-c7e225970b2f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Siddharth Mishra	7070012089	New Customers	{"cohort": "New Customers", "customer_name": "Siddharth Mishra", "contact_number": "7070012089"}	2026-02-01 10:33:59.081529	2026-02-01 10:34:37.347677
65c4bc64-94d9-4016-94f2-115c7864ab13	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Gowda	9364065667	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arjun Gowda", "contact_number": "9364065667"}	2026-02-01 10:33:59.081532	2026-02-01 10:34:37.347716
ec223371-d1cf-4d44-a1bd-6658c912d791	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anvi Bansal	6709173074	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anvi Bansal", "contact_number": "6709173074"}	2026-02-01 10:33:59.081534	2026-02-01 10:34:37.347758
cc370c2b-28d7-40cf-bdd3-9dc6b141a98b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Jain	9801277826	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Jain", "contact_number": "9801277826"}	2026-02-01 10:33:59.081537	2026-02-01 10:34:37.347796
3a5b0a37-6e8c-4774-9bd3-3e40cca35bd5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Iyer	8697739551	Promising	{"cohort": "Promising", "customer_name": "Gaurav Iyer", "contact_number": "8697739551"}	2026-02-01 10:33:59.08154	2026-02-01 10:34:37.347835
8af2a204-99d7-4642-b2c1-faecab2e629f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Ghosh	6535027729	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Dev Ghosh", "contact_number": "6535027729"}	2026-02-01 10:33:59.081542	2026-02-01 10:34:37.347882
5c424bdd-eeec-41a3-b020-b14f6c5e4b3f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Ghosh	7128117889	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Ghosh", "contact_number": "7128117889"}	2026-02-01 10:33:59.081545	2026-02-01 10:34:37.34792
681219e0-f8f0-4f19-acec-0e74341fbdd8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Tripathi	9606215936	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Tripathi", "contact_number": "9606215936"}	2026-02-01 10:33:59.081548	2026-02-01 10:34:37.347958
d4d59133-3411-4b45-b647-6ee75d96451c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Saxena	7169346355	Lost	{"cohort": "Lost", "customer_name": "Rohan Saxena", "contact_number": "7169346355"}	2026-02-01 10:33:59.081551	2026-02-01 10:34:37.347997
e45c28ba-4302-4611-9f8b-6ead90b8eeac	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Banerjee	8891377623	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Harsh Banerjee", "contact_number": "8891377623"}	2026-02-01 10:33:59.081553	2026-02-01 10:34:37.348035
b314d035-fe4d-4d37-a3e4-c7ab27da42f7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pooja Nair	8843351688	Promising	{"cohort": "Promising", "customer_name": "Pooja Nair", "contact_number": "8843351688"}	2026-02-01 10:33:59.081556	2026-02-01 10:34:37.348074
79809774-22b6-4d8c-8aad-012a023b3faa	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Tripathi	7817678868	Need Attention	{"cohort": "Need Attention", "customer_name": "Diya Tripathi", "contact_number": "7817678868"}	2026-02-01 10:33:59.081559	2026-02-01 10:34:37.348112
c5c166ae-cc5e-4566-b0d4-2487b6ac0772	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Malhotra	9720285613	New Customers	{"cohort": "New Customers", "customer_name": "Gaurav Malhotra", "contact_number": "9720285613"}	2026-02-01 10:33:59.081561	2026-02-01 10:34:37.348152
3c21a5b8-cbcf-4fdf-979a-cba8412bbe5f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Gill	8150302996	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mohit Gill", "contact_number": "8150302996"}	2026-02-01 10:33:59.081564	2026-02-01 10:34:37.34819
2abf6c1c-b9ea-4a52-8a88-d4cb18073606	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Khan	7419697432	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Khan", "contact_number": "7419697432"}	2026-02-01 10:33:59.081566	2026-02-01 10:34:37.348229
1c1f952b-8712-465f-9322-b7bc658a03ed	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Prasad	9222657398	At Risk	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "9222657398"}	2026-02-01 10:33:59.081569	2026-02-01 10:34:37.348267
aa26a322-2f18-482f-aad6-ad5b4cf3973a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Saxena	6937588251	Champions	{"cohort": "Champions", "customer_name": "Meera Saxena", "contact_number": "6937588251"}	2026-02-01 10:33:59.081572	2026-02-01 10:34:37.348307
c264fd96-e7c5-45cf-9186-208ebab9049b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pooja Sharma	9368539538	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Pooja Sharma", "contact_number": "9368539538"}	2026-02-01 10:33:59.081574	2026-02-01 10:34:37.348348
82401f4e-abd9-405b-a050-613515d5e30e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Banerjee	9780842521	Champions	{"cohort": "Champions", "customer_name": "Meera Banerjee", "contact_number": "9780842521"}	2026-02-01 10:33:59.081577	2026-02-01 10:34:37.348397
7ee61b43-4c1f-4798-8d08-d8cd14cf910c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Mishra	7371287442	Champions	{"cohort": "Champions", "customer_name": "Ira Mishra", "contact_number": "7371287442"}	2026-02-01 10:33:59.08158	2026-02-01 10:34:37.348439
65f00099-9896-4620-a3de-d43a0cfa071c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Yadav	7642151581	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Tanvi Yadav", "contact_number": "7642151581"}	2026-02-01 10:33:59.081583	2026-02-01 10:34:37.348479
1a24dc16-daeb-4251-9cd2-cc34088149d8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Narayan	7219550762	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Naina Narayan", "contact_number": "7219550762"}	2026-02-01 10:33:59.081585	2026-02-01 10:34:37.348519
bba676a8-eb9d-485a-9fbd-862c38cf55b8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Pandey	6264424157	Promising	{"cohort": "Promising", "customer_name": "Rohan Pandey", "contact_number": "6264424157"}	2026-02-01 10:33:59.081588	2026-02-01 10:34:37.348558
ff5da907-759f-4d40-9f68-b39890a459b9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Tiwari	8169503105	Champions	{"cohort": "Champions", "customer_name": "Yash Tiwari", "contact_number": "8169503105"}	2026-02-01 10:33:59.081591	2026-02-01 10:34:37.348597
6c1fb279-bc74-470e-8d46-6596ff3ee009	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mohit Roy	9861958570	Promising	{"cohort": "Promising", "customer_name": "Mohit Roy", "contact_number": "9861958570"}	2026-02-01 10:33:59.081593	2026-02-01 10:34:37.348639
82661e4a-04b9-45b8-8c79-b8dac0c05f23	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Kulkarni	7950964486	Promising	{"cohort": "Promising", "customer_name": "Neha Kulkarni", "contact_number": "7950964486"}	2026-02-01 10:33:59.081596	2026-02-01 10:34:37.348681
0154ef3f-1676-496f-aeda-f6c620ec6ecd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Gill	9287357760	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Tanvi Gill", "contact_number": "9287357760"}	2026-02-01 10:33:59.081599	2026-02-01 10:34:37.348719
3a54f6a1-3936-415c-a1a7-9a813c4e8d66	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Gowda	7279055207	New Customers	{"cohort": "New Customers", "customer_name": "Ananya Gowda", "contact_number": "7279055207"}	2026-02-01 10:33:59.081601	2026-02-01 10:34:37.348758
6c30e1fc-9f2e-464d-8a92-fd895e0170c0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Banerjee	6510663316	New Customers	{"cohort": "New Customers", "customer_name": "Sai Banerjee", "contact_number": "6510663316"}	2026-02-01 10:33:59.081604	2026-02-01 10:34:37.348799
529b709a-9383-49a5-a7ba-615acb161176	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Gowda	8255693255	Need Attention	{"cohort": "Need Attention", "customer_name": "Neha Gowda", "contact_number": "8255693255"}	2026-02-01 10:33:59.081607	2026-02-01 10:34:37.348838
58a0fa61-d890-469d-8b36-c4e2006d71d0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sameer Thakur	7352337786	Need Attention	{"cohort": "Need Attention", "customer_name": "Sameer Thakur", "contact_number": "7352337786"}	2026-02-01 10:33:59.081609	2026-02-01 10:34:37.348877
af8ace09-b49d-4605-87a8-cba5a989768d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Shah	7461243567	Champions	{"cohort": "Champions", "customer_name": "Rahul Shah", "contact_number": "7461243567"}	2026-02-01 10:33:59.081612	2026-02-01 10:34:37.348915
f3c3aa8c-be9b-42bc-ac63-8c9bb86a173c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rashmi Sood	7368846023	New Customers	{"cohort": "New Customers", "customer_name": "Rashmi Sood", "contact_number": "7368846023"}	2026-02-01 10:33:59.081615	2026-02-01 10:34:37.349984
9195a034-3685-48ba-a908-be3885cac753	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Hegde	6794629071	Need Attention	{"cohort": "Need Attention", "customer_name": "Saanvi Hegde", "contact_number": "6794629071"}	2026-02-01 10:33:59.081618	2026-02-01 10:34:37.350029
39d644b4-59e1-412a-8ecf-7d204a201cf0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Chatterjee	9426820552	Promising	{"cohort": "Promising", "customer_name": "Meera Chatterjee", "contact_number": "9426820552"}	2026-02-01 10:33:59.081621	2026-02-01 10:34:37.350071
3cfc676d-1088-41dd-9b17-8876639b8c8c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Das	7636902364	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Avni Das", "contact_number": "7636902364"}	2026-02-01 10:33:59.081624	2026-02-01 10:34:37.350111
1c3be4cc-a88f-4dec-8bc0-c8a71663a06b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Verma	7570028939	Need Attention	{"cohort": "Need Attention", "customer_name": "Ishaan Verma", "contact_number": "7570028939"}	2026-02-01 10:33:59.081628	2026-02-01 10:34:37.35015
3eecafa1-2d6e-4ad4-8a22-c270e8003902	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditya Mukherjee	8294401555	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Aditya Mukherjee", "contact_number": "8294401555"}	2026-02-01 10:33:59.081631	2026-02-01 10:34:37.350199
00f580bd-0cae-4765-bb0e-8b319850ba34	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Priya Thakur	8989885695	Champions	{"cohort": "Champions", "customer_name": "Priya Thakur", "contact_number": "8989885695"}	2026-02-01 10:33:59.081634	2026-02-01 10:34:37.350241
bc34cace-70fe-4c46-8f03-0c4fb24ded7c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Bajaj	7794450106	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Bajaj", "contact_number": "7794450106"}	2026-02-01 10:33:59.081637	2026-02-01 10:34:37.350286
428b5a03-498a-4142-97f7-eecc4a1bd612	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Pandey	7623950820	Champions	{"cohort": "Champions", "customer_name": "Arjun Pandey", "contact_number": "7623950820"}	2026-02-01 10:33:59.081639	2026-02-01 10:34:37.350325
f05a688a-44b1-4325-b423-fbfa889e86dc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kabir Srinivasan	8094382969	Need Attention	{"cohort": "Need Attention", "customer_name": "Kabir Srinivasan", "contact_number": "8094382969"}	2026-02-01 10:33:59.081642	2026-02-01 10:34:37.350364
519eb829-332b-4855-99d9-8dd1781bcc3d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kavya Das	9722228837	Hibernating	{"cohort": "Hibernating", "customer_name": "Kavya Das", "contact_number": "9722228837"}	2026-02-01 10:33:59.081645	2026-02-01 10:34:37.350404
9c7f0347-0811-4c6f-bb24-82b84cae2dcb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Bhat	6966675046	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Bhat", "contact_number": "6966675046"}	2026-02-01 10:33:59.081647	2026-02-01 10:34:37.350442
80502947-f911-4f53-a6cc-f40551516d27	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Deshmukh	9885217537	New Customers	{"cohort": "New Customers", "customer_name": "Varun Deshmukh", "contact_number": "9885217537"}	2026-02-01 10:33:59.08165	2026-02-01 10:34:37.350481
3fa52ead-b227-4f12-9568-c9f0b3b02541	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Mukherjee	7074553619	Need Attention	{"cohort": "Need Attention", "customer_name": "Arnav Mukherjee", "contact_number": "7074553619"}	2026-02-01 10:33:59.081653	2026-02-01 10:34:37.350519
1e01a283-8b68-44c8-9c2d-a8f82e2276fc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Narayan	9306313812	New Customers	{"cohort": "New Customers", "customer_name": "Ishaan Narayan", "contact_number": "9306313812"}	2026-02-01 10:33:59.081656	2026-02-01 10:34:37.350557
bf77fd65-e895-405b-a0ec-c4979abc446d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Sharma	8463427382	Promising	{"cohort": "Promising", "customer_name": "Harsh Sharma", "contact_number": "8463427382"}	2026-02-01 10:33:59.081658	2026-02-01 10:34:37.350596
efaca322-0ab2-4bce-949c-f001f0f50db0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Sood	7596878581	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Sood", "contact_number": "7596878581"}	2026-02-01 10:33:59.081661	2026-02-01 10:34:37.350634
88f50f12-8bc2-44d7-9431-d6d455f7a708	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Bajaj	7404186534	New Customers	{"cohort": "New Customers", "customer_name": "Trisha Bajaj", "contact_number": "7404186534"}	2026-02-01 10:33:59.081664	2026-02-01 10:34:37.350674
3b8319da-5865-4dc9-b462-58934f8a22ee	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Reddy	8553608464	Lost	{"cohort": "Lost", "customer_name": "Sakshi Reddy", "contact_number": "8553608464"}	2026-02-01 10:33:59.081667	2026-02-01 10:34:37.35071
a7b867a3-d7d9-493b-b65b-bd6e3ace8870	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Mishra	8235834366	Hibernating	{"cohort": "Hibernating", "customer_name": "Dhruv Mishra", "contact_number": "8235834366"}	2026-02-01 10:33:59.081669	2026-02-01 10:34:37.350746
01b837ee-7416-4ef5-baeb-4df52e0a08f4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Khan	7923574064	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Myra Khan", "contact_number": "7923574064"}	2026-02-01 10:33:59.081672	2026-02-01 10:34:37.350783
146732c3-8e04-48bb-a687-f2cd15874a6b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Bhat	7869464903	Champions	{"cohort": "Champions", "customer_name": "Avni Bhat", "contact_number": "7869464903"}	2026-02-01 10:33:59.081675	2026-02-01 10:34:37.35082
52645a8e-00d4-4c4d-b9d8-d70bfb558324	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Isha Pandey	8322624835	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Isha Pandey", "contact_number": "8322624835"}	2026-02-01 10:33:59.081678	2026-02-01 10:34:37.350856
6d576438-2120-4db6-a370-06bccfdd9b71	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Rao	9410769701	Champions	{"cohort": "Champions", "customer_name": "Vihaan Rao", "contact_number": "9410769701"}	2026-02-01 10:33:59.081681	2026-02-01 10:34:37.350893
1f808a4a-b198-4493-87db-65cba2bdb981	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Iyer	6094075916	Champions	{"cohort": "Champions", "customer_name": "Saanvi Iyer", "contact_number": "6094075916"}	2026-02-01 10:33:59.081683	2026-02-01 10:34:37.350929
274d67bd-bcf2-48f9-a3ef-0bd3aa77eb29	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Nair	6683226180	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Nikhil Nair", "contact_number": "6683226180"}	2026-02-01 10:33:59.081686	2026-02-01 10:34:37.350966
0fcd9875-b89b-4bef-b6b0-87eaa231fcfb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Pandey	8834952496	Champions	{"cohort": "Champions", "customer_name": "Avni Pandey", "contact_number": "8834952496"}	2026-02-01 10:33:59.081689	2026-02-01 10:34:37.351004
2e43a577-e416-40a9-9657-b8b4db04b70e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Naik	7547846594	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Naik", "contact_number": "7547846594"}	2026-02-01 10:33:59.081691	2026-02-01 10:34:37.351042
41540125-6c60-4e29-a599-98963bfcbee1	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pooja Chaudhary	7843230883	At Risk	{"cohort": "At Risk", "customer_name": "Pooja Chaudhary", "contact_number": "7843230883"}	2026-02-01 10:33:59.081694	2026-02-01 10:34:37.351082
d022b91a-d145-4d26-914c-545ef7bd8ce9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Sood	9564727757	Champions	{"cohort": "Champions", "customer_name": "Rohan Sood", "contact_number": "9564727757"}	2026-02-01 10:33:59.081697	2026-02-01 10:34:37.351118
5ed3c1ec-3e0c-4dc0-81d8-cacea4ab5cb8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Tiwari	8184276820	At Risk	{"cohort": "At Risk", "customer_name": "Nandini Tiwari", "contact_number": "8184276820"}	2026-02-01 10:33:59.0817	2026-02-01 10:34:37.351155
c3374ac4-a75b-479a-ac96-5b2a6b718381	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Kaur	7576626521	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Kaur", "contact_number": "7576626521"}	2026-02-01 10:33:59.081702	2026-02-01 10:34:37.351192
756c76dc-c7f2-482e-8493-79a3bf7b9a61	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Joshi	6126626100	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Nandini Joshi", "contact_number": "6126626100"}	2026-02-01 10:33:59.081705	2026-02-01 10:34:37.351228
b124c80a-ef98-44ac-93f6-e6a71b2ea312	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Rao	6112772143	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Manav Rao", "contact_number": "6112772143"}	2026-02-01 10:33:59.081708	2026-02-01 10:34:37.351276
133f9dcd-1641-40be-9a3d-7c4cf51ad14d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Singh	8743600712	Need Attention	{"cohort": "Need Attention", "customer_name": "Yash Singh", "contact_number": "8743600712"}	2026-02-01 10:33:59.08171	2026-02-01 10:34:37.351314
f38ce1b2-1929-43ca-8fb1-50f6a627812e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Kulkarni	9041888172	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Ayush Kulkarni", "contact_number": "9041888172"}	2026-02-01 10:33:59.081713	2026-02-01 10:34:37.351351
7117e6e6-d483-4e57-a950-9d9036acb9cb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Bose	9291706239	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Yash Bose", "contact_number": "9291706239"}	2026-02-01 10:33:59.081716	2026-02-01 10:34:37.351387
89bf65d4-fcf8-49c7-9eeb-f43c2f855d74	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Mukherjee	8177514230	At Risk	{"cohort": "At Risk", "customer_name": "Parth Mukherjee", "contact_number": "8177514230"}	2026-02-01 10:33:59.081718	2026-02-01 10:34:37.351424
8494d232-32ce-44f6-87f1-d0180d04f1a8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Srinivasan	7924075329	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Mansi Srinivasan", "contact_number": "7924075329"}	2026-02-01 10:33:59.081721	2026-02-01 10:34:37.35146
528c14e7-500a-402b-bd3b-b7c2a660c4fe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Bajaj	9617246397	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Anika Bajaj", "contact_number": "9617246397"}	2026-02-01 10:33:59.081724	2026-02-01 10:34:37.351497
fc25bf6b-d755-4f2f-bb81-fde9b6051651	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Naik	6067712977	At Risk	{"cohort": "At Risk", "customer_name": "Dhruv Naik", "contact_number": "6067712977"}	2026-02-01 10:33:59.081726	2026-02-01 10:34:37.351534
eef72adb-6a0e-4a29-92f4-d93abe60028b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Riya Srinivasan	9703720755	At Risk	{"cohort": "At Risk", "customer_name": "Riya Srinivasan", "contact_number": "9703720755"}	2026-02-01 10:33:59.081729	2026-02-01 10:34:37.35157
9ed1778f-c35d-4b51-8044-204eec5901c0	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Saha	9113728950	Lost	{"cohort": "Lost", "customer_name": "Saanvi Saha", "contact_number": "9113728950"}	2026-02-01 10:33:59.081732	2026-02-01 10:34:37.351606
d53a8c6a-4ef7-4fb4-ae25-2bd4d14e38e9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Yash Patel	7485475786	New Customers	{"cohort": "New Customers", "customer_name": "Yash Patel", "contact_number": "7485475786"}	2026-02-01 10:33:59.081734	2026-02-01 10:34:37.351642
99714e3a-d1fb-4409-8744-11c912fa68ac	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Banerjee	8727653545	New Customers	{"cohort": "New Customers", "customer_name": "Ritvik Banerjee", "contact_number": "8727653545"}	2026-02-01 10:33:59.081737	2026-02-01 10:34:37.351679
74cfe81b-8aa7-4446-b439-8c91ef0896b9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Saha	8361508182	At Risk	{"cohort": "At Risk", "customer_name": "Saanvi Saha", "contact_number": "8361508182"}	2026-02-01 10:33:59.08174	2026-02-01 10:34:37.351716
c6c85758-0839-45bb-9ad1-e3a48f87e435	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Jain	9106346502	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rahul Jain", "contact_number": "9106346502"}	2026-02-01 10:33:59.081742	2026-02-01 10:34:37.351752
8e7d2f9f-c0f4-4828-8f32-a9a191129874	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Shetty	6096984637	Hibernating	{"cohort": "Hibernating", "customer_name": "Nandini Shetty", "contact_number": "6096984637"}	2026-02-01 10:33:59.081745	2026-02-01 10:34:37.351789
c7a59196-55a5-42bf-8eed-94d2a95b6969	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Nair	9870657802	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Sai Nair", "contact_number": "9870657802"}	2026-02-01 10:33:59.081748	2026-02-01 10:34:37.351828
7015ecca-e02e-4168-86bc-b74b070dc16a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Chatterjee	6123165955	New Customers	{"cohort": "New Customers", "customer_name": "Ishaan Chatterjee", "contact_number": "6123165955"}	2026-02-01 10:33:59.081751	2026-02-01 10:34:37.351866
2522a5c9-23cd-417c-aa1b-ac5115020258	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Bhat	6756741755	At Risk	{"cohort": "At Risk", "customer_name": "Varun Bhat", "contact_number": "6756741755"}	2026-02-01 10:33:59.081753	2026-02-01 10:34:37.351903
aa4810fa-baa1-4677-a3fc-e7a14b7a56a4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ishaan Arora	7559959846	At Risk	{"cohort": "At Risk", "customer_name": "Ishaan Arora", "contact_number": "7559959846"}	2026-02-01 10:33:59.081756	2026-02-01 10:34:37.351939
dc3cfe34-499a-45c7-b16d-82cee14439f9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Patel	8652792943	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ira Patel", "contact_number": "8652792943"}	2026-02-01 10:33:59.081759	2026-02-01 10:34:37.351976
608611ca-2620-43df-a65c-80bb33e42041	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kabir Tripathi	6955933280	Hibernating	{"cohort": "Hibernating", "customer_name": "Kabir Tripathi", "contact_number": "6955933280"}	2026-02-01 10:33:59.081762	2026-02-01 10:34:37.352014
9248b63c-ec60-4709-b0ba-f8de0d691274	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Shetty	8955504128	Promising	{"cohort": "Promising", "customer_name": "Rahul Shetty", "contact_number": "8955504128"}	2026-02-01 10:33:59.081765	2026-02-01 10:34:37.35205
39af5f7c-cdca-46e9-9ef7-13a013cf4221	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Tripathi	7280397771	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Tripathi", "contact_number": "7280397771"}	2026-02-01 10:33:59.081768	2026-02-01 10:34:37.352087
da8e0ff4-af7a-42b1-97bb-9e684838abaf	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Roy	6537500738	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Roy", "contact_number": "6537500738"}	2026-02-01 10:33:59.081771	2026-02-01 10:34:37.352124
61f711ea-7616-46f4-b847-9d630fbe973a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Tripathi	9917789660	Hibernating	{"cohort": "Hibernating", "customer_name": "Mansi Tripathi", "contact_number": "9917789660"}	2026-02-01 10:33:59.081773	2026-02-01 10:34:37.352161
74b8bc68-928c-4398-87a5-5d5097d1a97e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Bajaj	6353616997	New Customers	{"cohort": "New Customers", "customer_name": "Varun Bajaj", "contact_number": "6353616997"}	2026-02-01 10:33:59.081776	2026-02-01 10:34:37.352198
885d40e9-dd94-438a-82e3-2b436abc8e52	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Bhat	6223105030	Champions	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6223105030"}	2026-02-01 10:33:59.081779	2026-02-01 10:34:37.352235
361e9fb1-ae99-434a-9975-86c5cb35f3f8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Sood	9711546167	Hibernating	{"cohort": "Hibernating", "customer_name": "Vivaan Sood", "contact_number": "9711546167"}	2026-02-01 10:33:59.081781	2026-02-01 10:34:37.352272
1765dcec-67ed-48f1-9385-bd40a01d9423	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kavya Malhotra	7224651431	Champions	{"cohort": "Champions", "customer_name": "Kavya Malhotra", "contact_number": "7224651431"}	2026-02-01 10:33:59.081784	2026-02-01 10:34:37.352309
51189967-47b2-40a6-854d-d75e0da0855a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Priya Sharma	8503969410	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Priya Sharma", "contact_number": "8503969410"}	2026-02-01 10:33:59.081787	2026-02-01 10:34:37.352345
93337308-608d-4254-a854-dd0517776501	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kunal Ghosh	7137810998	Lost	{"cohort": "Lost", "customer_name": "Kunal Ghosh", "contact_number": "7137810998"}	2026-02-01 10:33:59.08179	2026-02-01 10:34:37.352381
8e479c28-870f-4204-8c7d-7d3ef6c1b255	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Malhotra	8061402525	Lost	{"cohort": "Lost", "customer_name": "Parth Malhotra", "contact_number": "8061402525"}	2026-02-01 10:33:59.081792	2026-02-01 10:34:37.352418
81457bca-96b0-4d95-a533-057165efa7ea	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Tripathi	8569663952	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "8569663952"}	2026-02-01 10:33:59.081795	2026-02-01 10:34:37.352455
f322e0e6-e7d3-42b9-8603-e3833878696f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sneha Gill	6276060328	Need Attention	{"cohort": "Need Attention", "customer_name": "Sneha Gill", "contact_number": "6276060328"}	2026-02-01 10:33:59.081798	2026-02-01 10:34:37.352492
99141d25-70bd-4acb-8941-b0b3640fc5cc	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Shetty	8808623903	New Customers	{"cohort": "New Customers", "customer_name": "Ayush Shetty", "contact_number": "8808623903"}	2026-02-01 10:33:59.0818	2026-02-01 10:34:37.352529
c456ce87-f96b-495c-8460-f5fa38453f9d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Chaudhary	6154902533	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Avni Chaudhary", "contact_number": "6154902533"}	2026-02-01 10:33:59.081803	2026-02-01 10:34:37.352566
f58e161c-1130-4291-98d0-a0dd5dd22067	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Chatterjee	7063399202	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Chatterjee", "contact_number": "7063399202"}	2026-02-01 10:33:59.081805	2026-02-01 10:34:37.352602
1e4d30ca-332a-45a4-a2f6-2209f4855a2d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Riya Chatterjee	9880521860	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Riya Chatterjee", "contact_number": "9880521860"}	2026-02-01 10:33:59.081808	2026-02-01 10:34:37.352663
16622e33-5697-4db7-9d55-42488e74c3e9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Mishra	9568645436	At Risk	{"cohort": "At Risk", "customer_name": "Anika Mishra", "contact_number": "9568645436"}	2026-02-01 10:33:59.081811	2026-02-01 10:34:37.352701
448aa7a7-00e6-435d-a747-acb856ae90fd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Riya Verma	9521588375	At Risk	{"cohort": "At Risk", "customer_name": "Riya Verma", "contact_number": "9521588375"}	2026-02-01 10:33:59.081813	2026-02-01 10:34:37.352739
a5ca2eb1-8397-44c7-b4d9-e4de79bf623e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Varun Bansal	7497651057	At Risk	{"cohort": "At Risk", "customer_name": "Varun Bansal", "contact_number": "7497651057"}	2026-02-01 10:33:59.081816	2026-02-01 10:34:37.352776
f93f9900-0d31-4286-8db5-5997cd07bfdb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Hegde	7387784449	Champions	{"cohort": "Champions", "customer_name": "Gaurav Hegde", "contact_number": "7387784449"}	2026-02-01 10:33:59.081819	2026-02-01 10:34:37.352814
0718fa2b-8fed-46d8-92be-61d1e8dbc949	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Avni Saxena	8111096665	Promising	{"cohort": "Promising", "customer_name": "Avni Saxena", "contact_number": "8111096665"}	2026-02-01 10:33:59.081821	2026-02-01 10:34:37.352853
d7084f88-caa5-4e26-a992-7db23309b422	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Singh	7636456738	Champions	{"cohort": "Champions", "customer_name": "Dev Singh", "contact_number": "7636456738"}	2026-02-01 10:33:59.081824	2026-02-01 10:34:37.35289
bf63d137-a8ea-4596-a297-616d0c10a8c9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Pandey	9412499926	Promising	{"cohort": "Promising", "customer_name": "Mansi Pandey", "contact_number": "9412499926"}	2026-02-01 10:33:59.081827	2026-02-01 10:34:37.352926
67599d26-cfa1-46a4-ba5f-91a4d0f46cd9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anvi Nair	7709984342	New Customers	{"cohort": "New Customers", "customer_name": "Anvi Nair", "contact_number": "7709984342"}	2026-02-01 10:33:59.08183	2026-02-01 10:34:37.352963
47da8f72-b1d1-48da-8d24-904dd62d847f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Shetty	9768739556	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Aditi Shetty", "contact_number": "9768739556"}	2026-02-01 10:33:59.081832	2026-02-01 10:34:37.353
d77ebc6f-956d-4274-8faa-9aa80960928c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vivaan Saxena	6548095375	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Vivaan Saxena", "contact_number": "6548095375"}	2026-02-01 10:33:59.081835	2026-02-01 10:34:37.353037
a5642641-9849-4dc2-bd09-85cba7919390	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Prasad	6148721296	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Shreya Prasad", "contact_number": "6148721296"}	2026-02-01 10:33:59.081838	2026-02-01 10:34:37.353074
74d668df-93b3-4be4-a8d7-e6b3a345c6bf	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Gaurav Verma	7460515853	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Gaurav Verma", "contact_number": "7460515853"}	2026-02-01 10:33:59.08184	2026-02-01 10:34:37.353111
92abaf15-b0ff-4bd6-9ad6-ac6d1e496697	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sai Narayan	8415724269	At Risk	{"cohort": "At Risk", "customer_name": "Sai Narayan", "contact_number": "8415724269"}	2026-02-01 10:33:59.081843	2026-02-01 10:34:37.353147
3fffbf9f-d5c2-40dc-9d15-447e09df3b6b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Nair	7711435375	Need Attention	{"cohort": "Need Attention", "customer_name": "Manav Nair", "contact_number": "7711435375"}	2026-02-01 10:33:59.081846	2026-02-01 10:34:37.353184
eecfe8a4-f1e5-4f63-81d7-0df7c1ff8ca3	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Trisha Pandey	7337956181	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Trisha Pandey", "contact_number": "7337956181"}	2026-02-01 10:33:59.081848	2026-02-01 10:34:37.353222
fc028ea0-05ef-4362-a82b-8a4f42ce97e8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aadhya Mehta	6437461126	Champions	{"cohort": "Champions", "customer_name": "Aadhya Mehta", "contact_number": "6437461126"}	2026-02-01 10:33:59.081851	2026-02-01 10:34:37.353258
700f7500-fe73-492b-84ed-6377e420693c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Malhotra	8044864264	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Aarohi Malhotra", "contact_number": "8044864264"}	2026-02-01 10:33:59.081855	2026-02-01 10:34:37.353295
0ae41e73-79ca-434a-8c06-4e2ac2858f6a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Roy	9062565801	Champions	{"cohort": "Champions", "customer_name": "Rohan Roy", "contact_number": "9062565801"}	2026-02-01 10:33:59.081858	2026-02-01 10:34:37.353331
9e7121c4-1a88-43f7-b851-b2aa9685d729	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Jain	8086829041	At Risk	{"cohort": "At Risk", "customer_name": "Nikhil Jain", "contact_number": "8086829041"}	2026-02-01 10:33:59.08186	2026-02-01 10:34:37.353368
d4b6267d-53e3-401b-a542-bc526b5ad07e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Sood	8665714590	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Rahul Sood", "contact_number": "8665714590"}	2026-02-01 10:33:59.081863	2026-02-01 10:34:37.353404
b4192ab3-e351-4968-b40d-5df0259e7cab	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Sakshi Malhotra	8388780418	Champions	{"cohort": "Champions", "customer_name": "Sakshi Malhotra", "contact_number": "8388780418"}	2026-02-01 10:33:59.081866	2026-02-01 10:34:37.353441
001c5559-74b7-4098-bad6-559a7fd8b29d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Sood	8556617694	Champions	{"cohort": "Champions", "customer_name": "Anika Sood", "contact_number": "8556617694"}	2026-02-01 10:33:59.081869	2026-02-01 10:34:37.353477
6f7d30eb-57d0-4ff9-9f57-b9a31738187c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Tripathi	8482569647	Lost	{"cohort": "Lost", "customer_name": "Mansi Tripathi", "contact_number": "8482569647"}	2026-02-01 10:33:59.081871	2026-02-01 10:34:37.353514
3a3e2eeb-3282-4459-bd0c-3d4b04325036	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aarohi Shah	9416790061	New Customers	{"cohort": "New Customers", "customer_name": "Aarohi Shah", "contact_number": "9416790061"}	2026-02-01 10:33:59.081874	2026-02-01 10:34:37.35355
9b6a2fc4-67bf-4da2-854a-4a40bfafd0b2	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Priya Verma	7794356022	New Customers	{"cohort": "New Customers", "customer_name": "Priya Verma", "contact_number": "7794356022"}	2026-02-01 10:33:59.081877	2026-02-01 10:34:37.353587
19bbb53a-7f69-4e1f-a820-152f8726af20	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayush Shetty	6353063760	At Risk	{"cohort": "At Risk", "customer_name": "Ayush Shetty", "contact_number": "6353063760"}	2026-02-01 10:33:59.081879	2026-02-01 10:34:37.353623
3912544e-5c2d-411a-a54d-c49dab846070	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Vihaan Aggarwal	7189440114	Hibernating	{"cohort": "Hibernating", "customer_name": "Vihaan Aggarwal", "contact_number": "7189440114"}	2026-02-01 10:33:59.081882	2026-02-01 10:34:37.35366
bd4d30c5-8cbf-47ad-abc8-f98f3c096501	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Myra Narayan	8489055650	Lost	{"cohort": "Lost", "customer_name": "Myra Narayan", "contact_number": "8489055650"}	2026-02-01 10:33:59.081885	2026-02-01 10:34:37.353697
a952e761-9657-4295-a97c-07b95731d7c7	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arjun Bajaj	8783920968	At Risk	{"cohort": "At Risk", "customer_name": "Arjun Bajaj", "contact_number": "8783920968"}	2026-02-01 10:33:59.081887	2026-02-01 10:34:37.353734
839ac509-6b7a-493a-a274-d25109c197f9	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Gupta	9117387208	New Customers	{"cohort": "New Customers", "customer_name": "Aman Gupta", "contact_number": "9117387208"}	2026-02-01 10:33:59.08189	2026-02-01 10:34:37.353771
71f4af56-b9aa-4a14-83bd-b7635d5d1738	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Parth Verma	8492317794	Champions	{"cohort": "Champions", "customer_name": "Parth Verma", "contact_number": "8492317794"}	2026-02-01 10:33:59.081893	2026-02-01 10:34:37.353807
52ade54a-e2d8-4590-a4f0-ef86713d318b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Das	6791348337	At Risk	{"cohort": "At Risk", "customer_name": "Saanvi Das", "contact_number": "6791348337"}	2026-02-01 10:33:59.081896	2026-02-01 10:34:37.353844
205a36eb-a3c5-434b-a45f-7df6d9302c1f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Verma	6896174750	Promising	{"cohort": "Promising", "customer_name": "Mansi Verma", "contact_number": "6896174750"}	2026-02-01 10:33:59.081898	2026-02-01 10:34:37.35388
11c2a5ed-8639-4b70-9fd9-f24150902b03	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Menon	6650405635	New Customers	{"cohort": "New Customers", "customer_name": "Aditi Menon", "contact_number": "6650405635"}	2026-02-01 10:33:59.081901	2026-02-01 10:34:37.353916
be981c29-fb8f-410d-8fdc-c6bd41aee053	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Nair	8622257621	Hibernating	{"cohort": "Hibernating", "customer_name": "Saanvi Nair", "contact_number": "8622257621"}	2026-02-01 10:33:59.081904	2026-02-01 10:34:37.353952
f4efc8c5-8fc4-4aeb-9cb0-cfcdf4cef103	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Priya Gowda	6065233172	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Priya Gowda", "contact_number": "6065233172"}	2026-02-01 10:33:59.081906	2026-02-01 10:34:37.35399
8c7cd338-8853-4094-974b-c173e5ade911	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ayaan Prasad	7138500903	Promising	{"cohort": "Promising", "customer_name": "Ayaan Prasad", "contact_number": "7138500903"}	2026-02-01 10:33:59.081909	2026-02-01 10:34:37.354026
850b626f-fe59-4f84-b1a6-c26363d46d1a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ira Pandey	6415586638	Champions	{"cohort": "Champions", "customer_name": "Ira Pandey", "contact_number": "6415586638"}	2026-02-01 10:33:59.081912	2026-02-01 10:34:37.354063
865de19b-45e3-4ea2-84e8-1b5832995b22	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Bose	6974189446	Promising	{"cohort": "Promising", "customer_name": "Harsh Bose", "contact_number": "6974189446"}	2026-02-01 10:33:59.081915	2026-02-01 10:34:37.3541
79e12c03-f2c7-4623-a467-2350e7baf65c	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Kapoor	9491823193	Champions	{"cohort": "Champions", "customer_name": "Dhruv Kapoor", "contact_number": "9491823193"}	2026-02-01 10:33:59.081918	2026-02-01 10:34:37.354149
f09a3765-dc8f-4a73-acd6-f08d43128868	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ananya Chaudhary	8404341761	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Ananya Chaudhary", "contact_number": "8404341761"}	2026-02-01 10:33:59.081921	2026-02-01 10:34:37.35419
36dabe6c-699f-4ea2-859f-47dc2e415c53	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Gill	6471503452	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Naina Gill", "contact_number": "6471503452"}	2026-02-01 10:33:59.081924	2026-02-01 10:34:37.354228
1d77be30-b7cd-4f8b-951a-2dad02c4f798	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Iyer	7593385747	Need Attention	{"cohort": "Need Attention", "customer_name": "Ritvik Iyer", "contact_number": "7593385747"}	2026-02-01 10:33:59.081927	2026-02-01 10:34:37.354269
2d9085ae-69b3-4482-bb68-3fd500e4ff6e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Singh	7167781530	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Dhruv Singh", "contact_number": "7167781530"}	2026-02-01 10:33:59.08193	2026-02-01 10:34:37.354306
6bf1a4ba-2f5e-456b-800e-cecdf53074a6	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Reddy	9190187346	Need Attention	{"cohort": "Need Attention", "customer_name": "Meera Reddy", "contact_number": "9190187346"}	2026-02-01 10:33:59.081932	2026-02-01 10:34:37.354344
d055a640-8337-450e-b2ec-5c74e0ee8b43	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Verma	6215787642	Lost	{"cohort": "Lost", "customer_name": "Shreya Verma", "contact_number": "6215787642"}	2026-02-01 10:33:59.081935	2026-02-01 10:34:37.354381
060f2d7b-e5a4-42d0-94cb-a37b7572ff51	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rupali Ghosh	9163593949	New Customers	{"cohort": "New Customers", "customer_name": "Rupali Ghosh", "contact_number": "9163593949"}	2026-02-01 10:33:59.081938	2026-02-01 10:34:37.354419
050614dd-4a54-46a1-8740-62ea21e361af	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kavya Hegde	8956588099	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Kavya Hegde", "contact_number": "8956588099"}	2026-02-01 10:33:59.08194	2026-02-01 10:34:37.354456
5e42caf6-b684-4116-ae84-c141f66b9c12	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anvi Malhotra	6783882733	Can't Lose Them	{"cohort": "Can't Lose Them", "customer_name": "Anvi Malhotra", "contact_number": "6783882733"}	2026-02-01 10:33:59.081943	2026-02-01 10:34:37.354492
7a1b92ae-7e91-419a-a67e-59eb7d9af20f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Arnav Arora	9442115834	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Arnav Arora", "contact_number": "9442115834"}	2026-02-01 10:33:59.081946	2026-02-01 10:34:37.354531
698bdc65-34b9-4602-bea0-3751c1b34564	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Diya Patel	8961007449	Lost	{"cohort": "Lost", "customer_name": "Diya Patel", "contact_number": "8961007449"}	2026-02-01 10:33:59.081948	2026-02-01 10:34:37.354568
82a53340-7df2-4959-8339-c8e669930f2e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Bhat	6188869644	Champions	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6188869644"}	2026-02-01 10:33:59.081951	2026-02-01 10:34:37.354605
c18ce6bf-eb2b-4a45-90bc-95ef1fb76a1d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Srinivasan	9324047729	Lost	{"cohort": "Lost", "customer_name": "Mansi Srinivasan", "contact_number": "9324047729"}	2026-02-01 10:33:59.081953	2026-02-01 10:34:37.354641
00f60601-0fd0-4823-a13e-ede4ed1ce94d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Saanvi Reddy	8004359075	Champions	{"cohort": "Champions", "customer_name": "Saanvi Reddy", "contact_number": "8004359075"}	2026-02-01 10:33:59.081956	2026-02-01 10:34:37.354677
7a8d4466-7f80-42a9-8415-ee209eb841b5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Harsh Bajaj	8408047906	Hibernating	{"cohort": "Hibernating", "customer_name": "Harsh Bajaj", "contact_number": "8408047906"}	2026-02-01 10:33:59.081959	2026-02-01 10:34:37.354713
7ca052ed-da47-46d5-8c92-bf9156fd7e48	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Meera Hegde	8695049533	Promising	{"cohort": "Promising", "customer_name": "Meera Hegde", "contact_number": "8695049533"}	2026-02-01 10:33:59.081962	2026-02-01 10:34:37.35475
482637ea-710a-40db-abd2-cbc4c238a7fe	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Naina Iyer	8209775041	Lost	{"cohort": "Lost", "customer_name": "Naina Iyer", "contact_number": "8209775041"}	2026-02-01 10:33:59.081964	2026-02-01 10:34:37.354786
67fd6692-340a-464c-b06d-149372429d6d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Prasad	6627041072	Champions	{"cohort": "Champions", "customer_name": "Tanvi Prasad", "contact_number": "6627041072"}	2026-02-01 10:33:59.081967	2026-02-01 10:34:37.354823
10facf47-178c-45a1-9b62-55ba091b265b	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Tanvi Gupta	8227697631	Promising	{"cohort": "Promising", "customer_name": "Tanvi Gupta", "contact_number": "8227697631"}	2026-02-01 10:33:59.08197	2026-02-01 10:34:37.354859
ad268a2d-9988-4aca-b08b-62b4b26ddf98	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Kunal Shetty	7478301914	Lost	{"cohort": "Lost", "customer_name": "Kunal Shetty", "contact_number": "7478301914"}	2026-02-01 10:33:59.081972	2026-02-01 10:34:37.354894
eb35a912-1152-45bd-a893-067c0fcdc9cb	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Gowda	9724627367	Promising	{"cohort": "Promising", "customer_name": "Manav Gowda", "contact_number": "9724627367"}	2026-02-01 10:33:59.081975	2026-02-01 10:34:37.35493
46a6b9de-0fea-45a5-a471-535520c587b8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Siddharth Patel	6044499263	Need Attention	{"cohort": "Need Attention", "customer_name": "Siddharth Patel", "contact_number": "6044499263"}	2026-02-01 10:33:59.081978	2026-02-01 10:34:37.354966
a59851c3-ae69-45a6-8d93-c1c7b3f4d0b8	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Neha Narayan	8180946960	About To Sleep	{"cohort": "About To Sleep", "customer_name": "Neha Narayan", "contact_number": "8180946960"}	2026-02-01 10:33:59.08198	2026-02-01 10:34:37.355002
17337bfc-8fcc-4dbc-91e6-56820bfa84cf	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rahul Sharma	8949832063	New Customers	{"cohort": "New Customers", "customer_name": "Rahul Sharma", "contact_number": "8949832063"}	2026-02-01 10:33:59.081983	2026-02-01 10:34:37.35504
52eac22e-06ed-43df-8912-12db82c3d16f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Pallavi Tripathi	7751361568	Need Attention	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "7751361568"}	2026-02-01 10:33:59.081986	2026-02-01 10:34:37.355077
548b36c2-00ec-4c5b-b66d-d0054fc382f5	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rashmi Deshmukh	6456372060	Need Attention	{"cohort": "Need Attention", "customer_name": "Rashmi Deshmukh", "contact_number": "6456372060"}	2026-02-01 10:33:59.081989	2026-02-01 10:34:37.355113
608f6d40-e83c-491b-ac1b-c0ea11496178	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Reyansh Mishra	7967181685	Hibernating	{"cohort": "Hibernating", "customer_name": "Reyansh Mishra", "contact_number": "7967181685"}	2026-02-01 10:33:59.081991	2026-02-01 10:34:37.35515
26d833e6-0ef9-42f7-b66d-191022b3bf95	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Siddharth Srinivasan	7862496924	Champions	{"cohort": "Champions", "customer_name": "Siddharth Srinivasan", "contact_number": "7862496924"}	2026-02-01 10:33:59.081994	2026-02-01 10:34:37.355187
7d17f856-ed93-4557-ab34-46e3098218e4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nandini Pandey	8272039281	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Nandini Pandey", "contact_number": "8272039281"}	2026-02-01 10:33:59.081997	2026-02-01 10:34:37.355223
ae69ddcd-f3a3-4fc8-b825-4c07ef35965a	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Ritvik Menon	6496141726	Lost	{"cohort": "Lost", "customer_name": "Ritvik Menon", "contact_number": "6496141726"}	2026-02-01 10:33:59.081999	2026-02-01 10:34:37.355284
17442d7c-d470-49d1-9914-d5dd0d45e295	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Manav Khan	9710524816	Hibernating	{"cohort": "Hibernating", "customer_name": "Manav Khan", "contact_number": "9710524816"}	2026-02-01 10:33:59.082002	2026-02-01 10:34:37.355321
e0bcf82b-495d-4fc6-ad1e-0dc3b4468301	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dev Naik	6627955944	New Customers	{"cohort": "New Customers", "customer_name": "Dev Naik", "contact_number": "6627955944"}	2026-02-01 10:33:59.082005	2026-02-01 10:34:37.355358
c7c4b89e-0baa-4f88-8cae-6773e1d67abd	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aman Saha	6509845936	Need Attention	{"cohort": "Need Attention", "customer_name": "Aman Saha", "contact_number": "6509845936"}	2026-02-01 10:33:59.082008	2026-02-01 10:34:37.355394
576cbdde-4400-4d17-b60b-a26c51226e10	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Aditi Shetty	9096383872	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Aditi Shetty", "contact_number": "9096383872"}	2026-02-01 10:33:59.08201	2026-02-01 10:34:37.35543
8dcdde20-b3f8-4c16-a129-1f75050b778d	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Dhruv Kulkarni	7103168630	Loyal Customers	{"cohort": "Loyal Customers", "customer_name": "Dhruv Kulkarni", "contact_number": "7103168630"}	2026-02-01 10:33:59.082013	2026-02-01 10:34:37.355466
51efa1ed-ce7b-4c8b-bffa-442a93d4da4e	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Nikhil Mishra	9711754053	Promising	{"cohort": "Promising", "customer_name": "Nikhil Mishra", "contact_number": "9711754053"}	2026-02-01 10:33:59.082016	2026-02-01 10:34:37.355503
f5678f74-95b1-4751-aa85-c0a1c974fdb4	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rashmi Kaur	9903374265	Potential Loyalist	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Kaur", "contact_number": "9903374265"}	2026-02-01 10:33:59.082018	2026-02-01 10:34:37.35554
25731363-e289-4c08-9fa0-fe8dba2bde5f	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Shreya Saha	7720740962	Need Attention	{"cohort": "Need Attention", "customer_name": "Shreya Saha", "contact_number": "7720740962"}	2026-02-01 10:33:59.082021	2026-02-01 10:34:37.355576
3dcff5ec-fb43-424e-a88e-d69db9d24195	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Rohan Mukherjee	7069806808	Champions	{"cohort": "Champions", "customer_name": "Rohan Mukherjee", "contact_number": "7069806808"}	2026-02-01 10:33:59.082024	2026-02-01 10:34:37.355612
a388f6b6-81d8-48a0-83f9-a14baff04778	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Mansi Shah	6472848963	Lost	{"cohort": "Lost", "customer_name": "Mansi Shah", "contact_number": "6472848963"}	2026-02-01 10:33:59.082027	2026-02-01 10:34:37.35565
5d5f774f-8dc7-42ca-95f8-a6d57bad8f64	2cac138f-33dd-40bd-bb11-e137e562db6c	Sample	Anika Tiwari	7392010271	Lost	{"cohort": "Lost", "customer_name": "Anika Tiwari", "contact_number": "7392010271"}	2026-02-01 10:33:59.082029	2026-02-01 10:34:37.355686
\.


--
-- Data for Name: archived_campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.archived_campaigns (id, original_campaign_id, company_id, user_id, name, status, phone_number, team_member_role, team_member_department, decision_context, quality_score, quality_gap, brand_context, customer_context, team_member_context, preliminary_questions, question_bank, incentive_bank, cohort_questions, cohort_incentives, incentive, total_call_target, call_duration, cohort_config, selected_cohorts, execution_windows, cohort_data, goal_details, original_created_at, original_updated_at, archived_at) FROM stdin;
d3504df7-3818-43cf-8ed0-2a5936f4b66a	67d26a4c-26a6-4a55-91da-e72f6449be94	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	AA	DRAFT	+91 8668462386	Founder	HQ	{}	0	\N	Faasos is a delivery-first food brand known primarily for wraps and rolls, positioned as a quick and filling meal option. Customers typically order for convenience, familiar flavours, and a product format that travels well for delivery.	To understand why the customer orders Faasos repeatedly, what they like most (items, taste, convenience), and what 1–2 improvements would increase order frequency (quality consistency, portioning, delivery, packaging, pricing).	The interview will be conducted by a Customer Experience team member from Faasos, focused on understanding the customer’s real ordering experience, satisfaction drivers, and improvement areas.	[]	[]	["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"]	{}	{}		\N	600	{}	[]	[{"day": "2026-02-01", "end": "11:00", "start": "09:00"}]	{}	[]	2026-02-01 02:37:10.35039	2026-02-01 03:31:00.78206	2026-02-01 04:02:59.808519
8e485e98-b8d2-4f91-b6a0-c0c8acf772df	042ac4bb-581a-4835-ba89-68f9884c5d72	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2		DRAFT	+91 8668462386	Founder	HQ	{}	0	\N	Mumbai Pav Co is a street-food brand serving Mumbai-style favourites like Pav Bhaji, Dabeli, and Vada Pav, with a focus on consistent taste and delivery-friendly packaging.		Hi, I'm Param Jain, Founder from the HQ team at SquareUp.	[]	[]	["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"]	{}	{}		\N	600	{}	[]	[{"day": "2026-02-01", "end": "11:00", "start": "09:00"}]	{}	[]	2026-02-01 06:36:53.555145	2026-02-01 06:44:20.155239	2026-02-01 06:44:42.377002
736a5f15-85a4-4ac1-bbd4-7d40cbe61563	2cac138f-33dd-40bd-bb11-e137e562db6c	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	Sample	DRAFT		\N	\N	{}	0	\N	Mumbai Pav Co is a street-food brand serving Mumbai-style favourites like Pav Bhaji, Dabeli, and Vada Pav, with a focus on consistent taste and delivery-friendly packaging.	Hola	Hi, I'm John Doe, CEO from the Management team at SquareUp.	[]	[]	["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"]	{}	{}		\N	600	{}	[]	[{"day": "2026-02-01", "end": "17:15", "start": "16:15"}]	{}	[]	2026-02-01 10:33:59.069171	2026-02-01 10:34:11.680535	2026-02-01 10:34:37.320846
\.


--
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_trail (id, company_id, brand_id, workspace_id, actor_id, action, resource_type, resource_id, event_data, ip_address, user_agent, created_at) FROM stdin;
ddeb0c56-656a-4d71-b081-9bc19d60e9e3	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:31:36.974835
297b0aa7-265b-44e4-a642-88b57655a54e	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:32:09.514717
52b05fbf-637f-49bf-9c7a-957760f94efd	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:32:42.295947
c319692a-3520-4aa5-aeeb-9feb710c00fa	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:32:45.175163
cf492b49-d0f1-4a1e-a797-c4b3dad4adf5	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:32:48.616881
4736ca3e-da0d-411a-8eae-fa2bb4c93c92	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:32:50.882804
cb35d476-3d02-4999-8355-5b944db29e31	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	886758a9-e45a-4085-851b-ae67551e48f9	b4d29909-8a2c-4a26-8c49-603220ca9572	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.completed	company	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	{"onboarding_id": "5a8ae6b2-529f-4124-bf2c-d7c34a1fba83", "brand_name": "Mumbai Pav Co", "company_name": "Tidal Food Ventures Private Limited", "category": "QSR (Quick Service Restaurants)"}	\N	\N	2026-02-01 01:32:50.912498
164f4b73-885f-4ae7-85c5-6a888160c287	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:33:03.555369
10853f3e-a641-4615-8f9f-4dc99ba6fd1b	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:33:31.209924
3f9f79b5-a656-432c-a5fc-113f6587133a	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:33:44.734315
f1223c3e-bcd0-4e04-9bc8-3dfd2fbb959a	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:33:55.762788
e711844d-d0e5-43a2-9f33-4980a7280bf7	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:37:11.833892
948c92b5-69f9-4e13-a0cc-1ca93ab29285	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:37:32.645701
8c018b0b-a172-4f99-bbe5-2212d16bb35d	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:38:13.75307
cda70443-bc22-4526-aac6-a5c9c42fe74a	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:41:21.115774
d0ee30fd-5efc-48d4-8263-78d72bce0aa8	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:42:26.205089
fc403adf-e152-4526-a87e-3d498610bbc4	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:42:26.148811
61e14215-4183-4789-ab06-97f1744f76b9	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:46:56.670824
515fc0a1-63f1-42c5-9a07-fc724f6e845e	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:57:31.865102
3c3db5b9-c7c6-44e1-baf4-014ecacd8318	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:57:32.802795
4df9c96a-2c0d-4fab-b8f8-9b9c604a1a83	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:57:43.923617
77ecbddf-51ac-4acc-b4e5-9dde0b5e4dee	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 01:58:13.723899
eb4f1e91-f0c0-4810-9195-0255868d871d	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:00:17.372721
1776179a-b00b-4441-adba-3089909da572	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:00:18.356751
a3a47094-ffdc-46ba-9288-f7020ce8e7bb	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:00:52.296815
f8dc9350-5288-49e1-9f07-95501950b0a5	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:01:01.713727
bf7649cd-9755-48af-bd2a-25b67aeaa322	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:01:03.532275
26ce9ba3-3099-4638-8b7d-56534a6f7934	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:02:01.353606
287c1571-633f-433d-b9ff-7cb010bb1ea8	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:02:09.765922
9e0d2516-28b8-4dc0-ae40-5d8fe0c3a438	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:02:49.345707
d32e246b-84b1-4762-9056-c3263ca52e03	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:03:25.12749
89b286c3-967f-4d71-8fee-01f9d9225091	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:04:04.976985
7e83a56e-587d-4274-8adf-a62811419c40	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:04:48.940868
7750e48d-7cc9-4b06-b809-1a719d4ac1a9	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:06:03.456955
b9497e87-a839-4636-be65-2d4af35cc857	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:09:13.542048
eaf829a8-5352-424c-84f8-b83d73d7a1d3	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	886758a9-e45a-4085-851b-ae67551e48f9	b4d29909-8a2c-4a26-8c49-603220ca9572	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.completed	company	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	{"onboarding_id": "5a8ae6b2-529f-4124-bf2c-d7c34a1fba83", "brand_name": "Mumbai Pav Co", "company_name": "Tidal Food Ventures Private Limited", "category": "QSR (Quick Service Restaurants)"}	\N	\N	2026-02-01 02:09:13.562764
bf765bc6-4361-49ef-9a0b-8d2da055e1c4	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:06:44.621617
1d3a8f0e-8afd-4993-86b2-0c39e2594f01	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:09:10.99357
1d3e80b5-48f3-42b8-80a7-1ebdab96a837	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:09:04.422245
e200d9fe-b4e1-4e3d-bfff-f605252e317e	00000000-0000-0000-0000-000000000000	\N	\N	QrOwZmlu4ycKYdaUMz09rh0CoCc2	onboarding.basics_saved	onboarding_state	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	{"page": "basics", "data_keys": ["companyName", "brandName", "category", "region"]}	\N	\N	2026-02-01 02:09:08.297818
\.


--
-- Data for Name: brand; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brand (created_by, updated_by, id, company_id, name, created_at) FROM stdin;
QrOwZmlu4ycKYdaUMz09rh0CoCc2	QrOwZmlu4ycKYdaUMz09rh0CoCc2	886758a9-e45a-4085-851b-ae67551e48f9	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	Mumbai Pav Co	2026-02-01 01:32:50.901439
\.


--
-- Data for Name: brand_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brand_metric (id, brand_id, metric_date, total_revenue, currency, active_sources_count, total_inventory_value, insights, updated_at) FROM stdin;
\.


--
-- Data for Name: business_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_metric (id, metric_date, total_users, active_users_daily, active_users_weekly, active_users_monthly, new_users, churned_users, total_companies, new_companies, active_companies, total_workspaces, new_workspaces, active_workspaces, total_integrations, new_integrations, active_integrations, onboarding_started, onboarding_completed, onboarding_completion_rate, avg_session_duration_seconds, avg_page_views_per_user, mrr, arr, created_at, updated_at) FROM stdin;
75d3b9a0-c95e-4033-8927-9fc8a6c20b9a	2026-02-01	2	2	2	2	2	0	3	3	0	1	0	0	0	0	0	1	1	100	\N	\N	\N	\N	2026-02-01 01:43:36.773644	2026-02-01 07:35:31.501035
\.


--
-- Data for Name: calendar_connection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendar_connection (id, company_id, user_id, provider, credentials, status, expiry, last_synced_at, created_at, updated_at) FROM stdin;
8a5e7424-75da-43fd-a4b0-8f1efd09af09	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	google	{"token": "MASKED_TOKEN", "scopes": ["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/calendar.events"], "client_id": "527397315020-1uhaua0noh50e7qtrijcitjl44v2bscj.apps.googleusercontent.com", "token_uri": "https://oauth2.googleapis.com/token", "client_secret": "MASKED_CLIENT_SECRET", "refresh_token": "MASKED_REFRESH_TOKEN"}	active	2026-02-01 03:34:54	\N	2026-02-01 02:34:54.688756	2026-02-01 02:34:54.689183
\.


--
-- Data for Name: campaign_leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campaign_leads (id, campaign_id, customer_name, contact_number, cohort, status, meta_data, created_at) FROM stdin;
31dc389d-bd65-4d37-ab69-bb02083d5a32	66e326b8-1664-439d-820e-aff3c700aea7	Sameer Iyer	7756343432	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sameer Iyer", "contact_number": "7756343432"}	2026-02-01 02:13:16.593117
1f141798-4755-488a-9476-c4963444fc97	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Gill	8872090747	Lost	PENDING	{"cohort": "Lost", "customer_name": "Vivaan Gill", "contact_number": "8872090747"}	2026-02-01 02:13:16.593125
6d01d266-c07f-4d9d-9912-c75a952c08dc	66e326b8-1664-439d-820e-aff3c700aea7	Anika Mukherjee	9647026354	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Anika Mukherjee", "contact_number": "9647026354"}	2026-02-01 02:13:16.593128
f37bd502-7d0b-4390-9375-44bad655d890	66e326b8-1664-439d-820e-aff3c700aea7	Myra Nair	8473722111	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Myra Nair", "contact_number": "8473722111"}	2026-02-01 02:13:16.593131
0afba5a8-01ee-4d03-91cf-79200b169fae	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Reddy	7172575982	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ayush Reddy", "contact_number": "7172575982"}	2026-02-01 02:13:16.593134
e18df74e-a878-4462-8d8c-7a969f728314	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Gill	8105295618	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Mohit Gill", "contact_number": "8105295618"}	2026-02-01 02:13:16.593136
c2ee84e0-6a2c-4b5d-b3a3-b52ba0aa5ef2	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Shetty	9102439281	Champions	PENDING	{"cohort": "Champions", "customer_name": "Nandini Shetty", "contact_number": "9102439281"}	2026-02-01 02:13:16.593139
55ca60c7-6204-4aa8-a58a-33bad0400db9	66e326b8-1664-439d-820e-aff3c700aea7	Sai Yadav	6406015391	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Sai Yadav", "contact_number": "6406015391"}	2026-02-01 02:13:16.593141
db991446-e482-4c1e-827a-3238d8bef628	66e326b8-1664-439d-820e-aff3c700aea7	Manav Gupta	9672544893	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Manav Gupta", "contact_number": "9672544893"}	2026-02-01 02:13:16.593144
0a41b377-bdad-4fe4-a56e-952939c5e410	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Shah	6679226110	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Vivaan Shah", "contact_number": "6679226110"}	2026-02-01 02:13:16.593146
81e72fe8-b6ef-42e6-8e53-e5f84dd28eba	66e326b8-1664-439d-820e-aff3c700aea7	Ira Chatterjee	6464022802	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Chatterjee", "contact_number": "6464022802"}	2026-02-01 02:13:16.593149
3e9692dd-0a60-4b90-bc6b-5dfbe39f7595	66e326b8-1664-439d-820e-aff3c700aea7	Neha Chaudhary	8766945698	Lost	PENDING	{"cohort": "Lost", "customer_name": "Neha Chaudhary", "contact_number": "8766945698"}	2026-02-01 02:13:16.593152
3b397043-5962-4e0a-bb90-812ae10dbf2f	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Rao	6075894434	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Vivaan Rao", "contact_number": "6075894434"}	2026-02-01 02:13:16.593155
cc3f899a-58fd-419e-b558-a6dd1a348630	66e326b8-1664-439d-820e-aff3c700aea7	Diya Arora	8540043209	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Diya Arora", "contact_number": "8540043209"}	2026-02-01 02:13:16.593158
150aa8a4-1b25-4b55-a26c-72bfaeca679b	66e326b8-1664-439d-820e-aff3c700aea7	Aman Bhat	6962074691	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Bhat", "contact_number": "6962074691"}	2026-02-01 02:13:16.59316
352e8753-94e0-4938-82c0-41556d7ce207	66e326b8-1664-439d-820e-aff3c700aea7	Sneha Tripathi	9640336836	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sneha Tripathi", "contact_number": "9640336836"}	2026-02-01 02:13:16.593163
fb5334b8-0c42-4056-8533-c940c713666d	66e326b8-1664-439d-820e-aff3c700aea7	Myra Tiwari	8647002178	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Myra Tiwari", "contact_number": "8647002178"}	2026-02-01 02:13:16.593165
09594aab-16b7-4bb5-82c2-4a62d530f527	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Saha	6654137672	Promising	PENDING	{"cohort": "Promising", "customer_name": "Shreya Saha", "contact_number": "6654137672"}	2026-02-01 02:13:16.593168
462f8567-d3a1-4046-96ef-73a65f7397de	66e326b8-1664-439d-820e-aff3c700aea7	Avni Sharma	7946196215	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Avni Sharma", "contact_number": "7946196215"}	2026-02-01 02:13:16.593171
27f8747a-2295-492b-ac3b-447260614e7d	66e326b8-1664-439d-820e-aff3c700aea7	Parth Singh	9099418475	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Parth Singh", "contact_number": "9099418475"}	2026-02-01 02:13:16.593173
272883a8-2e7f-4fa0-9575-716cd9f02749	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Mishra	8444411571	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Harsh Mishra", "contact_number": "8444411571"}	2026-02-01 02:13:16.593175
e7c1b8d9-dc5e-40db-9c20-a0a822f048b6	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Saha	6274958225	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rahul Saha", "contact_number": "6274958225"}	2026-02-01 02:13:16.593178
b867d9e5-6ef4-4b64-9384-0067bc9774cd	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Roy	9844373989	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ishaan Roy", "contact_number": "9844373989"}	2026-02-01 02:13:16.593181
c437ae2c-2635-420a-8896-932169b0a05b	66e326b8-1664-439d-820e-aff3c700aea7	Parth Bansal	7527077836	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Parth Bansal", "contact_number": "7527077836"}	2026-02-01 02:13:16.593183
6ac83109-a172-4083-aa34-d50af817aa31	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Shah	7405588454	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Reyansh Shah", "contact_number": "7405588454"}	2026-02-01 02:13:16.593186
81a5ffbb-a272-4224-864c-0e0fa9939c3d	66e326b8-1664-439d-820e-aff3c700aea7	Varun Reddy	7461493668	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Reddy", "contact_number": "7461493668"}	2026-02-01 02:13:16.593189
979754ff-c892-48a1-a129-b59cbd0a7ae3	66e326b8-1664-439d-820e-aff3c700aea7	Kunal Aggarwal	9968456262	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kunal Aggarwal", "contact_number": "9968456262"}	2026-02-01 02:13:16.593191
f5cebde6-7029-469d-a583-72a3ffddc469	66e326b8-1664-439d-820e-aff3c700aea7	Naina Bose	7740684690	Promising	PENDING	{"cohort": "Promising", "customer_name": "Naina Bose", "contact_number": "7740684690"}	2026-02-01 02:13:16.593194
cbb2d404-aa98-4d66-be83-9f9007433b00	66e326b8-1664-439d-820e-aff3c700aea7	Avni Gupta	6231557108	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Avni Gupta", "contact_number": "6231557108"}	2026-02-01 02:13:16.593196
3432d436-a08f-42db-b82c-d030d7324082	66e326b8-1664-439d-820e-aff3c700aea7	Dev Pandey	7452646842	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dev Pandey", "contact_number": "7452646842"}	2026-02-01 02:13:16.593199
916969b2-d8e2-4457-8712-3353556589d9	66e326b8-1664-439d-820e-aff3c700aea7	Sneha Iyer	7099296439	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Iyer", "contact_number": "7099296439"}	2026-02-01 02:13:16.593201
12f4b288-5101-48ac-866f-0cb4f300616f	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Malhotra	9133260830	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rupali Malhotra", "contact_number": "9133260830"}	2026-02-01 02:13:16.593204
0096d0e6-6300-4b94-8290-6283b9ddad92	66e326b8-1664-439d-820e-aff3c700aea7	Sai Rao	6978972821	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sai Rao", "contact_number": "6978972821"}	2026-02-01 02:13:16.593206
b64b0a87-411e-48ab-b987-6ca5d2935b97	66e326b8-1664-439d-820e-aff3c700aea7	Kiara Srinivasan	8676869634	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kiara Srinivasan", "contact_number": "8676869634"}	2026-02-01 02:13:16.593209
33b1a57d-e951-463b-852c-126168a199b4	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Kapoor	8702711595	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aditi Kapoor", "contact_number": "8702711595"}	2026-02-01 02:13:16.593211
6e85ba3c-24a5-4611-86be-e65f43e6b8fa	66e326b8-1664-439d-820e-aff3c700aea7	Kavya Das	8828487319	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Kavya Das", "contact_number": "8828487319"}	2026-02-01 02:13:16.593214
77fa8142-7c6c-43c1-a500-0d784689570c	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Patel	7726638503	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ritvik Patel", "contact_number": "7726638503"}	2026-02-01 02:13:16.593216
91f4e336-9199-48ea-9a13-9951275106df	66e326b8-1664-439d-820e-aff3c700aea7	Aditya Gowda	8546658912	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aditya Gowda", "contact_number": "8546658912"}	2026-02-01 02:13:16.593219
03702aaa-d079-4cf4-ba11-998dea404ecd	66e326b8-1664-439d-820e-aff3c700aea7	Myra Bajaj	6693666476	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Myra Bajaj", "contact_number": "6693666476"}	2026-02-01 02:13:16.593221
e6ed5215-be12-410f-a1de-7c4f469c0de3	66e326b8-1664-439d-820e-aff3c700aea7	Kiara Shah	6193408146	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Kiara Shah", "contact_number": "6193408146"}	2026-02-01 02:13:16.593223
2bb2770b-10c4-4237-9f60-53fdb757c740	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Chatterjee	9578686926	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Pallavi Chatterjee", "contact_number": "9578686926"}	2026-02-01 02:13:16.593226
f8f99ee9-91cf-45d1-b682-433c341a952e	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Reddy	7498065933	Promising	PENDING	{"cohort": "Promising", "customer_name": "Trisha Reddy", "contact_number": "7498065933"}	2026-02-01 02:13:16.593233
b85aaf99-521d-4349-9b7c-2ffaaa9fc5ca	66e326b8-1664-439d-820e-aff3c700aea7	Varun Saha	7998026903	Champions	PENDING	{"cohort": "Champions", "customer_name": "Varun Saha", "contact_number": "7998026903"}	2026-02-01 02:13:16.593236
01547d78-8ba3-4640-9dcf-201aad20efb7	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Srinivasan	7728558277	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nikhil Srinivasan", "contact_number": "7728558277"}	2026-02-01 02:13:16.593238
68cf1eb5-7880-4e10-a0ce-b99553e783d9	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Kapoor	6299571813	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mansi Kapoor", "contact_number": "6299571813"}	2026-02-01 02:13:16.593241
2dcde58a-1749-46d2-9d00-289eec5ffbd8	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Kapoor	7502141043	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ananya Kapoor", "contact_number": "7502141043"}	2026-02-01 02:13:16.593243
5de9c267-29ca-4177-a74a-b0a308230aff	66e326b8-1664-439d-820e-aff3c700aea7	Kunal Roy	6426796360	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Kunal Roy", "contact_number": "6426796360"}	2026-02-01 02:13:16.593246
1b934eed-19d3-43c9-a118-370721ae7bf0	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Saha	9841748311	Promising	PENDING	{"cohort": "Promising", "customer_name": "Gaurav Saha", "contact_number": "9841748311"}	2026-02-01 02:13:16.593248
0f2b2d6c-b6d6-4c27-aaf5-21f6fa2de2ed	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Hegde	8352547168	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Hegde", "contact_number": "8352547168"}	2026-02-01 02:13:16.593251
45545d4b-8883-4062-a1ed-348c499b8b11	66e326b8-1664-439d-820e-aff3c700aea7	Aman Patel	7484837332	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Patel", "contact_number": "7484837332"}	2026-02-01 02:13:16.593253
ac52c264-8ed2-4d04-a138-f1ba09b53400	66e326b8-1664-439d-820e-aff3c700aea7	Naina Srinivasan	7640047310	Lost	PENDING	{"cohort": "Lost", "customer_name": "Naina Srinivasan", "contact_number": "7640047310"}	2026-02-01 02:13:16.593256
ebcebadb-2dfd-4543-89f3-3dd75b00e469	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Shetty	8648949023	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "8648949023"}	2026-02-01 02:13:16.593258
37872c7b-2d26-488a-a350-89bbdc35e0bd	66e326b8-1664-439d-820e-aff3c700aea7	Dev Mukherjee	6526218375	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Dev Mukherjee", "contact_number": "6526218375"}	2026-02-01 02:13:16.59326
7447c406-3c8d-4103-98eb-f110e0b14b2e	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Pandey	9898660982	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ananya Pandey", "contact_number": "9898660982"}	2026-02-01 02:13:16.593263
fd6985fe-e503-4ad6-a561-1b8926a0bfe7	66e326b8-1664-439d-820e-aff3c700aea7	Varun Saha	7279311607	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Varun Saha", "contact_number": "7279311607"}	2026-02-01 02:13:16.593265
1f6e5bb1-3451-42d5-a285-ab79120c2be4	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Srinivasan	6053413395	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Rupali Srinivasan", "contact_number": "6053413395"}	2026-02-01 02:13:16.593268
f3dc1942-dbb4-45a5-bb94-6dc5cef38383	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Rao	6170044642	Champions	PENDING	{"cohort": "Champions", "customer_name": "Harsh Rao", "contact_number": "6170044642"}	2026-02-01 02:13:16.59327
eed9d952-c0db-410c-83ca-34034b075474	66e326b8-1664-439d-820e-aff3c700aea7	Myra Hegde	6316553290	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Myra Hegde", "contact_number": "6316553290"}	2026-02-01 02:13:16.593272
749717af-f81a-4d92-bae2-c1e0aeb4e514	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Bajaj	7321230713	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Bajaj", "contact_number": "7321230713"}	2026-02-01 02:13:16.593275
66a74aa3-39b9-481a-a704-cd9f51c14cd4	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Mehta	7588080098	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Mehta", "contact_number": "7588080098"}	2026-02-01 02:13:16.593277
8edd7547-7c79-46c4-a5e5-27b4d60aa5bc	66e326b8-1664-439d-820e-aff3c700aea7	Myra Gupta	9574103868	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Myra Gupta", "contact_number": "9574103868"}	2026-02-01 02:13:16.59328
678571a6-6f97-4ef3-96ef-47fb9e0149cf	66e326b8-1664-439d-820e-aff3c700aea7	Avni Jain	8082553333	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Jain", "contact_number": "8082553333"}	2026-02-01 02:13:16.593282
c11845c2-7056-4c2e-865f-de3d09c06203	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Saha	7065173961	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arnav Saha", "contact_number": "7065173961"}	2026-02-01 02:13:16.593285
bbf7ee89-bd71-409a-b20a-fe2fe622e6f4	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Roy	6116761747	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Roy", "contact_number": "6116761747"}	2026-02-01 02:13:16.593287
0da627e7-2e0a-4918-9adf-78dd9b9bedb3	66e326b8-1664-439d-820e-aff3c700aea7	Anvi Prasad	9686939344	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Anvi Prasad", "contact_number": "9686939344"}	2026-02-01 02:13:16.59329
00df2782-8e2e-406f-b0df-d014dc854488	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Arora	8753040326	Promising	PENDING	{"cohort": "Promising", "customer_name": "Sakshi Arora", "contact_number": "8753040326"}	2026-02-01 02:13:16.593292
a5e5ab60-5364-4696-81d8-9b48e579e7a2	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Roy	6654578486	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rohan Roy", "contact_number": "6654578486"}	2026-02-01 02:13:16.593295
c9ae6947-cd69-4706-885c-112d4d66ffaf	66e326b8-1664-439d-820e-aff3c700aea7	Aman Deshmukh	8659488906	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aman Deshmukh", "contact_number": "8659488906"}	2026-02-01 02:13:16.593297
1b51d509-2d24-4bdb-8195-b4a2b6e244a5	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Narayan	6244513243	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arnav Narayan", "contact_number": "6244513243"}	2026-02-01 02:13:16.593299
0cdd2809-ec0d-4fa7-9819-6e111bc291df	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Menon	6760062769	Lost	PENDING	{"cohort": "Lost", "customer_name": "Nikhil Menon", "contact_number": "6760062769"}	2026-02-01 02:13:16.593302
d3a53e5a-2acc-4adc-8817-9386eeb44c0f	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Nair	7351396359	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aarohi Nair", "contact_number": "7351396359"}	2026-02-01 02:13:16.593304
e11c6151-46c1-4da0-83a8-25984f6b629f	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Gill	8563179990	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Saanvi Gill", "contact_number": "8563179990"}	2026-02-01 02:13:16.593307
e92737fd-4d8c-434c-a9d5-728f17c96987	66e326b8-1664-439d-820e-aff3c700aea7	Pooja Shetty	9503937191	Champions	PENDING	{"cohort": "Champions", "customer_name": "Pooja Shetty", "contact_number": "9503937191"}	2026-02-01 02:13:16.593309
e1a12f11-177c-4880-89a3-e79351a374fc	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Gill	8817880371	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aarohi Gill", "contact_number": "8817880371"}	2026-02-01 02:13:16.593312
5e0f5cc4-9f7b-4627-841d-72530068e784	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Mishra	9116697037	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Shreya Mishra", "contact_number": "9116697037"}	2026-02-01 02:13:16.593314
a8c82a49-9ca1-4be6-a0fd-04a26448143d	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Yadav	9677229791	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Yadav", "contact_number": "9677229791"}	2026-02-01 02:13:16.593316
3851a16b-d6b6-49eb-bc24-30bd5e6cc708	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Kapoor	9423598812	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arnav Kapoor", "contact_number": "9423598812"}	2026-02-01 02:13:16.593319
295a07ab-3dc7-4c6e-9c69-55febf36f147	66e326b8-1664-439d-820e-aff3c700aea7	Myra Nair	9851882729	Champions	PENDING	{"cohort": "Champions", "customer_name": "Myra Nair", "contact_number": "9851882729"}	2026-02-01 02:13:16.593321
3b716211-4c1f-47a0-afee-1290ccba7e63	66e326b8-1664-439d-820e-aff3c700aea7	Neha Deshmukh	7809889433	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Deshmukh", "contact_number": "7809889433"}	2026-02-01 02:13:16.593324
57527d3b-2f10-4305-9363-c73e749e0bea	66e326b8-1664-439d-820e-aff3c700aea7	Sai Sood	9930986712	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9930986712"}	2026-02-01 02:13:16.593326
e6f4c956-18d3-4b29-94bb-cf6dea9655f1	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Iyer	9617400285	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Vihaan Iyer", "contact_number": "9617400285"}	2026-02-01 02:13:16.59333
12aaaa49-8d7b-48bb-bd5d-d4e3db6b0a38	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Srinivasan	9123047419	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Srinivasan", "contact_number": "9123047419"}	2026-02-01 02:13:16.593333
86686089-87ae-42df-b8b1-f1ded2be2663	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Hegde	6657203516	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ananya Hegde", "contact_number": "6657203516"}	2026-02-01 02:13:16.593335
0ce77c41-2f0b-4db5-bafa-21b78eb97f62	66e326b8-1664-439d-820e-aff3c700aea7	Manav Chaudhary	8055953469	Champions	PENDING	{"cohort": "Champions", "customer_name": "Manav Chaudhary", "contact_number": "8055953469"}	2026-02-01 02:13:16.593338
984daa2a-d0a3-480b-9e22-55b3e98e6c52	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Malhotra	8730261571	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Malhotra", "contact_number": "8730261571"}	2026-02-01 02:13:16.59334
aa64faaa-77d7-447c-8364-c6def7f8ee81	66e326b8-1664-439d-820e-aff3c700aea7	Varun Chaudhary	8581746680	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Varun Chaudhary", "contact_number": "8581746680"}	2026-02-01 02:13:16.593343
3925f67a-08d1-4d99-a6c7-fab9bae0ecec	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Naik	9027833384	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nikhil Naik", "contact_number": "9027833384"}	2026-02-01 02:13:16.593345
bd0820cf-63c3-4a2b-ab96-88d291fbfb0f	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Rao	6713783138	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aarohi Rao", "contact_number": "6713783138"}	2026-02-01 02:13:16.593348
343d6dbf-aacc-4345-ba7c-3e9e0682fedc	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Sharma	9839449587	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Trisha Sharma", "contact_number": "9839449587"}	2026-02-01 02:13:16.59335
0ef6725b-7a04-40d4-a2a2-1c926f7366fb	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Kaur	6491213247	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mohit Kaur", "contact_number": "6491213247"}	2026-02-01 02:13:16.593353
7b2d3f29-a266-4dc6-83ba-57703d6917a4	66e326b8-1664-439d-820e-aff3c700aea7	Ayaan Hegde	7630839299	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ayaan Hegde", "contact_number": "7630839299"}	2026-02-01 02:13:16.593355
64e91823-e73c-499c-9dbb-7c4fbfce07ef	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Shetty	6645710864	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Sakshi Shetty", "contact_number": "6645710864"}	2026-02-01 02:13:16.593357
50259a3a-98ee-48ee-a040-88df9740eafd	66e326b8-1664-439d-820e-aff3c700aea7	Parth Saha	7073356693	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Parth Saha", "contact_number": "7073356693"}	2026-02-01 02:13:16.59336
440e7c2a-65ce-4219-9e91-0a12b7fc5319	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Narayan	6553621743	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Dhruv Narayan", "contact_number": "6553621743"}	2026-02-01 02:13:16.593362
0eef0838-9d91-453c-8aba-931710071553	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Iyer	6224929418	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Rahul Iyer", "contact_number": "6224929418"}	2026-02-01 02:13:16.593365
478eeb8f-c386-4cf6-a0f6-aee4bd82404e	66e326b8-1664-439d-820e-aff3c700aea7	Kiara Mishra	9179899675	Promising	PENDING	{"cohort": "Promising", "customer_name": "Kiara Mishra", "contact_number": "9179899675"}	2026-02-01 02:13:16.593367
0122a6f1-f546-4b8e-a334-841da9d9e2f3	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Pandey	8887967512	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ananya Pandey", "contact_number": "8887967512"}	2026-02-01 02:13:16.59337
d64e1170-f4e5-4004-b838-b0cc3d727c84	66e326b8-1664-439d-820e-aff3c700aea7	Aarav Kaur	7243549180	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarav Kaur", "contact_number": "7243549180"}	2026-02-01 02:13:16.593372
499396dc-b953-489b-b587-8fa499747d8b	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Kaur	9975780964	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sakshi Kaur", "contact_number": "9975780964"}	2026-02-01 02:13:16.593375
d94402da-3c48-471e-b91c-154055794d40	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Joshi	8185571588	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aarohi Joshi", "contact_number": "8185571588"}	2026-02-01 02:13:16.593377
d8165f0a-ea82-4b9c-8fdd-abde80742295	66e326b8-1664-439d-820e-aff3c700aea7	Parth Khan	7319295201	Champions	PENDING	{"cohort": "Champions", "customer_name": "Parth Khan", "contact_number": "7319295201"}	2026-02-01 02:13:16.593379
60bbf6ea-cbc5-47a7-86fc-ed23310276aa	66e326b8-1664-439d-820e-aff3c700aea7	Neha Reddy	8135519167	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Neha Reddy", "contact_number": "8135519167"}	2026-02-01 02:13:16.593382
75a16cd2-cf91-494a-9bea-597f3411e060	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Srinivasan	8858006567	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Trisha Srinivasan", "contact_number": "8858006567"}	2026-02-01 02:13:16.593384
49a9955c-6ff0-4263-8d4a-99ae2f72ccfe	66e326b8-1664-439d-820e-aff3c700aea7	Meera Srinivasan	9608563284	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Srinivasan", "contact_number": "9608563284"}	2026-02-01 02:13:16.593387
cf0b2e0b-f764-4271-ae47-38927a2af468	66e326b8-1664-439d-820e-aff3c700aea7	Neha Chaudhary	9004426377	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Neha Chaudhary", "contact_number": "9004426377"}	2026-02-01 02:13:16.593389
c35a430f-46c7-4754-b2f8-e544b6a41c9b	66e326b8-1664-439d-820e-aff3c700aea7	Diya Menon	8913534220	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Diya Menon", "contact_number": "8913534220"}	2026-02-01 02:13:16.593392
94406a91-0f00-4507-b62f-df453a1a7f84	66e326b8-1664-439d-820e-aff3c700aea7	Siddharth Sood	8984998971	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Siddharth Sood", "contact_number": "8984998971"}	2026-02-01 02:13:16.593394
f5ecc281-b599-4e8b-bb42-e54ec44ef1c4	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Shetty	7454309592	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "7454309592"}	2026-02-01 02:13:16.593396
ff59d1b7-30ed-42e4-b9f3-dfccad69d6cc	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Naik	8025862011	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dhruv Naik", "contact_number": "8025862011"}	2026-02-01 02:13:16.593399
65e7a4d7-34a8-43f5-9e79-91dd947a808d	66e326b8-1664-439d-820e-aff3c700aea7	Anvi Sharma	8773451505	Champions	PENDING	{"cohort": "Champions", "customer_name": "Anvi Sharma", "contact_number": "8773451505"}	2026-02-01 02:13:16.593401
5c9bbfe8-e5a4-4b71-99b1-91f7bb7689d4	66e326b8-1664-439d-820e-aff3c700aea7	Naina Jain	8866103953	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Naina Jain", "contact_number": "8866103953"}	2026-02-01 02:13:16.593404
e6856b5d-dafc-44ac-9824-3579fa4e6a3f	66e326b8-1664-439d-820e-aff3c700aea7	Riya Verma	7155013446	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Riya Verma", "contact_number": "7155013446"}	2026-02-01 02:13:16.593406
c902df5d-a069-43d6-9303-1746de51c0a8	66e326b8-1664-439d-820e-aff3c700aea7	Ayaan Kapoor	7361972385	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ayaan Kapoor", "contact_number": "7361972385"}	2026-02-01 02:13:16.593408
f4d8db36-0787-4328-9cc3-cb80133a56c3	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Ghosh	8403143886	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sakshi Ghosh", "contact_number": "8403143886"}	2026-02-01 02:13:16.593411
eab7f2b5-e998-4a03-81d6-86ec93e257c1	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Mehta	9269520457	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Mehta", "contact_number": "9269520457"}	2026-02-01 02:13:16.593413
2e9969d8-3095-4124-ae17-90106fc92339	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Prasad	9160910316	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Saanvi Prasad", "contact_number": "9160910316"}	2026-02-01 02:13:16.593416
6047f617-2456-4e8b-89a0-d1b387aa94e4	66e326b8-1664-439d-820e-aff3c700aea7	Sai Shah	9564877559	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sai Shah", "contact_number": "9564877559"}	2026-02-01 02:13:16.593418
899184f6-4593-4b1c-a63d-269ba161146b	66e326b8-1664-439d-820e-aff3c700aea7	Dev Deshmukh	9531933776	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dev Deshmukh", "contact_number": "9531933776"}	2026-02-01 02:13:16.593421
7a82cd97-2ce7-476e-88a2-eec80a461ee9	66e326b8-1664-439d-820e-aff3c700aea7	Rashmi Patel	8612529222	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Rashmi Patel", "contact_number": "8612529222"}	2026-02-01 02:13:16.593423
9c03e834-6a78-4f82-89eb-5384a422a91d	66e326b8-1664-439d-820e-aff3c700aea7	Parth Shetty	9339721639	Promising	PENDING	{"cohort": "Promising", "customer_name": "Parth Shetty", "contact_number": "9339721639"}	2026-02-01 02:13:16.593426
ca91a42b-f249-43cc-9941-aca832a1bc38	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Nair	8982273424	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Dhruv Nair", "contact_number": "8982273424"}	2026-02-01 02:13:16.593428
51fbc9ec-6008-4d46-9a54-318f1af2f33f	66e326b8-1664-439d-820e-aff3c700aea7	Krishna Gowda	7825217209	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Krishna Gowda", "contact_number": "7825217209"}	2026-02-01 02:13:16.593431
d5d705c2-1974-4b6b-a1db-53a5d93de9d7	66e326b8-1664-439d-820e-aff3c700aea7	Priya Rao	7604717059	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Priya Rao", "contact_number": "7604717059"}	2026-02-01 02:13:16.593433
4aa6d329-144b-4fd7-8dd0-e9a60f5aff19	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Bose	9684672207	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Bose", "contact_number": "9684672207"}	2026-02-01 02:13:16.593436
d099fe53-0674-4466-bdc5-f71aff981c3f	66e326b8-1664-439d-820e-aff3c700aea7	Isha Chaudhary	7579918199	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Isha Chaudhary", "contact_number": "7579918199"}	2026-02-01 02:13:16.593438
3796e08f-71a5-4fd0-befe-bf246e598358	66e326b8-1664-439d-820e-aff3c700aea7	Manav Roy	9717820269	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Manav Roy", "contact_number": "9717820269"}	2026-02-01 02:13:16.593441
b99dcd9c-6f5d-47fb-9dd9-0b62e8bc66a0	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Shetty	8295498411	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Rupali Shetty", "contact_number": "8295498411"}	2026-02-01 02:13:16.593443
749c2a61-e21e-4193-91ee-0e03c82f4c72	66e326b8-1664-439d-820e-aff3c700aea7	Parth Kaur	7767032616	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Parth Kaur", "contact_number": "7767032616"}	2026-02-01 02:13:16.593509
492919e0-3a1d-493d-91eb-c7bbee27c208	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Das	9850611322	Champions	PENDING	{"cohort": "Champions", "customer_name": "Harsh Das", "contact_number": "9850611322"}	2026-02-01 02:13:16.593512
3d4b4388-5da9-443e-b526-bb11b8864476	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Ghosh	7423552326	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ritvik Ghosh", "contact_number": "7423552326"}	2026-02-01 02:13:16.593514
1001ee55-f03d-4006-ac51-9aabb09b85c7	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Gowda	9345873192	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Arnav Gowda", "contact_number": "9345873192"}	2026-02-01 02:13:16.593517
58f6b837-b55b-4f2b-90d2-969c7bba1443	66e326b8-1664-439d-820e-aff3c700aea7	Aman Kapoor	7211764545	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Kapoor", "contact_number": "7211764545"}	2026-02-01 02:13:16.593519
4b680b60-8b7a-41f4-849a-03f01d77f36b	66e326b8-1664-439d-820e-aff3c700aea7	Yash Naik	7765755391	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Yash Naik", "contact_number": "7765755391"}	2026-02-01 02:13:16.593522
65b3f47e-779b-415b-a018-e7a691277d95	66e326b8-1664-439d-820e-aff3c700aea7	Yash Iyer	7513512505	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Yash Iyer", "contact_number": "7513512505"}	2026-02-01 02:13:16.593524
83952bd0-6a33-473d-8728-6fe6917d3efc	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Chatterjee	6454048738	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Chatterjee", "contact_number": "6454048738"}	2026-02-01 02:13:16.593526
9a305e90-3c34-46d7-8162-216a7ff6c209	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Bansal	7503099090	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Bansal", "contact_number": "7503099090"}	2026-02-01 02:13:16.593529
f6b4a003-cf90-4e14-888a-4529e7527fe3	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Yadav	9116793849	Promising	PENDING	{"cohort": "Promising", "customer_name": "Vivaan Yadav", "contact_number": "9116793849"}	2026-02-01 02:13:16.593531
6dedf9c8-23af-45f7-ae82-3c5e178b666a	66e326b8-1664-439d-820e-aff3c700aea7	Pooja Chatterjee	9366563155	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Pooja Chatterjee", "contact_number": "9366563155"}	2026-02-01 02:13:16.593533
67c7a914-7d5e-4bca-96de-5da78b92ac1b	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Chatterjee	7879474324	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Shreya Chatterjee", "contact_number": "7879474324"}	2026-02-01 02:13:16.593536
03cab014-494d-4739-ba50-cd79b8d52a74	66e326b8-1664-439d-820e-aff3c700aea7	Aarav Patel	7297184780	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aarav Patel", "contact_number": "7297184780"}	2026-02-01 02:13:16.593538
dfbec878-a029-4ac8-8cef-a99dcb1014db	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Srinivasan	7054682045	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ritvik Srinivasan", "contact_number": "7054682045"}	2026-02-01 02:13:16.593541
9411f2a0-8a73-46f8-9845-5c9311cfe960	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Chatterjee	6192955782	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Chatterjee", "contact_number": "6192955782"}	2026-02-01 02:13:16.593543
524a7f0f-efb3-4d79-9c6a-9f0ca2884c10	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Gupta	7954255716	Promising	PENDING	{"cohort": "Promising", "customer_name": "Arjun Gupta", "contact_number": "7954255716"}	2026-02-01 02:13:16.593545
48f359be-b792-4d06-9d92-d8130ff97bc8	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Bansal	9036356421	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Trisha Bansal", "contact_number": "9036356421"}	2026-02-01 02:13:16.593548
5bd73c51-3eb9-4ae5-a2b2-8180e2272782	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Joshi	9228140445	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Joshi", "contact_number": "9228140445"}	2026-02-01 02:13:16.59355
d14de335-be1c-48aa-8c02-c1ede2175771	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Saha	9226980712	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Saha", "contact_number": "9226980712"}	2026-02-01 02:13:16.593553
c689c188-98a2-4029-988c-145460cf29cc	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Deshmukh	6817754839	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Deshmukh", "contact_number": "6817754839"}	2026-02-01 02:13:16.593555
8536cf88-993c-4bd0-b947-6dbe9a87adb4	66e326b8-1664-439d-820e-aff3c700aea7	Ira Shetty	6217779673	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Shetty", "contact_number": "6217779673"}	2026-02-01 02:13:16.593557
913f4826-7957-48e4-b492-578901bda8c0	66e326b8-1664-439d-820e-aff3c700aea7	Krishna Kaur	7573532540	Champions	PENDING	{"cohort": "Champions", "customer_name": "Krishna Kaur", "contact_number": "7573532540"}	2026-02-01 02:13:16.59356
a77d37d2-3e68-48ae-bcaf-2d65c07d44df	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Prasad	9732308705	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rupali Prasad", "contact_number": "9732308705"}	2026-02-01 02:13:16.593562
5cc97546-9a6e-4d87-9276-b85aa1836a28	66e326b8-1664-439d-820e-aff3c700aea7	Kavya Kulkarni	9212525937	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kavya Kulkarni", "contact_number": "9212525937"}	2026-02-01 02:13:16.593564
5e045d6c-2241-4c32-b6b6-e6eacb70ee81	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Kulkarni	9964171749	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Saanvi Kulkarni", "contact_number": "9964171749"}	2026-02-01 02:13:16.593567
df5f1eef-624b-4f04-979f-c7a16c06b7bf	66e326b8-1664-439d-820e-aff3c700aea7	Avni Tripathi	6580800160	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Avni Tripathi", "contact_number": "6580800160"}	2026-02-01 02:13:16.593569
feb212df-c032-4104-ba48-8f4535441ae5	66e326b8-1664-439d-820e-aff3c700aea7	Diya Reddy	7053666440	Promising	PENDING	{"cohort": "Promising", "customer_name": "Diya Reddy", "contact_number": "7053666440"}	2026-02-01 02:13:16.593572
a12a40ba-aa2b-4548-99d4-c3f53f06df29	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Gowda	9052908689	Lost	PENDING	{"cohort": "Lost", "customer_name": "Reyansh Gowda", "contact_number": "9052908689"}	2026-02-01 02:13:16.593574
ba15bc85-d567-4991-b993-618e9a9b1376	66e326b8-1664-439d-820e-aff3c700aea7	Manav Aggarwal	6952623709	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Manav Aggarwal", "contact_number": "6952623709"}	2026-02-01 02:13:16.593576
cd52e092-662d-4eb7-8888-57dcbec0a0d9	66e326b8-1664-439d-820e-aff3c700aea7	Manav Tripathi	9592686870	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Tripathi", "contact_number": "9592686870"}	2026-02-01 02:13:16.593579
61ae7237-9b20-4cda-a031-1f5d07de7eaf	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Kaur	9346708639	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Kaur", "contact_number": "9346708639"}	2026-02-01 02:13:16.593581
9a54c9d1-6388-4461-a84f-f8d1513eaeeb	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Hegde	6892965296	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Vihaan Hegde", "contact_number": "6892965296"}	2026-02-01 02:13:16.593585
351bf586-3d8f-4814-ab9a-8696e64adb03	66e326b8-1664-439d-820e-aff3c700aea7	Aman Narayan	8850939577	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aman Narayan", "contact_number": "8850939577"}	2026-02-01 02:13:16.593587
80a830b2-9a58-477d-9169-cbac462d41df	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Mehta	9925586537	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Reyansh Mehta", "contact_number": "9925586537"}	2026-02-01 02:13:16.59359
267420dd-cd82-4553-9842-9f5c16c008ec	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Kaur	6590483793	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Arnav Kaur", "contact_number": "6590483793"}	2026-02-01 02:13:16.593592
3260538b-14d6-4247-9825-df2896eb0896	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Reddy	8029439466	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Rahul Reddy", "contact_number": "8029439466"}	2026-02-01 02:13:16.593594
e83cc8f7-3bb2-43d6-9a08-0da5b98f15f6	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Das	6722023713	Promising	PENDING	{"cohort": "Promising", "customer_name": "Saanvi Das", "contact_number": "6722023713"}	2026-02-01 02:13:16.593597
fda6a286-263c-40a3-bbbb-ce6335dd3f26	66e326b8-1664-439d-820e-aff3c700aea7	Diya Shetty	8103321145	Champions	PENDING	{"cohort": "Champions", "customer_name": "Diya Shetty", "contact_number": "8103321145"}	2026-02-01 02:13:16.593599
ed5d3ae6-9198-409e-b1c9-f874c61375ca	66e326b8-1664-439d-820e-aff3c700aea7	Yash Nair	9105578047	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Yash Nair", "contact_number": "9105578047"}	2026-02-01 02:13:16.593601
e5a7f89c-1611-4c27-abfd-6b845c2559ad	66e326b8-1664-439d-820e-aff3c700aea7	Manav Khan	7513134044	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Manav Khan", "contact_number": "7513134044"}	2026-02-01 02:13:16.593604
002e572b-1433-4cd5-98fe-0699e96f30ac	66e326b8-1664-439d-820e-aff3c700aea7	Anika Pandey	9739746410	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Pandey", "contact_number": "9739746410"}	2026-02-01 02:13:16.593606
1b7c1f89-8cdb-4835-b53e-70f4d4d547c1	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Patel	9368338891	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Patel", "contact_number": "9368338891"}	2026-02-01 02:13:16.593608
a72501b2-e7e3-439e-b604-a01c40f90ecc	66e326b8-1664-439d-820e-aff3c700aea7	Yash Rao	8664133769	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Yash Rao", "contact_number": "8664133769"}	2026-02-01 02:13:16.593611
f52da1d2-f52f-4e9d-af37-1a1604a995f8	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Mehta	7327391917	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Reyansh Mehta", "contact_number": "7327391917"}	2026-02-01 02:13:16.593613
b4924882-cce7-409b-bfcc-7952ab64585e	66e326b8-1664-439d-820e-aff3c700aea7	Aman Shetty	6947426874	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aman Shetty", "contact_number": "6947426874"}	2026-02-01 02:13:16.593616
18a00329-1cc3-4148-86d8-41f245937b78	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Sharma	9132143455	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Sharma", "contact_number": "9132143455"}	2026-02-01 02:13:16.593618
a833f1a9-7b8c-47da-89ae-6091899fe5c2	66e326b8-1664-439d-820e-aff3c700aea7	Sai Sood	9573856076	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9573856076"}	2026-02-01 02:13:16.59362
a7864c39-f84f-4219-a573-79e5db924065	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Mukherjee	8165669371	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Mukherjee", "contact_number": "8165669371"}	2026-02-01 02:13:16.593623
bd0412cf-ac28-4880-92b0-33fd5719fa67	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Tripathi	6255554375	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Tripathi", "contact_number": "6255554375"}	2026-02-01 02:13:16.593625
0fa02d57-9ad9-46b8-a1cb-752dc02c97cb	66e326b8-1664-439d-820e-aff3c700aea7	Riya Kulkarni	7301491913	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Riya Kulkarni", "contact_number": "7301491913"}	2026-02-01 02:13:16.593627
e574dc95-94c3-4ca6-a102-53dba0467f02	66e326b8-1664-439d-820e-aff3c700aea7	Ira Saxena	9753074007	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ira Saxena", "contact_number": "9753074007"}	2026-02-01 02:13:16.59363
e90065a7-b6ec-4852-b593-e1d3929a8fbc	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Mehta	6866192115	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Mehta", "contact_number": "6866192115"}	2026-02-01 02:13:16.593632
c8abf7b8-b699-42d3-84bc-b7a3ad98283a	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Malhotra	9241640615	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Malhotra", "contact_number": "9241640615"}	2026-02-01 02:13:16.593634
800071a5-122e-4f6a-86eb-42f2971833c1	66e326b8-1664-439d-820e-aff3c700aea7	Aarav Malhotra	9022775753	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aarav Malhotra", "contact_number": "9022775753"}	2026-02-01 02:13:16.593637
51d480cc-b626-465d-96f8-47d7e89e00b3	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Pandey	7428565653	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aarohi Pandey", "contact_number": "7428565653"}	2026-02-01 02:13:16.593639
496d9c75-74d1-4b48-be40-8c8a4d8cc097	66e326b8-1664-439d-820e-aff3c700aea7	Kiara Mishra	9687260113	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kiara Mishra", "contact_number": "9687260113"}	2026-02-01 02:13:16.593642
00a553d0-cdc9-4109-ab9d-d2e86f57419b	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Kaur	7313554459	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Harsh Kaur", "contact_number": "7313554459"}	2026-02-01 02:13:16.593646
98f7ab3a-9d6c-4667-a88c-495a4c37dc9e	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Rao	7541340301	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Tanvi Rao", "contact_number": "7541340301"}	2026-02-01 02:13:16.593649
9b1be285-3ea6-443c-ae8b-d9f724090885	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Arora	9954648400	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Arora", "contact_number": "9954648400"}	2026-02-01 02:13:16.593652
7209314e-7d28-4875-b334-9ffab370d0a0	66e326b8-1664-439d-820e-aff3c700aea7	Riya Menon	7225147751	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Menon", "contact_number": "7225147751"}	2026-02-01 02:13:16.593654
357c6353-a554-4dd5-bc8d-35c964283a46	66e326b8-1664-439d-820e-aff3c700aea7	Diya Banerjee	6259577424	Promising	PENDING	{"cohort": "Promising", "customer_name": "Diya Banerjee", "contact_number": "6259577424"}	2026-02-01 02:13:16.593657
abc8eef5-e8e7-40dc-80c2-20d5967e1f38	66e326b8-1664-439d-820e-aff3c700aea7	Ira Mehta	7294384972	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Mehta", "contact_number": "7294384972"}	2026-02-01 02:13:16.593659
9444003f-bc1c-4cad-bc73-322c4701214a	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Gill	8864678855	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Shreya Gill", "contact_number": "8864678855"}	2026-02-01 02:13:16.593661
45ba4b2f-e518-45dd-9e68-9e2596a01ad6	66e326b8-1664-439d-820e-aff3c700aea7	Sneha Mehta	7372289609	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sneha Mehta", "contact_number": "7372289609"}	2026-02-01 02:13:16.593664
fdf2b3af-4391-49e8-bdf6-28b07ebba9a2	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Jain	9998182787	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ayush Jain", "contact_number": "9998182787"}	2026-02-01 02:13:16.593667
9b0e9c88-4a89-4e1c-9b10-3ed74a445a50	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Mehta	9452446805	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vihaan Mehta", "contact_number": "9452446805"}	2026-02-01 02:13:16.59367
07d04454-7e3c-4590-9d10-961997af8ca7	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Kulkarni	8684458809	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Kulkarni", "contact_number": "8684458809"}	2026-02-01 02:13:16.593673
f9282c22-ef24-4a08-a824-374d506e75f4	66e326b8-1664-439d-820e-aff3c700aea7	Neha Naik	8873984325	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Naik", "contact_number": "8873984325"}	2026-02-01 02:13:16.593676
3f6047dc-9b1c-41cd-ab20-7b6458731f4e	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Mehta	7543600741	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ananya Mehta", "contact_number": "7543600741"}	2026-02-01 02:13:16.593679
802ad154-6336-47c3-babf-230260434fa0	66e326b8-1664-439d-820e-aff3c700aea7	Neha Shah	7409261619	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Shah", "contact_number": "7409261619"}	2026-02-01 02:13:16.593681
f321ff4c-b1a7-4bbf-b060-9b615ea75b86	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Khan	8030660677	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Pallavi Khan", "contact_number": "8030660677"}	2026-02-01 02:13:16.593684
096ea38c-ae18-4303-b45b-a7d03817af22	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Chaudhary	9670412606	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Arjun Chaudhary", "contact_number": "9670412606"}	2026-02-01 02:13:16.593686
84abb353-f484-41e5-8764-a811d5a6384c	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Hegde	6941037138	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arjun Hegde", "contact_number": "6941037138"}	2026-02-01 02:13:16.593689
ae812f20-d505-4ca2-9f3f-dc9bd707d287	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Mukherjee	7388660561	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Trisha Mukherjee", "contact_number": "7388660561"}	2026-02-01 02:13:16.593691
8393acf9-5350-4e91-a84f-caa19187497b	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Iyer	8761468017	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arnav Iyer", "contact_number": "8761468017"}	2026-02-01 02:13:16.593694
de8ff738-7701-4001-bccb-ff91e11cdb09	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Prasad	9347262672	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sakshi Prasad", "contact_number": "9347262672"}	2026-02-01 02:13:16.593696
ff0bfd8a-dfff-42da-8a8a-cf9d6fafec4d	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Yadav	6863557208	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Yadav", "contact_number": "6863557208"}	2026-02-01 02:13:16.593698
1d2a5395-4faa-46f1-a556-f8be00f2edd0	66e326b8-1664-439d-820e-aff3c700aea7	Naina Gupta	7414559991	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Naina Gupta", "contact_number": "7414559991"}	2026-02-01 02:13:16.593701
aec78105-d8ff-4f66-aa1c-29d04155d2a5	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Shah	9367970020	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aditi Shah", "contact_number": "9367970020"}	2026-02-01 02:13:16.593703
ac3dfa94-dde8-49b4-8054-287faf9781f7	66e326b8-1664-439d-820e-aff3c700aea7	Kabir Gowda	6932774465	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kabir Gowda", "contact_number": "6932774465"}	2026-02-01 02:13:16.593706
998c6e57-5e89-45e3-82ce-34759e0735cc	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Prasad	7235285368	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Shreya Prasad", "contact_number": "7235285368"}	2026-02-01 02:13:16.593708
fbd9c2ca-a700-44d5-86dd-b500d8930efb	66e326b8-1664-439d-820e-aff3c700aea7	Isha Jain	6349229160	Champions	PENDING	{"cohort": "Champions", "customer_name": "Isha Jain", "contact_number": "6349229160"}	2026-02-01 02:13:16.593711
ee0ccfce-de95-4517-8f90-82231356d8f3	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Bose	7177195771	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rupali Bose", "contact_number": "7177195771"}	2026-02-01 02:13:16.593713
bcb8701f-db1b-47f6-b332-90703b6a027e	66e326b8-1664-439d-820e-aff3c700aea7	Ira Gowda	7787183452	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Gowda", "contact_number": "7787183452"}	2026-02-01 02:13:16.593716
6722c7c4-eade-42ef-b5dc-50ec67bf2665	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Jain	6450811786	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ritvik Jain", "contact_number": "6450811786"}	2026-02-01 02:13:16.593718
71d50d33-bfa1-4b48-bddd-d371beefb6e5	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Bose	6250824319	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Bose", "contact_number": "6250824319"}	2026-02-01 02:13:16.593721
d718a459-391a-417e-9446-01ca5a535a39	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Nair	6597434720	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arnav Nair", "contact_number": "6597434720"}	2026-02-01 02:13:16.593723
dd51c270-4ee9-4f7b-a6e6-1683e50b9ea2	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Narayan	8160250488	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Gaurav Narayan", "contact_number": "8160250488"}	2026-02-01 02:13:16.593725
e27a979a-8f7e-4b05-928b-9034fdd04689	66e326b8-1664-439d-820e-aff3c700aea7	Meera Pandey	8350253645	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Meera Pandey", "contact_number": "8350253645"}	2026-02-01 02:13:16.593728
038d436d-3c4b-4546-a5ba-969933f8f6db	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Sood	9977571905	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rohan Sood", "contact_number": "9977571905"}	2026-02-01 02:13:16.59373
6978d581-7422-40cd-8f03-451a095a89db	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Patel	6906871524	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Rupali Patel", "contact_number": "6906871524"}	2026-02-01 02:13:16.593733
10cfc46a-65d5-41cc-8ac4-2b7615ec6741	66e326b8-1664-439d-820e-aff3c700aea7	Aarav Pandey	6912028484	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aarav Pandey", "contact_number": "6912028484"}	2026-02-01 02:13:16.593735
0e4be37e-45e3-4473-bc66-2eba6f298730	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Prasad	6556350612	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "6556350612"}	2026-02-01 02:13:16.593737
7b53d7f8-7d52-4457-8ddf-829aff48cc21	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Patel	8938342917	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Patel", "contact_number": "8938342917"}	2026-02-01 02:13:16.59374
d9c3382f-f5cf-4081-81fc-5f08514f3953	66e326b8-1664-439d-820e-aff3c700aea7	Sneha Roy	6114459232	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Roy", "contact_number": "6114459232"}	2026-02-01 02:13:16.593742
41ed9e29-ab80-452e-abd9-ccc21c72e6af	66e326b8-1664-439d-820e-aff3c700aea7	Neha Bose	6083762817	Champions	PENDING	{"cohort": "Champions", "customer_name": "Neha Bose", "contact_number": "6083762817"}	2026-02-01 02:13:16.593745
a2c5e090-e90e-4b35-b227-c32e8167cbf4	66e326b8-1664-439d-820e-aff3c700aea7	Krishna Aggarwal	8302819855	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Krishna Aggarwal", "contact_number": "8302819855"}	2026-02-01 02:13:16.593748
fe58edb0-ad85-4c9c-81e2-d272dc5cb000	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Patel	6481089183	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Patel", "contact_number": "6481089183"}	2026-02-01 02:13:16.59375
8a57c976-6cde-4ad9-972d-655d5fec68ed	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Mukherjee	6528009419	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Mukherjee", "contact_number": "6528009419"}	2026-02-01 02:13:16.593752
f6bebdff-d3c0-4b08-a406-ac47ad364b4a	66e326b8-1664-439d-820e-aff3c700aea7	Siddharth Banerjee	8190947434	Lost	PENDING	{"cohort": "Lost", "customer_name": "Siddharth Banerjee", "contact_number": "8190947434"}	2026-02-01 02:13:16.593755
a96a1a1e-571d-48f3-8b58-6d74e4af96e6	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Tiwari	8212806224	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ananya Tiwari", "contact_number": "8212806224"}	2026-02-01 02:13:16.593757
b0bb0286-fe69-4f8e-9863-2bf5a25e6b60	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Shetty	9021185687	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mansi Shetty", "contact_number": "9021185687"}	2026-02-01 02:13:16.59376
92e9fc34-607a-40e7-8445-998c8d48436d	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Ghosh	9735495313	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Ghosh", "contact_number": "9735495313"}	2026-02-01 02:13:16.593762
656cc818-a825-4d51-bd26-5fb051704953	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Narayan	7082843521	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Narayan", "contact_number": "7082843521"}	2026-02-01 02:13:16.593765
9d62d73f-e8ff-46b2-bab7-2e1e13ced827	66e326b8-1664-439d-820e-aff3c700aea7	Isha Sharma	7628909287	Promising	PENDING	{"cohort": "Promising", "customer_name": "Isha Sharma", "contact_number": "7628909287"}	2026-02-01 02:13:16.593767
88b1dd2e-5d7b-4da7-b094-4c90d620eddc	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Rao	8991237357	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Rao", "contact_number": "8991237357"}	2026-02-01 02:13:16.59377
d255d888-9233-42df-b0cd-0b2c7413e215	66e326b8-1664-439d-820e-aff3c700aea7	Meera Gowda	8955198434	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Gowda", "contact_number": "8955198434"}	2026-02-01 02:13:16.593772
a536a112-c66b-4e55-b1e2-b7ca93fdc001	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Nair	6060436831	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Reyansh Nair", "contact_number": "6060436831"}	2026-02-01 02:13:16.593775
b61a8b21-2410-4b4a-b237-71251c8ab0e1	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Iyer	8017115307	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aarohi Iyer", "contact_number": "8017115307"}	2026-02-01 02:13:16.593777
1f6eb4eb-b68f-468d-ba9b-f12008beafd7	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Reddy	9533974643	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Reddy", "contact_number": "9533974643"}	2026-02-01 02:13:16.593779
5e0ceaa6-9b37-4e8e-b76c-7c7684c1d71a	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Rao	8251361799	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ayush Rao", "contact_number": "8251361799"}	2026-02-01 02:13:16.593782
8ed49cc3-4abb-4f8b-bde3-38a382e9c959	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Saha	9875138661	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Saha", "contact_number": "9875138661"}	2026-02-01 02:13:16.593784
5481baa6-74fa-4f05-ac48-6fc4ca21ab4a	66e326b8-1664-439d-820e-aff3c700aea7	Kiara Chaudhary	9172918076	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kiara Chaudhary", "contact_number": "9172918076"}	2026-02-01 02:13:16.593787
4725ed37-0ef9-473b-8b43-0c9b8685e348	66e326b8-1664-439d-820e-aff3c700aea7	Ira Arora	8422021037	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ira Arora", "contact_number": "8422021037"}	2026-02-01 02:13:16.593789
58a3e7b2-abaf-4dcc-8564-9e7baddec922	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Roy	7843514866	Lost	PENDING	{"cohort": "Lost", "customer_name": "Rahul Roy", "contact_number": "7843514866"}	2026-02-01 02:13:16.593792
f418483e-0504-4067-92e4-fea9e3629305	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Srinivasan	7470021381	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mohit Srinivasan", "contact_number": "7470021381"}	2026-02-01 02:13:16.593794
f3b1e6a7-5b8c-470a-b801-371b86fb94ff	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Bose	6580564091	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Pallavi Bose", "contact_number": "6580564091"}	2026-02-01 02:13:16.593797
74464279-209e-4008-9cc9-4393c985ac71	66e326b8-1664-439d-820e-aff3c700aea7	Neha Deshmukh	9112167722	Champions	PENDING	{"cohort": "Champions", "customer_name": "Neha Deshmukh", "contact_number": "9112167722"}	2026-02-01 02:13:16.593799
4d4d0237-45fb-4830-93f2-c7ebbd73879c	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Mehta	7035400086	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Aarohi Mehta", "contact_number": "7035400086"}	2026-02-01 02:13:16.593802
23ec38f4-83b6-4ad4-8353-9eff4f89186d	66e326b8-1664-439d-820e-aff3c700aea7	Sai Srinivasan	9101208334	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sai Srinivasan", "contact_number": "9101208334"}	2026-02-01 02:13:16.593804
f1d9ba45-c468-42b9-b6fc-71902ada6443	66e326b8-1664-439d-820e-aff3c700aea7	Manav Saha	8051834242	Lost	PENDING	{"cohort": "Lost", "customer_name": "Manav Saha", "contact_number": "8051834242"}	2026-02-01 02:13:16.593806
8cb0c811-b9f7-4335-82df-18f41c32567d	66e326b8-1664-439d-820e-aff3c700aea7	Aditya Sharma	8516068472	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aditya Sharma", "contact_number": "8516068472"}	2026-02-01 02:13:16.593809
b33026c5-8ef7-4cff-a761-f7f824490fbd	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Bajaj	6884584840	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Rahul Bajaj", "contact_number": "6884584840"}	2026-02-01 02:13:16.593812
15137082-2f75-4608-b8fa-9c934a552ac0	66e326b8-1664-439d-820e-aff3c700aea7	Krishna Srinivasan	6598661719	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Krishna Srinivasan", "contact_number": "6598661719"}	2026-02-01 02:13:16.593815
bfdd70f1-99e8-4ef0-8e2e-3790ff207878	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Singh	7814949682	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarohi Singh", "contact_number": "7814949682"}	2026-02-01 02:13:16.593817
b2c4d031-09f9-424d-99f2-fe3e8923e4c8	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Tiwari	6055859075	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ayush Tiwari", "contact_number": "6055859075"}	2026-02-01 02:13:16.59382
6e570165-ee2d-4c51-8a49-82162d6799fd	66e326b8-1664-439d-820e-aff3c700aea7	Pooja Arora	9115591177	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Pooja Arora", "contact_number": "9115591177"}	2026-02-01 02:13:16.593822
bc5f90e0-fc59-40aa-9a8a-16c1d1d2ead9	66e326b8-1664-439d-820e-aff3c700aea7	Manav Rao	8826541466	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Manav Rao", "contact_number": "8826541466"}	2026-02-01 02:13:16.593825
c254f604-6359-421b-93e1-32e9b1a75fe8	66e326b8-1664-439d-820e-aff3c700aea7	Aarav Iyer	9083279808	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aarav Iyer", "contact_number": "9083279808"}	2026-02-01 02:13:16.593827
40d2e79f-ba52-4809-a94d-630e6e2ecda2	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Bhat	8388692377	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Arjun Bhat", "contact_number": "8388692377"}	2026-02-01 02:13:16.59383
f02f9ede-ecd8-436a-aa9e-2bb5d6c0bbf5	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Menon	8246128778	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Menon", "contact_number": "8246128778"}	2026-02-01 02:13:16.593832
f1fca3cd-0e8a-4ce0-9886-56f69ae1ef81	66e326b8-1664-439d-820e-aff3c700aea7	Sneha Gupta	6513518801	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Gupta", "contact_number": "6513518801"}	2026-02-01 02:13:16.593834
66d4bc2a-4f76-4053-a3df-09c0e087007d	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Kapoor	7824972856	Champions	PENDING	{"cohort": "Champions", "customer_name": "Mansi Kapoor", "contact_number": "7824972856"}	2026-02-01 02:13:16.593837
fa20f94b-0d52-44a0-a20b-7b6934f77bc0	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Rao	6624494538	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Rao", "contact_number": "6624494538"}	2026-02-01 02:13:16.593839
93d9811c-0a7f-4fe4-bf8f-0d93b6a6e3ee	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Mishra	8762315986	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ishaan Mishra", "contact_number": "8762315986"}	2026-02-01 02:13:16.593842
e39af462-4166-4f97-b104-7fd0ed5b04ad	66e326b8-1664-439d-820e-aff3c700aea7	Krishna Gupta	7240770966	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Krishna Gupta", "contact_number": "7240770966"}	2026-02-01 02:13:16.593844
b2a749bc-628f-43e6-a2cf-36b438e1b344	66e326b8-1664-439d-820e-aff3c700aea7	Meera Kapoor	6269772884	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Kapoor", "contact_number": "6269772884"}	2026-02-01 02:13:16.593846
090a4cd7-1216-49b1-b3db-18003552251d	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Gupta	7468315683	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Nandini Gupta", "contact_number": "7468315683"}	2026-02-01 02:13:16.593849
ec85176d-59a9-4b74-991d-0edc7930f8e0	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Aggarwal	8210968278	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Aggarwal", "contact_number": "8210968278"}	2026-02-01 02:13:16.593851
aea4f304-9234-4d50-8fcd-45c5c010c9e6	66e326b8-1664-439d-820e-aff3c700aea7	Ira Hegde	8152088431	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ira Hegde", "contact_number": "8152088431"}	2026-02-01 02:13:16.593854
0034ffd4-36eb-4cdf-8208-bae2d5cb4e07	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Gowda	6692430751	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Saanvi Gowda", "contact_number": "6692430751"}	2026-02-01 02:13:16.593856
02fab7e5-33cb-46f3-ac09-6e448022312e	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Aggarwal	7664933165	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Reyansh Aggarwal", "contact_number": "7664933165"}	2026-02-01 02:13:16.593859
00e0cf2d-d3d2-4ec1-9ccd-d0b90216dfce	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Rao	8012871630	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Rao", "contact_number": "8012871630"}	2026-02-01 02:13:16.593861
fa13ad7e-47c6-4be8-baeb-22feacbc8126	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Tripathi	8284835410	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sakshi Tripathi", "contact_number": "8284835410"}	2026-02-01 02:13:16.593864
d2935448-5ab6-4310-a80b-ee0f3e5ea58e	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Gill	6411654819	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Gill", "contact_number": "6411654819"}	2026-02-01 02:13:16.593866
709501f1-94a5-463c-a3d1-2f2271a9ef8f	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Mukherjee	8459437746	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ishaan Mukherjee", "contact_number": "8459437746"}	2026-02-01 02:13:16.593868
dd400f5e-0b7e-4635-9ef4-bfbc1e136003	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Singh	7304275177	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Trisha Singh", "contact_number": "7304275177"}	2026-02-01 02:13:16.593871
f6dc42bd-0c60-4677-aa62-a91420945434	66e326b8-1664-439d-820e-aff3c700aea7	Avni Khan	7664930130	Promising	PENDING	{"cohort": "Promising", "customer_name": "Avni Khan", "contact_number": "7664930130"}	2026-02-01 02:13:16.593873
a9b58485-beb7-4813-b237-211b1717ae27	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Tripathi	8750072831	Promising	PENDING	{"cohort": "Promising", "customer_name": "Sakshi Tripathi", "contact_number": "8750072831"}	2026-02-01 02:13:16.593876
8b09334c-07a0-44f1-909e-40f26e8859b7	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Khan	8182275389	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Vivaan Khan", "contact_number": "8182275389"}	2026-02-01 02:13:16.593878
85f00405-c8bd-4522-a758-0f5af89db614	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Bansal	8947198029	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ayush Bansal", "contact_number": "8947198029"}	2026-02-01 02:13:16.593881
084527b8-f202-49c2-a72e-a5c8956b8a2e	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Tripathi	7751360825	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Tanvi Tripathi", "contact_number": "7751360825"}	2026-02-01 02:13:16.593883
22174db3-7daf-42c6-a5dd-38bf24140bb1	66e326b8-1664-439d-820e-aff3c700aea7	Avni Gowda	6501801412	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Avni Gowda", "contact_number": "6501801412"}	2026-02-01 02:13:16.593886
d131cefa-e61e-44e9-8d38-8c2c4ccc71d3	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Gill	7260415674	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Trisha Gill", "contact_number": "7260415674"}	2026-02-01 02:13:16.593888
628cb1d1-e75a-42d6-aca5-92533156f8c9	66e326b8-1664-439d-820e-aff3c700aea7	Avni Mukherjee	6562746789	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Mukherjee", "contact_number": "6562746789"}	2026-02-01 02:13:16.59389
41958689-ec3e-4e74-a3d8-15b05b6994b5	66e326b8-1664-439d-820e-aff3c700aea7	Anika Singh	8720429306	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Anika Singh", "contact_number": "8720429306"}	2026-02-01 02:13:16.593893
cfea38ee-3c87-42df-ab34-555945ff7d38	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Bhat	6861057122	Champions	PENDING	{"cohort": "Champions", "customer_name": "Tanvi Bhat", "contact_number": "6861057122"}	2026-02-01 02:13:16.593895
20192d16-373f-4914-acdf-ba5a9b144656	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Malhotra	8208883641	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Malhotra", "contact_number": "8208883641"}	2026-02-01 02:13:16.593897
91337a68-b63a-4d35-925e-a8dc2ef74be2	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Gupta	6016389273	Champions	PENDING	{"cohort": "Champions", "customer_name": "Trisha Gupta", "contact_number": "6016389273"}	2026-02-01 02:13:16.5939
4705deb4-027f-4cce-b6e2-6862ddc31581	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Kulkarni	8149238767	Promising	PENDING	{"cohort": "Promising", "customer_name": "Pallavi Kulkarni", "contact_number": "8149238767"}	2026-02-01 02:13:16.593902
96633f8d-f730-4c7d-8660-312bf0710df6	66e326b8-1664-439d-820e-aff3c700aea7	Myra Das	6179819454	Promising	PENDING	{"cohort": "Promising", "customer_name": "Myra Das", "contact_number": "6179819454"}	2026-02-01 02:13:16.593905
4848872a-ba34-4ee4-a281-74b2d8209af5	66e326b8-1664-439d-820e-aff3c700aea7	Rashmi Pandey	9768878448	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Pandey", "contact_number": "9768878448"}	2026-02-01 02:13:16.593907
0dfe07ed-e913-46a7-b151-2642eba69ce2	66e326b8-1664-439d-820e-aff3c700aea7	Kunal Ghosh	9023767559	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Kunal Ghosh", "contact_number": "9023767559"}	2026-02-01 02:13:16.593909
5481d3c5-0d43-4565-b755-c109c69532fc	66e326b8-1664-439d-820e-aff3c700aea7	Rashmi Chatterjee	8566474661	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rashmi Chatterjee", "contact_number": "8566474661"}	2026-02-01 02:13:16.593912
c1c58d10-f887-46bf-828b-e011983b9f75	66e326b8-1664-439d-820e-aff3c700aea7	Myra Verma	6095441733	Champions	PENDING	{"cohort": "Champions", "customer_name": "Myra Verma", "contact_number": "6095441733"}	2026-02-01 02:13:16.593914
2ec8d5bf-539b-4355-8826-ad124769a4cf	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Das	8026424848	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Gaurav Das", "contact_number": "8026424848"}	2026-02-01 02:13:16.593917
d0d491c4-f8df-4f4d-992e-dddd912eca02	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Bansal	9397040587	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Arnav Bansal", "contact_number": "9397040587"}	2026-02-01 02:13:16.593919
d50008a8-0546-4ddc-b30f-9dc63ffc4467	66e326b8-1664-439d-820e-aff3c700aea7	Anika Patel	8856438883	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Patel", "contact_number": "8856438883"}	2026-02-01 02:13:16.593922
3109a016-9829-4b73-ad87-8431ab7e6eb1	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Saha	9734060367	Promising	PENDING	{"cohort": "Promising", "customer_name": "Dhruv Saha", "contact_number": "9734060367"}	2026-02-01 02:13:16.593924
6d7c267f-7609-40c4-bb8c-91d19be7247d	66e326b8-1664-439d-820e-aff3c700aea7	Kunal Narayan	8701177161	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Kunal Narayan", "contact_number": "8701177161"}	2026-02-01 02:13:16.593927
52c17b73-5073-4812-aa9c-08c58be86ac8	66e326b8-1664-439d-820e-aff3c700aea7	Neha Saxena	9281370661	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Neha Saxena", "contact_number": "9281370661"}	2026-02-01 02:13:16.593929
2ea9f0c5-e73b-41e2-b3eb-1d484951aae7	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Shetty	9455907545	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Mohit Shetty", "contact_number": "9455907545"}	2026-02-01 02:13:16.593931
dc8d7f59-26e9-42e4-b99b-936c9a14faa6	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Verma	7618166384	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rahul Verma", "contact_number": "7618166384"}	2026-02-01 02:13:16.593934
45973cc4-bac2-43f8-8b61-563fae8b8097	66e326b8-1664-439d-820e-aff3c700aea7	Ayaan Bose	7299414772	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ayaan Bose", "contact_number": "7299414772"}	2026-02-01 02:13:16.593936
60d38363-98ec-450d-a9ec-729f8ca09ca1	66e326b8-1664-439d-820e-aff3c700aea7	Aadhya Yadav	8796262369	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aadhya Yadav", "contact_number": "8796262369"}	2026-02-01 02:13:16.593938
0eb172b1-3e7f-460c-92f4-8a44510d9be3	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Gupta	7563134564	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aarohi Gupta", "contact_number": "7563134564"}	2026-02-01 02:13:16.593941
bfea0a94-8391-42d7-ac04-001590dbd71f	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Chaudhary	8840130027	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Chaudhary", "contact_number": "8840130027"}	2026-02-01 02:13:16.593943
0d942cfa-c593-40d5-ad4e-1cc48cc0436e	66e326b8-1664-439d-820e-aff3c700aea7	Manav Aggarwal	8610725346	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Aggarwal", "contact_number": "8610725346"}	2026-02-01 02:13:16.593945
adc80718-9375-4646-b886-03d252fcd2e9	66e326b8-1664-439d-820e-aff3c700aea7	Dev Jain	7752772693	Lost	PENDING	{"cohort": "Lost", "customer_name": "Dev Jain", "contact_number": "7752772693"}	2026-02-01 02:13:16.593948
9c5c502d-162c-45c0-a6b5-1dde69c62b60	66e326b8-1664-439d-820e-aff3c700aea7	Manav Chaudhary	8907288426	Promising	PENDING	{"cohort": "Promising", "customer_name": "Manav Chaudhary", "contact_number": "8907288426"}	2026-02-01 02:13:16.59395
a546ac4e-5203-479b-b171-8cea96da94d0	66e326b8-1664-439d-820e-aff3c700aea7	Neha Iyer	8756792161	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Iyer", "contact_number": "8756792161"}	2026-02-01 02:13:16.593953
ee7915e6-da83-4731-82aa-989b77b51c9c	66e326b8-1664-439d-820e-aff3c700aea7	Varun Prasad	7710221804	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Prasad", "contact_number": "7710221804"}	2026-02-01 02:13:16.593955
82ac2c47-b2d1-438e-a234-376b77ebdc24	66e326b8-1664-439d-820e-aff3c700aea7	Diya Bose	7095768375	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Diya Bose", "contact_number": "7095768375"}	2026-02-01 02:13:16.593957
d7227533-f4de-4011-a999-883ff30023df	66e326b8-1664-439d-820e-aff3c700aea7	Aditya Arora	6732105450	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aditya Arora", "contact_number": "6732105450"}	2026-02-01 02:13:16.59396
eb8bd816-b2f1-4658-ae25-fc3bf0f790e3	66e326b8-1664-439d-820e-aff3c700aea7	Manav Sharma	7863296457	Champions	PENDING	{"cohort": "Champions", "customer_name": "Manav Sharma", "contact_number": "7863296457"}	2026-02-01 02:13:16.593963
e33e6bda-c529-4c25-8009-27bec2ae4ea6	66e326b8-1664-439d-820e-aff3c700aea7	Isha Shetty	6132692083	Champions	PENDING	{"cohort": "Champions", "customer_name": "Isha Shetty", "contact_number": "6132692083"}	2026-02-01 02:13:16.593965
003667a9-e954-4bb7-9238-a4c41936535c	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Kaur	6352983840	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mohit Kaur", "contact_number": "6352983840"}	2026-02-01 02:13:16.593968
4b7fdf98-c98e-48fc-911b-8cbc5b59eb20	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Gill	7300975626	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ayush Gill", "contact_number": "7300975626"}	2026-02-01 02:13:16.59397
85e67f35-406e-4b33-b622-ef8074b9a628	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Das	7841579769	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Gaurav Das", "contact_number": "7841579769"}	2026-02-01 02:13:16.593974
baf8db53-2728-4ec5-9b58-3b516be3ec13	66e326b8-1664-439d-820e-aff3c700aea7	Siddharth Mishra	7070012089	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Siddharth Mishra", "contact_number": "7070012089"}	2026-02-01 02:13:16.593976
db60c515-7a53-465d-bae8-e4f8fdedab63	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Gowda	9364065667	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arjun Gowda", "contact_number": "9364065667"}	2026-02-01 02:13:16.593979
c650b9be-7a9b-4b90-8fe6-851eaecce9e6	66e326b8-1664-439d-820e-aff3c700aea7	Anvi Bansal	6709173074	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anvi Bansal", "contact_number": "6709173074"}	2026-02-01 02:13:16.593981
14e0e105-be62-4bb1-ac62-430f2d658d0c	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Jain	9801277826	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Jain", "contact_number": "9801277826"}	2026-02-01 02:13:16.593983
f9869f91-46cf-4a39-a02b-1d684bc1cb92	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Iyer	8697739551	Promising	PENDING	{"cohort": "Promising", "customer_name": "Gaurav Iyer", "contact_number": "8697739551"}	2026-02-01 02:13:16.593986
04f82704-4a08-4d26-bccd-4ab0fc98408a	66e326b8-1664-439d-820e-aff3c700aea7	Dev Ghosh	6535027729	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Dev Ghosh", "contact_number": "6535027729"}	2026-02-01 02:13:16.593988
57cabc89-f64d-4b49-8f2c-0b8fba1ae43a	66e326b8-1664-439d-820e-aff3c700aea7	Neha Ghosh	7128117889	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Ghosh", "contact_number": "7128117889"}	2026-02-01 02:13:16.593991
fee06dfa-15e3-4231-bfd3-3b805ab4b67b	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Tripathi	9606215936	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Tripathi", "contact_number": "9606215936"}	2026-02-01 02:13:16.593993
4b37c3f0-19b8-4538-8136-c16d36c69391	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Saxena	7169346355	Lost	PENDING	{"cohort": "Lost", "customer_name": "Rohan Saxena", "contact_number": "7169346355"}	2026-02-01 02:13:16.593995
8aaf2d00-6271-44bd-9293-e1904d170a37	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Banerjee	8891377623	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Harsh Banerjee", "contact_number": "8891377623"}	2026-02-01 02:13:16.593998
77d989b2-201a-4d04-8105-fe7bcc6dcfff	66e326b8-1664-439d-820e-aff3c700aea7	Pooja Nair	8843351688	Promising	PENDING	{"cohort": "Promising", "customer_name": "Pooja Nair", "contact_number": "8843351688"}	2026-02-01 02:13:16.594
290358d3-2579-4214-88e0-f4cae2615166	66e326b8-1664-439d-820e-aff3c700aea7	Diya Tripathi	7817678868	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Diya Tripathi", "contact_number": "7817678868"}	2026-02-01 02:13:16.594003
c7295afe-4274-4721-b3c5-9d737eb3543c	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Malhotra	9720285613	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Gaurav Malhotra", "contact_number": "9720285613"}	2026-02-01 02:13:16.594005
7f988f41-8875-489f-91a2-1d5a396bf9b1	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Gill	8150302996	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mohit Gill", "contact_number": "8150302996"}	2026-02-01 02:13:16.594008
2eac501e-ed16-4f7f-9ebd-e389988c357e	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Khan	7419697432	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Khan", "contact_number": "7419697432"}	2026-02-01 02:13:16.59401
3c906c98-18ee-4171-a8bc-6ed0cd12d3cf	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Prasad	9222657398	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "9222657398"}	2026-02-01 02:13:16.594013
0b89aed2-7a4a-416b-9956-72ebc09b98df	66e326b8-1664-439d-820e-aff3c700aea7	Meera Saxena	6937588251	Champions	PENDING	{"cohort": "Champions", "customer_name": "Meera Saxena", "contact_number": "6937588251"}	2026-02-01 02:13:16.594015
f84ced9a-e6c7-479f-950d-1ad728e76347	66e326b8-1664-439d-820e-aff3c700aea7	Pooja Sharma	9368539538	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Pooja Sharma", "contact_number": "9368539538"}	2026-02-01 02:13:16.594017
062a556c-77b1-4913-aa31-016544142d9e	66e326b8-1664-439d-820e-aff3c700aea7	Meera Banerjee	9780842521	Champions	PENDING	{"cohort": "Champions", "customer_name": "Meera Banerjee", "contact_number": "9780842521"}	2026-02-01 02:13:16.59402
545dafc3-a8c2-4ad3-88f9-f5cecb1df6f5	66e326b8-1664-439d-820e-aff3c700aea7	Ira Mishra	7371287442	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Mishra", "contact_number": "7371287442"}	2026-02-01 02:13:16.594022
bf6804f2-8b7f-4621-a0ad-cc75374f7129	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Yadav	7642151581	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Tanvi Yadav", "contact_number": "7642151581"}	2026-02-01 02:13:16.594024
07b3bb99-5e3a-4511-bb02-ea1c2953f0d8	66e326b8-1664-439d-820e-aff3c700aea7	Naina Narayan	7219550762	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Naina Narayan", "contact_number": "7219550762"}	2026-02-01 02:13:16.594027
0ce717c9-14aa-4f38-ae02-f7774d09d8a1	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Pandey	6264424157	Promising	PENDING	{"cohort": "Promising", "customer_name": "Rohan Pandey", "contact_number": "6264424157"}	2026-02-01 02:13:16.594029
516326e6-fa9c-4e63-b60b-694243b265a8	66e326b8-1664-439d-820e-aff3c700aea7	Yash Tiwari	8169503105	Champions	PENDING	{"cohort": "Champions", "customer_name": "Yash Tiwari", "contact_number": "8169503105"}	2026-02-01 02:13:16.594031
9d6f7bd8-9ac7-475c-9476-fcca342ec6a5	66e326b8-1664-439d-820e-aff3c700aea7	Mohit Roy	9861958570	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mohit Roy", "contact_number": "9861958570"}	2026-02-01 02:13:16.594034
817fffb4-b33b-44e4-9579-54ec9aff62f4	66e326b8-1664-439d-820e-aff3c700aea7	Neha Kulkarni	7950964486	Promising	PENDING	{"cohort": "Promising", "customer_name": "Neha Kulkarni", "contact_number": "7950964486"}	2026-02-01 02:13:16.594036
7f87cd16-3d39-41e3-8587-a950d2969fd4	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Gill	9287357760	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Tanvi Gill", "contact_number": "9287357760"}	2026-02-01 02:13:16.594039
020a16dd-e2a5-4997-aa68-802414621865	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Gowda	7279055207	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ananya Gowda", "contact_number": "7279055207"}	2026-02-01 02:13:16.594042
9501dc5b-3ad5-4a5f-a320-99491a70daa7	66e326b8-1664-439d-820e-aff3c700aea7	Sai Banerjee	6510663316	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sai Banerjee", "contact_number": "6510663316"}	2026-02-01 02:13:16.594044
8e528f14-fa8d-4c0d-8e8d-22e766adb19e	66e326b8-1664-439d-820e-aff3c700aea7	Neha Gowda	8255693255	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Neha Gowda", "contact_number": "8255693255"}	2026-02-01 02:13:16.594046
83537815-46d3-49c1-a642-8f18fa1e81bb	66e326b8-1664-439d-820e-aff3c700aea7	Sameer Thakur	7352337786	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sameer Thakur", "contact_number": "7352337786"}	2026-02-01 02:13:16.594049
b85ed38e-4778-483d-8298-80d8d5fcc052	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Shah	7461243567	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rahul Shah", "contact_number": "7461243567"}	2026-02-01 02:13:16.594051
eea2dd73-7b84-4942-aac0-2f8ebfebf039	66e326b8-1664-439d-820e-aff3c700aea7	Rashmi Sood	7368846023	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rashmi Sood", "contact_number": "7368846023"}	2026-02-01 02:13:16.594054
39c62bf3-a8c1-4d79-9571-99c393bf2115	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Hegde	6794629071	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Hegde", "contact_number": "6794629071"}	2026-02-01 02:13:16.594056
66ea7e21-e071-42e9-9611-07d37f1e4a86	66e326b8-1664-439d-820e-aff3c700aea7	Meera Chatterjee	9426820552	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Chatterjee", "contact_number": "9426820552"}	2026-02-01 02:13:16.594058
ab376334-ec60-4764-a9e7-ad1770c560af	66e326b8-1664-439d-820e-aff3c700aea7	Avni Das	7636902364	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Avni Das", "contact_number": "7636902364"}	2026-02-01 02:13:16.594061
428426c5-1155-4bd7-84a2-b311b1f2d1e7	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Verma	7570028939	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Verma", "contact_number": "7570028939"}	2026-02-01 02:13:16.594063
b251fa64-5cae-490e-878d-3280a56b30db	66e326b8-1664-439d-820e-aff3c700aea7	Aditya Mukherjee	8294401555	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aditya Mukherjee", "contact_number": "8294401555"}	2026-02-01 02:13:16.594065
ecf5122a-8775-4484-aa90-f74a6de13da8	66e326b8-1664-439d-820e-aff3c700aea7	Priya Thakur	8989885695	Champions	PENDING	{"cohort": "Champions", "customer_name": "Priya Thakur", "contact_number": "8989885695"}	2026-02-01 02:13:16.594068
ecab8174-7af5-42bb-a81e-7c7a9c4e3043	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Bajaj	7794450106	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Bajaj", "contact_number": "7794450106"}	2026-02-01 02:13:16.59407
8c899915-15d8-4cec-a629-8ccd70d830f7	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Pandey	7623950820	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arjun Pandey", "contact_number": "7623950820"}	2026-02-01 02:13:16.594073
2981c8e0-adba-4bf6-8340-401e50518ec7	66e326b8-1664-439d-820e-aff3c700aea7	Kabir Srinivasan	8094382969	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Kabir Srinivasan", "contact_number": "8094382969"}	2026-02-01 02:13:16.594075
893d0490-f902-4c25-a1ce-49cce17596f3	66e326b8-1664-439d-820e-aff3c700aea7	Kavya Das	9722228837	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kavya Das", "contact_number": "9722228837"}	2026-02-01 02:13:16.594077
8865710f-cb62-44e0-9d65-2c8e98ea5ac2	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Bhat	6966675046	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Bhat", "contact_number": "6966675046"}	2026-02-01 02:13:16.59408
3272182b-928f-40ac-890a-8a9df2aa36a5	66e326b8-1664-439d-820e-aff3c700aea7	Varun Deshmukh	9885217537	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Varun Deshmukh", "contact_number": "9885217537"}	2026-02-01 02:13:16.594082
cacea33c-8330-4a4a-9b46-614143011ac9	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Mukherjee	7074553619	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Arnav Mukherjee", "contact_number": "7074553619"}	2026-02-01 02:13:16.594085
89036e58-3b04-4722-8e35-47595d17ce1c	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Narayan	9306313812	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ishaan Narayan", "contact_number": "9306313812"}	2026-02-01 02:13:16.594087
6b6eba87-1508-47d0-bdf6-1cbeeac0a710	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Sharma	8463427382	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Sharma", "contact_number": "8463427382"}	2026-02-01 02:13:16.594089
a9ae89d2-a537-4b7a-9d7b-39ca3e3f2fc3	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Sood	7596878581	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Sood", "contact_number": "7596878581"}	2026-02-01 02:13:16.594092
ad07d4e3-6d0e-4357-b16b-d33fe5b19ec5	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Bajaj	7404186534	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Trisha Bajaj", "contact_number": "7404186534"}	2026-02-01 02:13:16.594094
74d411ba-c3af-4601-b52e-ae4303205566	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Reddy	8553608464	Lost	PENDING	{"cohort": "Lost", "customer_name": "Sakshi Reddy", "contact_number": "8553608464"}	2026-02-01 02:13:16.594097
7b66badd-9a95-47f2-bfd5-4dfcc312240e	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Mishra	8235834366	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Dhruv Mishra", "contact_number": "8235834366"}	2026-02-01 02:13:16.594099
41fada1b-5d7e-4a65-847b-866412411c79	66e326b8-1664-439d-820e-aff3c700aea7	Myra Khan	7923574064	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Myra Khan", "contact_number": "7923574064"}	2026-02-01 02:13:16.594101
23175b99-78ec-457e-b354-9984027e5fd7	66e326b8-1664-439d-820e-aff3c700aea7	Avni Bhat	7869464903	Champions	PENDING	{"cohort": "Champions", "customer_name": "Avni Bhat", "contact_number": "7869464903"}	2026-02-01 02:13:16.594104
a1258bb4-08bc-487a-878b-f199ddd8ea43	66e326b8-1664-439d-820e-aff3c700aea7	Isha Pandey	8322624835	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Isha Pandey", "contact_number": "8322624835"}	2026-02-01 02:13:16.594106
54ba5066-4bac-461b-b209-d933b5f6d622	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Rao	9410769701	Champions	PENDING	{"cohort": "Champions", "customer_name": "Vihaan Rao", "contact_number": "9410769701"}	2026-02-01 02:13:16.594109
724c0e56-0735-4cbc-9438-302e6636daef	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Iyer	6094075916	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Iyer", "contact_number": "6094075916"}	2026-02-01 02:13:16.594111
a143c97b-5a28-484b-93e2-5b441e8f4555	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Nair	6683226180	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nikhil Nair", "contact_number": "6683226180"}	2026-02-01 02:13:16.594113
1c654f3b-c6bb-446f-afab-06564fdcab36	66e326b8-1664-439d-820e-aff3c700aea7	Avni Pandey	8834952496	Champions	PENDING	{"cohort": "Champions", "customer_name": "Avni Pandey", "contact_number": "8834952496"}	2026-02-01 02:13:16.594116
45eb4bb2-1e02-4ff4-8e5e-5755bf7b308a	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Naik	7547846594	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Naik", "contact_number": "7547846594"}	2026-02-01 02:13:16.594118
206e14ef-087c-400b-979b-9cdf20d35e2c	66e326b8-1664-439d-820e-aff3c700aea7	Pooja Chaudhary	7843230883	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Pooja Chaudhary", "contact_number": "7843230883"}	2026-02-01 02:13:16.594121
f77da96f-bdae-48f4-be75-862403dc5cfb	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Sood	9564727757	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Sood", "contact_number": "9564727757"}	2026-02-01 02:13:16.594123
a13aa807-fbb0-4e0b-baba-a07365a2d5f5	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Tiwari	8184276820	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nandini Tiwari", "contact_number": "8184276820"}	2026-02-01 02:13:16.594127
86d3ba43-2c02-4a39-90ff-b620eacf2848	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Kaur	7576626521	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Kaur", "contact_number": "7576626521"}	2026-02-01 02:13:16.594129
d223ee66-f060-4ed5-ade7-d0251b4142b7	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Joshi	6126626100	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Nandini Joshi", "contact_number": "6126626100"}	2026-02-01 02:13:16.594132
3e47192a-12f9-4061-8d69-93a7308e41ad	66e326b8-1664-439d-820e-aff3c700aea7	Manav Rao	6112772143	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Rao", "contact_number": "6112772143"}	2026-02-01 02:13:16.594134
938d519b-2bc7-43cf-80db-9f1c417ae0ca	66e326b8-1664-439d-820e-aff3c700aea7	Yash Singh	8743600712	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Yash Singh", "contact_number": "8743600712"}	2026-02-01 02:13:16.594136
25821fec-3d22-4702-accb-a2f54ee3c29c	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Kulkarni	9041888172	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ayush Kulkarni", "contact_number": "9041888172"}	2026-02-01 02:13:16.594139
0cbd06db-ebbd-43de-9541-f5cdaab4ac26	66e326b8-1664-439d-820e-aff3c700aea7	Yash Bose	9291706239	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Yash Bose", "contact_number": "9291706239"}	2026-02-01 02:13:16.594141
0546bbff-f853-42d9-b6d6-d5b67a05014c	66e326b8-1664-439d-820e-aff3c700aea7	Parth Mukherjee	8177514230	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Parth Mukherjee", "contact_number": "8177514230"}	2026-02-01 02:13:16.594143
fac1ebc2-5e91-417b-8822-0ef289ad2e64	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Srinivasan	7924075329	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mansi Srinivasan", "contact_number": "7924075329"}	2026-02-01 02:13:16.594146
f85d9042-23f3-4969-8835-59041a9b8dbd	66e326b8-1664-439d-820e-aff3c700aea7	Anika Bajaj	9617246397	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Bajaj", "contact_number": "9617246397"}	2026-02-01 02:13:16.594148
ccbca237-9fde-4217-aeeb-da0c68a2d599	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Naik	6067712977	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Dhruv Naik", "contact_number": "6067712977"}	2026-02-01 02:13:16.594151
19ed5a73-eb1f-4bb1-97b4-612eef279377	66e326b8-1664-439d-820e-aff3c700aea7	Riya Srinivasan	9703720755	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Srinivasan", "contact_number": "9703720755"}	2026-02-01 02:13:16.594153
f5004f21-8715-40b4-b9c7-72e6ffdc5450	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Saha	9113728950	Lost	PENDING	{"cohort": "Lost", "customer_name": "Saanvi Saha", "contact_number": "9113728950"}	2026-02-01 02:13:16.594155
18d65f65-a5ec-4232-955d-c80e7b535549	66e326b8-1664-439d-820e-aff3c700aea7	Yash Patel	7485475786	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Yash Patel", "contact_number": "7485475786"}	2026-02-01 02:13:16.594158
4f8aeb1b-3379-4ed4-837b-ea405025e032	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Banerjee	8727653545	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ritvik Banerjee", "contact_number": "8727653545"}	2026-02-01 02:13:16.59416
89327c2d-8d81-4271-9058-fd74935a3cd0	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Saha	8361508182	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Saanvi Saha", "contact_number": "8361508182"}	2026-02-01 02:13:16.594162
3891c680-0474-4911-bcb4-eb9d095e2cc9	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Jain	9106346502	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rahul Jain", "contact_number": "9106346502"}	2026-02-01 02:13:16.594165
9bf6ce87-a0f0-42cf-b3b6-671d7dfaa006	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Shetty	6096984637	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Shetty", "contact_number": "6096984637"}	2026-02-01 02:13:16.594167
4622c34a-9d12-4f24-86cc-2e94c78e5722	66e326b8-1664-439d-820e-aff3c700aea7	Sai Nair	9870657802	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Sai Nair", "contact_number": "9870657802"}	2026-02-01 02:13:16.59417
6c2e405d-cd0e-4a9c-8971-6d25d779e5bf	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Chatterjee	6123165955	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ishaan Chatterjee", "contact_number": "6123165955"}	2026-02-01 02:13:16.594172
e753aeec-9649-465f-b1a0-e388ae6d3f66	66e326b8-1664-439d-820e-aff3c700aea7	Varun Bhat	6756741755	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Bhat", "contact_number": "6756741755"}	2026-02-01 02:13:16.594175
021e1563-5d21-4208-aa6c-d386a6d1f6b3	66e326b8-1664-439d-820e-aff3c700aea7	Ishaan Arora	7559959846	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ishaan Arora", "contact_number": "7559959846"}	2026-02-01 02:13:16.594177
390b4200-8366-422b-bac9-6737df7fb4f8	66e326b8-1664-439d-820e-aff3c700aea7	Ira Patel	8652792943	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ira Patel", "contact_number": "8652792943"}	2026-02-01 02:13:16.594179
fb6534f2-6bb1-4390-a705-7f8951abb5dc	66e326b8-1664-439d-820e-aff3c700aea7	Kabir Tripathi	6955933280	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kabir Tripathi", "contact_number": "6955933280"}	2026-02-01 02:13:16.594182
d168bec4-fe76-4dc2-957c-0439329471ad	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Shetty	8955504128	Promising	PENDING	{"cohort": "Promising", "customer_name": "Rahul Shetty", "contact_number": "8955504128"}	2026-02-01 02:13:16.594184
8ad5b593-3b98-46d3-9cd4-3d6489302926	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Tripathi	7280397771	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Tripathi", "contact_number": "7280397771"}	2026-02-01 02:13:16.594186
969c0118-760b-4bd7-ab94-b68decd33e5a	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Roy	6537500738	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Roy", "contact_number": "6537500738"}	2026-02-01 02:13:16.594189
ce50859f-5bdc-497a-b03a-e5af41d1e43f	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Tripathi	9917789660	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mansi Tripathi", "contact_number": "9917789660"}	2026-02-01 02:13:16.594191
9e42f9e1-7029-42cd-90c4-d39f233d05c0	66e326b8-1664-439d-820e-aff3c700aea7	Varun Bajaj	6353616997	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Varun Bajaj", "contact_number": "6353616997"}	2026-02-01 02:13:16.594194
105403f7-2390-4498-baf4-ce98d6b2f239	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Bhat	6223105030	Champions	PENDING	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6223105030"}	2026-02-01 02:13:16.594196
12800011-c11f-4c7c-9a32-3428c31f001f	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Sood	9711546167	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vivaan Sood", "contact_number": "9711546167"}	2026-02-01 02:13:16.594198
d8a75237-988c-4843-9153-372d7dad11cf	66e326b8-1664-439d-820e-aff3c700aea7	Kavya Malhotra	7224651431	Champions	PENDING	{"cohort": "Champions", "customer_name": "Kavya Malhotra", "contact_number": "7224651431"}	2026-02-01 02:13:16.594201
92eb1277-3d3f-4060-914b-88512d1b82b0	66e326b8-1664-439d-820e-aff3c700aea7	Priya Sharma	8503969410	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Priya Sharma", "contact_number": "8503969410"}	2026-02-01 02:13:16.594203
0bc2b318-de1d-4b05-8ec5-9067fe3179f6	66e326b8-1664-439d-820e-aff3c700aea7	Kunal Ghosh	7137810998	Lost	PENDING	{"cohort": "Lost", "customer_name": "Kunal Ghosh", "contact_number": "7137810998"}	2026-02-01 02:13:16.594205
0b1c9b22-7fa4-4996-9e48-787070df35c0	66e326b8-1664-439d-820e-aff3c700aea7	Parth Malhotra	8061402525	Lost	PENDING	{"cohort": "Lost", "customer_name": "Parth Malhotra", "contact_number": "8061402525"}	2026-02-01 02:13:16.594208
2a52f36a-01e7-4b27-843a-3b8ff927656f	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Tripathi	8569663952	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "8569663952"}	2026-02-01 02:13:16.59421
88dca348-cd41-45d0-88c5-69fd02a3219b	66e326b8-1664-439d-820e-aff3c700aea7	Sneha Gill	6276060328	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Gill", "contact_number": "6276060328"}	2026-02-01 02:13:16.594213
6f1a8bdb-8ee7-4028-986e-a80715e366f3	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Shetty	8808623903	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ayush Shetty", "contact_number": "8808623903"}	2026-02-01 02:13:16.594215
c1b6223a-84cb-4841-b1d5-ee3e2cfb1a08	66e326b8-1664-439d-820e-aff3c700aea7	Avni Chaudhary	6154902533	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Chaudhary", "contact_number": "6154902533"}	2026-02-01 02:13:16.594218
c91912f2-fd7e-422f-8f3c-1a3addd331c6	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Chatterjee	7063399202	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Chatterjee", "contact_number": "7063399202"}	2026-02-01 02:13:16.59422
023275f6-a933-446d-859d-7c8b94f8e7fe	66e326b8-1664-439d-820e-aff3c700aea7	Riya Chatterjee	9880521860	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Riya Chatterjee", "contact_number": "9880521860"}	2026-02-01 02:13:16.594222
79080c08-d221-4b0e-8aff-61c13cb4c7a6	66e326b8-1664-439d-820e-aff3c700aea7	Anika Mishra	9568645436	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Anika Mishra", "contact_number": "9568645436"}	2026-02-01 02:13:16.594225
a8dbe643-021f-4dd2-a8dc-ef517c406cf1	66e326b8-1664-439d-820e-aff3c700aea7	Riya Verma	9521588375	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Verma", "contact_number": "9521588375"}	2026-02-01 02:13:16.594227
362b8dd5-87e6-47a9-8dcc-103eb09d1eea	66e326b8-1664-439d-820e-aff3c700aea7	Varun Bansal	7497651057	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Bansal", "contact_number": "7497651057"}	2026-02-01 02:13:16.59423
f2684b87-a44a-4681-80f3-960fdc42252a	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Hegde	7387784449	Champions	PENDING	{"cohort": "Champions", "customer_name": "Gaurav Hegde", "contact_number": "7387784449"}	2026-02-01 02:13:16.594232
ef1e0a05-ce12-49c4-bdb1-360232157b3a	66e326b8-1664-439d-820e-aff3c700aea7	Avni Saxena	8111096665	Promising	PENDING	{"cohort": "Promising", "customer_name": "Avni Saxena", "contact_number": "8111096665"}	2026-02-01 02:13:16.594234
ad811b83-70f1-44f5-86ba-2517b22a6e78	66e326b8-1664-439d-820e-aff3c700aea7	Dev Singh	7636456738	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dev Singh", "contact_number": "7636456738"}	2026-02-01 02:13:16.594237
8f7e4ba5-2cf0-4b60-9495-df28434af8f6	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Pandey	9412499926	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Pandey", "contact_number": "9412499926"}	2026-02-01 02:13:16.594239
69769fab-f548-454a-b365-ccd79e4994e1	66e326b8-1664-439d-820e-aff3c700aea7	Anvi Nair	7709984342	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Anvi Nair", "contact_number": "7709984342"}	2026-02-01 02:13:16.594241
e8a74013-0c32-466f-ab27-ac53d7d25ad8	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Shetty	9768739556	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Aditi Shetty", "contact_number": "9768739556"}	2026-02-01 02:13:16.594244
55909588-ebb4-411f-88b2-e8e70893c6fa	66e326b8-1664-439d-820e-aff3c700aea7	Vivaan Saxena	6548095375	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vivaan Saxena", "contact_number": "6548095375"}	2026-02-01 02:13:16.594246
3195cbde-3c13-4f9b-8af9-b815cc22f1f3	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Prasad	6148721296	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Shreya Prasad", "contact_number": "6148721296"}	2026-02-01 02:13:16.594248
4b1d635c-9f6f-45d2-ad34-a0be733112a5	66e326b8-1664-439d-820e-aff3c700aea7	Gaurav Verma	7460515853	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Gaurav Verma", "contact_number": "7460515853"}	2026-02-01 02:13:16.594251
5916895d-042a-4548-97c0-e01131eabd61	66e326b8-1664-439d-820e-aff3c700aea7	Sai Narayan	8415724269	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sai Narayan", "contact_number": "8415724269"}	2026-02-01 02:13:16.594261
c0a2d03f-eda0-462e-8d70-528ee18f3591	66e326b8-1664-439d-820e-aff3c700aea7	Manav Nair	7711435375	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Manav Nair", "contact_number": "7711435375"}	2026-02-01 02:13:16.594263
b2af8255-2022-48d7-9f7c-d261fde5e8b9	66e326b8-1664-439d-820e-aff3c700aea7	Trisha Pandey	7337956181	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Trisha Pandey", "contact_number": "7337956181"}	2026-02-01 02:13:16.594266
2b1980d7-2e8d-458f-b6ee-e81c0a78db45	66e326b8-1664-439d-820e-aff3c700aea7	Aadhya Mehta	6437461126	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aadhya Mehta", "contact_number": "6437461126"}	2026-02-01 02:13:16.594268
bd6d0a01-50cb-489a-8898-2c6501dcc650	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Malhotra	8044864264	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aarohi Malhotra", "contact_number": "8044864264"}	2026-02-01 02:13:16.594271
87fce564-c3a2-47f6-8514-0940957f8701	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Roy	9062565801	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Roy", "contact_number": "9062565801"}	2026-02-01 02:13:16.594273
9b64973d-671b-45ca-ac24-54fc8220655d	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Jain	8086829041	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Jain", "contact_number": "8086829041"}	2026-02-01 02:13:16.594275
04ddff8a-b7cd-4862-8db3-01baed55c14a	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Sood	8665714590	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Rahul Sood", "contact_number": "8665714590"}	2026-02-01 02:13:16.594278
d4dd9b3a-9a5f-4912-9f72-63ccd75c89ab	66e326b8-1664-439d-820e-aff3c700aea7	Sakshi Malhotra	8388780418	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sakshi Malhotra", "contact_number": "8388780418"}	2026-02-01 02:13:16.59428
6acbb625-6eb9-490e-996b-4f768b3bb28b	66e326b8-1664-439d-820e-aff3c700aea7	Anika Sood	8556617694	Champions	PENDING	{"cohort": "Champions", "customer_name": "Anika Sood", "contact_number": "8556617694"}	2026-02-01 02:13:16.594283
6e11186c-742b-423f-9056-9b714a4c2e65	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Tripathi	8482569647	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Tripathi", "contact_number": "8482569647"}	2026-02-01 02:13:16.594285
3e281fc5-de82-47e2-8e3c-283d3b92bb02	66e326b8-1664-439d-820e-aff3c700aea7	Aarohi Shah	9416790061	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarohi Shah", "contact_number": "9416790061"}	2026-02-01 02:13:16.594287
7762d2d8-612c-464f-b924-a4ceda88dc20	66e326b8-1664-439d-820e-aff3c700aea7	Priya Verma	7794356022	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Priya Verma", "contact_number": "7794356022"}	2026-02-01 02:13:16.59429
21bd7361-85e6-4992-97bf-7afd2b9fa896	66e326b8-1664-439d-820e-aff3c700aea7	Ayush Shetty	6353063760	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ayush Shetty", "contact_number": "6353063760"}	2026-02-01 02:13:16.594292
3643f17e-6304-4dde-abf9-2f6ac7c52fc3	66e326b8-1664-439d-820e-aff3c700aea7	Vihaan Aggarwal	7189440114	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vihaan Aggarwal", "contact_number": "7189440114"}	2026-02-01 02:13:16.594295
cbd5ea29-67ad-4c5e-ac84-ba784c263742	66e326b8-1664-439d-820e-aff3c700aea7	Myra Narayan	8489055650	Lost	PENDING	{"cohort": "Lost", "customer_name": "Myra Narayan", "contact_number": "8489055650"}	2026-02-01 02:13:16.594297
e176366e-5a60-4317-8c4b-cdf953086fa9	66e326b8-1664-439d-820e-aff3c700aea7	Arjun Bajaj	8783920968	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arjun Bajaj", "contact_number": "8783920968"}	2026-02-01 02:13:16.594299
fd4abc9b-440a-4a96-9628-753b38a126a5	66e326b8-1664-439d-820e-aff3c700aea7	Aman Gupta	9117387208	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aman Gupta", "contact_number": "9117387208"}	2026-02-01 02:13:16.594302
a3a39ac4-f26c-4bbc-aa14-7a68fcde8032	66e326b8-1664-439d-820e-aff3c700aea7	Parth Verma	8492317794	Champions	PENDING	{"cohort": "Champions", "customer_name": "Parth Verma", "contact_number": "8492317794"}	2026-02-01 02:13:16.594304
264e26ef-bc92-4859-956b-25c56fd6fd0c	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Das	6791348337	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Saanvi Das", "contact_number": "6791348337"}	2026-02-01 02:13:16.594307
69671051-1738-4a83-9e3f-4bd70640ecdd	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Verma	6896174750	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Verma", "contact_number": "6896174750"}	2026-02-01 02:13:16.594309
7c88f452-7e3c-4408-b369-c3b8ebebe06a	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Menon	6650405635	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aditi Menon", "contact_number": "6650405635"}	2026-02-01 02:13:16.594311
2f9d0d77-2fe9-440b-8064-1d7214a02056	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Nair	8622257621	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Nair", "contact_number": "8622257621"}	2026-02-01 02:13:16.594314
5541a775-1e67-492b-91b6-458d6c059d8f	66e326b8-1664-439d-820e-aff3c700aea7	Priya Gowda	6065233172	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Priya Gowda", "contact_number": "6065233172"}	2026-02-01 02:13:16.594316
a0745c4d-c9e0-4976-9048-eeb2081fab25	66e326b8-1664-439d-820e-aff3c700aea7	Ayaan Prasad	7138500903	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ayaan Prasad", "contact_number": "7138500903"}	2026-02-01 02:13:16.594319
60ddc2a5-7d7b-4c36-9f62-5bd051934435	66e326b8-1664-439d-820e-aff3c700aea7	Ira Pandey	6415586638	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Pandey", "contact_number": "6415586638"}	2026-02-01 02:13:16.594321
4dbb377b-7e1f-4442-bc88-441fcc16426d	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Bose	6974189446	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Bose", "contact_number": "6974189446"}	2026-02-01 02:13:16.594324
242f7392-c9e0-4f0b-adcb-439d9ce6af53	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Kapoor	9491823193	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dhruv Kapoor", "contact_number": "9491823193"}	2026-02-01 02:13:16.594326
7a8696a9-0b93-407e-9752-21b34801cb4f	66e326b8-1664-439d-820e-aff3c700aea7	Ananya Chaudhary	8404341761	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Chaudhary", "contact_number": "8404341761"}	2026-02-01 02:13:16.594328
cf683cc9-5269-49f6-858b-96ac94adabd5	66e326b8-1664-439d-820e-aff3c700aea7	Naina Gill	6471503452	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Naina Gill", "contact_number": "6471503452"}	2026-02-01 02:13:16.594331
45c0e339-c8fe-4dd9-8644-e337ee151323	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Iyer	7593385747	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Iyer", "contact_number": "7593385747"}	2026-02-01 02:13:16.594333
381726c9-23e8-46e0-bed2-d7fc528dbb64	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Singh	7167781530	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Dhruv Singh", "contact_number": "7167781530"}	2026-02-01 02:13:16.594336
5149d3a2-e4cf-4b18-b6ce-41b495cc127f	66e326b8-1664-439d-820e-aff3c700aea7	Meera Reddy	9190187346	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Meera Reddy", "contact_number": "9190187346"}	2026-02-01 02:13:16.594338
91521255-2fb0-4336-81a9-bd374cc44799	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Verma	6215787642	Lost	PENDING	{"cohort": "Lost", "customer_name": "Shreya Verma", "contact_number": "6215787642"}	2026-02-01 02:13:16.59434
6e802c7a-6bed-478a-8a8e-3a6cf90378e8	66e326b8-1664-439d-820e-aff3c700aea7	Rupali Ghosh	9163593949	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rupali Ghosh", "contact_number": "9163593949"}	2026-02-01 02:13:16.594343
13f9499e-1f20-4245-8cb6-3f1f89d500a7	66e326b8-1664-439d-820e-aff3c700aea7	Kavya Hegde	8956588099	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Kavya Hegde", "contact_number": "8956588099"}	2026-02-01 02:13:16.594345
32eb4e93-ee9e-4b75-8910-622fd8b70dbd	66e326b8-1664-439d-820e-aff3c700aea7	Anvi Malhotra	6783882733	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Anvi Malhotra", "contact_number": "6783882733"}	2026-02-01 02:13:16.594347
d4253e46-cd0e-40f2-bae1-64dc0133562c	66e326b8-1664-439d-820e-aff3c700aea7	Arnav Arora	9442115834	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arnav Arora", "contact_number": "9442115834"}	2026-02-01 02:13:16.59435
682862ab-d42c-4692-ba2b-e350a238a3fb	66e326b8-1664-439d-820e-aff3c700aea7	Diya Patel	8961007449	Lost	PENDING	{"cohort": "Lost", "customer_name": "Diya Patel", "contact_number": "8961007449"}	2026-02-01 02:13:16.594352
d5dfc0eb-40e9-4ada-9f74-1954c698fb3f	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Bhat	6188869644	Champions	PENDING	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6188869644"}	2026-02-01 02:13:16.594355
d963c81c-1b80-4f2b-b872-f4f2758781cc	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Srinivasan	9324047729	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Srinivasan", "contact_number": "9324047729"}	2026-02-01 02:13:16.594357
bdb36172-e642-42a1-9999-ce3ade2b9871	66e326b8-1664-439d-820e-aff3c700aea7	Saanvi Reddy	8004359075	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Reddy", "contact_number": "8004359075"}	2026-02-01 02:13:16.594359
34e42f55-bbf3-43bc-b09f-792701909202	66e326b8-1664-439d-820e-aff3c700aea7	Harsh Bajaj	8408047906	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Harsh Bajaj", "contact_number": "8408047906"}	2026-02-01 02:13:16.594362
324d5ba9-1827-4316-a143-23d5ce7b96f8	66e326b8-1664-439d-820e-aff3c700aea7	Meera Hegde	8695049533	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Hegde", "contact_number": "8695049533"}	2026-02-01 02:13:16.594364
987a99f7-1376-4d19-b53d-9d764f9e85d4	66e326b8-1664-439d-820e-aff3c700aea7	Naina Iyer	8209775041	Lost	PENDING	{"cohort": "Lost", "customer_name": "Naina Iyer", "contact_number": "8209775041"}	2026-02-01 02:13:16.594367
4f138666-d326-4c80-884e-a6cadeff5b37	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Prasad	6627041072	Champions	PENDING	{"cohort": "Champions", "customer_name": "Tanvi Prasad", "contact_number": "6627041072"}	2026-02-01 02:13:16.594369
e098fb17-ba45-4b9c-b793-6d1112f21aa9	66e326b8-1664-439d-820e-aff3c700aea7	Tanvi Gupta	8227697631	Promising	PENDING	{"cohort": "Promising", "customer_name": "Tanvi Gupta", "contact_number": "8227697631"}	2026-02-01 02:13:16.594371
17d099a5-6415-4ee9-923d-900d22a78f78	66e326b8-1664-439d-820e-aff3c700aea7	Kunal Shetty	7478301914	Lost	PENDING	{"cohort": "Lost", "customer_name": "Kunal Shetty", "contact_number": "7478301914"}	2026-02-01 02:13:16.594374
20078598-0502-4303-a780-ec0b01083f24	66e326b8-1664-439d-820e-aff3c700aea7	Manav Gowda	9724627367	Promising	PENDING	{"cohort": "Promising", "customer_name": "Manav Gowda", "contact_number": "9724627367"}	2026-02-01 02:13:16.594376
2460f182-0bc1-4630-92a7-279fde135221	66e326b8-1664-439d-820e-aff3c700aea7	Siddharth Patel	6044499263	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Siddharth Patel", "contact_number": "6044499263"}	2026-02-01 02:13:16.594378
ccc5e8ab-436c-4a1b-b34b-fc9631acb48c	66e326b8-1664-439d-820e-aff3c700aea7	Neha Narayan	8180946960	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Narayan", "contact_number": "8180946960"}	2026-02-01 02:13:16.594381
4ae0bd75-f0e9-437d-8b33-49b0780ebd11	66e326b8-1664-439d-820e-aff3c700aea7	Rahul Sharma	8949832063	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rahul Sharma", "contact_number": "8949832063"}	2026-02-01 02:13:16.594383
97ab489f-8c46-4df5-b121-decdaa437106	66e326b8-1664-439d-820e-aff3c700aea7	Pallavi Tripathi	7751361568	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "7751361568"}	2026-02-01 02:13:16.594387
60951083-68d7-4cf5-9a94-ffda1525b1de	66e326b8-1664-439d-820e-aff3c700aea7	Rashmi Deshmukh	6456372060	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Rashmi Deshmukh", "contact_number": "6456372060"}	2026-02-01 02:13:16.594389
b79874f8-7075-4f1a-a734-e79d2c0840c5	66e326b8-1664-439d-820e-aff3c700aea7	Reyansh Mishra	7967181685	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Reyansh Mishra", "contact_number": "7967181685"}	2026-02-01 02:13:16.594392
bcd8d5bf-8e02-4a1f-88c4-e31ec1d5e2d0	66e326b8-1664-439d-820e-aff3c700aea7	Siddharth Srinivasan	7862496924	Champions	PENDING	{"cohort": "Champions", "customer_name": "Siddharth Srinivasan", "contact_number": "7862496924"}	2026-02-01 02:13:16.594394
fce6dc55-2bfc-4c23-8594-ec3ca2559228	66e326b8-1664-439d-820e-aff3c700aea7	Nandini Pandey	8272039281	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Pandey", "contact_number": "8272039281"}	2026-02-01 02:13:16.594396
bbdc4c96-8687-4f4d-b988-c90fe7d6e9ec	66e326b8-1664-439d-820e-aff3c700aea7	Ritvik Menon	6496141726	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ritvik Menon", "contact_number": "6496141726"}	2026-02-01 02:13:16.594399
e3d10ef8-8bf5-4ecb-8785-95abeedeecbb	66e326b8-1664-439d-820e-aff3c700aea7	Manav Khan	9710524816	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Manav Khan", "contact_number": "9710524816"}	2026-02-01 02:13:16.594401
60b80d4e-4f46-46cd-9086-491143557f0d	66e326b8-1664-439d-820e-aff3c700aea7	Dev Naik	6627955944	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Dev Naik", "contact_number": "6627955944"}	2026-02-01 02:13:16.594403
729a6ac6-be1e-4745-9d13-08bbcf83bfae	66e326b8-1664-439d-820e-aff3c700aea7	Aman Saha	6509845936	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aman Saha", "contact_number": "6509845936"}	2026-02-01 02:13:16.594406
32fb72b8-58d8-4f45-a068-7b2ce2c23b07	66e326b8-1664-439d-820e-aff3c700aea7	Aditi Shetty	9096383872	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Shetty", "contact_number": "9096383872"}	2026-02-01 02:13:16.594408
7814d47a-7a8e-46cc-bb1d-af8e22a89143	66e326b8-1664-439d-820e-aff3c700aea7	Dhruv Kulkarni	7103168630	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dhruv Kulkarni", "contact_number": "7103168630"}	2026-02-01 02:13:16.594411
dae6cf97-a32c-4833-9146-70829ce75b22	66e326b8-1664-439d-820e-aff3c700aea7	Nikhil Mishra	9711754053	Promising	PENDING	{"cohort": "Promising", "customer_name": "Nikhil Mishra", "contact_number": "9711754053"}	2026-02-01 02:13:16.594413
2014a1ea-69b4-4246-a3f9-80141b172637	66e326b8-1664-439d-820e-aff3c700aea7	Rashmi Kaur	9903374265	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Kaur", "contact_number": "9903374265"}	2026-02-01 02:13:16.594415
66bc6074-1174-49ec-8af3-bdd05bd1a604	66e326b8-1664-439d-820e-aff3c700aea7	Shreya Saha	7720740962	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Saha", "contact_number": "7720740962"}	2026-02-01 02:13:16.594418
db6b986c-0095-421e-a0c9-983a2382c512	66e326b8-1664-439d-820e-aff3c700aea7	Rohan Mukherjee	7069806808	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Mukherjee", "contact_number": "7069806808"}	2026-02-01 02:13:16.59442
a1177bd7-0a6f-493d-94d1-6eb553170f82	66e326b8-1664-439d-820e-aff3c700aea7	Mansi Shah	6472848963	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Shah", "contact_number": "6472848963"}	2026-02-01 02:13:16.594423
6899f465-353e-4f64-b689-01407c1e8b00	66e326b8-1664-439d-820e-aff3c700aea7	Anika Tiwari	7392010271	Lost	PENDING	{"cohort": "Lost", "customer_name": "Anika Tiwari", "contact_number": "7392010271"}	2026-02-01 02:13:16.594425
3fe3578c-846e-4a83-9aac-c4b78b53d4cd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sameer Iyer	7756343432	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sameer Iyer", "contact_number": "7756343432"}	2026-02-01 10:22:00.496643
24ff7b01-b99a-4445-b365-d73254a9be96	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Gill	8872090747	Lost	PENDING	{"cohort": "Lost", "customer_name": "Vivaan Gill", "contact_number": "8872090747"}	2026-02-01 10:22:00.496649
5dfcf0b4-da64-4931-8fa9-da55fb1ae875	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Mukherjee	9647026354	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Anika Mukherjee", "contact_number": "9647026354"}	2026-02-01 10:22:00.496655
1ac5c667-0f95-425e-9905-1ccf489b6d88	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Nair	8473722111	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Myra Nair", "contact_number": "8473722111"}	2026-02-01 10:22:00.496657
a262bfd1-0c0a-4542-9caf-7fa69b83fdaf	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Reddy	7172575982	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ayush Reddy", "contact_number": "7172575982"}	2026-02-01 10:22:00.49666
28d0509e-0111-4c76-b0dc-b548f5da8ef0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Gill	8105295618	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Mohit Gill", "contact_number": "8105295618"}	2026-02-01 10:22:00.496663
6c260a11-b83e-45ce-ac32-7cdbcd073d75	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Shetty	9102439281	Champions	PENDING	{"cohort": "Champions", "customer_name": "Nandini Shetty", "contact_number": "9102439281"}	2026-02-01 10:22:00.496666
bba30e2c-2fcc-4f5b-9672-fdc932a6a6b5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Yadav	6406015391	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Sai Yadav", "contact_number": "6406015391"}	2026-02-01 10:22:00.496669
e1660a57-3435-4805-9910-265572f37826	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Gupta	9672544893	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Manav Gupta", "contact_number": "9672544893"}	2026-02-01 10:22:00.496672
1e7033be-56fc-4244-926b-0f94041caa15	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Shah	6679226110	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Vivaan Shah", "contact_number": "6679226110"}	2026-02-01 10:22:00.496675
37300617-8da4-41f1-8833-a1644b39b715	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Chatterjee	6464022802	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Chatterjee", "contact_number": "6464022802"}	2026-02-01 10:22:00.496678
a2a56da1-30ae-424c-b213-09360318ea71	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Chaudhary	8766945698	Lost	PENDING	{"cohort": "Lost", "customer_name": "Neha Chaudhary", "contact_number": "8766945698"}	2026-02-01 10:22:00.496681
370ca891-833b-40d9-8587-bc48e4ff865d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Rao	6075894434	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Vivaan Rao", "contact_number": "6075894434"}	2026-02-01 10:22:00.496685
b2be6433-727f-471f-a060-5da4cf8ba96a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Arora	8540043209	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Diya Arora", "contact_number": "8540043209"}	2026-02-01 10:22:00.496687
b7360de3-4304-4db7-a4b5-c489d56b55f1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Bhat	6962074691	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Bhat", "contact_number": "6962074691"}	2026-02-01 10:22:00.49669
a221c0da-8cff-4a65-8374-67f1d7722edc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sneha Tripathi	9640336836	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sneha Tripathi", "contact_number": "9640336836"}	2026-02-01 10:22:00.496692
0bf8c5c4-4a21-49b6-ba8e-5dfc428c1eda	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Tiwari	8647002178	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Myra Tiwari", "contact_number": "8647002178"}	2026-02-01 10:22:00.496695
47a39607-047a-4778-83ad-0699208e086c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Saha	6654137672	Promising	PENDING	{"cohort": "Promising", "customer_name": "Shreya Saha", "contact_number": "6654137672"}	2026-02-01 10:22:00.496698
5ff2e07f-76cd-4d63-83c7-b779a69174f2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Sharma	7946196215	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Avni Sharma", "contact_number": "7946196215"}	2026-02-01 10:22:00.496702
f2a646db-6b29-4fd9-8de8-9ed815cec892	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Singh	9099418475	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Parth Singh", "contact_number": "9099418475"}	2026-02-01 10:22:00.496705
2f0fafda-0b4a-4ca4-aa5a-2289f82e0d58	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Mishra	8444411571	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Harsh Mishra", "contact_number": "8444411571"}	2026-02-01 10:22:00.496707
5ae6de7a-fa10-4030-90b5-d1a46f8638a7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Saha	6274958225	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rahul Saha", "contact_number": "6274958225"}	2026-02-01 10:22:00.49671
703d1cee-fe84-4065-a381-2db78700fd62	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Roy	9844373989	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ishaan Roy", "contact_number": "9844373989"}	2026-02-01 10:22:00.496712
17c41393-5d8f-46cb-9b6e-19c278bdf34a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Bansal	7527077836	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Parth Bansal", "contact_number": "7527077836"}	2026-02-01 10:22:00.496715
62ff131a-cff7-470f-8870-00933dea10aa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Shah	7405588454	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Reyansh Shah", "contact_number": "7405588454"}	2026-02-01 10:22:00.496717
7a84ad44-6ae7-40b0-b3bd-1ffc50dae992	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Reddy	7461493668	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Reddy", "contact_number": "7461493668"}	2026-02-01 10:22:00.49672
483804fe-1981-43da-bdb2-0a699dbd044e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kunal Aggarwal	9968456262	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kunal Aggarwal", "contact_number": "9968456262"}	2026-02-01 10:22:00.496724
32d5ea33-6124-4d43-8e7f-c0bdae5c822e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Bose	7740684690	Promising	PENDING	{"cohort": "Promising", "customer_name": "Naina Bose", "contact_number": "7740684690"}	2026-02-01 10:22:00.496727
0e41b346-528b-4c02-95f2-2cd6fae58951	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Gupta	6231557108	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Avni Gupta", "contact_number": "6231557108"}	2026-02-01 10:22:00.496729
d95600be-f49d-4c66-b8e6-6c7848233378	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Pandey	7452646842	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dev Pandey", "contact_number": "7452646842"}	2026-02-01 10:22:00.496731
3d55ecf6-b728-4f58-acce-cb7d087101b3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sneha Iyer	7099296439	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Iyer", "contact_number": "7099296439"}	2026-02-01 10:22:00.496734
3d99ea77-0ae2-457a-842d-2e5806df3a85	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Malhotra	9133260830	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rupali Malhotra", "contact_number": "9133260830"}	2026-02-01 10:22:00.496736
a029b693-7d27-444a-a5cb-6999cf6c2305	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Rao	6978972821	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sai Rao", "contact_number": "6978972821"}	2026-02-01 10:22:00.496739
a48d39b9-d617-4529-9060-8cb4f97a26dd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kiara Srinivasan	8676869634	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kiara Srinivasan", "contact_number": "8676869634"}	2026-02-01 10:22:00.496741
680a0cde-1b33-4943-98be-2fef55687f78	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Kapoor	8702711595	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aditi Kapoor", "contact_number": "8702711595"}	2026-02-01 10:22:00.496743
d48553df-e4b0-4587-8a0f-3c184cdc0692	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kavya Das	8828487319	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Kavya Das", "contact_number": "8828487319"}	2026-02-01 10:22:00.496746
b39bb91b-3c30-4fbb-a782-35b81b69e334	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Patel	7726638503	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ritvik Patel", "contact_number": "7726638503"}	2026-02-01 10:22:00.496748
43cac19e-f85c-46c5-9497-56abc4aeb797	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditya Gowda	8546658912	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aditya Gowda", "contact_number": "8546658912"}	2026-02-01 10:22:00.496751
552e9f50-56bf-47a4-b0c8-65478aae9383	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Bajaj	6693666476	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Myra Bajaj", "contact_number": "6693666476"}	2026-02-01 10:22:00.496753
16768755-b3e3-42dc-a350-cd0141ecf6bd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kiara Shah	6193408146	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Kiara Shah", "contact_number": "6193408146"}	2026-02-01 10:22:00.496756
3ff0695a-d485-4dba-b355-d8d2e275cbb7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Chatterjee	9578686926	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Pallavi Chatterjee", "contact_number": "9578686926"}	2026-02-01 10:22:00.496759
189cfb6a-eef8-4fe0-9574-d5f053b401c2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Reddy	7498065933	Promising	PENDING	{"cohort": "Promising", "customer_name": "Trisha Reddy", "contact_number": "7498065933"}	2026-02-01 10:22:00.496761
053fc59b-5e4d-449d-92a1-1f4f040db520	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Saha	7998026903	Champions	PENDING	{"cohort": "Champions", "customer_name": "Varun Saha", "contact_number": "7998026903"}	2026-02-01 10:22:00.496764
321b3d7b-72bd-48fe-b748-7a292ebe2afd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Srinivasan	7728558277	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nikhil Srinivasan", "contact_number": "7728558277"}	2026-02-01 10:22:00.496766
cbdb5b1e-468b-45d3-9228-fdb886eb4857	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Kapoor	6299571813	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mansi Kapoor", "contact_number": "6299571813"}	2026-02-01 10:22:00.496769
4032743e-8e6c-4dd4-a844-ca2b08ce1324	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Kapoor	7502141043	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ananya Kapoor", "contact_number": "7502141043"}	2026-02-01 10:22:00.496771
f73ffe8a-ec64-4b4d-8ffb-da62c6edcb3e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kunal Roy	6426796360	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Kunal Roy", "contact_number": "6426796360"}	2026-02-01 10:22:00.496774
2b6b27fa-e635-48ce-b744-3d72f0a5d39b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Saha	9841748311	Promising	PENDING	{"cohort": "Promising", "customer_name": "Gaurav Saha", "contact_number": "9841748311"}	2026-02-01 10:22:00.496776
adc75e40-a2f8-46cc-a597-271c429c8132	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Hegde	8352547168	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Hegde", "contact_number": "8352547168"}	2026-02-01 10:22:00.496778
1364d13b-77da-48e5-8b55-8bd5f619df39	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Patel	7484837332	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Patel", "contact_number": "7484837332"}	2026-02-01 10:22:00.496781
4a574a22-44b8-496f-94d1-f2b58e54e29c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Srinivasan	7640047310	Lost	PENDING	{"cohort": "Lost", "customer_name": "Naina Srinivasan", "contact_number": "7640047310"}	2026-02-01 10:22:00.496783
a1181465-4cff-4e87-979d-d7a1d531b698	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Shetty	8648949023	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "8648949023"}	2026-02-01 10:22:00.496786
65ae91bf-8dad-4d3e-891f-63bec90ca9d4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Mukherjee	6526218375	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Dev Mukherjee", "contact_number": "6526218375"}	2026-02-01 10:22:00.496788
0ed609d0-1105-4d45-8ac6-b5a226bd448d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Pandey	9898660982	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ananya Pandey", "contact_number": "9898660982"}	2026-02-01 10:22:00.496791
0eb6dce6-ed5d-44c7-9591-8f53c7c5f07f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Saha	7279311607	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Varun Saha", "contact_number": "7279311607"}	2026-02-01 10:22:00.496794
7f7a67aa-81e0-47e6-b873-7d54cfde0c79	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Srinivasan	6053413395	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Rupali Srinivasan", "contact_number": "6053413395"}	2026-02-01 10:22:00.496796
de986499-7424-48de-af70-c0f75f690004	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Rao	6170044642	Champions	PENDING	{"cohort": "Champions", "customer_name": "Harsh Rao", "contact_number": "6170044642"}	2026-02-01 10:22:00.496798
da788fbf-2687-4f92-a4ae-df7689326442	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Hegde	6316553290	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Myra Hegde", "contact_number": "6316553290"}	2026-02-01 10:22:00.496801
eb30e077-5c68-487f-bb49-f493d7385da6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Bajaj	7321230713	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Bajaj", "contact_number": "7321230713"}	2026-02-01 10:22:00.496803
29379254-fa9c-449d-a557-e2478ebc0d8c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Mehta	7588080098	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Mehta", "contact_number": "7588080098"}	2026-02-01 10:22:00.496805
d0ced50c-f097-460e-b538-9d4b6e993a56	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Gupta	9574103868	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Myra Gupta", "contact_number": "9574103868"}	2026-02-01 10:22:00.496808
272cf722-c6d5-4a08-8b56-2d02a039beb3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Jain	8082553333	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Jain", "contact_number": "8082553333"}	2026-02-01 10:22:00.49681
c7959a5d-b247-4588-9e2a-d17145905421	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Saha	7065173961	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arnav Saha", "contact_number": "7065173961"}	2026-02-01 10:22:00.496813
136f8970-2d57-4dea-b950-cd91c90cb879	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Roy	6116761747	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Roy", "contact_number": "6116761747"}	2026-02-01 10:22:00.496815
79615dda-760a-4942-a0f4-fd9d9a8b65d5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anvi Prasad	9686939344	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Anvi Prasad", "contact_number": "9686939344"}	2026-02-01 10:22:00.496818
e59cffad-bb54-497b-a1f5-fe184a22343a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Arora	8753040326	Promising	PENDING	{"cohort": "Promising", "customer_name": "Sakshi Arora", "contact_number": "8753040326"}	2026-02-01 10:22:00.49682
5daf02f4-be60-4e5d-97a4-29031b67869f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Roy	6654578486	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rohan Roy", "contact_number": "6654578486"}	2026-02-01 10:22:00.496823
42ce8a26-7205-46f1-b1ba-3b05a8bcf1ae	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Deshmukh	8659488906	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aman Deshmukh", "contact_number": "8659488906"}	2026-02-01 10:22:00.496827
4142dbd5-6410-4ee6-a9e9-a62d8ad8c6fd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Narayan	6244513243	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arnav Narayan", "contact_number": "6244513243"}	2026-02-01 10:22:00.496829
2698e855-e121-4e2f-83de-67458303ecfd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Menon	6760062769	Lost	PENDING	{"cohort": "Lost", "customer_name": "Nikhil Menon", "contact_number": "6760062769"}	2026-02-01 10:22:00.496832
ceb740eb-9350-423d-8c29-fa0017b91066	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Nair	7351396359	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aarohi Nair", "contact_number": "7351396359"}	2026-02-01 10:22:00.496835
ed3133c1-4ee5-46b3-9757-d98233758293	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Gill	8563179990	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Saanvi Gill", "contact_number": "8563179990"}	2026-02-01 10:22:00.496838
e4993427-3875-40e7-8759-4ad44c3430fa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pooja Shetty	9503937191	Champions	PENDING	{"cohort": "Champions", "customer_name": "Pooja Shetty", "contact_number": "9503937191"}	2026-02-01 10:22:00.49684
da70cd39-3bd2-4cf6-9261-5a1846986526	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Gill	8817880371	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aarohi Gill", "contact_number": "8817880371"}	2026-02-01 10:22:00.496843
b5906779-5949-48fb-b876-1d18e478691c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Mishra	9116697037	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Shreya Mishra", "contact_number": "9116697037"}	2026-02-01 10:22:00.496845
8381084e-2f87-4ad8-86c4-929be219b019	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Yadav	9677229791	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Yadav", "contact_number": "9677229791"}	2026-02-01 10:22:00.496848
56bd4c39-3502-45f9-abb1-2387466e1551	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Kapoor	9423598812	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arnav Kapoor", "contact_number": "9423598812"}	2026-02-01 10:22:00.49685
e041f273-96ec-48b0-aa6b-1b6744a2fe41	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Nair	9851882729	Champions	PENDING	{"cohort": "Champions", "customer_name": "Myra Nair", "contact_number": "9851882729"}	2026-02-01 10:22:00.496853
42c16bde-aad0-4ab5-b4ac-ff44d50e6da5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Deshmukh	7809889433	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Deshmukh", "contact_number": "7809889433"}	2026-02-01 10:22:00.496857
bba6f946-7875-47f5-bb9d-e49a33af152a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Sood	9930986712	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9930986712"}	2026-02-01 10:22:00.496859
e274db48-c251-4b6f-a1be-03262f5b4428	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Iyer	9617400285	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Vihaan Iyer", "contact_number": "9617400285"}	2026-02-01 10:22:00.496861
d88f1dd0-257d-47b6-b5c5-51d0afb477b5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Srinivasan	9123047419	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Srinivasan", "contact_number": "9123047419"}	2026-02-01 10:22:00.496864
b97f010f-f267-42e0-beb7-b5bab666a918	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Hegde	6657203516	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ananya Hegde", "contact_number": "6657203516"}	2026-02-01 10:22:00.496866
b763180a-6f35-4629-9bd8-4ee37398e693	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Chaudhary	8055953469	Champions	PENDING	{"cohort": "Champions", "customer_name": "Manav Chaudhary", "contact_number": "8055953469"}	2026-02-01 10:22:00.496869
4b11c546-6f57-4633-8ad3-4585406c36aa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Malhotra	8730261571	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Malhotra", "contact_number": "8730261571"}	2026-02-01 10:22:00.496871
44130ea4-7c0b-4696-9886-989b0d9bfb31	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Chaudhary	8581746680	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Varun Chaudhary", "contact_number": "8581746680"}	2026-02-01 10:22:00.496874
ba2c91c1-af69-4bcd-97c2-f7cf6c44d7c7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Naik	9027833384	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nikhil Naik", "contact_number": "9027833384"}	2026-02-01 10:22:00.496877
05b6eb34-65e3-4798-a3df-514a736033f9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Rao	6713783138	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aarohi Rao", "contact_number": "6713783138"}	2026-02-01 10:22:00.49688
8375d105-fbc6-4f3a-b74e-f4d65eb090ec	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Sharma	9839449587	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Trisha Sharma", "contact_number": "9839449587"}	2026-02-01 10:22:00.496882
e1557371-bebb-44ea-8c63-3b92594a1c21	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Kaur	6491213247	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mohit Kaur", "contact_number": "6491213247"}	2026-02-01 10:22:00.496885
fd84ed7a-4169-4c98-b409-3b0586d25741	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayaan Hegde	7630839299	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ayaan Hegde", "contact_number": "7630839299"}	2026-02-01 10:22:00.496887
43a2f4a3-48e8-45f2-a215-5782879727f1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Shetty	6645710864	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Sakshi Shetty", "contact_number": "6645710864"}	2026-02-01 10:22:00.49689
67b94f27-b355-4a18-b0f5-c4284ed5d538	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Saha	7073356693	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Parth Saha", "contact_number": "7073356693"}	2026-02-01 10:22:00.496892
21f855ef-045b-4f58-b2cf-d22b01be24ad	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Narayan	6553621743	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Dhruv Narayan", "contact_number": "6553621743"}	2026-02-01 10:22:00.496895
9a805e66-fc42-48b3-a02b-08373b267cab	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Iyer	6224929418	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Rahul Iyer", "contact_number": "6224929418"}	2026-02-01 10:22:00.496897
fe456231-f169-4912-83d8-5e17e9fc32cd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kiara Mishra	9179899675	Promising	PENDING	{"cohort": "Promising", "customer_name": "Kiara Mishra", "contact_number": "9179899675"}	2026-02-01 10:22:00.496899
116bc687-a7e1-4dc2-afc4-571d6effdf2b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Pandey	8887967512	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ananya Pandey", "contact_number": "8887967512"}	2026-02-01 10:22:00.496902
d24f65ac-6e6e-4fe0-b84a-51fadd66ad0f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarav Kaur	7243549180	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarav Kaur", "contact_number": "7243549180"}	2026-02-01 10:22:00.496904
ebe81ebd-8a43-493f-ad00-0fa355e89c8a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Kaur	9975780964	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sakshi Kaur", "contact_number": "9975780964"}	2026-02-01 10:22:00.496906
ff2a218a-1c52-45aa-b341-accdf993fce3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Joshi	8185571588	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aarohi Joshi", "contact_number": "8185571588"}	2026-02-01 10:22:00.496909
7889616c-ef6d-4848-a352-9b5a35bccd9c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Khan	7319295201	Champions	PENDING	{"cohort": "Champions", "customer_name": "Parth Khan", "contact_number": "7319295201"}	2026-02-01 10:22:00.496911
f76ddc14-6aa9-4bd8-acb9-2fedc4fe690a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Reddy	8135519167	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Neha Reddy", "contact_number": "8135519167"}	2026-02-01 10:22:00.496914
adebdd33-ad96-449d-ba96-36df8bc602f4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Srinivasan	8858006567	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Trisha Srinivasan", "contact_number": "8858006567"}	2026-02-01 10:22:00.496917
ac4e3bd1-d272-410c-85b0-a3eaa1f7cd14	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Srinivasan	9608563284	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Srinivasan", "contact_number": "9608563284"}	2026-02-01 10:22:00.49692
e4fe0990-acbd-46d8-9211-388eed996bc7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Chaudhary	9004426377	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Neha Chaudhary", "contact_number": "9004426377"}	2026-02-01 10:22:00.496923
ddf67b53-16ec-4b2a-acb3-5ca7b20e914d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Menon	8913534220	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Diya Menon", "contact_number": "8913534220"}	2026-02-01 10:22:00.496925
3fd67dc2-83f2-45ab-b7fa-ae9cb0e029d7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Siddharth Sood	8984998971	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Siddharth Sood", "contact_number": "8984998971"}	2026-02-01 10:22:00.496927
9d51f6ac-8465-4c01-9a44-7ff3fe4a87da	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Shetty	7454309592	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "7454309592"}	2026-02-01 10:22:00.49693
3233bd20-2690-4fb1-94b1-12b87490ef34	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Naik	8025862011	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dhruv Naik", "contact_number": "8025862011"}	2026-02-01 10:22:00.496932
8b3591c8-d846-4a05-bd82-90ee90812e27	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anvi Sharma	8773451505	Champions	PENDING	{"cohort": "Champions", "customer_name": "Anvi Sharma", "contact_number": "8773451505"}	2026-02-01 10:22:00.496935
0e170fbd-4304-4211-ba70-69395301f024	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Jain	8866103953	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Naina Jain", "contact_number": "8866103953"}	2026-02-01 10:22:00.496937
270180f3-b10e-4918-b6b0-91c4811ee5bc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Riya Verma	7155013446	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Riya Verma", "contact_number": "7155013446"}	2026-02-01 10:22:00.496939
7a3afb15-4e4f-43cf-b277-9d2cf2e37313	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayaan Kapoor	7361972385	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ayaan Kapoor", "contact_number": "7361972385"}	2026-02-01 10:22:00.496942
2276e891-6e97-4557-b79b-f4be5ff47de1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Ghosh	8403143886	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sakshi Ghosh", "contact_number": "8403143886"}	2026-02-01 10:22:00.496944
aa0c987b-0aff-49e9-8ada-e001e16a2ffb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Mehta	9269520457	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Mehta", "contact_number": "9269520457"}	2026-02-01 10:22:00.496947
2dee2c10-ab48-43a8-bfa5-1aab8b6368a7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Prasad	9160910316	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Saanvi Prasad", "contact_number": "9160910316"}	2026-02-01 10:22:00.496949
2b4e5467-b67f-4dc9-9ad2-1d0cf09b0da0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Shah	9564877559	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sai Shah", "contact_number": "9564877559"}	2026-02-01 10:22:00.496951
3b3725ce-f895-4084-ad1a-6523ba174c3f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Deshmukh	9531933776	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dev Deshmukh", "contact_number": "9531933776"}	2026-02-01 10:22:00.496954
8e18ff25-ff50-4ef7-98a8-d1d6dd03eaf0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rashmi Patel	8612529222	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Rashmi Patel", "contact_number": "8612529222"}	2026-02-01 10:22:00.496956
6f6b4acc-4b9d-4872-b599-476c1508e574	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Shetty	9339721639	Promising	PENDING	{"cohort": "Promising", "customer_name": "Parth Shetty", "contact_number": "9339721639"}	2026-02-01 10:22:00.496959
9f88ac5a-2675-4a30-a038-f550cf0d79a9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Nair	8982273424	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Dhruv Nair", "contact_number": "8982273424"}	2026-02-01 10:22:00.496961
747a56a2-3ab1-49d3-8bdd-f96ea605b7a1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Krishna Gowda	7825217209	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Krishna Gowda", "contact_number": "7825217209"}	2026-02-01 10:22:00.496965
08a9a25c-d032-4b58-beb2-5690996003c7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Priya Rao	7604717059	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Priya Rao", "contact_number": "7604717059"}	2026-02-01 10:22:00.496967
073688f7-38f6-49b4-8a8a-d4a800e32eaa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Bose	9684672207	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Bose", "contact_number": "9684672207"}	2026-02-01 10:22:00.496972
20532d9c-c4ee-4a68-8c06-79d615ba9974	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Isha Chaudhary	7579918199	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Isha Chaudhary", "contact_number": "7579918199"}	2026-02-01 10:22:00.496974
3f9e9331-a17d-479f-943a-9d7c00c624f3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Roy	9717820269	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Manav Roy", "contact_number": "9717820269"}	2026-02-01 10:22:00.496977
7dba282e-dc38-47b2-9a40-6a40ddc6d74a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Shetty	8295498411	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Rupali Shetty", "contact_number": "8295498411"}	2026-02-01 10:22:00.496979
f6d901a3-79ca-4f09-a81c-fb82202ff5c0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Kaur	7767032616	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Parth Kaur", "contact_number": "7767032616"}	2026-02-01 10:22:00.496982
a3d57184-4504-4940-9cba-6ec28a600ebe	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Das	9850611322	Champions	PENDING	{"cohort": "Champions", "customer_name": "Harsh Das", "contact_number": "9850611322"}	2026-02-01 10:22:00.496985
33085d14-77fc-4c76-8e63-49fa8b1ccfd7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Ghosh	7423552326	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ritvik Ghosh", "contact_number": "7423552326"}	2026-02-01 10:22:00.496987
f082fac3-9606-40e5-91d8-54a42119309f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Gowda	9345873192	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Arnav Gowda", "contact_number": "9345873192"}	2026-02-01 10:22:00.496989
934c63c5-ed52-4363-8553-a516b17a830c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Kapoor	7211764545	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Kapoor", "contact_number": "7211764545"}	2026-02-01 10:22:00.496992
fc674e17-3ca7-41e8-be95-3433fc611491	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Naik	7765755391	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Yash Naik", "contact_number": "7765755391"}	2026-02-01 10:22:00.496994
f99d85b9-5acb-4c5a-b8a9-d63f5e4b884a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Iyer	7513512505	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Yash Iyer", "contact_number": "7513512505"}	2026-02-01 10:22:00.496997
e22e0e6c-d3fa-4b39-bcca-30b46f03926e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Chatterjee	6454048738	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Chatterjee", "contact_number": "6454048738"}	2026-02-01 10:22:00.496999
e295d765-d1ff-4328-aba9-10bbed4d8861	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Bansal	7503099090	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Bansal", "contact_number": "7503099090"}	2026-02-01 10:22:00.497001
7fc2c91f-64a9-49f1-ab9e-5db79b244357	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Yadav	9116793849	Promising	PENDING	{"cohort": "Promising", "customer_name": "Vivaan Yadav", "contact_number": "9116793849"}	2026-02-01 10:22:00.497004
59377f4c-0a1b-4e26-b797-b7eb9b3bc5b6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pooja Chatterjee	9366563155	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Pooja Chatterjee", "contact_number": "9366563155"}	2026-02-01 10:22:00.497006
6b7ca9c1-9724-4e47-b5ae-9fd97ae8d1e6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Chatterjee	7879474324	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Shreya Chatterjee", "contact_number": "7879474324"}	2026-02-01 10:22:00.49701
b195c723-11d3-4a06-8b78-7d2b7d923fbe	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarav Patel	7297184780	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aarav Patel", "contact_number": "7297184780"}	2026-02-01 10:22:00.497012
6e286517-07b5-43c5-816a-ba896bc5eb55	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Srinivasan	7054682045	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ritvik Srinivasan", "contact_number": "7054682045"}	2026-02-01 10:22:00.497015
7d5850aa-542e-41ce-9ac4-b0b622899e1a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Chatterjee	6192955782	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Chatterjee", "contact_number": "6192955782"}	2026-02-01 10:22:00.497017
7f6e5d06-bf50-4ec8-8f7f-d48194204f75	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Gupta	7954255716	Promising	PENDING	{"cohort": "Promising", "customer_name": "Arjun Gupta", "contact_number": "7954255716"}	2026-02-01 10:22:00.49702
f2b2c63d-4e58-4c49-85e4-4b71723c2639	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Bansal	9036356421	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Trisha Bansal", "contact_number": "9036356421"}	2026-02-01 10:22:00.497024
5980bd76-6238-48ca-8cfc-c55d7c99edd7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Joshi	9228140445	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Joshi", "contact_number": "9228140445"}	2026-02-01 10:22:00.497026
fdf0ca35-de19-4d24-b44a-4da5f891a8cb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Saha	9226980712	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Saha", "contact_number": "9226980712"}	2026-02-01 10:22:00.497029
9fbbd8b4-8f11-4e2a-9a46-ad5379b02c0f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Deshmukh	6817754839	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Deshmukh", "contact_number": "6817754839"}	2026-02-01 10:22:00.497031
bd48136a-a102-4733-b3bf-44a04bdcf7bc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Shetty	6217779673	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Shetty", "contact_number": "6217779673"}	2026-02-01 10:22:00.497034
08bc01d7-8dbc-4764-8437-f7e5868ee29b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Krishna Kaur	7573532540	Champions	PENDING	{"cohort": "Champions", "customer_name": "Krishna Kaur", "contact_number": "7573532540"}	2026-02-01 10:22:00.497036
faba338c-e215-49a1-9185-23aac09c9d17	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Prasad	9732308705	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rupali Prasad", "contact_number": "9732308705"}	2026-02-01 10:22:00.497038
1920d7b6-0ebb-4029-8b47-41d477f92cd3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kavya Kulkarni	9212525937	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kavya Kulkarni", "contact_number": "9212525937"}	2026-02-01 10:22:00.497041
966b9ea4-c554-44a6-98e0-4e543d64793d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Kulkarni	9964171749	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Saanvi Kulkarni", "contact_number": "9964171749"}	2026-02-01 10:22:00.497043
8385a654-d845-43d3-8266-a87781f9596f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Tripathi	6580800160	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Avni Tripathi", "contact_number": "6580800160"}	2026-02-01 10:22:00.497046
345bac3c-19de-4a3a-bdd7-38e615ea404b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Reddy	7053666440	Promising	PENDING	{"cohort": "Promising", "customer_name": "Diya Reddy", "contact_number": "7053666440"}	2026-02-01 10:22:00.497048
29248a0b-a457-4ef5-a94b-36d0d7959c97	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Gowda	9052908689	Lost	PENDING	{"cohort": "Lost", "customer_name": "Reyansh Gowda", "contact_number": "9052908689"}	2026-02-01 10:22:00.497051
82b0ecab-50d7-49b5-8987-db923f308fcf	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Aggarwal	6952623709	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Manav Aggarwal", "contact_number": "6952623709"}	2026-02-01 10:22:00.497053
d0349eda-4fb7-405e-b00d-e07dabaf7918	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Tripathi	9592686870	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Tripathi", "contact_number": "9592686870"}	2026-02-01 10:22:00.497056
e6318aab-a36c-4287-a8fe-b78f43ecf146	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Kaur	9346708639	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Kaur", "contact_number": "9346708639"}	2026-02-01 10:22:00.497058
04b3ace1-96d0-4909-b9da-ef670fe7c7db	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Hegde	6892965296	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Vihaan Hegde", "contact_number": "6892965296"}	2026-02-01 10:22:00.49706
59832342-62ff-42c4-8df1-4d39293a960e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Narayan	8850939577	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aman Narayan", "contact_number": "8850939577"}	2026-02-01 10:22:00.497063
9d259982-753f-46fc-babe-5625135c898f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Mehta	9925586537	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Reyansh Mehta", "contact_number": "9925586537"}	2026-02-01 10:22:00.497065
33efe53d-6302-42cb-97a2-00c5a637ba35	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Kaur	6590483793	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Arnav Kaur", "contact_number": "6590483793"}	2026-02-01 10:22:00.497067
8a70b46d-7df2-4603-abde-2762c3c1af95	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Reddy	8029439466	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Rahul Reddy", "contact_number": "8029439466"}	2026-02-01 10:22:00.49707
e2e34445-6b8e-406a-b648-b4427c3cd2e2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Das	6722023713	Promising	PENDING	{"cohort": "Promising", "customer_name": "Saanvi Das", "contact_number": "6722023713"}	2026-02-01 10:22:00.497072
2c8afd68-24cf-4ec8-a614-4e828aee5356	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Shetty	8103321145	Champions	PENDING	{"cohort": "Champions", "customer_name": "Diya Shetty", "contact_number": "8103321145"}	2026-02-01 10:22:00.497076
76a843cf-dbaf-496d-afa6-4da9636f116c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Nair	9105578047	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Yash Nair", "contact_number": "9105578047"}	2026-02-01 10:22:00.497079
44c00968-603e-40d4-9016-b04f2d2378ca	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Khan	7513134044	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Manav Khan", "contact_number": "7513134044"}	2026-02-01 10:22:00.497081
96bdc63e-e6cb-419f-8c80-021d3f25c412	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Pandey	9739746410	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Pandey", "contact_number": "9739746410"}	2026-02-01 10:22:00.497084
87a913b6-3e11-4f33-abbf-1bb4c32614ce	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Patel	9368338891	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Patel", "contact_number": "9368338891"}	2026-02-01 10:22:00.497086
64775b5b-639b-4f85-bebf-6334cfceb8fe	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Rao	8664133769	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Yash Rao", "contact_number": "8664133769"}	2026-02-01 10:22:00.497089
d53ded08-6d3c-4fbc-a82d-84ee458ad9fd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Mehta	7327391917	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Reyansh Mehta", "contact_number": "7327391917"}	2026-02-01 10:22:00.497091
a6f92ce5-b0c4-4828-afe7-637d1eec9803	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Shetty	6947426874	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aman Shetty", "contact_number": "6947426874"}	2026-02-01 10:22:00.497093
8e95c428-0332-4284-8b73-1ee6d29510e7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Sharma	9132143455	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Sharma", "contact_number": "9132143455"}	2026-02-01 10:22:00.497096
49816fd4-3954-4248-83af-866a9a959e6e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Sood	9573856076	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9573856076"}	2026-02-01 10:22:00.497098
518b5610-7890-4f7d-80a7-8ce0a5057523	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Mukherjee	8165669371	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Mukherjee", "contact_number": "8165669371"}	2026-02-01 10:22:00.4971
c9328b43-17da-4891-8a6d-6182ab1e48a4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Tripathi	6255554375	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Tripathi", "contact_number": "6255554375"}	2026-02-01 10:22:00.497103
0a931dec-003e-4ccf-b0e3-be7c3f5b6404	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Riya Kulkarni	7301491913	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Riya Kulkarni", "contact_number": "7301491913"}	2026-02-01 10:22:00.497105
5b4e873b-35f6-40bf-ae98-202304ed2f29	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Saxena	9753074007	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ira Saxena", "contact_number": "9753074007"}	2026-02-01 10:22:00.497108
353f482c-8de6-41fa-aac5-a1482d8843c3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Mehta	6866192115	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Mehta", "contact_number": "6866192115"}	2026-02-01 10:22:00.497111
1ee735c9-e309-4d92-adf7-4c109cb48f17	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Malhotra	9241640615	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Malhotra", "contact_number": "9241640615"}	2026-02-01 10:22:00.497114
76f99b4f-2668-43aa-978e-845415b610df	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarav Malhotra	9022775753	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aarav Malhotra", "contact_number": "9022775753"}	2026-02-01 10:22:00.497117
c0a89616-569d-4d4e-93ac-37c378619faa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Pandey	7428565653	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aarohi Pandey", "contact_number": "7428565653"}	2026-02-01 10:22:00.497119
6dd705dd-cf25-4c27-8d17-eedb67015508	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kiara Mishra	9687260113	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kiara Mishra", "contact_number": "9687260113"}	2026-02-01 10:22:00.497122
8fe0ba88-1ddb-48be-bdee-1aaec9ca36a6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Kaur	7313554459	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Harsh Kaur", "contact_number": "7313554459"}	2026-02-01 10:22:00.497124
a24108df-37f2-4130-923d-d4b71abe43e4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Rao	7541340301	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Tanvi Rao", "contact_number": "7541340301"}	2026-02-01 10:22:00.497126
dc25dc84-0e1c-4efc-b15e-a02b2da88ef4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Arora	9954648400	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Arora", "contact_number": "9954648400"}	2026-02-01 10:22:00.497129
788f4750-0f57-4a35-a470-bb5579fad2c5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Riya Menon	7225147751	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Menon", "contact_number": "7225147751"}	2026-02-01 10:22:00.497131
e87fab87-56a3-44e8-8ab1-cb4ded2b5792	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Banerjee	6259577424	Promising	PENDING	{"cohort": "Promising", "customer_name": "Diya Banerjee", "contact_number": "6259577424"}	2026-02-01 10:22:00.497133
1c87ca56-350b-4e09-a8c6-cc2af5358a57	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Mehta	7294384972	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Mehta", "contact_number": "7294384972"}	2026-02-01 10:22:00.497136
7c102aa8-583c-4e91-9826-eb7066ab5b1b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Gill	8864678855	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Shreya Gill", "contact_number": "8864678855"}	2026-02-01 10:22:00.497138
2f5fa4c8-7076-4570-8383-6b3d45e66d40	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sneha Mehta	7372289609	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sneha Mehta", "contact_number": "7372289609"}	2026-02-01 10:22:00.49714
ab3f742d-93cd-49cd-867e-b3cd0e56980e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Jain	9998182787	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ayush Jain", "contact_number": "9998182787"}	2026-02-01 10:22:00.497143
9ed63d16-c491-4dce-af18-ce2afa716c40	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Mehta	9452446805	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vihaan Mehta", "contact_number": "9452446805"}	2026-02-01 10:22:00.497145
cd4e7357-4ff4-47c4-8180-eaf3076c9882	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Kulkarni	8684458809	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Kulkarni", "contact_number": "8684458809"}	2026-02-01 10:22:00.497148
d398ef1e-bffe-4f68-a46f-55993b72d558	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Naik	8873984325	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Naik", "contact_number": "8873984325"}	2026-02-01 10:22:00.49715
221b527e-a865-4ce0-9de2-23bedfc61aa0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Mehta	7543600741	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ananya Mehta", "contact_number": "7543600741"}	2026-02-01 10:22:00.497152
0a4ae77e-f866-42c9-a0f6-57fca3de455a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Shah	7409261619	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Shah", "contact_number": "7409261619"}	2026-02-01 10:22:00.497155
d66430c2-1030-4026-b967-255de75b56bd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Khan	8030660677	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Pallavi Khan", "contact_number": "8030660677"}	2026-02-01 10:22:00.497157
7ec41879-a391-4cb4-990b-854b09be614c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Chaudhary	9670412606	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Arjun Chaudhary", "contact_number": "9670412606"}	2026-02-01 10:22:00.497159
957ca571-3183-4eff-84e0-8cfbb41ee6bd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Hegde	6941037138	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arjun Hegde", "contact_number": "6941037138"}	2026-02-01 10:22:00.497162
8042a762-3f58-4cd0-b8c6-60a7dd84ea80	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Mukherjee	7388660561	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Trisha Mukherjee", "contact_number": "7388660561"}	2026-02-01 10:22:00.497164
6d2aa014-7c3f-499a-9267-286435c792a2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Iyer	8761468017	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arnav Iyer", "contact_number": "8761468017"}	2026-02-01 10:22:00.497166
181b3ec2-d46f-4184-b28b-e2356abbf705	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Prasad	9347262672	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sakshi Prasad", "contact_number": "9347262672"}	2026-02-01 10:22:00.497169
3dc4aef9-aebc-429c-830a-9db662c7f433	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Yadav	6863557208	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Yadav", "contact_number": "6863557208"}	2026-02-01 10:22:00.497171
62dfa3ea-c0d2-4ff0-9d82-f295c3c8daf3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Gupta	7414559991	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Naina Gupta", "contact_number": "7414559991"}	2026-02-01 10:22:00.497174
7b7dd265-370c-419e-989a-5b313dad6bb4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Shah	9367970020	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aditi Shah", "contact_number": "9367970020"}	2026-02-01 10:22:00.497176
cb6983fa-0a22-4a06-99de-41d19b722192	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kabir Gowda	6932774465	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kabir Gowda", "contact_number": "6932774465"}	2026-02-01 10:22:00.497178
333d6018-92e2-42c5-bd24-5df745cad510	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Prasad	7235285368	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Shreya Prasad", "contact_number": "7235285368"}	2026-02-01 10:22:00.497181
101e4157-53db-4b56-ae83-26abbf719d3f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Isha Jain	6349229160	Champions	PENDING	{"cohort": "Champions", "customer_name": "Isha Jain", "contact_number": "6349229160"}	2026-02-01 10:22:00.497183
f0755ed2-a556-4c28-8c09-075c515329b6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Bose	7177195771	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rupali Bose", "contact_number": "7177195771"}	2026-02-01 10:22:00.497185
24b4dbc9-c1a3-4432-a001-073eeaa74f68	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Gowda	7787183452	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Gowda", "contact_number": "7787183452"}	2026-02-01 10:22:00.497188
3c9617e4-7d3f-429c-84ac-7ea2baf37d45	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Jain	6450811786	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ritvik Jain", "contact_number": "6450811786"}	2026-02-01 10:22:00.49719
62c5055d-0076-48c1-ab53-bf82ab291340	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Bose	6250824319	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Bose", "contact_number": "6250824319"}	2026-02-01 10:22:00.497192
1c5f4447-0365-434a-9e43-ff096f39af1f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Nair	6597434720	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arnav Nair", "contact_number": "6597434720"}	2026-02-01 10:22:00.497195
59b77b54-b1b6-41fe-a219-cac3525a08b3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Narayan	8160250488	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Gaurav Narayan", "contact_number": "8160250488"}	2026-02-01 10:22:00.497198
5427a3d5-92c2-4eb8-a3d8-44c128db0794	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Pandey	8350253645	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Meera Pandey", "contact_number": "8350253645"}	2026-02-01 10:22:00.497201
4253e3a5-19e7-4db9-a410-655595f75afb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Sood	9977571905	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rohan Sood", "contact_number": "9977571905"}	2026-02-01 10:22:00.497203
0d650361-f695-4138-8950-c1d9bd833e47	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Patel	6906871524	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Rupali Patel", "contact_number": "6906871524"}	2026-02-01 10:22:00.497205
17c9a008-73bd-47e0-9e0e-dcb938bcc59a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarav Pandey	6912028484	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aarav Pandey", "contact_number": "6912028484"}	2026-02-01 10:22:00.497208
1ccce787-4189-4e48-8223-3ed4705aaf21	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Prasad	6556350612	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "6556350612"}	2026-02-01 10:22:00.49721
745224bc-3837-4a3d-9e2b-3a8ee559c7d9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Patel	8938342917	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Patel", "contact_number": "8938342917"}	2026-02-01 10:22:00.497212
ffe1ba82-0f4e-4843-bbed-4ddc946ba6fc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sneha Roy	6114459232	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Roy", "contact_number": "6114459232"}	2026-02-01 10:22:00.497215
498084c9-8e0c-4e76-b50d-89750d5d1684	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Bose	6083762817	Champions	PENDING	{"cohort": "Champions", "customer_name": "Neha Bose", "contact_number": "6083762817"}	2026-02-01 10:22:00.497217
99d9afea-0444-495b-857f-4a9bb1a4b312	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Krishna Aggarwal	8302819855	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Krishna Aggarwal", "contact_number": "8302819855"}	2026-02-01 10:22:00.49722
5d024403-305b-4896-831d-e408ee47f5cb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Patel	6481089183	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Patel", "contact_number": "6481089183"}	2026-02-01 10:22:00.497222
3733f340-5721-4386-b826-eec5b87e2c02	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Mukherjee	6528009419	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Mukherjee", "contact_number": "6528009419"}	2026-02-01 10:22:00.497224
734c5dd9-5ab4-4fe8-8780-8fce2b3b0e95	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Siddharth Banerjee	8190947434	Lost	PENDING	{"cohort": "Lost", "customer_name": "Siddharth Banerjee", "contact_number": "8190947434"}	2026-02-01 10:22:00.497227
6b02a2c5-8303-482e-a274-4eca93a49ef9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Tiwari	8212806224	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ananya Tiwari", "contact_number": "8212806224"}	2026-02-01 10:22:00.497229
adb8ff01-0b9c-4f37-bab4-9070c0e840a5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Shetty	9021185687	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mansi Shetty", "contact_number": "9021185687"}	2026-02-01 10:22:00.497231
30a438e7-3b0d-44e2-8610-cfb7fbfa426f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Ghosh	9735495313	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Ghosh", "contact_number": "9735495313"}	2026-02-01 10:22:00.497234
dd8401e5-95fe-4b0f-b0e9-f562fb879661	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Narayan	7082843521	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Narayan", "contact_number": "7082843521"}	2026-02-01 10:22:00.497236
a065d4ea-872f-41a6-93d2-7f85754ceaf4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Isha Sharma	7628909287	Promising	PENDING	{"cohort": "Promising", "customer_name": "Isha Sharma", "contact_number": "7628909287"}	2026-02-01 10:22:00.497239
0a9851d7-264a-465e-bc39-6f4b3ce82d2e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Rao	8991237357	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Rao", "contact_number": "8991237357"}	2026-02-01 10:22:00.497241
6323d063-4457-4892-b29d-0970ba5c5771	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Gowda	8955198434	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Gowda", "contact_number": "8955198434"}	2026-02-01 10:22:00.497243
6a113ef8-3d54-4179-999e-eeab6a0de32f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Nair	6060436831	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Reyansh Nair", "contact_number": "6060436831"}	2026-02-01 10:22:00.497246
5f5b61f3-1065-44fe-a2f2-a78d2a312017	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Iyer	8017115307	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aarohi Iyer", "contact_number": "8017115307"}	2026-02-01 10:22:00.497248
e5babb4b-089a-4231-8a4c-20757ded8c05	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Reddy	9533974643	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Reddy", "contact_number": "9533974643"}	2026-02-01 10:22:00.49725
926b62ed-aae5-46e0-9e5b-a0a5d53a7bcd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Rao	8251361799	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ayush Rao", "contact_number": "8251361799"}	2026-02-01 10:22:00.497253
d499d124-bace-469f-80df-16bc1e57dbb3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Saha	9875138661	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Saha", "contact_number": "9875138661"}	2026-02-01 10:22:00.497255
62ca1131-098b-432e-9505-964ec9d8d653	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kiara Chaudhary	9172918076	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kiara Chaudhary", "contact_number": "9172918076"}	2026-02-01 10:22:00.497259
3e7ea512-45a9-4abc-ad5f-74c0ba21ff95	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Arora	8422021037	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ira Arora", "contact_number": "8422021037"}	2026-02-01 10:22:00.497261
3309b447-4a37-452e-90ff-113137fb49b2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Roy	7843514866	Lost	PENDING	{"cohort": "Lost", "customer_name": "Rahul Roy", "contact_number": "7843514866"}	2026-02-01 10:22:00.497264
2746a2bd-8606-4fc2-a1c3-f81260bb9f27	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Srinivasan	7470021381	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mohit Srinivasan", "contact_number": "7470021381"}	2026-02-01 10:22:00.497266
8e7f9fd2-08ac-48aa-a82a-8bf3288dbe18	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Bose	6580564091	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Pallavi Bose", "contact_number": "6580564091"}	2026-02-01 10:22:00.497269
321d1f2e-10af-43c6-a12c-0903bfdf27a1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Deshmukh	9112167722	Champions	PENDING	{"cohort": "Champions", "customer_name": "Neha Deshmukh", "contact_number": "9112167722"}	2026-02-01 10:22:00.497271
aaa95624-f73e-498b-98ba-e4fc08d5c783	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Mehta	7035400086	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Aarohi Mehta", "contact_number": "7035400086"}	2026-02-01 10:22:00.497273
034ee1b9-a286-440a-9a51-90a0be380d87	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Srinivasan	9101208334	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sai Srinivasan", "contact_number": "9101208334"}	2026-02-01 10:22:00.497276
96453b09-3123-4d8a-90e9-2bcbf6aca7fa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Saha	8051834242	Lost	PENDING	{"cohort": "Lost", "customer_name": "Manav Saha", "contact_number": "8051834242"}	2026-02-01 10:22:00.497279
f3d56cc7-78d8-4b6b-8ab4-bc8e544f0024	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditya Sharma	8516068472	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aditya Sharma", "contact_number": "8516068472"}	2026-02-01 10:22:00.497282
b13e9706-7aa9-44cd-94d9-fb5001115b5c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Bajaj	6884584840	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Rahul Bajaj", "contact_number": "6884584840"}	2026-02-01 10:22:00.497284
b044d7a8-87cb-4417-922d-325d44ccf933	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Krishna Srinivasan	6598661719	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Krishna Srinivasan", "contact_number": "6598661719"}	2026-02-01 10:22:00.497287
c3d68383-7c72-422b-82e4-1ee85be3ec1d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Singh	7814949682	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarohi Singh", "contact_number": "7814949682"}	2026-02-01 10:22:00.497289
3657861b-a218-4a6f-a0ce-de58e861007d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Tiwari	6055859075	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ayush Tiwari", "contact_number": "6055859075"}	2026-02-01 10:22:00.497291
4ac9c96d-d61a-4f91-b6d8-923d8e7a77b1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pooja Arora	9115591177	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Pooja Arora", "contact_number": "9115591177"}	2026-02-01 10:22:00.497294
db065fb3-b445-4326-b029-e6acf03ad92b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Rao	8826541466	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Manav Rao", "contact_number": "8826541466"}	2026-02-01 10:22:00.497296
c337365a-124c-493b-86b2-6f32da065a4b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarav Iyer	9083279808	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aarav Iyer", "contact_number": "9083279808"}	2026-02-01 10:22:00.497299
f502bd32-bc21-4b6f-9aec-845b599cc095	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Bhat	8388692377	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Arjun Bhat", "contact_number": "8388692377"}	2026-02-01 10:22:00.497301
f7af7f58-d8e7-4ebb-9a3a-b6c8fd6539ae	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Menon	8246128778	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Menon", "contact_number": "8246128778"}	2026-02-01 10:22:00.497304
52fa19f6-163a-49d3-b02c-87debe246fe4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sneha Gupta	6513518801	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Gupta", "contact_number": "6513518801"}	2026-02-01 10:22:00.497306
39d4b142-bfaf-4711-ab99-92659712f6cd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Kapoor	7824972856	Champions	PENDING	{"cohort": "Champions", "customer_name": "Mansi Kapoor", "contact_number": "7824972856"}	2026-02-01 10:22:00.497309
977f5d67-0af9-40b0-b19d-6ad2cd969097	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Rao	6624494538	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Rao", "contact_number": "6624494538"}	2026-02-01 10:22:00.497311
5af09ad4-27c1-4e28-9964-776cf9d5dddc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Mishra	8762315986	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ishaan Mishra", "contact_number": "8762315986"}	2026-02-01 10:22:00.497314
3f122496-d6fa-4d4f-8cee-57f141f056ea	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Krishna Gupta	7240770966	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Krishna Gupta", "contact_number": "7240770966"}	2026-02-01 10:22:00.497317
32a7bd5a-3276-4248-b593-49aaea1319bb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Kapoor	6269772884	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Kapoor", "contact_number": "6269772884"}	2026-02-01 10:22:00.497321
3fb9a13e-6891-443f-8e1a-9020de23c932	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Gupta	7468315683	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Nandini Gupta", "contact_number": "7468315683"}	2026-02-01 10:22:00.497323
8d3a9c6d-9b29-49f3-b196-3f6de77361f3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Aggarwal	8210968278	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Aggarwal", "contact_number": "8210968278"}	2026-02-01 10:22:00.497326
bf74b442-6fc3-4583-9516-eb315282201e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Hegde	8152088431	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ira Hegde", "contact_number": "8152088431"}	2026-02-01 10:22:00.497328
c017dc70-92a4-4f06-a86f-3427dfbdb8a4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Gowda	6692430751	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Saanvi Gowda", "contact_number": "6692430751"}	2026-02-01 10:22:00.497331
4418fb39-f989-4eca-9cf4-6288e10536c0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Aggarwal	7664933165	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Reyansh Aggarwal", "contact_number": "7664933165"}	2026-02-01 10:22:00.497333
a3233c8b-111f-45b7-af55-68a92f5ef60a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Rao	8012871630	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Rao", "contact_number": "8012871630"}	2026-02-01 10:22:00.497336
0628597e-7e80-4e9a-9376-1dbf50c212eb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Tripathi	8284835410	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sakshi Tripathi", "contact_number": "8284835410"}	2026-02-01 10:22:00.497338
47e6caa9-40d2-40e4-9cb6-33229b983d92	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Gill	6411654819	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Gill", "contact_number": "6411654819"}	2026-02-01 10:22:00.497341
1e280aa9-9468-4c34-9d1b-ca0acfa146ac	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Mukherjee	8459437746	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ishaan Mukherjee", "contact_number": "8459437746"}	2026-02-01 10:22:00.497343
bf988463-3c39-483f-b15c-10ac7cdbb36a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Singh	7304275177	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Trisha Singh", "contact_number": "7304275177"}	2026-02-01 10:22:00.497345
ef1f8e42-81f8-43f7-83a1-b243f97ce004	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Khan	7664930130	Promising	PENDING	{"cohort": "Promising", "customer_name": "Avni Khan", "contact_number": "7664930130"}	2026-02-01 10:22:00.497348
685559d5-bdf4-4276-81c0-6ad3a8aa5822	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Tripathi	8750072831	Promising	PENDING	{"cohort": "Promising", "customer_name": "Sakshi Tripathi", "contact_number": "8750072831"}	2026-02-01 10:22:00.49735
492c7aae-e052-42fb-a959-93badc0342a1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Khan	8182275389	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Vivaan Khan", "contact_number": "8182275389"}	2026-02-01 10:22:00.497352
4be5c89a-671a-4e06-b09a-0f4d726c2c32	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Bansal	8947198029	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ayush Bansal", "contact_number": "8947198029"}	2026-02-01 10:22:00.497355
db133f27-6fb1-473f-9cf0-bedecfa3ed17	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Tripathi	7751360825	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Tanvi Tripathi", "contact_number": "7751360825"}	2026-02-01 10:22:00.497357
fb2a3570-65f8-4e04-a2e5-a612fd7c1608	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Gowda	6501801412	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Avni Gowda", "contact_number": "6501801412"}	2026-02-01 10:22:00.497359
0421a733-00d9-4065-bea1-ace1ed30a9d9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Gill	7260415674	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Trisha Gill", "contact_number": "7260415674"}	2026-02-01 10:22:00.497362
7ad3fe77-1cc8-454b-9c72-57d1060a67d3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Mukherjee	6562746789	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Mukherjee", "contact_number": "6562746789"}	2026-02-01 10:22:00.497364
8f068905-a731-43ef-bd3f-bcdcd6b55947	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Singh	8720429306	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Anika Singh", "contact_number": "8720429306"}	2026-02-01 10:22:00.497367
e0ddb236-c299-4873-8f2a-ca4ef21edcbf	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Bhat	6861057122	Champions	PENDING	{"cohort": "Champions", "customer_name": "Tanvi Bhat", "contact_number": "6861057122"}	2026-02-01 10:22:00.497369
17b29255-4be2-494b-a4ad-44f509025240	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Malhotra	8208883641	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Malhotra", "contact_number": "8208883641"}	2026-02-01 10:22:00.497371
ade85eec-d07f-405a-8d80-eacd62d528c0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Gupta	6016389273	Champions	PENDING	{"cohort": "Champions", "customer_name": "Trisha Gupta", "contact_number": "6016389273"}	2026-02-01 10:22:00.497374
938f071a-431e-4e8c-9ddc-2c78afe6b889	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Kulkarni	8149238767	Promising	PENDING	{"cohort": "Promising", "customer_name": "Pallavi Kulkarni", "contact_number": "8149238767"}	2026-02-01 10:22:00.497377
8f295a80-c120-483f-9b27-cbe6bd8c41c1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Das	6179819454	Promising	PENDING	{"cohort": "Promising", "customer_name": "Myra Das", "contact_number": "6179819454"}	2026-02-01 10:22:00.497379
003dd203-31df-4c59-ad96-546995e25472	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rashmi Pandey	9768878448	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Pandey", "contact_number": "9768878448"}	2026-02-01 10:22:00.497381
7ad79dfd-b792-4f54-ac13-4cb2ab831552	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kunal Ghosh	9023767559	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Kunal Ghosh", "contact_number": "9023767559"}	2026-02-01 10:22:00.497384
d152a468-51f1-4e8c-bb79-c1e14894b691	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rashmi Chatterjee	8566474661	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rashmi Chatterjee", "contact_number": "8566474661"}	2026-02-01 10:22:00.497386
755c820e-12e6-4d6d-8f8d-ad3d2e68bf25	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Verma	6095441733	Champions	PENDING	{"cohort": "Champions", "customer_name": "Myra Verma", "contact_number": "6095441733"}	2026-02-01 10:22:00.497389
3b8a3d0c-b273-48dc-8ebc-d6034a4afd84	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Das	8026424848	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Gaurav Das", "contact_number": "8026424848"}	2026-02-01 10:22:00.497391
ee939c23-a3ae-4887-8575-6866ae2dbe10	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Bansal	9397040587	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Arnav Bansal", "contact_number": "9397040587"}	2026-02-01 10:22:00.497393
96b16198-13a1-4e9a-985a-16b5ad647279	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Patel	8856438883	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Patel", "contact_number": "8856438883"}	2026-02-01 10:22:00.497396
b68e6cd1-1f37-4964-9d82-fd2be8b68b8d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Saha	9734060367	Promising	PENDING	{"cohort": "Promising", "customer_name": "Dhruv Saha", "contact_number": "9734060367"}	2026-02-01 10:22:00.497398
3cf54cb4-60b4-485f-ac39-138f5e38d8c2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kunal Narayan	8701177161	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Kunal Narayan", "contact_number": "8701177161"}	2026-02-01 10:22:00.4974
8cee8560-88d9-45e1-9c98-864d65024758	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Saxena	9281370661	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Neha Saxena", "contact_number": "9281370661"}	2026-02-01 10:22:00.497403
fa4ad938-c201-49d7-9334-91cebab0963a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Shetty	9455907545	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Mohit Shetty", "contact_number": "9455907545"}	2026-02-01 10:22:00.497405
ebd21370-8a71-4cda-a426-2d9f98278327	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Verma	7618166384	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rahul Verma", "contact_number": "7618166384"}	2026-02-01 10:22:00.497408
ecc7cdbd-7f59-4ce4-ae67-838d8a70eabe	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayaan Bose	7299414772	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ayaan Bose", "contact_number": "7299414772"}	2026-02-01 10:22:00.49741
d5fe54e3-0a79-4f15-870c-efe37607c1ef	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aadhya Yadav	8796262369	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aadhya Yadav", "contact_number": "8796262369"}	2026-02-01 10:22:00.497412
73cde38d-7d41-429d-ac48-e0fd1833fe6f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Gupta	7563134564	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aarohi Gupta", "contact_number": "7563134564"}	2026-02-01 10:22:00.497415
590dc702-2710-43a5-b103-70dcd67c54d0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Chaudhary	8840130027	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Chaudhary", "contact_number": "8840130027"}	2026-02-01 10:22:00.497417
90c9d5ad-a24d-4ddf-8b2d-9b05ff67a01c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Aggarwal	8610725346	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Aggarwal", "contact_number": "8610725346"}	2026-02-01 10:22:00.497419
44398bd9-e95b-4cf7-8f34-4969fd5b8876	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Jain	7752772693	Lost	PENDING	{"cohort": "Lost", "customer_name": "Dev Jain", "contact_number": "7752772693"}	2026-02-01 10:22:00.497422
86f01b2a-a525-4128-a0e1-43ffe0b4ac67	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Chaudhary	8907288426	Promising	PENDING	{"cohort": "Promising", "customer_name": "Manav Chaudhary", "contact_number": "8907288426"}	2026-02-01 10:22:00.497424
3f6b1e75-855f-4b1c-8eb7-c0e183982737	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Iyer	8756792161	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Iyer", "contact_number": "8756792161"}	2026-02-01 10:22:00.497427
5901e87c-826a-4284-958a-c978305b7ba9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Prasad	7710221804	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Prasad", "contact_number": "7710221804"}	2026-02-01 10:22:00.497429
d8a30f9d-fb6f-42b7-8371-d9f25967d5a2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Bose	7095768375	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Diya Bose", "contact_number": "7095768375"}	2026-02-01 10:22:00.497432
5f3d87ea-3b48-486b-83ba-650eab86d82d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditya Arora	6732105450	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aditya Arora", "contact_number": "6732105450"}	2026-02-01 10:22:00.497434
2aeb1659-6558-4747-8755-670e3bf02ffa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Sharma	7863296457	Champions	PENDING	{"cohort": "Champions", "customer_name": "Manav Sharma", "contact_number": "7863296457"}	2026-02-01 10:22:00.497437
7d6ac07b-9671-4338-a5a9-76ec79b96648	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Isha Shetty	6132692083	Champions	PENDING	{"cohort": "Champions", "customer_name": "Isha Shetty", "contact_number": "6132692083"}	2026-02-01 10:22:00.497439
7f8ceb61-2929-4ae5-b835-d5f52ff2ce6c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Kaur	6352983840	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mohit Kaur", "contact_number": "6352983840"}	2026-02-01 10:22:00.497443
461f37fc-5480-4673-b8b0-f46c92442ac7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Gill	7300975626	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ayush Gill", "contact_number": "7300975626"}	2026-02-01 10:22:00.497445
e4f1ab97-f8c1-4d21-8680-b64b448eabcc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Das	7841579769	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Gaurav Das", "contact_number": "7841579769"}	2026-02-01 10:22:00.49745
456c591e-85ad-40fe-9547-8f8de43731e8	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Siddharth Mishra	7070012089	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Siddharth Mishra", "contact_number": "7070012089"}	2026-02-01 10:22:00.497452
8ad9d93a-8a3e-4a6f-b655-efa74da933b0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Gowda	9364065667	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arjun Gowda", "contact_number": "9364065667"}	2026-02-01 10:22:00.497455
a4ff6eba-0b30-4296-8bf4-43bb640db2d5	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anvi Bansal	6709173074	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anvi Bansal", "contact_number": "6709173074"}	2026-02-01 10:22:00.497458
d42de384-a1f0-4aec-912f-dc5e479eb119	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Jain	9801277826	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Jain", "contact_number": "9801277826"}	2026-02-01 10:22:00.49746
50cadd34-b18a-4f75-9092-b56900b0dfde	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Iyer	8697739551	Promising	PENDING	{"cohort": "Promising", "customer_name": "Gaurav Iyer", "contact_number": "8697739551"}	2026-02-01 10:22:00.497463
8b75b98c-9ec6-4588-9f6d-7c8d9120c15b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Ghosh	6535027729	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Dev Ghosh", "contact_number": "6535027729"}	2026-02-01 10:22:00.497465
970d59e5-a080-4018-bebf-ae810673e094	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Ghosh	7128117889	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Ghosh", "contact_number": "7128117889"}	2026-02-01 10:22:00.497468
5f5b4c6b-83f8-4ee6-a40d-91f65e9b8701	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Tripathi	9606215936	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Tripathi", "contact_number": "9606215936"}	2026-02-01 10:22:00.49747
96984e62-9373-41ac-a53b-f29d709760ff	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Saxena	7169346355	Lost	PENDING	{"cohort": "Lost", "customer_name": "Rohan Saxena", "contact_number": "7169346355"}	2026-02-01 10:22:00.497473
82fd84e2-9cb0-40bf-830f-c40fac6fce2c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Banerjee	8891377623	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Harsh Banerjee", "contact_number": "8891377623"}	2026-02-01 10:22:00.497476
1337704a-19c5-477b-939b-b5826345367d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pooja Nair	8843351688	Promising	PENDING	{"cohort": "Promising", "customer_name": "Pooja Nair", "contact_number": "8843351688"}	2026-02-01 10:22:00.497479
1ed91fc7-09e6-44a8-9590-f1ff0de0f477	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Tripathi	7817678868	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Diya Tripathi", "contact_number": "7817678868"}	2026-02-01 10:22:00.497481
7d4050a3-1326-4aae-ab89-e85321ab2291	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Malhotra	9720285613	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Gaurav Malhotra", "contact_number": "9720285613"}	2026-02-01 10:22:00.497484
b68e9a74-6287-4350-b5b8-7e6459fd4b0f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Gill	8150302996	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mohit Gill", "contact_number": "8150302996"}	2026-02-01 10:22:00.497486
53689152-c003-4b81-9397-8c1498500c5d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Khan	7419697432	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Khan", "contact_number": "7419697432"}	2026-02-01 10:22:00.497489
4242927a-0e4b-4c4b-96a8-c1d52f298449	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Prasad	9222657398	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "9222657398"}	2026-02-01 10:22:00.497491
6be6bcbf-5391-48af-9515-cedc69017fc0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Saxena	6937588251	Champions	PENDING	{"cohort": "Champions", "customer_name": "Meera Saxena", "contact_number": "6937588251"}	2026-02-01 10:22:00.497493
d9bb56d7-4043-4b3d-b32c-9025efa5fc37	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pooja Sharma	9368539538	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Pooja Sharma", "contact_number": "9368539538"}	2026-02-01 10:22:00.497496
4c8b8981-a87e-4252-a8c7-fa359c6aeb1b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Banerjee	9780842521	Champions	PENDING	{"cohort": "Champions", "customer_name": "Meera Banerjee", "contact_number": "9780842521"}	2026-02-01 10:22:00.497498
0332299c-c567-4c87-8a86-610922d44dfa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Mishra	7371287442	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Mishra", "contact_number": "7371287442"}	2026-02-01 10:22:00.4975
d019c360-d6c2-40e6-903f-f30f515d00b8	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Yadav	7642151581	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Tanvi Yadav", "contact_number": "7642151581"}	2026-02-01 10:22:00.497503
7a8003d6-d6e7-435e-b141-7f795a216c7e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Narayan	7219550762	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Naina Narayan", "contact_number": "7219550762"}	2026-02-01 10:22:00.497505
20fe42b9-c9e3-4832-a993-bc9789463050	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Pandey	6264424157	Promising	PENDING	{"cohort": "Promising", "customer_name": "Rohan Pandey", "contact_number": "6264424157"}	2026-02-01 10:22:00.497508
b6c7babe-9f6b-4153-b354-4c987eface9c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Tiwari	8169503105	Champions	PENDING	{"cohort": "Champions", "customer_name": "Yash Tiwari", "contact_number": "8169503105"}	2026-02-01 10:22:00.49751
27e73366-6d8b-402d-bb6e-82886e7992de	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mohit Roy	9861958570	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mohit Roy", "contact_number": "9861958570"}	2026-02-01 10:22:00.497512
3a670b01-cdee-4a0b-b96f-5cfdbbff1e83	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Kulkarni	7950964486	Promising	PENDING	{"cohort": "Promising", "customer_name": "Neha Kulkarni", "contact_number": "7950964486"}	2026-02-01 10:22:00.497515
5298b208-fd33-42c0-b020-ab3e7e5c56be	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Gill	9287357760	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Tanvi Gill", "contact_number": "9287357760"}	2026-02-01 10:22:00.497517
3e3c2ac6-5cf8-4bab-85dd-dd4263108fd0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Gowda	7279055207	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ananya Gowda", "contact_number": "7279055207"}	2026-02-01 10:22:00.497519
33b7f7fd-c95d-4d87-b88d-8bc345287873	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Banerjee	6510663316	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sai Banerjee", "contact_number": "6510663316"}	2026-02-01 10:22:00.497522
6f2adbd4-cf7b-40a8-b95c-a9f4828787a4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Gowda	8255693255	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Neha Gowda", "contact_number": "8255693255"}	2026-02-01 10:22:00.497524
d494dc2f-043a-4752-a0e5-5e56c42006ca	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sameer Thakur	7352337786	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sameer Thakur", "contact_number": "7352337786"}	2026-02-01 10:22:00.497526
e697557f-1c64-4b32-b288-8f7140df344c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Shah	7461243567	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rahul Shah", "contact_number": "7461243567"}	2026-02-01 10:22:00.497529
03b10ae1-8d20-48d5-b7cf-52ce0db2a693	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rashmi Sood	7368846023	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rashmi Sood", "contact_number": "7368846023"}	2026-02-01 10:22:00.497531
233ce8a9-8bf4-413b-9983-02904f2ddc85	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Hegde	6794629071	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Hegde", "contact_number": "6794629071"}	2026-02-01 10:22:00.497534
a755602c-d705-4636-82d3-3cbbff2f690b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Chatterjee	9426820552	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Chatterjee", "contact_number": "9426820552"}	2026-02-01 10:22:00.497536
52e34c5d-a5bf-47b4-a033-d6bcf3724ee7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Das	7636902364	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Avni Das", "contact_number": "7636902364"}	2026-02-01 10:22:00.497538
641d934b-55c5-42ce-ad82-31232405a0e4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Verma	7570028939	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Verma", "contact_number": "7570028939"}	2026-02-01 10:22:00.497541
a8c0d950-b1bb-4bb5-899b-9ce3b7070f80	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditya Mukherjee	8294401555	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aditya Mukherjee", "contact_number": "8294401555"}	2026-02-01 10:22:00.497543
10d1921a-c9d0-45eb-8bc5-013cf46c8f62	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Priya Thakur	8989885695	Champions	PENDING	{"cohort": "Champions", "customer_name": "Priya Thakur", "contact_number": "8989885695"}	2026-02-01 10:22:00.497545
b788d36a-2d45-4306-a447-4a482cb2a772	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Bajaj	7794450106	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Bajaj", "contact_number": "7794450106"}	2026-02-01 10:22:00.497548
f3091005-12c4-4daf-aa86-05750ee61263	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Pandey	7623950820	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arjun Pandey", "contact_number": "7623950820"}	2026-02-01 10:22:00.49755
c897cb65-4fa2-42e5-a753-8259a02c0a82	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kabir Srinivasan	8094382969	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Kabir Srinivasan", "contact_number": "8094382969"}	2026-02-01 10:22:00.497552
5fba712d-5708-4238-877e-ec61fe66a032	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kavya Das	9722228837	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kavya Das", "contact_number": "9722228837"}	2026-02-01 10:22:00.497555
2f59d749-673e-407b-ae92-1ad0c1c9d16c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Bhat	6966675046	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Bhat", "contact_number": "6966675046"}	2026-02-01 10:22:00.497557
f99a1aed-0ea1-416c-add3-f4d032921842	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Deshmukh	9885217537	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Varun Deshmukh", "contact_number": "9885217537"}	2026-02-01 10:22:00.49756
956cdb5c-1a6f-4771-a365-d3e1a80e8927	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Mukherjee	7074553619	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Arnav Mukherjee", "contact_number": "7074553619"}	2026-02-01 10:22:00.497562
e5e9eb36-79d4-413c-ac69-2d00172ae741	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Narayan	9306313812	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ishaan Narayan", "contact_number": "9306313812"}	2026-02-01 10:22:00.497565
42f4a446-994d-4139-8eb0-37eb374ffc78	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Sharma	8463427382	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Sharma", "contact_number": "8463427382"}	2026-02-01 10:22:00.497567
bf0a8e20-31f9-4e0d-b144-f7dcb7a9bbb7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Sood	7596878581	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Sood", "contact_number": "7596878581"}	2026-02-01 10:22:00.497569
70120b63-89a4-4910-b686-0e861908cd97	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Bajaj	7404186534	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Trisha Bajaj", "contact_number": "7404186534"}	2026-02-01 10:22:00.497572
1aed3f62-8e1a-4a2a-abe2-5df51121d5c3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Reddy	8553608464	Lost	PENDING	{"cohort": "Lost", "customer_name": "Sakshi Reddy", "contact_number": "8553608464"}	2026-02-01 10:22:00.497574
6af4af18-379c-4247-b79a-b4e0d7a71e5b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Mishra	8235834366	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Dhruv Mishra", "contact_number": "8235834366"}	2026-02-01 10:22:00.497576
458c4c3b-9703-428a-b160-b57c081fdf7c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Khan	7923574064	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Myra Khan", "contact_number": "7923574064"}	2026-02-01 10:22:00.497579
c7d4f04d-a59b-4997-9c1d-5fc1b6a63a77	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Bhat	7869464903	Champions	PENDING	{"cohort": "Champions", "customer_name": "Avni Bhat", "contact_number": "7869464903"}	2026-02-01 10:22:00.497581
f6267aab-1b33-4e14-af50-64ea23dbeb96	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Isha Pandey	8322624835	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Isha Pandey", "contact_number": "8322624835"}	2026-02-01 10:22:00.497583
948632e2-aa09-423f-92b2-47d4c42363cc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Rao	9410769701	Champions	PENDING	{"cohort": "Champions", "customer_name": "Vihaan Rao", "contact_number": "9410769701"}	2026-02-01 10:22:00.497586
39f8ad1b-bf9b-44e0-8c5d-9763b73f0182	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Iyer	6094075916	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Iyer", "contact_number": "6094075916"}	2026-02-01 10:22:00.497588
0374d565-f9af-447a-b7b7-fae6f8e66219	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Nair	6683226180	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nikhil Nair", "contact_number": "6683226180"}	2026-02-01 10:22:00.49759
4dfd0d63-7305-4f37-ad66-0b712c4fa750	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Pandey	8834952496	Champions	PENDING	{"cohort": "Champions", "customer_name": "Avni Pandey", "contact_number": "8834952496"}	2026-02-01 10:22:00.497593
823ca36b-9c7e-4e03-a59d-2d85d69145b4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Naik	7547846594	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Naik", "contact_number": "7547846594"}	2026-02-01 10:22:00.497595
7b9b3705-0445-4c2f-b99f-17e7c109cae0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pooja Chaudhary	7843230883	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Pooja Chaudhary", "contact_number": "7843230883"}	2026-02-01 10:22:00.497597
1d9bdc8a-0c50-44c9-b916-5b14b9b5c335	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Sood	9564727757	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Sood", "contact_number": "9564727757"}	2026-02-01 10:22:00.4976
b8165412-ae09-4728-b921-fb2e822a20d8	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Tiwari	8184276820	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nandini Tiwari", "contact_number": "8184276820"}	2026-02-01 10:22:00.497603
0fc59e80-67b6-4c2c-8a59-667115b0dce7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Kaur	7576626521	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Kaur", "contact_number": "7576626521"}	2026-02-01 10:22:00.497605
bbfff4ef-0aaf-4dd8-b054-8e995f2e962b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Joshi	6126626100	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Nandini Joshi", "contact_number": "6126626100"}	2026-02-01 10:22:00.497607
0f85016c-a5c5-472b-aefe-171a3b1e3497	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Rao	6112772143	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Rao", "contact_number": "6112772143"}	2026-02-01 10:22:00.49761
82b92beb-66d5-4212-8df8-45716bdb3fe3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Singh	8743600712	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Yash Singh", "contact_number": "8743600712"}	2026-02-01 10:22:00.497612
c4511a36-f115-4e8e-9d0e-097c0b81c9bc	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Kulkarni	9041888172	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ayush Kulkarni", "contact_number": "9041888172"}	2026-02-01 10:22:00.497616
56baeba2-dfda-466b-b6ea-dd84e900230b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Bose	9291706239	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Yash Bose", "contact_number": "9291706239"}	2026-02-01 10:22:00.497619
ff82c47a-7a7f-4f6c-bd41-884032fbeb1b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Mukherjee	8177514230	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Parth Mukherjee", "contact_number": "8177514230"}	2026-02-01 10:22:00.497621
814e4c0d-eb71-48ab-847b-44fc66edd600	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Srinivasan	7924075329	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mansi Srinivasan", "contact_number": "7924075329"}	2026-02-01 10:22:00.497623
cc588d4a-ad94-44ce-ad39-c55ea489dca0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Bajaj	9617246397	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Bajaj", "contact_number": "9617246397"}	2026-02-01 10:22:00.497626
245dce26-7c43-432d-967c-16d7078775c2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Naik	6067712977	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Dhruv Naik", "contact_number": "6067712977"}	2026-02-01 10:22:00.497628
699713f3-5739-4797-a6d3-ca2b1642fa24	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Riya Srinivasan	9703720755	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Srinivasan", "contact_number": "9703720755"}	2026-02-01 10:22:00.49763
2fd7d653-998f-4075-aa51-4422d742f8b7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Saha	9113728950	Lost	PENDING	{"cohort": "Lost", "customer_name": "Saanvi Saha", "contact_number": "9113728950"}	2026-02-01 10:22:00.497633
468d4b2a-ac4b-4d12-bc5e-26065e09723e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Yash Patel	7485475786	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Yash Patel", "contact_number": "7485475786"}	2026-02-01 10:22:00.497635
0748f5b6-74f3-4e70-90af-dd4cb2681acd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Banerjee	8727653545	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ritvik Banerjee", "contact_number": "8727653545"}	2026-02-01 10:22:00.497638
314fa716-fe87-48d1-9ce0-cddf681ce35c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Saha	8361508182	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Saanvi Saha", "contact_number": "8361508182"}	2026-02-01 10:22:00.49764
ae9d63a0-4098-4155-a28c-c04161529172	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Jain	9106346502	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rahul Jain", "contact_number": "9106346502"}	2026-02-01 10:22:00.497642
3df4b75a-b1a3-41ea-bdd3-f22d9583ff09	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Shetty	6096984637	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Shetty", "contact_number": "6096984637"}	2026-02-01 10:22:00.497645
3c5de378-5eb5-45dc-9c46-a37015fda0d2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Nair	9870657802	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Sai Nair", "contact_number": "9870657802"}	2026-02-01 10:22:00.497647
235ea7f8-9910-44c5-8fec-6f58dbf03495	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Chatterjee	6123165955	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ishaan Chatterjee", "contact_number": "6123165955"}	2026-02-01 10:22:00.497649
79f418af-28f6-443e-9531-a2d737fd14cd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Bhat	6756741755	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Bhat", "contact_number": "6756741755"}	2026-02-01 10:22:00.497652
4dcc535c-5f0b-4d72-8a23-5e52cf99585f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ishaan Arora	7559959846	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ishaan Arora", "contact_number": "7559959846"}	2026-02-01 10:22:00.497655
8f76ccd4-5d1d-441c-996e-bec7b9bb46fe	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Patel	8652792943	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ira Patel", "contact_number": "8652792943"}	2026-02-01 10:22:00.497658
b2a9843e-dae7-481b-a28b-12c30765681a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kabir Tripathi	6955933280	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kabir Tripathi", "contact_number": "6955933280"}	2026-02-01 10:22:00.497661
28270f02-d367-40c2-bfcc-9f9af760d665	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Shetty	8955504128	Promising	PENDING	{"cohort": "Promising", "customer_name": "Rahul Shetty", "contact_number": "8955504128"}	2026-02-01 10:22:00.497664
58be545a-5048-4cf1-a19b-d0028a536f97	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Tripathi	7280397771	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Tripathi", "contact_number": "7280397771"}	2026-02-01 10:22:00.497666
275df6be-7455-4d23-b3b1-2e27094f0646	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Roy	6537500738	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Roy", "contact_number": "6537500738"}	2026-02-01 10:22:00.497669
bd923f07-be09-4d6d-a872-5951f23f233f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Tripathi	9917789660	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mansi Tripathi", "contact_number": "9917789660"}	2026-02-01 10:22:00.497671
ddbf6600-61e4-4e99-a0c7-5c775d282ff4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Bajaj	6353616997	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Varun Bajaj", "contact_number": "6353616997"}	2026-02-01 10:22:00.497673
6d02d458-5032-4965-8f65-949ee23619c7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Bhat	6223105030	Champions	PENDING	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6223105030"}	2026-02-01 10:22:00.497676
59274a49-a849-4323-87a5-25b9c6047f42	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Sood	9711546167	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vivaan Sood", "contact_number": "9711546167"}	2026-02-01 10:22:00.497678
a510a97e-45d2-475f-8179-50de05efcffa	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kavya Malhotra	7224651431	Champions	PENDING	{"cohort": "Champions", "customer_name": "Kavya Malhotra", "contact_number": "7224651431"}	2026-02-01 10:22:00.497681
aa1d6bc8-227e-4f93-b842-ccea5d2f992b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Priya Sharma	8503969410	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Priya Sharma", "contact_number": "8503969410"}	2026-02-01 10:22:00.497683
e704cc2a-defb-471b-be20-32105182c429	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kunal Ghosh	7137810998	Lost	PENDING	{"cohort": "Lost", "customer_name": "Kunal Ghosh", "contact_number": "7137810998"}	2026-02-01 10:22:00.497685
2b8971dd-ea28-4665-8d4d-ac21447e6f14	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Malhotra	8061402525	Lost	PENDING	{"cohort": "Lost", "customer_name": "Parth Malhotra", "contact_number": "8061402525"}	2026-02-01 10:22:00.497688
ff0b4272-52e3-4872-acd2-fc64b463c29c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Tripathi	8569663952	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "8569663952"}	2026-02-01 10:22:00.497691
69b70cb4-5f1e-44bc-9cc1-a057438d3717	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sneha Gill	6276060328	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Gill", "contact_number": "6276060328"}	2026-02-01 10:22:00.497693
b50602a4-f113-4f5c-b365-ba379139ccba	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Shetty	8808623903	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ayush Shetty", "contact_number": "8808623903"}	2026-02-01 10:22:00.497695
117ed802-e7d9-4074-8932-4985a1889e21	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Chaudhary	6154902533	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Chaudhary", "contact_number": "6154902533"}	2026-02-01 10:22:00.497698
6cf6a471-9cad-4271-875c-8931f7d9aa49	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Chatterjee	7063399202	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Chatterjee", "contact_number": "7063399202"}	2026-02-01 10:22:00.4977
9554fd82-a971-4a07-8289-b0918d75529b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Riya Chatterjee	9880521860	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Riya Chatterjee", "contact_number": "9880521860"}	2026-02-01 10:22:00.497703
2c7d4313-c48b-4ecf-80e5-9b76b801b07e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Mishra	9568645436	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Anika Mishra", "contact_number": "9568645436"}	2026-02-01 10:22:00.497705
9e80368f-fb9d-47f4-8ae6-d9cb590f260d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Riya Verma	9521588375	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Verma", "contact_number": "9521588375"}	2026-02-01 10:22:00.497707
fa67f743-f1fc-4442-a1ca-8e4f4f3880fd	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Varun Bansal	7497651057	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Bansal", "contact_number": "7497651057"}	2026-02-01 10:22:00.49771
82191883-046d-41b1-8f01-0c831f32da49	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Hegde	7387784449	Champions	PENDING	{"cohort": "Champions", "customer_name": "Gaurav Hegde", "contact_number": "7387784449"}	2026-02-01 10:22:00.497712
92bcd9b5-05e2-4827-a212-d4ad55ac9042	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Avni Saxena	8111096665	Promising	PENDING	{"cohort": "Promising", "customer_name": "Avni Saxena", "contact_number": "8111096665"}	2026-02-01 10:22:00.497714
e3d19b49-6d2b-40ef-a3bd-325e52956843	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Singh	7636456738	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dev Singh", "contact_number": "7636456738"}	2026-02-01 10:22:00.497717
c1a09baf-d984-42fb-825f-3f6a786df9df	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Pandey	9412499926	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Pandey", "contact_number": "9412499926"}	2026-02-01 10:22:00.497719
0095759f-dea3-4454-8e01-c9d3a5d2b9b3	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anvi Nair	7709984342	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Anvi Nair", "contact_number": "7709984342"}	2026-02-01 10:22:00.497721
afb722ea-49d9-4cd3-8ae6-39b7749e2f3d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Shetty	9768739556	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Aditi Shetty", "contact_number": "9768739556"}	2026-02-01 10:22:00.497724
21db3069-b097-4045-8985-3c3d13586783	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vivaan Saxena	6548095375	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vivaan Saxena", "contact_number": "6548095375"}	2026-02-01 10:22:00.497769
512d756f-16d4-4c23-a5fa-0dd81de9d4f9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Prasad	6148721296	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Shreya Prasad", "contact_number": "6148721296"}	2026-02-01 10:22:00.497772
ca9c7a4d-7c5b-430f-bee5-1a0fd65145e1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Gaurav Verma	7460515853	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Gaurav Verma", "contact_number": "7460515853"}	2026-02-01 10:22:00.497774
9fc8f9e9-b54d-429b-8c4b-0be7488fc4b8	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sai Narayan	8415724269	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sai Narayan", "contact_number": "8415724269"}	2026-02-01 10:22:00.497777
c1b3f0ac-0460-4e20-a6d7-b43196ec8a02	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Nair	7711435375	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Manav Nair", "contact_number": "7711435375"}	2026-02-01 10:22:00.49778
4be70744-716c-4557-a2d9-f28f0df818b9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Trisha Pandey	7337956181	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Trisha Pandey", "contact_number": "7337956181"}	2026-02-01 10:22:00.497783
ce9619de-3fc2-4ee1-ab70-f640cbf7ed0a	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aadhya Mehta	6437461126	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aadhya Mehta", "contact_number": "6437461126"}	2026-02-01 10:22:00.497785
4948c4b9-e650-4657-924e-9b7b191aa936	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Malhotra	8044864264	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aarohi Malhotra", "contact_number": "8044864264"}	2026-02-01 10:22:00.497788
42c9037f-38c5-46ba-96f3-bf1dc0ae8473	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Roy	9062565801	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Roy", "contact_number": "9062565801"}	2026-02-01 10:22:00.49779
f02dc686-c1d5-49d3-86e2-029eee6d0bcf	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Jain	8086829041	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Jain", "contact_number": "8086829041"}	2026-02-01 10:22:00.497792
84f8d1d0-d65f-4090-994f-82d9520db950	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Sood	8665714590	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Rahul Sood", "contact_number": "8665714590"}	2026-02-01 10:22:00.497795
1a021809-d723-4b03-bc91-5162ac5f7101	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Sakshi Malhotra	8388780418	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sakshi Malhotra", "contact_number": "8388780418"}	2026-02-01 10:22:00.497797
8502aa9a-a61e-482f-abfd-d76369d8e4d8	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Sood	8556617694	Champions	PENDING	{"cohort": "Champions", "customer_name": "Anika Sood", "contact_number": "8556617694"}	2026-02-01 10:22:00.497799
b1ee9ec3-1df9-455a-8a48-a6a88113a35f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Tripathi	8482569647	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Tripathi", "contact_number": "8482569647"}	2026-02-01 10:22:00.497802
0bb50df1-5fb2-4076-be83-e759fcca16b7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aarohi Shah	9416790061	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarohi Shah", "contact_number": "9416790061"}	2026-02-01 10:22:00.497804
315d06cb-a7d5-450b-84d6-f9ba62b03be6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Priya Verma	7794356022	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Priya Verma", "contact_number": "7794356022"}	2026-02-01 10:22:00.497807
94b03c7c-b002-48b1-960b-51ba13834d38	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayush Shetty	6353063760	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ayush Shetty", "contact_number": "6353063760"}	2026-02-01 10:22:00.497809
b6ce23da-ae6e-4ca8-9e7d-16ccb85f22c4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Vihaan Aggarwal	7189440114	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vihaan Aggarwal", "contact_number": "7189440114"}	2026-02-01 10:22:00.497812
a6b1debd-7214-4e76-979e-f8ea56288f69	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Myra Narayan	8489055650	Lost	PENDING	{"cohort": "Lost", "customer_name": "Myra Narayan", "contact_number": "8489055650"}	2026-02-01 10:22:00.497814
ed0ba8df-9277-4891-866a-e75897dbdc74	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arjun Bajaj	8783920968	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arjun Bajaj", "contact_number": "8783920968"}	2026-02-01 10:22:00.497816
37d45f89-f11e-43a0-877e-0f9452c3af6c	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Gupta	9117387208	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aman Gupta", "contact_number": "9117387208"}	2026-02-01 10:22:00.497819
b182f0de-11f1-4e69-ad95-9febcadea76e	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Parth Verma	8492317794	Champions	PENDING	{"cohort": "Champions", "customer_name": "Parth Verma", "contact_number": "8492317794"}	2026-02-01 10:22:00.497821
f01f0dca-43ab-4d08-8eb3-19a0f4c26521	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Das	6791348337	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Saanvi Das", "contact_number": "6791348337"}	2026-02-01 10:22:00.497823
50be57f5-53fd-4001-b691-1c51962bcf51	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Verma	6896174750	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Verma", "contact_number": "6896174750"}	2026-02-01 10:22:00.497826
fd3ed71a-f12d-4cb4-9f9f-d34e3431205d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Menon	6650405635	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aditi Menon", "contact_number": "6650405635"}	2026-02-01 10:22:00.497829
42cffb1f-350d-4cf7-bbf1-14d527c8561d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Nair	8622257621	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Nair", "contact_number": "8622257621"}	2026-02-01 10:22:00.497831
283c9f59-b7dd-4efb-9ca0-984d34ec9032	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Priya Gowda	6065233172	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Priya Gowda", "contact_number": "6065233172"}	2026-02-01 10:22:00.497833
1b9d6930-3ffa-470e-a4b9-b9da32327b1f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ayaan Prasad	7138500903	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ayaan Prasad", "contact_number": "7138500903"}	2026-02-01 10:22:00.497836
eef68fcc-d6eb-45ff-88bd-714f28f45719	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ira Pandey	6415586638	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Pandey", "contact_number": "6415586638"}	2026-02-01 10:22:00.497838
764cf92c-6008-42e3-894c-edefbb0e4ea9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Bose	6974189446	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Bose", "contact_number": "6974189446"}	2026-02-01 10:22:00.49784
949a7ec1-55f7-45c9-bda0-09bdc3007d3d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Kapoor	9491823193	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dhruv Kapoor", "contact_number": "9491823193"}	2026-02-01 10:22:00.497843
c50e629f-f918-4441-89a4-9f355c70f179	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ananya Chaudhary	8404341761	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Chaudhary", "contact_number": "8404341761"}	2026-02-01 10:22:00.497845
c536513e-8561-498a-a6ef-6e6fda9ffb88	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Gill	6471503452	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Naina Gill", "contact_number": "6471503452"}	2026-02-01 10:22:00.497848
79deac9c-5b67-4c17-9c53-0f98c3e3f3db	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Iyer	7593385747	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Iyer", "contact_number": "7593385747"}	2026-02-01 10:22:00.49785
1e06b979-4874-499e-aad6-65abde9a4d2b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Singh	7167781530	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Dhruv Singh", "contact_number": "7167781530"}	2026-02-01 10:22:00.497853
6668fa88-0d7e-4220-aa00-8fd4859e3df7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Reddy	9190187346	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Meera Reddy", "contact_number": "9190187346"}	2026-02-01 10:22:00.497855
bdb8e791-311b-4029-a2c8-181202dc465d	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Verma	6215787642	Lost	PENDING	{"cohort": "Lost", "customer_name": "Shreya Verma", "contact_number": "6215787642"}	2026-02-01 10:22:00.497857
c5b74f67-aa7f-43cf-b7be-69c2a0c4e09f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rupali Ghosh	9163593949	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rupali Ghosh", "contact_number": "9163593949"}	2026-02-01 10:22:00.49786
e1c947f8-63d0-42ba-ab8b-de1ec7115253	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kavya Hegde	8956588099	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Kavya Hegde", "contact_number": "8956588099"}	2026-02-01 10:22:00.497862
2988abd1-1dc5-4fa3-9526-a70835e8db75	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anvi Malhotra	6783882733	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Anvi Malhotra", "contact_number": "6783882733"}	2026-02-01 10:22:00.497865
23da2a65-6350-4899-ba25-9ace99134404	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Arnav Arora	9442115834	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arnav Arora", "contact_number": "9442115834"}	2026-02-01 10:22:00.497867
1140f1e7-3167-4a35-90b6-a07011801a60	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Diya Patel	8961007449	Lost	PENDING	{"cohort": "Lost", "customer_name": "Diya Patel", "contact_number": "8961007449"}	2026-02-01 10:22:00.497869
9e3cea0d-e8c0-4617-b685-6c27df09d0b0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Bhat	6188869644	Champions	PENDING	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6188869644"}	2026-02-01 10:22:00.497871
9922d451-4dee-4cfa-946f-d7ab82006b1b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Srinivasan	9324047729	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Srinivasan", "contact_number": "9324047729"}	2026-02-01 10:22:00.497874
56f65dc7-663e-4b89-8b93-214edf851059	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Saanvi Reddy	8004359075	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Reddy", "contact_number": "8004359075"}	2026-02-01 10:22:00.497876
21daacbf-7a63-48e4-91d5-ea0d4f9eb0ef	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Harsh Bajaj	8408047906	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Harsh Bajaj", "contact_number": "8408047906"}	2026-02-01 10:22:00.497879
a9c1b2b5-b5e2-43b7-b13a-6f2105203350	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Meera Hegde	8695049533	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Hegde", "contact_number": "8695049533"}	2026-02-01 10:22:00.497881
5729a367-fc6f-47ce-ad28-aeaf138403c1	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Naina Iyer	8209775041	Lost	PENDING	{"cohort": "Lost", "customer_name": "Naina Iyer", "contact_number": "8209775041"}	2026-02-01 10:22:00.497883
c3f34c45-48e0-4e97-a85f-fdcab879f99b	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Prasad	6627041072	Champions	PENDING	{"cohort": "Champions", "customer_name": "Tanvi Prasad", "contact_number": "6627041072"}	2026-02-01 10:22:00.497886
27fa6f56-7f09-4b66-ba8d-982bea788147	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Tanvi Gupta	8227697631	Promising	PENDING	{"cohort": "Promising", "customer_name": "Tanvi Gupta", "contact_number": "8227697631"}	2026-02-01 10:22:00.497888
8dabbaed-af27-4a5d-ba75-22931ddd7361	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Kunal Shetty	7478301914	Lost	PENDING	{"cohort": "Lost", "customer_name": "Kunal Shetty", "contact_number": "7478301914"}	2026-02-01 10:22:00.49789
aef1a8b7-8e22-4b63-a7cf-0dc28a1b5f38	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Gowda	9724627367	Promising	PENDING	{"cohort": "Promising", "customer_name": "Manav Gowda", "contact_number": "9724627367"}	2026-02-01 10:22:00.497893
b5be96a3-c209-4158-b7e5-d274037afeee	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Siddharth Patel	6044499263	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Siddharth Patel", "contact_number": "6044499263"}	2026-02-01 10:22:00.497895
0db4f07d-28da-4f2e-83f5-d92849d8b331	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Neha Narayan	8180946960	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Narayan", "contact_number": "8180946960"}	2026-02-01 10:22:00.497897
3c4b5d4f-81fd-4ee1-a19b-13d22de6a1f0	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rahul Sharma	8949832063	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rahul Sharma", "contact_number": "8949832063"}	2026-02-01 10:22:00.4979
209e83f4-ce2a-470d-ab69-0fccbc030432	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Pallavi Tripathi	7751361568	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "7751361568"}	2026-02-01 10:22:00.497902
5ccd8ef8-ab9c-43a5-8e0e-b19e80428d97	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rashmi Deshmukh	6456372060	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Rashmi Deshmukh", "contact_number": "6456372060"}	2026-02-01 10:22:00.497904
3319897a-f5ee-4d95-ad07-716b8aa4e7ab	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Reyansh Mishra	7967181685	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Reyansh Mishra", "contact_number": "7967181685"}	2026-02-01 10:22:00.497907
e5e00575-2441-4ddd-b60b-78e17da7c544	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Siddharth Srinivasan	7862496924	Champions	PENDING	{"cohort": "Champions", "customer_name": "Siddharth Srinivasan", "contact_number": "7862496924"}	2026-02-01 10:22:00.497909
fdc60bc8-8899-4517-911a-5e6db7f0ad21	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nandini Pandey	8272039281	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Pandey", "contact_number": "8272039281"}	2026-02-01 10:22:00.497912
b1d972a9-59d5-4b91-8741-bbe1d62daf6f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Ritvik Menon	6496141726	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ritvik Menon", "contact_number": "6496141726"}	2026-02-01 10:22:00.497914
0b699695-20e7-42aa-914d-818f4ce6e9b9	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Manav Khan	9710524816	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Manav Khan", "contact_number": "9710524816"}	2026-02-01 10:22:00.497916
29f5f3fe-2bc7-4eb8-8973-17d471736cdb	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dev Naik	6627955944	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Dev Naik", "contact_number": "6627955944"}	2026-02-01 10:22:00.497919
cdf14b71-b36a-467d-9000-284dd7c2e7d6	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aman Saha	6509845936	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aman Saha", "contact_number": "6509845936"}	2026-02-01 10:22:00.497921
105efa48-24ac-4511-94aa-3d36fc322740	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Aditi Shetty	9096383872	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Shetty", "contact_number": "9096383872"}	2026-02-01 10:22:00.497923
8fdff7fd-b39c-4229-92fa-5b9bb02245f4	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Dhruv Kulkarni	7103168630	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dhruv Kulkarni", "contact_number": "7103168630"}	2026-02-01 10:22:00.497926
dba143fa-610e-4050-a7bf-a36cce49c927	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Nikhil Mishra	9711754053	Promising	PENDING	{"cohort": "Promising", "customer_name": "Nikhil Mishra", "contact_number": "9711754053"}	2026-02-01 10:22:00.497928
9098e15c-a084-4557-8ec8-d846bfbb042f	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rashmi Kaur	9903374265	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Kaur", "contact_number": "9903374265"}	2026-02-01 10:22:00.49793
b3c740ae-946e-4e77-8109-acdd389e2ed8	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Shreya Saha	7720740962	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Saha", "contact_number": "7720740962"}	2026-02-01 10:22:00.497932
0cddf9e3-971f-4ae2-bd9a-e12165da4dc7	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Rohan Mukherjee	7069806808	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Mukherjee", "contact_number": "7069806808"}	2026-02-01 10:22:00.497935
f42e95ed-0dd7-4f7c-bb9e-9b9e591ee5af	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Mansi Shah	6472848963	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Shah", "contact_number": "6472848963"}	2026-02-01 10:22:00.497937
c95d14ef-fa1c-4847-9a19-419aa14cf3e3	a390371e-28a4-43a9-b8e3-befc774011cb	Sameer Iyer	7756343432	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sameer Iyer", "contact_number": "7756343432"}	2026-02-01 03:21:32.104211
88a57995-412e-4afe-b7e7-bfbe2f58fab9	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Gill	8872090747	Lost	PENDING	{"cohort": "Lost", "customer_name": "Vivaan Gill", "contact_number": "8872090747"}	2026-02-01 03:21:32.104245
89177d2c-cf64-42d4-b51f-3bfa0ffedbd0	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Mukherjee	9647026354	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Anika Mukherjee", "contact_number": "9647026354"}	2026-02-01 03:21:32.104263
f5833de9-e824-4c55-826b-cd7b1acb0f4b	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Nair	8473722111	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Myra Nair", "contact_number": "8473722111"}	2026-02-01 03:21:32.104281
45b242fd-c124-4f84-abbd-f40dc971bdf9	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Reddy	7172575982	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ayush Reddy", "contact_number": "7172575982"}	2026-02-01 03:21:32.104297
f95dc6ed-8630-4850-99d8-2890c29d95bb	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Gill	8105295618	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Mohit Gill", "contact_number": "8105295618"}	2026-02-01 03:21:32.104313
307f4120-a83d-4574-b4c6-3fb7657bedd3	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Shetty	9102439281	Champions	PENDING	{"cohort": "Champions", "customer_name": "Nandini Shetty", "contact_number": "9102439281"}	2026-02-01 03:21:32.104494
bff63995-8d94-4734-b1bb-2074bc940614	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Yadav	6406015391	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Sai Yadav", "contact_number": "6406015391"}	2026-02-01 03:21:32.104562
b46103b4-a92c-4f83-9466-4bc888d45187	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Gupta	9672544893	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Manav Gupta", "contact_number": "9672544893"}	2026-02-01 03:21:32.104586
6ff86265-e64e-44ae-8651-9e9484f2e8a8	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Shah	6679226110	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Vivaan Shah", "contact_number": "6679226110"}	2026-02-01 03:21:32.104604
26853ee2-2b2d-4b1f-9e90-2febd1929913	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Chatterjee	6464022802	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Chatterjee", "contact_number": "6464022802"}	2026-02-01 03:21:32.104622
1cd6f33e-8eb2-4414-ba04-018c90242b17	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Chaudhary	8766945698	Lost	PENDING	{"cohort": "Lost", "customer_name": "Neha Chaudhary", "contact_number": "8766945698"}	2026-02-01 03:21:32.10464
df91b280-ce91-4387-b6bb-fbf1da004efc	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Rao	6075894434	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Vivaan Rao", "contact_number": "6075894434"}	2026-02-01 03:21:32.104656
4e5c03a4-d854-4504-8852-68c03610a24d	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Arora	8540043209	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Diya Arora", "contact_number": "8540043209"}	2026-02-01 03:21:32.104674
9db0a10b-d852-4fbd-9a88-d9334972c987	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Bhat	6962074691	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Bhat", "contact_number": "6962074691"}	2026-02-01 03:21:32.104692
e1745ed8-4043-4aff-bc39-927a37e876bd	a390371e-28a4-43a9-b8e3-befc774011cb	Sneha Tripathi	9640336836	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sneha Tripathi", "contact_number": "9640336836"}	2026-02-01 03:21:32.10471
94e80003-687f-4295-bbfb-f8cc68cfc7b2	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Tiwari	8647002178	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Myra Tiwari", "contact_number": "8647002178"}	2026-02-01 03:21:32.104729
080ae1dc-9105-4773-ae27-df0112eadc43	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Saha	6654137672	Promising	PENDING	{"cohort": "Promising", "customer_name": "Shreya Saha", "contact_number": "6654137672"}	2026-02-01 03:21:32.104747
fa7f901a-d1e8-4bba-808a-63479ce34584	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Sharma	7946196215	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Avni Sharma", "contact_number": "7946196215"}	2026-02-01 03:21:32.104765
a65d680c-6c46-45dc-8302-57c56399a33e	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Singh	9099418475	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Parth Singh", "contact_number": "9099418475"}	2026-02-01 03:21:32.104792
22c0a16a-d371-4f0f-95b7-4c79cedc3ae4	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Mishra	8444411571	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Harsh Mishra", "contact_number": "8444411571"}	2026-02-01 03:21:32.104807
cfbf951d-6a2d-4c66-ade8-47949f489132	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Saha	6274958225	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rahul Saha", "contact_number": "6274958225"}	2026-02-01 03:21:32.104823
fda8c394-e21b-43ae-81f4-6ab58b7fbc44	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Roy	9844373989	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ishaan Roy", "contact_number": "9844373989"}	2026-02-01 03:21:32.104905
7e073fca-512e-4717-a0a1-fe4de92b1eff	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Bansal	7527077836	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Parth Bansal", "contact_number": "7527077836"}	2026-02-01 03:21:32.104926
936aed80-5ff0-474d-85db-21a29409a600	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Shah	7405588454	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Reyansh Shah", "contact_number": "7405588454"}	2026-02-01 03:21:32.104941
847bfc78-caf0-44f6-a4ae-a3e433c4da65	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Reddy	7461493668	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Reddy", "contact_number": "7461493668"}	2026-02-01 03:21:32.104993
15c94d5b-4005-43bc-8653-d936e4c10706	a390371e-28a4-43a9-b8e3-befc774011cb	Kunal Aggarwal	9968456262	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kunal Aggarwal", "contact_number": "9968456262"}	2026-02-01 03:21:32.105012
477a67f8-717b-4cff-bcd6-d09e3f104c02	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Bose	7740684690	Promising	PENDING	{"cohort": "Promising", "customer_name": "Naina Bose", "contact_number": "7740684690"}	2026-02-01 03:21:32.105028
c302c0e4-4357-491b-8f3e-8cbffb4ff48c	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Gupta	6231557108	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Avni Gupta", "contact_number": "6231557108"}	2026-02-01 03:21:32.105045
03f233bc-6fa4-44e4-b20e-1c5c02ca286c	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Pandey	7452646842	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dev Pandey", "contact_number": "7452646842"}	2026-02-01 03:21:32.107359
763c00a1-3f42-46aa-8566-a35e786d82f6	a390371e-28a4-43a9-b8e3-befc774011cb	Sneha Iyer	7099296439	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Iyer", "contact_number": "7099296439"}	2026-02-01 03:21:32.107393
cd857785-3af6-4933-8e2b-51eb7d6e1b9f	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Malhotra	9133260830	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rupali Malhotra", "contact_number": "9133260830"}	2026-02-01 03:21:32.107411
367840cf-222f-454f-9c59-d68d57d8b326	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Rao	6978972821	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sai Rao", "contact_number": "6978972821"}	2026-02-01 03:21:32.108963
b5ed043b-f600-4de0-a054-40b7c96228bb	a390371e-28a4-43a9-b8e3-befc774011cb	Kiara Srinivasan	8676869634	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kiara Srinivasan", "contact_number": "8676869634"}	2026-02-01 03:21:32.111458
d4f3a63c-7bda-499e-89ae-7d5e1f47fc49	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Kapoor	8702711595	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aditi Kapoor", "contact_number": "8702711595"}	2026-02-01 03:21:32.11162
04fb588a-3dfc-41a2-991f-01c168e35eb9	a390371e-28a4-43a9-b8e3-befc774011cb	Kavya Das	8828487319	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Kavya Das", "contact_number": "8828487319"}	2026-02-01 03:21:32.111769
acaad033-bb2c-425a-8ea0-624f22955240	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Patel	7726638503	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ritvik Patel", "contact_number": "7726638503"}	2026-02-01 03:21:32.111797
7be34e8c-c5d6-46a1-b1ab-7f1fd1b10fa5	a390371e-28a4-43a9-b8e3-befc774011cb	Aditya Gowda	8546658912	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aditya Gowda", "contact_number": "8546658912"}	2026-02-01 03:21:32.111816
5d263b40-c4d9-4aac-ab0d-9716e58c3998	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Bajaj	6693666476	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Myra Bajaj", "contact_number": "6693666476"}	2026-02-01 03:21:32.111834
89d95a8d-6839-426b-b98f-5424668ff1a3	a390371e-28a4-43a9-b8e3-befc774011cb	Kiara Shah	6193408146	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Kiara Shah", "contact_number": "6193408146"}	2026-02-01 03:21:32.111851
6aa1fd3d-1621-44b7-9b67-56d9fddf9a31	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Chatterjee	9578686926	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Pallavi Chatterjee", "contact_number": "9578686926"}	2026-02-01 03:21:32.111868
3fb03b25-d2a6-4812-ab56-64cf64150f42	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Reddy	7498065933	Promising	PENDING	{"cohort": "Promising", "customer_name": "Trisha Reddy", "contact_number": "7498065933"}	2026-02-01 03:21:32.111886
1dc54257-b24a-4494-8c92-4eeaa6a5b79e	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Saha	7998026903	Champions	PENDING	{"cohort": "Champions", "customer_name": "Varun Saha", "contact_number": "7998026903"}	2026-02-01 03:21:32.112285
c8485331-ed12-4b92-b617-874fadcfd29e	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Srinivasan	7728558277	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nikhil Srinivasan", "contact_number": "7728558277"}	2026-02-01 03:21:32.112315
fb1982b3-e0c4-4d81-a34e-7ccf28031652	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Kapoor	6299571813	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mansi Kapoor", "contact_number": "6299571813"}	2026-02-01 03:21:32.112334
0b9aea85-5e25-4c0a-8919-7677577100da	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Kapoor	7502141043	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ananya Kapoor", "contact_number": "7502141043"}	2026-02-01 03:21:32.112352
abcdbc3e-ab45-4ddb-b6df-5b96c8755408	a390371e-28a4-43a9-b8e3-befc774011cb	Kunal Roy	6426796360	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Kunal Roy", "contact_number": "6426796360"}	2026-02-01 03:21:32.112369
f8906dcf-35eb-463a-ba79-aad5a28eb0d2	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Saha	9841748311	Promising	PENDING	{"cohort": "Promising", "customer_name": "Gaurav Saha", "contact_number": "9841748311"}	2026-02-01 03:21:32.112385
0bed44bc-5213-4632-ac20-d179cb41e6e2	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Hegde	8352547168	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Hegde", "contact_number": "8352547168"}	2026-02-01 03:21:32.112402
5f91d748-15b4-4c0f-ba55-3a3a98a00bb7	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Patel	7484837332	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Patel", "contact_number": "7484837332"}	2026-02-01 03:21:32.112418
8d1f17e8-bcd5-4b21-b085-14aaabeaad89	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Srinivasan	7640047310	Lost	PENDING	{"cohort": "Lost", "customer_name": "Naina Srinivasan", "contact_number": "7640047310"}	2026-02-01 03:21:32.112435
a11ac298-765c-4e7f-8c9d-8d29e14cfa0b	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Shetty	8648949023	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "8648949023"}	2026-02-01 03:21:32.112545
671c89c6-3687-4bf1-ae77-e16a7a61ed79	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Mukherjee	6526218375	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Dev Mukherjee", "contact_number": "6526218375"}	2026-02-01 03:21:32.112575
e450752a-09c7-478e-8301-40b94da89368	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Pandey	9898660982	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ananya Pandey", "contact_number": "9898660982"}	2026-02-01 03:21:32.112596
5f054c2b-1eff-4cce-953a-f1ad78c5ebcd	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Saha	7279311607	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Varun Saha", "contact_number": "7279311607"}	2026-02-01 03:21:32.112613
ab2ab388-b0d4-430a-ba3d-6b6f0b648175	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Srinivasan	6053413395	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Rupali Srinivasan", "contact_number": "6053413395"}	2026-02-01 03:21:32.112629
559750c5-a2b2-4ca9-98f7-1c1c630f870c	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Rao	6170044642	Champions	PENDING	{"cohort": "Champions", "customer_name": "Harsh Rao", "contact_number": "6170044642"}	2026-02-01 03:21:32.112645
75f2be70-8a5b-4216-afb9-f015981505a1	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Hegde	6316553290	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Myra Hegde", "contact_number": "6316553290"}	2026-02-01 03:21:32.112661
2fd3ffd1-4ae7-49cd-a277-a9d43a43b3f7	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Bajaj	7321230713	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Bajaj", "contact_number": "7321230713"}	2026-02-01 03:21:32.112677
dede792d-5d13-4755-b578-e83390ad81f9	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Mehta	7588080098	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Mehta", "contact_number": "7588080098"}	2026-02-01 03:21:32.112693
a75bc047-a9d7-45ff-ab50-35ecf67b517f	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Gupta	9574103868	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Myra Gupta", "contact_number": "9574103868"}	2026-02-01 03:21:32.112709
23214ea3-2e2b-4ef4-8202-39c90ed26903	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Jain	8082553333	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Jain", "contact_number": "8082553333"}	2026-02-01 03:21:32.112999
43b9229c-3514-4d76-bd33-04bd78ba30e1	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Saha	7065173961	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arnav Saha", "contact_number": "7065173961"}	2026-02-01 03:21:32.113013
0686a071-b0af-4b23-8df9-f67e37dfe785	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Roy	6116761747	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Roy", "contact_number": "6116761747"}	2026-02-01 03:21:32.113026
8865f00f-924f-41e7-a183-b4d7dab25a80	a390371e-28a4-43a9-b8e3-befc774011cb	Anvi Prasad	9686939344	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Anvi Prasad", "contact_number": "9686939344"}	2026-02-01 03:21:32.113038
f66f6f37-a50b-464d-9a25-b55b85db39de	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Arora	8753040326	Promising	PENDING	{"cohort": "Promising", "customer_name": "Sakshi Arora", "contact_number": "8753040326"}	2026-02-01 03:21:32.113054
26297d2b-8dc3-447b-9ba5-77aa59878eda	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Roy	6654578486	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rohan Roy", "contact_number": "6654578486"}	2026-02-01 03:21:32.113066
3b25548d-e501-47d1-8738-3844ccfdccd8	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Deshmukh	8659488906	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aman Deshmukh", "contact_number": "8659488906"}	2026-02-01 03:21:32.113078
6e682c98-4a79-4a54-933d-8d26dbb60c3f	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Narayan	6244513243	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arnav Narayan", "contact_number": "6244513243"}	2026-02-01 03:21:32.113089
d9c1f7b4-ea03-47cd-8cc4-226e9f37dbbb	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Menon	6760062769	Lost	PENDING	{"cohort": "Lost", "customer_name": "Nikhil Menon", "contact_number": "6760062769"}	2026-02-01 03:21:32.113101
04b38247-76cc-49d3-be79-b2ae65646e5f	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Nair	7351396359	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aarohi Nair", "contact_number": "7351396359"}	2026-02-01 03:21:32.113114
288cad19-2f5f-4766-bf7f-29a10e33c62c	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Gill	8563179990	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Saanvi Gill", "contact_number": "8563179990"}	2026-02-01 03:21:32.113126
e3341b0f-5a91-4e40-8b65-81259a23afd5	a390371e-28a4-43a9-b8e3-befc774011cb	Pooja Shetty	9503937191	Champions	PENDING	{"cohort": "Champions", "customer_name": "Pooja Shetty", "contact_number": "9503937191"}	2026-02-01 03:21:32.113138
a48b8091-994c-420a-8eb2-e0e2fa62898f	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Gill	8817880371	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aarohi Gill", "contact_number": "8817880371"}	2026-02-01 03:21:32.11315
559bf802-e5f8-4343-84ed-326ae52b108f	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Mishra	9116697037	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Shreya Mishra", "contact_number": "9116697037"}	2026-02-01 03:21:32.113162
e6e5bc15-b4f2-4c46-b657-5186b302ab0b	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Yadav	9677229791	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Yadav", "contact_number": "9677229791"}	2026-02-01 03:21:32.113174
1ca99456-ca4e-4d59-ab07-f04f325c3ca6	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Kapoor	9423598812	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arnav Kapoor", "contact_number": "9423598812"}	2026-02-01 03:21:32.113186
267b0107-296d-4155-9903-2bb09102ae9d	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Nair	9851882729	Champions	PENDING	{"cohort": "Champions", "customer_name": "Myra Nair", "contact_number": "9851882729"}	2026-02-01 03:21:32.113202
dcb39d8e-39cc-451a-a903-a5f28217971f	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Deshmukh	7809889433	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Deshmukh", "contact_number": "7809889433"}	2026-02-01 03:21:32.113214
df321228-9444-4204-b2fe-b9bb2923ba58	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Sood	9930986712	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9930986712"}	2026-02-01 03:21:32.113225
75846c75-5433-42f7-89d4-64d597433411	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Iyer	9617400285	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Vihaan Iyer", "contact_number": "9617400285"}	2026-02-01 03:21:32.113237
40349375-9103-41fd-a42f-5a5232ff4e7a	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Srinivasan	9123047419	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Srinivasan", "contact_number": "9123047419"}	2026-02-01 03:21:32.11325
cb5e25e3-fa4b-41a0-ac0e-5203c6469d3d	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Hegde	6657203516	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ananya Hegde", "contact_number": "6657203516"}	2026-02-01 03:21:32.113262
7a4bc7b4-2a60-4b93-bbf4-260fdbb1271a	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Chaudhary	8055953469	Champions	PENDING	{"cohort": "Champions", "customer_name": "Manav Chaudhary", "contact_number": "8055953469"}	2026-02-01 03:21:32.113275
88ad350f-40a1-4840-ad92-414abb2134f2	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Malhotra	8730261571	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Malhotra", "contact_number": "8730261571"}	2026-02-01 03:21:32.113287
baffa0f8-f707-4ead-b991-24e60f88d5e1	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Chaudhary	8581746680	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Varun Chaudhary", "contact_number": "8581746680"}	2026-02-01 03:21:32.113298
ebd37beb-32c3-4fa9-8a90-de7816d97d0c	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Naik	9027833384	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nikhil Naik", "contact_number": "9027833384"}	2026-02-01 03:21:32.113811
a604b457-8ea1-41f1-ae7a-0ad0c64d9ef9	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Rao	6713783138	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aarohi Rao", "contact_number": "6713783138"}	2026-02-01 03:21:32.113849
af4201c4-6d43-474f-ab32-1ce4df39723a	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Sharma	9839449587	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Trisha Sharma", "contact_number": "9839449587"}	2026-02-01 03:21:32.113863
c25b7f1d-f998-44e8-b3da-40a1d5e17041	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Kaur	6491213247	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mohit Kaur", "contact_number": "6491213247"}	2026-02-01 03:21:32.113876
0ef94617-f7c9-455b-ad1a-17941a295383	a390371e-28a4-43a9-b8e3-befc774011cb	Ayaan Hegde	7630839299	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ayaan Hegde", "contact_number": "7630839299"}	2026-02-01 03:21:32.113888
f54196fe-c7e5-4cb3-917c-fe56ef961ea7	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Shetty	6645710864	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Sakshi Shetty", "contact_number": "6645710864"}	2026-02-01 03:21:32.1139
85946a83-92bb-4d7e-a2d4-5c543c3bf674	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Saha	7073356693	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Parth Saha", "contact_number": "7073356693"}	2026-02-01 03:21:32.113912
a4fa6b83-e601-4593-a23a-0b6c981fd598	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Narayan	6553621743	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Dhruv Narayan", "contact_number": "6553621743"}	2026-02-01 03:21:32.114009
1aa267fa-1c8d-492a-9b9c-dcd98436ac81	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Iyer	6224929418	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Rahul Iyer", "contact_number": "6224929418"}	2026-02-01 03:21:32.114025
e92c2c45-0242-46fc-8abc-5c4dcd66098b	a390371e-28a4-43a9-b8e3-befc774011cb	Kiara Mishra	9179899675	Promising	PENDING	{"cohort": "Promising", "customer_name": "Kiara Mishra", "contact_number": "9179899675"}	2026-02-01 03:21:32.114398
0a881fd9-ac3c-4b9e-8187-b2fb9eee0eca	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Pandey	8887967512	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ananya Pandey", "contact_number": "8887967512"}	2026-02-01 03:21:32.114426
4cacfb83-396c-4bad-a9e2-f0a80d54628e	a390371e-28a4-43a9-b8e3-befc774011cb	Aarav Kaur	7243549180	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarav Kaur", "contact_number": "7243549180"}	2026-02-01 03:21:32.11444
ec4de8a0-3d9d-4c73-a495-d3f82c6dec6c	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Kaur	9975780964	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sakshi Kaur", "contact_number": "9975780964"}	2026-02-01 03:21:32.114452
78d176f3-6170-41de-a622-0f37ddb5cd56	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Joshi	8185571588	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aarohi Joshi", "contact_number": "8185571588"}	2026-02-01 03:21:32.114464
65132ccd-f47d-4cfb-9f7d-660f7b5c2760	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Khan	7319295201	Champions	PENDING	{"cohort": "Champions", "customer_name": "Parth Khan", "contact_number": "7319295201"}	2026-02-01 03:21:32.114476
e5529421-2160-4c17-8392-2336904f4fd7	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Reddy	8135519167	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Neha Reddy", "contact_number": "8135519167"}	2026-02-01 03:21:32.114488
9708a522-2c30-44bc-916b-1be38e98f82e	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Srinivasan	8858006567	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Trisha Srinivasan", "contact_number": "8858006567"}	2026-02-01 03:21:32.114501
e03feb6b-e21d-45cf-9c86-926000fdc1a5	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Srinivasan	9608563284	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Srinivasan", "contact_number": "9608563284"}	2026-02-01 03:21:32.114512
756f760e-af5f-4975-b246-76c4538537be	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Chaudhary	9004426377	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Neha Chaudhary", "contact_number": "9004426377"}	2026-02-01 03:21:32.114524
3ffe602c-6e1f-4ef0-a4f7-26de0847f4fe	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Menon	8913534220	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Diya Menon", "contact_number": "8913534220"}	2026-02-01 03:21:32.114536
c184d39b-015d-4911-807d-eccaafd824b4	a390371e-28a4-43a9-b8e3-befc774011cb	Siddharth Sood	8984998971	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Siddharth Sood", "contact_number": "8984998971"}	2026-02-01 03:21:32.114547
5bb40c37-0718-4145-845d-03f99de18090	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Shetty	7454309592	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ananya Shetty", "contact_number": "7454309592"}	2026-02-01 03:21:32.114559
da932e63-e7c0-4ac3-94d0-ba19ffc36575	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Naik	8025862011	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dhruv Naik", "contact_number": "8025862011"}	2026-02-01 03:21:32.114571
498d1038-6bed-4e68-90eb-81f92b4542fb	a390371e-28a4-43a9-b8e3-befc774011cb	Anvi Sharma	8773451505	Champions	PENDING	{"cohort": "Champions", "customer_name": "Anvi Sharma", "contact_number": "8773451505"}	2026-02-01 03:21:32.114586
87c855a2-2282-4c25-b409-6e6dc0222feb	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Jain	8866103953	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Naina Jain", "contact_number": "8866103953"}	2026-02-01 03:21:32.114604
f8a7f386-def5-4258-a047-7affc38872ec	a390371e-28a4-43a9-b8e3-befc774011cb	Riya Verma	7155013446	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Riya Verma", "contact_number": "7155013446"}	2026-02-01 03:21:32.114617
2e8def6d-ef5b-444c-bc24-396f318f4aa1	a390371e-28a4-43a9-b8e3-befc774011cb	Ayaan Kapoor	7361972385	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ayaan Kapoor", "contact_number": "7361972385"}	2026-02-01 03:21:32.114629
5d1a2466-2075-43d6-970d-26d5b7162001	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Ghosh	8403143886	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sakshi Ghosh", "contact_number": "8403143886"}	2026-02-01 03:21:32.114642
180495fc-859b-4404-90b4-775d3c8af4ce	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Mehta	9269520457	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Mehta", "contact_number": "9269520457"}	2026-02-01 03:21:32.114654
ae0c8896-af6c-4ade-ad83-f6b1240e313a	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Prasad	9160910316	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Saanvi Prasad", "contact_number": "9160910316"}	2026-02-01 03:21:32.114666
24c55a6a-7546-4fde-8f4e-6a34824bc9ef	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Shah	9564877559	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sai Shah", "contact_number": "9564877559"}	2026-02-01 03:21:32.114678
9e95d658-0cc5-45b8-9d13-1e7d8713463e	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Deshmukh	9531933776	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dev Deshmukh", "contact_number": "9531933776"}	2026-02-01 03:21:32.11469
c7d36d90-9651-440c-ae3a-55823b388de3	a390371e-28a4-43a9-b8e3-befc774011cb	Rashmi Patel	8612529222	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Rashmi Patel", "contact_number": "8612529222"}	2026-02-01 03:21:32.114702
651b2675-64c8-48bc-88c5-3585349519b2	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Shetty	9339721639	Promising	PENDING	{"cohort": "Promising", "customer_name": "Parth Shetty", "contact_number": "9339721639"}	2026-02-01 03:21:32.114713
9084d988-0a15-4ecc-b100-b9efccceb351	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Nair	8982273424	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Dhruv Nair", "contact_number": "8982273424"}	2026-02-01 03:21:32.114727
83f3ca32-973d-45c2-a67a-e7492ab02b51	a390371e-28a4-43a9-b8e3-befc774011cb	Krishna Gowda	7825217209	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Krishna Gowda", "contact_number": "7825217209"}	2026-02-01 03:21:32.114739
a85f5f71-b748-4349-82d9-8aa3e9aaaf55	a390371e-28a4-43a9-b8e3-befc774011cb	Priya Rao	7604717059	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Priya Rao", "contact_number": "7604717059"}	2026-02-01 03:21:32.114751
ca3c28d8-f51e-4abb-a857-0037a457c0b3	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Bose	9684672207	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Bose", "contact_number": "9684672207"}	2026-02-01 03:21:32.114763
b6c1c51c-e353-4d76-8152-2166fcbb0714	a390371e-28a4-43a9-b8e3-befc774011cb	Isha Chaudhary	7579918199	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Isha Chaudhary", "contact_number": "7579918199"}	2026-02-01 03:21:32.114776
ca547f73-6b98-49c5-a2bc-c7826b72bf3d	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Roy	9717820269	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Manav Roy", "contact_number": "9717820269"}	2026-02-01 03:21:32.114788
a97303b8-8b8e-4e74-8974-a70ea83d39d3	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Shetty	8295498411	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Rupali Shetty", "contact_number": "8295498411"}	2026-02-01 03:21:32.114799
76dfa431-1c3e-44ff-a8d3-e34c0d0d94ec	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Kaur	7767032616	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Parth Kaur", "contact_number": "7767032616"}	2026-02-01 03:21:32.11482
be4913c5-60d3-4a0f-b2eb-3a2bacba2a81	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Das	9850611322	Champions	PENDING	{"cohort": "Champions", "customer_name": "Harsh Das", "contact_number": "9850611322"}	2026-02-01 03:21:32.114832
d3ffe78a-4d44-428f-bdcb-09d2f2c308aa	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Ghosh	7423552326	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ritvik Ghosh", "contact_number": "7423552326"}	2026-02-01 03:21:32.114848
68c8b77f-785f-414d-8214-fefaffa0fe19	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Gowda	9345873192	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Arnav Gowda", "contact_number": "9345873192"}	2026-02-01 03:21:32.114859
da86e5cf-6f08-44b3-899f-76f2a8b9441d	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Kapoor	7211764545	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aman Kapoor", "contact_number": "7211764545"}	2026-02-01 03:21:32.114871
37c592a4-7c74-4501-b72f-36c5aefbfd26	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Naik	7765755391	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Yash Naik", "contact_number": "7765755391"}	2026-02-01 03:21:32.114883
feb11679-3640-4480-bca0-18b4ecb6b00a	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Iyer	7513512505	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Yash Iyer", "contact_number": "7513512505"}	2026-02-01 03:21:32.115236
af9ff310-b8fd-4fcd-9597-6dbff789f1cb	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Chatterjee	6454048738	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Chatterjee", "contact_number": "6454048738"}	2026-02-01 03:21:32.115271
7df30b23-5782-4a42-924c-aafaa66f60d8	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Bansal	7503099090	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Bansal", "contact_number": "7503099090"}	2026-02-01 03:21:32.115286
b24c0c43-c8b3-4527-a01f-4bc2bd3bc50c	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Yadav	9116793849	Promising	PENDING	{"cohort": "Promising", "customer_name": "Vivaan Yadav", "contact_number": "9116793849"}	2026-02-01 03:21:32.115599
a9fd71a4-182a-4159-93dd-1ef6b2125b00	a390371e-28a4-43a9-b8e3-befc774011cb	Pooja Chatterjee	9366563155	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Pooja Chatterjee", "contact_number": "9366563155"}	2026-02-01 03:21:32.11562
a4174995-dfdc-4f37-a179-e82922e68ea7	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Chatterjee	7879474324	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Shreya Chatterjee", "contact_number": "7879474324"}	2026-02-01 03:21:32.115632
65645bff-342b-48e4-a429-432b08b30b36	a390371e-28a4-43a9-b8e3-befc774011cb	Aarav Patel	7297184780	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aarav Patel", "contact_number": "7297184780"}	2026-02-01 03:21:32.115644
63aa4401-38ff-4ace-85f8-41e8e299ede2	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Srinivasan	7054682045	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ritvik Srinivasan", "contact_number": "7054682045"}	2026-02-01 03:21:32.115657
67feff4d-7ebf-483c-9081-a17b8f7c43b2	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Chatterjee	6192955782	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Chatterjee", "contact_number": "6192955782"}	2026-02-01 03:21:32.115668
ac312ee1-5666-4c98-abbd-fd46b91af5e2	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Gupta	7954255716	Promising	PENDING	{"cohort": "Promising", "customer_name": "Arjun Gupta", "contact_number": "7954255716"}	2026-02-01 03:21:32.115681
06f9d31a-0e5b-4499-8a03-6614a661e2c4	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Bansal	9036356421	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Trisha Bansal", "contact_number": "9036356421"}	2026-02-01 03:21:32.115693
3b58df05-b503-4622-93e0-a4c8ed34c06e	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Joshi	9228140445	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Arjun Joshi", "contact_number": "9228140445"}	2026-02-01 03:21:32.115707
5551676f-9c8c-4257-898b-f5f06497da39	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Saha	9226980712	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Saha", "contact_number": "9226980712"}	2026-02-01 03:21:32.115719
654f5b0a-6d99-4f06-8789-8c3792d359d9	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Deshmukh	6817754839	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Deshmukh", "contact_number": "6817754839"}	2026-02-01 03:21:32.115732
be3f70ca-8502-4fa4-872f-86ad21569cac	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Shetty	6217779673	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Shetty", "contact_number": "6217779673"}	2026-02-01 03:21:32.115744
74e4ffba-e181-4c1e-b797-02c37653d405	a390371e-28a4-43a9-b8e3-befc774011cb	Krishna Kaur	7573532540	Champions	PENDING	{"cohort": "Champions", "customer_name": "Krishna Kaur", "contact_number": "7573532540"}	2026-02-01 03:21:32.115769
a26c1a42-ebb7-459c-a84b-bb070c35917a	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Prasad	9732308705	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rupali Prasad", "contact_number": "9732308705"}	2026-02-01 03:21:32.115808
2cc6e525-aab8-41b6-896a-5503555e7bbb	a390371e-28a4-43a9-b8e3-befc774011cb	Kavya Kulkarni	9212525937	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kavya Kulkarni", "contact_number": "9212525937"}	2026-02-01 03:21:32.115826
4eb66213-50c9-4c82-8853-dcc8e4f84e51	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Kulkarni	9964171749	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Saanvi Kulkarni", "contact_number": "9964171749"}	2026-02-01 03:21:32.11584
b5ce8bb2-127e-4652-90df-a779bde8acf4	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Tripathi	6580800160	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Avni Tripathi", "contact_number": "6580800160"}	2026-02-01 03:21:32.115853
8939ba2e-b074-4761-abe1-158a831181e4	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Reddy	7053666440	Promising	PENDING	{"cohort": "Promising", "customer_name": "Diya Reddy", "contact_number": "7053666440"}	2026-02-01 03:21:32.115865
2c44ae52-6a74-4649-9665-943f3c17e8cf	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Gowda	9052908689	Lost	PENDING	{"cohort": "Lost", "customer_name": "Reyansh Gowda", "contact_number": "9052908689"}	2026-02-01 03:21:32.115877
48b0fcc9-f833-4434-a9c6-f8f4f2ed7292	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Aggarwal	6952623709	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Manav Aggarwal", "contact_number": "6952623709"}	2026-02-01 03:21:32.11589
185ca502-c22d-43a2-bca2-d5da0fadff4e	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Tripathi	9592686870	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Tripathi", "contact_number": "9592686870"}	2026-02-01 03:21:32.115904
4d16c78f-331f-4535-bd60-cbd139512eb6	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Kaur	9346708639	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Kaur", "contact_number": "9346708639"}	2026-02-01 03:21:32.115919
00fdcae3-de89-45fe-ac70-5db988d8396f	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Hegde	6892965296	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Vihaan Hegde", "contact_number": "6892965296"}	2026-02-01 03:21:32.11594
4e745e6a-12bf-4ba3-b9ed-2712b4ea7e9f	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Narayan	8850939577	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aman Narayan", "contact_number": "8850939577"}	2026-02-01 03:21:32.115956
f9d21471-4da6-4ecf-81f2-4462247ae210	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Mehta	9925586537	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Reyansh Mehta", "contact_number": "9925586537"}	2026-02-01 03:21:32.115971
2ac875ce-1622-4036-ba1d-395837b0d974	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Kaur	6590483793	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Arnav Kaur", "contact_number": "6590483793"}	2026-02-01 03:21:32.115986
248970d9-6c39-4b29-a037-59524ea7d2ba	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Reddy	8029439466	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Rahul Reddy", "contact_number": "8029439466"}	2026-02-01 03:21:32.116004
d39da707-193a-4581-b199-2a7b7b1ff469	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Das	6722023713	Promising	PENDING	{"cohort": "Promising", "customer_name": "Saanvi Das", "contact_number": "6722023713"}	2026-02-01 03:21:32.116017
5f503ded-11bd-417a-92a3-77134b7edf91	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Shetty	8103321145	Champions	PENDING	{"cohort": "Champions", "customer_name": "Diya Shetty", "contact_number": "8103321145"}	2026-02-01 03:21:32.116031
c38c660f-2229-44da-8f76-fe7b4f91facd	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Nair	9105578047	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Yash Nair", "contact_number": "9105578047"}	2026-02-01 03:21:32.116046
fe0a6159-58e0-4457-8a67-b3f73c671c78	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Khan	7513134044	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Manav Khan", "contact_number": "7513134044"}	2026-02-01 03:21:32.11606
9f01b666-b301-48d2-b80e-2004e249f900	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Pandey	9739746410	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Pandey", "contact_number": "9739746410"}	2026-02-01 03:21:32.116075
0dd9d348-7f43-45df-8aa5-c633f8a9582c	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Patel	9368338891	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Patel", "contact_number": "9368338891"}	2026-02-01 03:21:32.116089
271429dd-cf9f-4a1b-a04c-7344d001665c	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Rao	8664133769	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Yash Rao", "contact_number": "8664133769"}	2026-02-01 03:21:32.116103
955aa857-0663-40d9-8161-fc760a2f4d6a	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Mehta	7327391917	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Reyansh Mehta", "contact_number": "7327391917"}	2026-02-01 03:21:32.116119
98232ca0-9197-4993-a07f-c94d6fb42f1e	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Shetty	6947426874	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aman Shetty", "contact_number": "6947426874"}	2026-02-01 03:21:32.116133
7cef8b67-3c01-4096-9e83-2db06f71a2ed	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Sharma	9132143455	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Sharma", "contact_number": "9132143455"}	2026-02-01 03:21:32.116145
d9d93f2e-cf06-46de-95f8-e82f3f7e06db	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Sood	9573856076	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sai Sood", "contact_number": "9573856076"}	2026-02-01 03:21:32.116168
9bdae0c3-4411-46b6-becd-d7695c0e0dc3	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Mukherjee	8165669371	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Mukherjee", "contact_number": "8165669371"}	2026-02-01 03:21:32.116184
1a8ed8e8-66ca-4919-9bc9-84ebd619692a	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Tripathi	6255554375	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Tripathi", "contact_number": "6255554375"}	2026-02-01 03:21:32.116197
ecd2cb1e-7c8b-4e73-91b0-d7f747f2c262	a390371e-28a4-43a9-b8e3-befc774011cb	Riya Kulkarni	7301491913	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Riya Kulkarni", "contact_number": "7301491913"}	2026-02-01 03:21:32.116212
adef621c-c66f-45b4-8ff5-d16143fc80b3	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Saxena	9753074007	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ira Saxena", "contact_number": "9753074007"}	2026-02-01 03:21:32.116224
aea41289-e844-4cde-87e7-7ca9614b2c31	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Mehta	6866192115	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Mehta", "contact_number": "6866192115"}	2026-02-01 03:21:32.116236
a18ab124-cb90-4377-8aaf-60b4a29d6b8b	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Malhotra	9241640615	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Malhotra", "contact_number": "9241640615"}	2026-02-01 03:21:32.11625
5eaf4256-9b2e-4992-b8ea-e6c524b597ab	a390371e-28a4-43a9-b8e3-befc774011cb	Aarav Malhotra	9022775753	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aarav Malhotra", "contact_number": "9022775753"}	2026-02-01 03:21:32.116262
6d453a1f-3df0-4ad5-a3e2-21b64e62db36	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Pandey	7428565653	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aarohi Pandey", "contact_number": "7428565653"}	2026-02-01 03:21:32.116274
b8520823-07ca-4334-ba95-f8600f0928c6	a390371e-28a4-43a9-b8e3-befc774011cb	Kiara Mishra	9687260113	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kiara Mishra", "contact_number": "9687260113"}	2026-02-01 03:21:32.116285
c5e386f3-b272-4200-95f8-7a81253d7e33	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Kaur	7313554459	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Harsh Kaur", "contact_number": "7313554459"}	2026-02-01 03:21:32.116298
9fe594d9-bda2-4670-ad2b-d5a510c065b7	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Rao	7541340301	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Tanvi Rao", "contact_number": "7541340301"}	2026-02-01 03:21:32.11631
ce6a54ce-ebc0-412e-8de4-33538a13a9be	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Arora	9954648400	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Arora", "contact_number": "9954648400"}	2026-02-01 03:21:32.116322
48e17096-4ede-4799-aa1d-86d44a5e4689	a390371e-28a4-43a9-b8e3-befc774011cb	Riya Menon	7225147751	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Menon", "contact_number": "7225147751"}	2026-02-01 03:21:32.116335
81538875-2d6b-470c-824e-329202264b23	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Banerjee	6259577424	Promising	PENDING	{"cohort": "Promising", "customer_name": "Diya Banerjee", "contact_number": "6259577424"}	2026-02-01 03:21:32.116347
b55ca56c-2cb1-4005-b85d-7a68d6f49106	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Mehta	7294384972	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Mehta", "contact_number": "7294384972"}	2026-02-01 03:21:32.116376
de76c90a-b03c-4a71-8503-ee81594fc0e7	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Gill	8864678855	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Shreya Gill", "contact_number": "8864678855"}	2026-02-01 03:21:32.116457
2feb5af3-a298-4184-9171-74d12eb78d65	a390371e-28a4-43a9-b8e3-befc774011cb	Sneha Mehta	7372289609	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sneha Mehta", "contact_number": "7372289609"}	2026-02-01 03:21:32.116474
d1c6abd7-7d80-4f06-becf-2d3953280ce0	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Jain	9998182787	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ayush Jain", "contact_number": "9998182787"}	2026-02-01 03:21:32.116485
bdae9b2b-217c-4d58-9161-b878db514717	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Mehta	9452446805	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vihaan Mehta", "contact_number": "9452446805"}	2026-02-01 03:21:32.116497
b3719f6d-6fb8-46fd-ab3d-f2474deddde6	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Kulkarni	8684458809	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Kulkarni", "contact_number": "8684458809"}	2026-02-01 03:21:32.116509
afbfd01e-b90c-4459-9c15-69c565c62de2	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Naik	8873984325	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Naik", "contact_number": "8873984325"}	2026-02-01 03:21:32.11652
6f78e309-357c-4596-9196-764b2f1f0865	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Mehta	7543600741	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Ananya Mehta", "contact_number": "7543600741"}	2026-02-01 03:21:32.116532
82bad27f-475e-48d7-b00c-50a248312a41	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Shah	7409261619	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Shah", "contact_number": "7409261619"}	2026-02-01 03:21:32.116543
41e464bc-3b7f-4d61-9655-33628d013f96	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Khan	8030660677	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Pallavi Khan", "contact_number": "8030660677"}	2026-02-01 03:21:32.116555
86e96838-786f-4593-bbd2-ce0ecd78a9b9	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Chaudhary	9670412606	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Arjun Chaudhary", "contact_number": "9670412606"}	2026-02-01 03:21:32.116569
065cecf1-905f-4351-9ec9-3f98caf36cb9	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Hegde	6941037138	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arjun Hegde", "contact_number": "6941037138"}	2026-02-01 03:21:32.116581
bf0c1012-baa5-4cc0-9ebe-789699470e8f	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Mukherjee	7388660561	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Trisha Mukherjee", "contact_number": "7388660561"}	2026-02-01 03:21:32.116592
eb8e1e95-d0cb-45e9-807d-04981329659e	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Iyer	8761468017	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arnav Iyer", "contact_number": "8761468017"}	2026-02-01 03:21:32.116609
5ca1354a-52fc-4119-8ba1-e09d7f5ddd70	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Prasad	9347262672	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Sakshi Prasad", "contact_number": "9347262672"}	2026-02-01 03:21:32.116621
5c14bd38-4b2f-476d-819d-6e68c59d6ad8	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Yadav	6863557208	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Yadav", "contact_number": "6863557208"}	2026-02-01 03:21:32.116633
38ae90f0-9364-4840-93e1-503445be0603	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Gupta	7414559991	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Naina Gupta", "contact_number": "7414559991"}	2026-02-01 03:21:32.116646
4812748c-6691-41f3-8360-81742fe99c29	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Shah	9367970020	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aditi Shah", "contact_number": "9367970020"}	2026-02-01 03:21:32.116658
0e115f16-2bbd-49b2-bf6e-c63956d651d6	a390371e-28a4-43a9-b8e3-befc774011cb	Kabir Gowda	6932774465	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kabir Gowda", "contact_number": "6932774465"}	2026-02-01 03:21:32.11667
0a1fbbe9-587b-4ceb-94ae-01177df430ce	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Prasad	7235285368	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Shreya Prasad", "contact_number": "7235285368"}	2026-02-01 03:21:32.116683
f3447cd2-6551-4ac7-b214-821f7a41a1b9	a390371e-28a4-43a9-b8e3-befc774011cb	Isha Jain	6349229160	Champions	PENDING	{"cohort": "Champions", "customer_name": "Isha Jain", "contact_number": "6349229160"}	2026-02-01 03:21:32.116695
3abbcfa2-ed91-4ed6-8100-466c29e2454c	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Bose	7177195771	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Rupali Bose", "contact_number": "7177195771"}	2026-02-01 03:21:32.116706
993ceb16-9530-4d68-b465-81396a7fbabe	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Gowda	7787183452	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ira Gowda", "contact_number": "7787183452"}	2026-02-01 03:21:32.116719
1f6b06cb-0a6c-411f-9987-cc9b3731c777	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Jain	6450811786	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ritvik Jain", "contact_number": "6450811786"}	2026-02-01 03:21:32.116732
ddf02ce6-51e0-40a6-87e3-256d5e78dc51	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Bose	6250824319	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Bose", "contact_number": "6250824319"}	2026-02-01 03:21:32.116744
320c10d0-238d-456e-9911-49d3dfc66a7b	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Nair	6597434720	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arnav Nair", "contact_number": "6597434720"}	2026-02-01 03:21:32.116756
7de3681c-dd20-4415-8b40-fe37c0b7dd0a	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Narayan	8160250488	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Gaurav Narayan", "contact_number": "8160250488"}	2026-02-01 03:21:32.116768
6fe9f139-66a9-4bbb-85fc-f6dd596717e8	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Pandey	8350253645	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Meera Pandey", "contact_number": "8350253645"}	2026-02-01 03:21:32.11678
55ac719c-6db4-41cf-8987-d48202dd7b72	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Sood	9977571905	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rohan Sood", "contact_number": "9977571905"}	2026-02-01 03:21:32.116792
7bd3317a-d02b-4efe-8a88-25d253e33215	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Patel	6906871524	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Rupali Patel", "contact_number": "6906871524"}	2026-02-01 03:21:32.116867
44a77729-e2cf-4f14-97a0-361bcdb45b64	a390371e-28a4-43a9-b8e3-befc774011cb	Aarav Pandey	6912028484	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aarav Pandey", "contact_number": "6912028484"}	2026-02-01 03:21:32.116885
7023e4a0-a279-40ab-805b-f9f596765c77	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Prasad	6556350612	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "6556350612"}	2026-02-01 03:21:32.116898
ad6c6bf0-054e-401c-8014-be25c0e7b62f	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Patel	8938342917	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Patel", "contact_number": "8938342917"}	2026-02-01 03:21:32.116911
c01cc131-93cc-4a5b-81cb-b71c2f41030e	a390371e-28a4-43a9-b8e3-befc774011cb	Sneha Roy	6114459232	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Roy", "contact_number": "6114459232"}	2026-02-01 03:21:32.116923
e8436444-fff6-48be-9d2b-09c53ad7e50c	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Bose	6083762817	Champions	PENDING	{"cohort": "Champions", "customer_name": "Neha Bose", "contact_number": "6083762817"}	2026-02-01 03:21:32.116935
991cd424-24a5-475a-82f6-663a08a61a3f	a390371e-28a4-43a9-b8e3-befc774011cb	Krishna Aggarwal	8302819855	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Krishna Aggarwal", "contact_number": "8302819855"}	2026-02-01 03:21:32.116948
d25e216d-2aa0-455c-8c9a-3b7a73594039	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Patel	6481089183	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Patel", "contact_number": "6481089183"}	2026-02-01 03:21:32.116959
bff6c6dc-b7ff-45a3-aa60-c6fe278e9213	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Mukherjee	6528009419	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Mukherjee", "contact_number": "6528009419"}	2026-02-01 03:21:32.116972
7c93a28b-6f00-430e-81ab-25cd317e5d13	a390371e-28a4-43a9-b8e3-befc774011cb	Siddharth Banerjee	8190947434	Lost	PENDING	{"cohort": "Lost", "customer_name": "Siddharth Banerjee", "contact_number": "8190947434"}	2026-02-01 03:21:32.116984
86974975-2d97-4148-9754-7dac1954a215	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Tiwari	8212806224	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ananya Tiwari", "contact_number": "8212806224"}	2026-02-01 03:21:32.116996
a2dcae16-b272-4371-86d8-ecff866071af	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Shetty	9021185687	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mansi Shetty", "contact_number": "9021185687"}	2026-02-01 03:21:32.117008
5f4fcae3-1708-40bf-834f-bf67904b84c1	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Ghosh	9735495313	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Ghosh", "contact_number": "9735495313"}	2026-02-01 03:21:32.117021
f6fcd3fd-d81e-4b4d-ac6f-504d6da27ca8	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Narayan	7082843521	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Narayan", "contact_number": "7082843521"}	2026-02-01 03:21:32.117035
8f399c17-22ce-4777-9af1-9baa88c4f53b	a390371e-28a4-43a9-b8e3-befc774011cb	Isha Sharma	7628909287	Promising	PENDING	{"cohort": "Promising", "customer_name": "Isha Sharma", "contact_number": "7628909287"}	2026-02-01 03:21:32.11705
2f33bf38-22f5-42d0-af98-766489d7e8cf	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Rao	8991237357	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Gaurav Rao", "contact_number": "8991237357"}	2026-02-01 03:21:32.117062
df9ef283-b7fc-470a-a4d5-76f3e0af3edc	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Gowda	8955198434	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Gowda", "contact_number": "8955198434"}	2026-02-01 03:21:32.117082
12b7ab9c-5db2-4932-ba59-9795bfe17626	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Nair	6060436831	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Reyansh Nair", "contact_number": "6060436831"}	2026-02-01 03:21:32.117095
9536e265-d65a-49da-8ada-0a0e4dfc9ba7	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Iyer	8017115307	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aarohi Iyer", "contact_number": "8017115307"}	2026-02-01 03:21:32.117106
e99c0cce-f166-44bf-b749-2b66c8ba1f2c	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Reddy	9533974643	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Sakshi Reddy", "contact_number": "9533974643"}	2026-02-01 03:21:32.117117
ade33e2c-290f-42f0-b8d5-09d8d5ec48de	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Rao	8251361799	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ayush Rao", "contact_number": "8251361799"}	2026-02-01 03:21:32.117129
b0ddb43a-79c9-4424-9f4d-262bdfb2070d	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Saha	9875138661	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Saha", "contact_number": "9875138661"}	2026-02-01 03:21:32.117141
2332f291-0bf6-4a76-8360-863393d4bde2	a390371e-28a4-43a9-b8e3-befc774011cb	Kiara Chaudhary	9172918076	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Kiara Chaudhary", "contact_number": "9172918076"}	2026-02-01 03:21:32.117152
16a30f09-b9d7-467b-b9db-bccf8cee40a7	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Arora	8422021037	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Ira Arora", "contact_number": "8422021037"}	2026-02-01 03:21:32.117163
af515348-437d-4215-a2d2-6ec03990b4df	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Roy	7843514866	Lost	PENDING	{"cohort": "Lost", "customer_name": "Rahul Roy", "contact_number": "7843514866"}	2026-02-01 03:21:32.117176
f767e0b4-9d72-4627-a0e4-eb550bd10636	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Srinivasan	7470021381	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mohit Srinivasan", "contact_number": "7470021381"}	2026-02-01 03:21:32.117188
7c92df1f-e5c4-4fb7-8c6a-8f18bb6c82b0	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Bose	6580564091	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Pallavi Bose", "contact_number": "6580564091"}	2026-02-01 03:21:32.117199
0a9f233a-5baf-4ba6-8fbc-1240b3ad9c34	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Deshmukh	9112167722	Champions	PENDING	{"cohort": "Champions", "customer_name": "Neha Deshmukh", "contact_number": "9112167722"}	2026-02-01 03:21:32.117213
09b26dc4-4faa-41e1-aae8-6896883b7ba1	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Mehta	7035400086	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Aarohi Mehta", "contact_number": "7035400086"}	2026-02-01 03:21:32.117227
7ebd7882-24ba-4e35-b823-955b0bb464ed	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Srinivasan	9101208334	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sai Srinivasan", "contact_number": "9101208334"}	2026-02-01 03:21:32.117241
2a9403a9-45b8-4ec7-b788-eb8b2b003429	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Saha	8051834242	Lost	PENDING	{"cohort": "Lost", "customer_name": "Manav Saha", "contact_number": "8051834242"}	2026-02-01 03:21:32.117254
2e87e5c9-7ba8-4a60-b7fd-6cf9efed3570	a390371e-28a4-43a9-b8e3-befc774011cb	Aditya Sharma	8516068472	Lost	PENDING	{"cohort": "Lost", "customer_name": "Aditya Sharma", "contact_number": "8516068472"}	2026-02-01 03:21:32.117267
d3773e6d-71ac-46aa-8fe5-c00ad784f95c	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Bajaj	6884584840	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Rahul Bajaj", "contact_number": "6884584840"}	2026-02-01 03:21:32.117279
e7528bf8-16e5-4669-bdc0-26e0d3e5c2c2	a390371e-28a4-43a9-b8e3-befc774011cb	Krishna Srinivasan	6598661719	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Krishna Srinivasan", "contact_number": "6598661719"}	2026-02-01 03:21:32.117292
2d2bc012-545e-4579-aee7-29f7e3937a66	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Singh	7814949682	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarohi Singh", "contact_number": "7814949682"}	2026-02-01 03:21:32.117304
b3d5e5de-2752-46f6-bf66-647ad11157e2	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Tiwari	6055859075	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ayush Tiwari", "contact_number": "6055859075"}	2026-02-01 03:21:32.117317
7443dc8b-24e7-4dc8-a7aa-8ec5b54225b1	a390371e-28a4-43a9-b8e3-befc774011cb	Pooja Arora	9115591177	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Pooja Arora", "contact_number": "9115591177"}	2026-02-01 03:21:32.11733
33dffa3d-f9a3-47c2-b0eb-cbdd87fc3e57	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Rao	8826541466	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Manav Rao", "contact_number": "8826541466"}	2026-02-01 03:21:32.117342
b617dca8-989a-42c9-b8c6-1616eebb8451	a390371e-28a4-43a9-b8e3-befc774011cb	Aarav Iyer	9083279808	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aarav Iyer", "contact_number": "9083279808"}	2026-02-01 03:21:32.117353
9e0a083f-3e27-43b0-860b-0b37e93a055d	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Bhat	8388692377	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Arjun Bhat", "contact_number": "8388692377"}	2026-02-01 03:21:32.117365
16d0482a-092a-4968-b5af-16e9f3e8d37d	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Menon	8246128778	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Menon", "contact_number": "8246128778"}	2026-02-01 03:21:32.117377
81037be9-18a0-4076-8c12-daa0adb0834f	a390371e-28a4-43a9-b8e3-befc774011cb	Sneha Gupta	6513518801	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Gupta", "contact_number": "6513518801"}	2026-02-01 03:21:32.117388
fc92112c-e294-4fa6-9d94-7d8201f9340f	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Kapoor	7824972856	Champions	PENDING	{"cohort": "Champions", "customer_name": "Mansi Kapoor", "contact_number": "7824972856"}	2026-02-01 03:21:32.1174
a2148f96-cd9e-4163-b8a6-7a1b2e0204bc	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Rao	6624494538	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Rao", "contact_number": "6624494538"}	2026-02-01 03:21:32.117412
45f21e7e-db20-44e3-ad8a-f89820b15dc5	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Mishra	8762315986	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ishaan Mishra", "contact_number": "8762315986"}	2026-02-01 03:21:32.117423
198c76c6-8adb-466b-91d2-071610723b75	a390371e-28a4-43a9-b8e3-befc774011cb	Krishna Gupta	7240770966	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Krishna Gupta", "contact_number": "7240770966"}	2026-02-01 03:21:32.117435
9b306714-4681-4510-afde-a8967b15ccc3	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Kapoor	6269772884	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Kapoor", "contact_number": "6269772884"}	2026-02-01 03:21:32.117446
2dbcb758-8b62-4783-951b-be0741adb616	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Gupta	7468315683	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Nandini Gupta", "contact_number": "7468315683"}	2026-02-01 03:21:32.117458
6ad10872-3bb7-4df9-8d4a-0f7c771e664c	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Aggarwal	8210968278	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nandini Aggarwal", "contact_number": "8210968278"}	2026-02-01 03:21:32.11747
30c65761-e54c-48f1-9c35-260b54a76644	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Hegde	8152088431	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Ira Hegde", "contact_number": "8152088431"}	2026-02-01 03:21:32.117634
f197895f-d0e0-4630-b74e-ba69c04d1316	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Gowda	6692430751	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Saanvi Gowda", "contact_number": "6692430751"}	2026-02-01 03:21:32.117649
57a13bdb-e5bc-4ba4-9fbd-ceac5c8205f5	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Aggarwal	7664933165	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Reyansh Aggarwal", "contact_number": "7664933165"}	2026-02-01 03:21:32.117661
c4d991e8-ee7d-42a1-b91a-bba5e6d73864	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Rao	8012871630	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Dhruv Rao", "contact_number": "8012871630"}	2026-02-01 03:21:32.117674
cbb1a3af-24e4-43f4-b60b-ec46f93b3e96	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Tripathi	8284835410	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sakshi Tripathi", "contact_number": "8284835410"}	2026-02-01 03:21:32.117686
ac3b00b6-9e69-4049-93bf-0943d44e6887	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Gill	6411654819	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Gill", "contact_number": "6411654819"}	2026-02-01 03:21:32.117697
0abb1cde-9731-454f-81d7-c1f1f7776d97	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Mukherjee	8459437746	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ishaan Mukherjee", "contact_number": "8459437746"}	2026-02-01 03:21:32.117709
f2ffaacf-28a7-4293-8cd7-bfb2d7d8abbb	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Singh	7304275177	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Trisha Singh", "contact_number": "7304275177"}	2026-02-01 03:21:32.11772
ded83f4e-0fc3-477e-ab8e-58145b1bb165	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Khan	7664930130	Promising	PENDING	{"cohort": "Promising", "customer_name": "Avni Khan", "contact_number": "7664930130"}	2026-02-01 03:21:32.117732
ee377070-1f74-4e0a-b690-b52987770f41	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Tripathi	8750072831	Promising	PENDING	{"cohort": "Promising", "customer_name": "Sakshi Tripathi", "contact_number": "8750072831"}	2026-02-01 03:21:32.117744
db4c5ec4-e258-4ef3-b5ea-fbb76a4204ce	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Khan	8182275389	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Vivaan Khan", "contact_number": "8182275389"}	2026-02-01 03:21:32.117756
983ff6de-f9d3-4d33-b55e-32e77ee97833	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Bansal	8947198029	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ayush Bansal", "contact_number": "8947198029"}	2026-02-01 03:21:32.117767
8870aed5-bcdb-48a1-b7ff-3044d9c50648	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Tripathi	7751360825	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Tanvi Tripathi", "contact_number": "7751360825"}	2026-02-01 03:21:32.117778
2797da78-bdd9-4b30-9c7a-092e4ff588bb	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Gowda	6501801412	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Avni Gowda", "contact_number": "6501801412"}	2026-02-01 03:21:32.117789
4fdcb9f8-6cbc-4c3c-a3b0-f05833442e5b	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Gill	7260415674	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Trisha Gill", "contact_number": "7260415674"}	2026-02-01 03:21:32.117801
71c2887e-88af-4143-ac95-ffcd7d2d9f54	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Mukherjee	6562746789	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Mukherjee", "contact_number": "6562746789"}	2026-02-01 03:21:32.117812
86dcda3d-0342-4f18-980b-5540d3fd14a9	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Singh	8720429306	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Anika Singh", "contact_number": "8720429306"}	2026-02-01 03:21:32.117824
ed242ea8-9518-4a48-8936-e0b0bc21e3d9	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Bhat	6861057122	Champions	PENDING	{"cohort": "Champions", "customer_name": "Tanvi Bhat", "contact_number": "6861057122"}	2026-02-01 03:21:32.117835
3c4b7ae6-1baa-47f7-96e8-63a3d2c6e03e	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Malhotra	8208883641	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Malhotra", "contact_number": "8208883641"}	2026-02-01 03:21:32.117846
368f524e-c880-4747-977c-cf047d4c955a	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Gupta	6016389273	Champions	PENDING	{"cohort": "Champions", "customer_name": "Trisha Gupta", "contact_number": "6016389273"}	2026-02-01 03:21:32.117857
b1819d42-c371-442b-8710-268665f0a20a	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Kulkarni	8149238767	Promising	PENDING	{"cohort": "Promising", "customer_name": "Pallavi Kulkarni", "contact_number": "8149238767"}	2026-02-01 03:21:32.117869
284145f7-5a5b-43b1-918b-87ca2c5175ad	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Das	6179819454	Promising	PENDING	{"cohort": "Promising", "customer_name": "Myra Das", "contact_number": "6179819454"}	2026-02-01 03:21:32.11788
2a800b44-c13b-4fb6-bb3e-2454695f2dfd	a390371e-28a4-43a9-b8e3-befc774011cb	Rashmi Pandey	9768878448	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Pandey", "contact_number": "9768878448"}	2026-02-01 03:21:32.117893
f33680ae-7f31-4253-9482-0d85e52f5ad8	a390371e-28a4-43a9-b8e3-befc774011cb	Kunal Ghosh	9023767559	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Kunal Ghosh", "contact_number": "9023767559"}	2026-02-01 03:21:32.117904
29178d41-b40c-4e91-82d3-27ed5bc60ec9	a390371e-28a4-43a9-b8e3-befc774011cb	Rashmi Chatterjee	8566474661	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rashmi Chatterjee", "contact_number": "8566474661"}	2026-02-01 03:21:32.117915
5e5d421c-546f-4436-9a85-622d95bdcbd3	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Verma	6095441733	Champions	PENDING	{"cohort": "Champions", "customer_name": "Myra Verma", "contact_number": "6095441733"}	2026-02-01 03:21:32.117927
f958f285-ab98-4ec6-b534-f8a9907c15a8	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Das	8026424848	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Gaurav Das", "contact_number": "8026424848"}	2026-02-01 03:21:32.117939
1807a90d-ed2d-4b74-abc4-b15f3dfadd3e	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Bansal	9397040587	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Arnav Bansal", "contact_number": "9397040587"}	2026-02-01 03:21:32.11795
996507c3-2d0b-4208-9f57-c72d82b0e129	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Patel	8856438883	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Patel", "contact_number": "8856438883"}	2026-02-01 03:21:32.117962
a9902769-32b1-4d4f-ae93-2d4d444bf9c5	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Saha	9734060367	Promising	PENDING	{"cohort": "Promising", "customer_name": "Dhruv Saha", "contact_number": "9734060367"}	2026-02-01 03:21:32.117973
081e5dba-78fa-4ae7-b747-c7020a18f6d7	a390371e-28a4-43a9-b8e3-befc774011cb	Kunal Narayan	8701177161	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Kunal Narayan", "contact_number": "8701177161"}	2026-02-01 03:21:32.117985
8ba7a446-1e92-44bb-8c17-5ec836ae3f6f	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Saxena	9281370661	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Neha Saxena", "contact_number": "9281370661"}	2026-02-01 03:21:32.117996
b5caca76-29d4-4a08-bbee-f8d21a270802	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Shetty	9455907545	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Mohit Shetty", "contact_number": "9455907545"}	2026-02-01 03:21:32.118008
0f4924e7-b765-47e1-b02e-97e07edd3a45	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Verma	7618166384	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rahul Verma", "contact_number": "7618166384"}	2026-02-01 03:21:32.118168
9c52a4e5-6ba7-4951-a2bf-75748f773c9d	a390371e-28a4-43a9-b8e3-befc774011cb	Ayaan Bose	7299414772	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ayaan Bose", "contact_number": "7299414772"}	2026-02-01 03:21:32.11821
89cb51eb-19cd-4f86-93b9-2b0baf690d97	a390371e-28a4-43a9-b8e3-befc774011cb	Aadhya Yadav	8796262369	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aadhya Yadav", "contact_number": "8796262369"}	2026-02-01 03:21:32.118223
31db8ddf-db1c-49ad-b1df-f8894abc76fa	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Gupta	7563134564	Promising	PENDING	{"cohort": "Promising", "customer_name": "Aarohi Gupta", "contact_number": "7563134564"}	2026-02-01 03:21:32.118238
f90c3852-12bb-49d4-a72a-af0f5ecc9c06	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Chaudhary	8840130027	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Reyansh Chaudhary", "contact_number": "8840130027"}	2026-02-01 03:21:32.118494
6adc6adf-dd56-4f9e-ad15-8a18ae4c03c3	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Aggarwal	8610725346	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Aggarwal", "contact_number": "8610725346"}	2026-02-01 03:21:32.118561
1f81d19c-48af-47c1-b684-289e5fdcb9d9	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Jain	7752772693	Lost	PENDING	{"cohort": "Lost", "customer_name": "Dev Jain", "contact_number": "7752772693"}	2026-02-01 03:21:32.118577
481ee551-0092-4921-a50f-9f1a53b6675c	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Chaudhary	8907288426	Promising	PENDING	{"cohort": "Promising", "customer_name": "Manav Chaudhary", "contact_number": "8907288426"}	2026-02-01 03:21:32.11859
38201980-a2c2-4188-83f6-a18a939d5899	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Iyer	8756792161	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Neha Iyer", "contact_number": "8756792161"}	2026-02-01 03:21:32.118602
23f015f3-c718-466a-b5c4-ff6ffeec8434	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Prasad	7710221804	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Prasad", "contact_number": "7710221804"}	2026-02-01 03:21:32.118615
34b5ddbd-0856-4355-8d97-bfafe8ee9057	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Bose	7095768375	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Diya Bose", "contact_number": "7095768375"}	2026-02-01 03:21:32.118634
722155e1-1640-4dcc-ab59-5055b8aa7b19	a390371e-28a4-43a9-b8e3-befc774011cb	Aditya Arora	6732105450	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aditya Arora", "contact_number": "6732105450"}	2026-02-01 03:21:32.118647
671326ee-9420-4501-b060-b9ca3c0fbd9e	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Sharma	7863296457	Champions	PENDING	{"cohort": "Champions", "customer_name": "Manav Sharma", "contact_number": "7863296457"}	2026-02-01 03:21:32.118661
7900bef3-35c2-404b-b12e-484f3ee7e019	a390371e-28a4-43a9-b8e3-befc774011cb	Isha Shetty	6132692083	Champions	PENDING	{"cohort": "Champions", "customer_name": "Isha Shetty", "contact_number": "6132692083"}	2026-02-01 03:21:32.118673
af982575-c307-4f34-b6c4-fbf15709ff81	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Kaur	6352983840	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mohit Kaur", "contact_number": "6352983840"}	2026-02-01 03:21:32.118684
eda57d9b-a344-407c-9086-b498f3fe31f9	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Gill	7300975626	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ayush Gill", "contact_number": "7300975626"}	2026-02-01 03:21:32.118696
249ff509-7c19-4cee-b0d0-4b0dfdd79e1a	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Das	7841579769	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Gaurav Das", "contact_number": "7841579769"}	2026-02-01 03:21:32.118708
8172e200-eb42-4851-931e-d8f9a2c8e3fa	a390371e-28a4-43a9-b8e3-befc774011cb	Siddharth Mishra	7070012089	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Siddharth Mishra", "contact_number": "7070012089"}	2026-02-01 03:21:32.11872
db986cb2-7916-4bc8-ae2f-278e742d8f41	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Gowda	9364065667	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arjun Gowda", "contact_number": "9364065667"}	2026-02-01 03:21:32.118731
ba48295e-37dd-48d7-8787-3cef41b60ef7	a390371e-28a4-43a9-b8e3-befc774011cb	Anvi Bansal	6709173074	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anvi Bansal", "contact_number": "6709173074"}	2026-02-01 03:21:32.118743
a296d7d3-8403-4989-b16e-ed9eaca9cf19	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Jain	9801277826	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Jain", "contact_number": "9801277826"}	2026-02-01 03:21:32.118755
016b78b5-2d3a-4dc6-88cc-9c65aaed629f	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Iyer	8697739551	Promising	PENDING	{"cohort": "Promising", "customer_name": "Gaurav Iyer", "contact_number": "8697739551"}	2026-02-01 03:21:32.118766
a380e68e-b14f-4553-8711-ccdb49fec6ac	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Ghosh	6535027729	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Dev Ghosh", "contact_number": "6535027729"}	2026-02-01 03:21:32.118778
de25ba47-8c2f-4129-ab76-d8e4761456f8	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Ghosh	7128117889	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Ghosh", "contact_number": "7128117889"}	2026-02-01 03:21:32.11879
46312b6b-53ea-4251-9a4a-e5b5d2d2423d	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Tripathi	9606215936	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Tripathi", "contact_number": "9606215936"}	2026-02-01 03:21:32.118802
e20da69d-c87a-483d-9df6-914b4133c8a0	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Saxena	7169346355	Lost	PENDING	{"cohort": "Lost", "customer_name": "Rohan Saxena", "contact_number": "7169346355"}	2026-02-01 03:21:32.118814
80026d12-1abb-40d0-a75c-cb10911f75b2	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Banerjee	8891377623	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Harsh Banerjee", "contact_number": "8891377623"}	2026-02-01 03:21:32.118826
35745aa6-e0eb-49a4-8667-05a20fb06544	a390371e-28a4-43a9-b8e3-befc774011cb	Pooja Nair	8843351688	Promising	PENDING	{"cohort": "Promising", "customer_name": "Pooja Nair", "contact_number": "8843351688"}	2026-02-01 03:21:32.118838
d836c11b-1094-4b7e-93f6-b0a6b477d0e6	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Tripathi	7817678868	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Diya Tripathi", "contact_number": "7817678868"}	2026-02-01 03:21:32.11885
4170cbad-5100-471c-997d-bca2328c2a36	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Malhotra	9720285613	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Gaurav Malhotra", "contact_number": "9720285613"}	2026-02-01 03:21:32.118861
0bcc0b89-733c-42b8-abe3-5b9409e6aabe	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Gill	8150302996	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mohit Gill", "contact_number": "8150302996"}	2026-02-01 03:21:32.118873
428e2771-b0f4-4a3d-b47e-b153a286a1c2	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Khan	7419697432	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Khan", "contact_number": "7419697432"}	2026-02-01 03:21:32.118885
c143d36e-e15f-451f-a386-ebc2d0f7f28d	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Prasad	9222657398	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Aditi Prasad", "contact_number": "9222657398"}	2026-02-01 03:21:32.118897
5996709c-f3b5-4188-ba7c-8251711849b2	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Saxena	6937588251	Champions	PENDING	{"cohort": "Champions", "customer_name": "Meera Saxena", "contact_number": "6937588251"}	2026-02-01 03:21:32.118908
a871e474-5cdf-47a3-860d-1caf1bfc73b3	a390371e-28a4-43a9-b8e3-befc774011cb	Pooja Sharma	9368539538	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Pooja Sharma", "contact_number": "9368539538"}	2026-02-01 03:21:32.11892
dc7b8c61-33c0-4fcf-b8bf-12371f301618	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Banerjee	9780842521	Champions	PENDING	{"cohort": "Champions", "customer_name": "Meera Banerjee", "contact_number": "9780842521"}	2026-02-01 03:21:32.118932
73e25a7f-b107-48a3-9cad-697c1c0d84d2	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Mishra	7371287442	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Mishra", "contact_number": "7371287442"}	2026-02-01 03:21:32.118943
e614aca9-d00e-4e86-9cbd-c701ed261334	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Yadav	7642151581	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Tanvi Yadav", "contact_number": "7642151581"}	2026-02-01 03:21:32.118955
5758d715-d23d-432d-b2c5-77e566c8a56f	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Narayan	7219550762	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Naina Narayan", "contact_number": "7219550762"}	2026-02-01 03:21:32.118966
b61b34be-b393-4913-b288-a3433dc67c9d	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Pandey	6264424157	Promising	PENDING	{"cohort": "Promising", "customer_name": "Rohan Pandey", "contact_number": "6264424157"}	2026-02-01 03:21:32.118978
e1e37699-6c05-4155-90fd-438ce13a1e92	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Tiwari	8169503105	Champions	PENDING	{"cohort": "Champions", "customer_name": "Yash Tiwari", "contact_number": "8169503105"}	2026-02-01 03:21:32.118989
6b2cf8b3-74d5-46f0-af3e-084d02d4f4ac	a390371e-28a4-43a9-b8e3-befc774011cb	Mohit Roy	9861958570	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mohit Roy", "contact_number": "9861958570"}	2026-02-01 03:21:32.119001
bb1ddc1a-37b1-4118-9ebf-c64f65c72480	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Kulkarni	7950964486	Promising	PENDING	{"cohort": "Promising", "customer_name": "Neha Kulkarni", "contact_number": "7950964486"}	2026-02-01 03:21:32.119012
b62ef39d-cb30-4a79-b923-4ebaedbe48f9	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Gill	9287357760	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Tanvi Gill", "contact_number": "9287357760"}	2026-02-01 03:21:32.119024
c31a7093-5489-43ca-8cfe-f7d2daec5b30	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Gowda	7279055207	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ananya Gowda", "contact_number": "7279055207"}	2026-02-01 03:21:32.119036
df2b7c16-7c73-4d89-a465-3aa6a01d87b1	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Banerjee	6510663316	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Sai Banerjee", "contact_number": "6510663316"}	2026-02-01 03:21:32.119047
5115700f-fe11-4d5e-80cf-17c50f2456f6	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Gowda	8255693255	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Neha Gowda", "contact_number": "8255693255"}	2026-02-01 03:21:32.119059
d9de8850-c68e-427e-a182-3d80286a4b88	a390371e-28a4-43a9-b8e3-befc774011cb	Sameer Thakur	7352337786	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sameer Thakur", "contact_number": "7352337786"}	2026-02-01 03:21:32.11907
2368d524-1bb1-410e-b497-70cebcd6e13f	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Shah	7461243567	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rahul Shah", "contact_number": "7461243567"}	2026-02-01 03:21:32.119081
dec2a350-d650-440a-85ed-cae36983b90b	a390371e-28a4-43a9-b8e3-befc774011cb	Rashmi Sood	7368846023	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rashmi Sood", "contact_number": "7368846023"}	2026-02-01 03:21:32.119093
89f43504-b0b5-4bad-a66c-ad0c1fb29cf7	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Hegde	6794629071	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Saanvi Hegde", "contact_number": "6794629071"}	2026-02-01 03:21:32.119104
ec9fa534-28e5-4fbf-8092-f2e222b61ce5	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Chatterjee	9426820552	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Chatterjee", "contact_number": "9426820552"}	2026-02-01 03:21:32.119181
24ca65cf-fce8-46d5-8c8b-76b6ea6084a5	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Das	7636902364	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Avni Das", "contact_number": "7636902364"}	2026-02-01 03:21:32.119218
18840652-934e-4da0-a110-10bd6d73ea6a	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Verma	7570028939	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ishaan Verma", "contact_number": "7570028939"}	2026-02-01 03:21:32.119232
c091276b-f10d-47a6-856b-0fc6455b4cc8	a390371e-28a4-43a9-b8e3-befc774011cb	Aditya Mukherjee	8294401555	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Aditya Mukherjee", "contact_number": "8294401555"}	2026-02-01 03:21:32.119246
afb5b5a7-8082-4ac9-98e3-3d03c6af7553	a390371e-28a4-43a9-b8e3-befc774011cb	Priya Thakur	8989885695	Champions	PENDING	{"cohort": "Champions", "customer_name": "Priya Thakur", "contact_number": "8989885695"}	2026-02-01 03:21:32.119258
cf7c2d36-8a66-47bc-984d-56822da0cda1	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Bajaj	7794450106	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Bajaj", "contact_number": "7794450106"}	2026-02-01 03:21:32.119295
aeae0b62-12a7-473f-8619-17974dfe1e5c	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Pandey	7623950820	Champions	PENDING	{"cohort": "Champions", "customer_name": "Arjun Pandey", "contact_number": "7623950820"}	2026-02-01 03:21:32.11932
4afb26c5-57a5-4388-b648-d3c712394e80	a390371e-28a4-43a9-b8e3-befc774011cb	Kabir Srinivasan	8094382969	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Kabir Srinivasan", "contact_number": "8094382969"}	2026-02-01 03:21:32.119334
fc82b485-51ce-41df-8835-8cfb3fb66b3c	a390371e-28a4-43a9-b8e3-befc774011cb	Kavya Das	9722228837	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kavya Das", "contact_number": "9722228837"}	2026-02-01 03:21:32.119347
094cdd72-51f7-49ad-b2c5-598b96570b63	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Bhat	6966675046	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Bhat", "contact_number": "6966675046"}	2026-02-01 03:21:32.119359
17a144ab-98aa-4dbf-98d5-6b71f4cfb740	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Deshmukh	9885217537	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Varun Deshmukh", "contact_number": "9885217537"}	2026-02-01 03:21:32.119371
e379cd50-32e4-49db-bdd9-1852ab7a33e4	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Mukherjee	7074553619	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Arnav Mukherjee", "contact_number": "7074553619"}	2026-02-01 03:21:32.119384
6562f20f-9e53-42ea-92b2-4b873eeb5f62	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Narayan	9306313812	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ishaan Narayan", "contact_number": "9306313812"}	2026-02-01 03:21:32.119397
c66e3fd3-a662-4461-88f9-8bd1ad7f8461	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Sharma	8463427382	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Sharma", "contact_number": "8463427382"}	2026-02-01 03:21:32.11941
7afd909e-1a1e-46e1-a11e-cd4b00369d64	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Sood	7596878581	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Sood", "contact_number": "7596878581"}	2026-02-01 03:21:32.119421
97d3edda-f0d8-4d58-af19-37aef15628fc	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Bajaj	7404186534	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Trisha Bajaj", "contact_number": "7404186534"}	2026-02-01 03:21:32.119433
c16dea9c-aec2-450b-80c8-0e2e90c9a8a4	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Reddy	8553608464	Lost	PENDING	{"cohort": "Lost", "customer_name": "Sakshi Reddy", "contact_number": "8553608464"}	2026-02-01 03:21:32.119445
8148ccbd-d7d9-4ea7-b6be-ebe173b7731e	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Mishra	8235834366	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Dhruv Mishra", "contact_number": "8235834366"}	2026-02-01 03:21:32.119456
06eae3cf-d6b5-46bf-842e-21a465ce8c62	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Khan	7923574064	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Myra Khan", "contact_number": "7923574064"}	2026-02-01 03:21:32.119468
415cab3b-3a7a-4324-9984-30f77ed5ff3d	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Bhat	7869464903	Champions	PENDING	{"cohort": "Champions", "customer_name": "Avni Bhat", "contact_number": "7869464903"}	2026-02-01 03:21:32.119479
4f6372d0-3522-4980-94a5-136f02b5ed4e	a390371e-28a4-43a9-b8e3-befc774011cb	Isha Pandey	8322624835	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Isha Pandey", "contact_number": "8322624835"}	2026-02-01 03:21:32.119491
e79b51a5-c683-4232-83b1-735060b6638d	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Rao	9410769701	Champions	PENDING	{"cohort": "Champions", "customer_name": "Vihaan Rao", "contact_number": "9410769701"}	2026-02-01 03:21:32.119503
602eee25-692a-4500-af4e-b41e8c1143b9	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Iyer	6094075916	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Iyer", "contact_number": "6094075916"}	2026-02-01 03:21:32.119515
59ff34c0-86eb-4bb7-afa4-2c56bb170bfe	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Nair	6683226180	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Nikhil Nair", "contact_number": "6683226180"}	2026-02-01 03:21:32.119527
b82d060d-3283-4fd8-99fb-b06b08c9bec1	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Pandey	8834952496	Champions	PENDING	{"cohort": "Champions", "customer_name": "Avni Pandey", "contact_number": "8834952496"}	2026-02-01 03:21:32.119539
5e0d67e6-f7b9-4a8e-9b32-6d57977ffc92	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Naik	7547846594	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Gaurav Naik", "contact_number": "7547846594"}	2026-02-01 03:21:32.119551
6b157a7b-0e1c-4928-85f1-9c58ae8d4bf4	a390371e-28a4-43a9-b8e3-befc774011cb	Pooja Chaudhary	7843230883	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Pooja Chaudhary", "contact_number": "7843230883"}	2026-02-01 03:21:32.119562
528bed07-423b-4182-b4e9-239eee898c13	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Sood	9564727757	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Sood", "contact_number": "9564727757"}	2026-02-01 03:21:32.119573
efa813b8-436c-4677-bf1b-dfe8f9124332	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Tiwari	8184276820	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nandini Tiwari", "contact_number": "8184276820"}	2026-02-01 03:21:32.119585
afba79af-4bed-40ce-9683-7f71ec676515	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Kaur	7576626521	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Kaur", "contact_number": "7576626521"}	2026-02-01 03:21:32.119596
50d96e28-0171-4882-ba92-083ec36d9573	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Joshi	6126626100	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Nandini Joshi", "contact_number": "6126626100"}	2026-02-01 03:21:32.119607
1dadd2d7-64fc-4f03-bf3f-9da135bd2d11	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Rao	6112772143	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Manav Rao", "contact_number": "6112772143"}	2026-02-01 03:21:32.119618
34cb1a64-4543-49ce-be7a-4873b0f25b6d	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Singh	8743600712	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Yash Singh", "contact_number": "8743600712"}	2026-02-01 03:21:32.119629
65fef4d0-cddf-4a45-bcc5-0c34788f5965	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Kulkarni	9041888172	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Ayush Kulkarni", "contact_number": "9041888172"}	2026-02-01 03:21:32.11964
1ec39dff-310c-47e0-8ddc-9a55f5149985	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Bose	9291706239	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Yash Bose", "contact_number": "9291706239"}	2026-02-01 03:21:32.119652
2edd5270-2425-4b04-bbbc-e524c648a721	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Mukherjee	8177514230	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Parth Mukherjee", "contact_number": "8177514230"}	2026-02-01 03:21:32.119663
8d88979d-c917-44d5-b7bd-a82373f270de	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Srinivasan	7924075329	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Mansi Srinivasan", "contact_number": "7924075329"}	2026-02-01 03:21:32.119674
841143b6-36af-4343-a66c-90607d07c463	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Bajaj	9617246397	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Anika Bajaj", "contact_number": "9617246397"}	2026-02-01 03:21:32.119686
c51b6adf-c7ac-4dbc-b9a6-ee5cd227d4df	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Naik	6067712977	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Dhruv Naik", "contact_number": "6067712977"}	2026-02-01 03:21:32.119697
0ceded95-0a33-4969-8c36-df58b06fe56c	a390371e-28a4-43a9-b8e3-befc774011cb	Riya Srinivasan	9703720755	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Srinivasan", "contact_number": "9703720755"}	2026-02-01 03:21:32.119708
110710d5-46ee-4b25-834e-f9354364d5ce	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Saha	9113728950	Lost	PENDING	{"cohort": "Lost", "customer_name": "Saanvi Saha", "contact_number": "9113728950"}	2026-02-01 03:21:32.128354
cdef2f15-d72e-430c-a670-6353b1c60400	a390371e-28a4-43a9-b8e3-befc774011cb	Yash Patel	7485475786	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Yash Patel", "contact_number": "7485475786"}	2026-02-01 03:21:32.128427
ddf4df17-1b5a-49a8-a1c1-e93425edf706	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Banerjee	8727653545	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ritvik Banerjee", "contact_number": "8727653545"}	2026-02-01 03:21:32.12845
fc431312-d8db-40c4-af09-3d54b3554c60	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Saha	8361508182	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Saanvi Saha", "contact_number": "8361508182"}	2026-02-01 03:21:32.128469
77efccd5-6308-41b2-aa4c-afa2d4c5a6d1	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Jain	9106346502	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rahul Jain", "contact_number": "9106346502"}	2026-02-01 03:21:32.128487
3727a7ab-66fc-4704-804f-4d142dc75847	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Shetty	6096984637	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Nandini Shetty", "contact_number": "6096984637"}	2026-02-01 03:21:32.129303
0af878fa-bdd3-48c5-9918-711b1710b571	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Nair	9870657802	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Sai Nair", "contact_number": "9870657802"}	2026-02-01 03:21:32.129343
c5eec4c5-5cc6-42e4-b70a-980059df3185	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Chatterjee	6123165955	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ishaan Chatterjee", "contact_number": "6123165955"}	2026-02-01 03:21:32.130295
821f954c-9cdf-4919-881b-8248b041c4ab	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Bhat	6756741755	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Bhat", "contact_number": "6756741755"}	2026-02-01 03:21:32.130579
1a8d06df-23a5-4a4c-86bf-1c2ff7c12c92	a390371e-28a4-43a9-b8e3-befc774011cb	Ishaan Arora	7559959846	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ishaan Arora", "contact_number": "7559959846"}	2026-02-01 03:21:32.130602
2c9e302b-3d91-46c7-b3ea-6ea93bdc2869	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Patel	8652792943	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ira Patel", "contact_number": "8652792943"}	2026-02-01 03:21:32.130621
20c78b22-2bd3-49f2-ad52-05591c29ace5	a390371e-28a4-43a9-b8e3-befc774011cb	Kabir Tripathi	6955933280	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Kabir Tripathi", "contact_number": "6955933280"}	2026-02-01 03:21:32.130646
7d960af3-221a-438b-bcfe-a3d39adcf364	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Shetty	8955504128	Promising	PENDING	{"cohort": "Promising", "customer_name": "Rahul Shetty", "contact_number": "8955504128"}	2026-02-01 03:21:32.130662
21025826-ea54-4054-9a96-e599a232f7bc	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Tripathi	7280397771	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Tripathi", "contact_number": "7280397771"}	2026-02-01 03:21:32.130678
f75d3061-b6b2-47fe-b2ed-df1e4665375c	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Roy	6537500738	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vihaan Roy", "contact_number": "6537500738"}	2026-02-01 03:21:32.130695
3087b148-9f05-4c14-a7bc-9f306c74412f	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Tripathi	9917789660	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Mansi Tripathi", "contact_number": "9917789660"}	2026-02-01 03:21:32.130813
a81c3576-3ba6-468d-8d76-454dd2e14946	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Bajaj	6353616997	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Varun Bajaj", "contact_number": "6353616997"}	2026-02-01 03:21:32.130836
ddd85432-bb18-42c4-b96d-f2f05c0a13c7	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Bhat	6223105030	Champions	PENDING	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6223105030"}	2026-02-01 03:21:32.130855
3f79832a-13dc-4d3f-89ef-529d7bf60dff	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Sood	9711546167	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vivaan Sood", "contact_number": "9711546167"}	2026-02-01 03:21:32.130877
39f0bd50-e7d7-4b38-a2b3-66d85bb2da75	a390371e-28a4-43a9-b8e3-befc774011cb	Kavya Malhotra	7224651431	Champions	PENDING	{"cohort": "Champions", "customer_name": "Kavya Malhotra", "contact_number": "7224651431"}	2026-02-01 03:21:32.130896
c3c32be1-d9bf-4b0f-8ca4-4c1de9295ed0	a390371e-28a4-43a9-b8e3-befc774011cb	Priya Sharma	8503969410	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Priya Sharma", "contact_number": "8503969410"}	2026-02-01 03:21:32.130914
f236eeb8-d8c5-48a2-8a58-4f7c8f990603	a390371e-28a4-43a9-b8e3-befc774011cb	Kunal Ghosh	7137810998	Lost	PENDING	{"cohort": "Lost", "customer_name": "Kunal Ghosh", "contact_number": "7137810998"}	2026-02-01 03:21:32.130932
e1f862cc-9790-4afc-b7ef-3ea185663ae0	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Malhotra	8061402525	Lost	PENDING	{"cohort": "Lost", "customer_name": "Parth Malhotra", "contact_number": "8061402525"}	2026-02-01 03:21:32.130952
38e1d656-d72a-4109-a470-06686820b8b9	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Tripathi	8569663952	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "8569663952"}	2026-02-01 03:21:32.130972
e5984e3f-dc6a-48f9-bb00-c432a6d4b540	a390371e-28a4-43a9-b8e3-befc774011cb	Sneha Gill	6276060328	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Sneha Gill", "contact_number": "6276060328"}	2026-02-01 03:21:32.130991
60168cd9-d699-42fd-a1c2-4db7fd8b6b51	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Shetty	8808623903	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Ayush Shetty", "contact_number": "8808623903"}	2026-02-01 03:21:32.131202
69aac69a-f277-4fd5-8469-5a6855fab4d5	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Chaudhary	6154902533	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Avni Chaudhary", "contact_number": "6154902533"}	2026-02-01 03:21:32.131248
6546365d-fc8f-4a74-b914-7bc68af0df36	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Chatterjee	7063399202	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Chatterjee", "contact_number": "7063399202"}	2026-02-01 03:21:32.131269
af446ba3-0f55-4602-a9e7-882bafffa9de	a390371e-28a4-43a9-b8e3-befc774011cb	Riya Chatterjee	9880521860	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Riya Chatterjee", "contact_number": "9880521860"}	2026-02-01 03:21:32.131287
997718ee-6d8a-411b-ae12-73173ee6544c	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Mishra	9568645436	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Anika Mishra", "contact_number": "9568645436"}	2026-02-01 03:21:32.131303
e3fb91e7-b458-4646-975d-c4cde9b75bb7	a390371e-28a4-43a9-b8e3-befc774011cb	Riya Verma	9521588375	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Riya Verma", "contact_number": "9521588375"}	2026-02-01 03:21:32.13132
d42163b9-b46f-4f8d-b90a-21e9b3a8e444	a390371e-28a4-43a9-b8e3-befc774011cb	Varun Bansal	7497651057	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Varun Bansal", "contact_number": "7497651057"}	2026-02-01 03:21:32.131336
9da0775e-b546-43a1-b109-baf0e7812f1c	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Hegde	7387784449	Champions	PENDING	{"cohort": "Champions", "customer_name": "Gaurav Hegde", "contact_number": "7387784449"}	2026-02-01 03:21:32.131351
1ff4ddf5-402b-4c15-b621-ddd06f437541	a390371e-28a4-43a9-b8e3-befc774011cb	Avni Saxena	8111096665	Promising	PENDING	{"cohort": "Promising", "customer_name": "Avni Saxena", "contact_number": "8111096665"}	2026-02-01 03:21:32.131367
7f55dffd-c4c6-4683-b114-9ead8b4cb2fa	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Singh	7636456738	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dev Singh", "contact_number": "7636456738"}	2026-02-01 03:21:32.131383
2ed64d86-e032-4511-bbf8-77ef7530dfb0	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Pandey	9412499926	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Pandey", "contact_number": "9412499926"}	2026-02-01 03:21:32.131398
989148a3-63a3-424b-94d4-18ab20128b6d	a390371e-28a4-43a9-b8e3-befc774011cb	Anvi Nair	7709984342	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Anvi Nair", "contact_number": "7709984342"}	2026-02-01 03:21:32.131414
cc2bbedc-1e60-470b-889f-6c99b514c7ec	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Shetty	9768739556	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Aditi Shetty", "contact_number": "9768739556"}	2026-02-01 03:21:32.131666
48dfdcb9-8ac2-476f-9596-f6857526d752	a390371e-28a4-43a9-b8e3-befc774011cb	Vivaan Saxena	6548095375	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Vivaan Saxena", "contact_number": "6548095375"}	2026-02-01 03:21:32.131705
8fc1143e-c3cc-4c5b-9421-8b7c0d403c09	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Prasad	6148721296	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Shreya Prasad", "contact_number": "6148721296"}	2026-02-01 03:21:32.131726
afa3a51f-4eff-4921-b2c7-b027b81cb645	a390371e-28a4-43a9-b8e3-befc774011cb	Gaurav Verma	7460515853	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Gaurav Verma", "contact_number": "7460515853"}	2026-02-01 03:21:32.131743
07ed95bb-ce84-410f-aa23-6d44971c5a16	a390371e-28a4-43a9-b8e3-befc774011cb	Sai Narayan	8415724269	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Sai Narayan", "contact_number": "8415724269"}	2026-02-01 03:21:32.131759
1f6d72ee-048e-447f-86ff-3556e5b1b6c0	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Nair	7711435375	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Manav Nair", "contact_number": "7711435375"}	2026-02-01 03:21:32.131776
4f6a5dbd-8465-4d16-9e16-372c4dd65597	a390371e-28a4-43a9-b8e3-befc774011cb	Trisha Pandey	7337956181	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Trisha Pandey", "contact_number": "7337956181"}	2026-02-01 03:21:32.131793
41660fd8-fc38-4acb-9eb8-f58bb0e6c5f0	a390371e-28a4-43a9-b8e3-befc774011cb	Aadhya Mehta	6437461126	Champions	PENDING	{"cohort": "Champions", "customer_name": "Aadhya Mehta", "contact_number": "6437461126"}	2026-02-01 03:21:32.131809
7df860b4-8be3-4575-aa7d-3ea914c5c586	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Malhotra	8044864264	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Aarohi Malhotra", "contact_number": "8044864264"}	2026-02-01 03:21:32.131896
0a70086d-798a-4711-88ba-4832cd2d1f2d	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Roy	9062565801	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Roy", "contact_number": "9062565801"}	2026-02-01 03:21:32.131916
c96a3054-a151-4ba7-a729-06fba9f426b3	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Jain	8086829041	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Nikhil Jain", "contact_number": "8086829041"}	2026-02-01 03:21:32.131931
efc65947-20dd-480e-8b26-0534f36903c5	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Sood	8665714590	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Rahul Sood", "contact_number": "8665714590"}	2026-02-01 03:21:32.131948
59bf4db9-9ae9-46b4-bb51-081ce2c3c673	a390371e-28a4-43a9-b8e3-befc774011cb	Sakshi Malhotra	8388780418	Champions	PENDING	{"cohort": "Champions", "customer_name": "Sakshi Malhotra", "contact_number": "8388780418"}	2026-02-01 03:21:32.131964
113249bf-0b92-4216-aeb4-f8ee5904ff13	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Sood	8556617694	Champions	PENDING	{"cohort": "Champions", "customer_name": "Anika Sood", "contact_number": "8556617694"}	2026-02-01 03:21:32.131981
13122edd-56df-4bbd-bd9d-f1e165b73c13	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Tripathi	8482569647	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Tripathi", "contact_number": "8482569647"}	2026-02-01 03:21:32.131998
baebac54-392c-47f3-a601-b00057978326	a390371e-28a4-43a9-b8e3-befc774011cb	Aarohi Shah	9416790061	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aarohi Shah", "contact_number": "9416790061"}	2026-02-01 03:21:32.132014
e9c151be-2695-4162-a7f6-535b3d087a1c	a390371e-28a4-43a9-b8e3-befc774011cb	Priya Verma	7794356022	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Priya Verma", "contact_number": "7794356022"}	2026-02-01 03:21:32.13203
c13b5d7b-d3e9-4ff9-82da-325fef35bd15	a390371e-28a4-43a9-b8e3-befc774011cb	Ayush Shetty	6353063760	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Ayush Shetty", "contact_number": "6353063760"}	2026-02-01 03:21:32.132045
7d31a6bf-2d4f-4bbd-b5a2-f94af6c2faaf	a390371e-28a4-43a9-b8e3-befc774011cb	Vihaan Aggarwal	7189440114	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Vihaan Aggarwal", "contact_number": "7189440114"}	2026-02-01 03:21:32.132062
e2c24efb-728b-4042-a07a-21b13583a53e	a390371e-28a4-43a9-b8e3-befc774011cb	Myra Narayan	8489055650	Lost	PENDING	{"cohort": "Lost", "customer_name": "Myra Narayan", "contact_number": "8489055650"}	2026-02-01 03:21:32.132078
28c51eae-8d45-42da-bef5-a07ceb1e8afe	a390371e-28a4-43a9-b8e3-befc774011cb	Arjun Bajaj	8783920968	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Arjun Bajaj", "contact_number": "8783920968"}	2026-02-01 03:21:32.132094
a5461a63-afeb-4581-8c52-e4e493540c33	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Gupta	9117387208	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aman Gupta", "contact_number": "9117387208"}	2026-02-01 03:21:32.132111
f5c21dbb-52b6-403b-aeca-0f75a47459d0	a390371e-28a4-43a9-b8e3-befc774011cb	Parth Verma	8492317794	Champions	PENDING	{"cohort": "Champions", "customer_name": "Parth Verma", "contact_number": "8492317794"}	2026-02-01 03:21:32.132131
a0ea668b-a559-44cc-a6f8-f7dab3bd686b	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Das	6791348337	At Risk	PENDING	{"cohort": "At Risk", "customer_name": "Saanvi Das", "contact_number": "6791348337"}	2026-02-01 03:21:32.132147
d4fae527-3171-4b3e-a5fc-6f95cdbb3efb	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Verma	6896174750	Promising	PENDING	{"cohort": "Promising", "customer_name": "Mansi Verma", "contact_number": "6896174750"}	2026-02-01 03:21:32.132164
38d2dfe4-cd3c-4b20-bcb2-a56d99c22541	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Menon	6650405635	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Aditi Menon", "contact_number": "6650405635"}	2026-02-01 03:21:32.132183
e9967a55-92de-46d5-b3a6-d32c73304ef7	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Nair	8622257621	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Saanvi Nair", "contact_number": "8622257621"}	2026-02-01 03:21:32.132198
467cc319-cfc3-4272-a0b2-183e6c367195	a390371e-28a4-43a9-b8e3-befc774011cb	Priya Gowda	6065233172	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Priya Gowda", "contact_number": "6065233172"}	2026-02-01 03:21:32.132216
d19bf9ac-f916-47a5-94d6-0bebd4d615e1	a390371e-28a4-43a9-b8e3-befc774011cb	Ayaan Prasad	7138500903	Promising	PENDING	{"cohort": "Promising", "customer_name": "Ayaan Prasad", "contact_number": "7138500903"}	2026-02-01 03:21:32.132233
7c854b52-0334-4ee9-b16a-56d2201025f9	a390371e-28a4-43a9-b8e3-befc774011cb	Ira Pandey	6415586638	Champions	PENDING	{"cohort": "Champions", "customer_name": "Ira Pandey", "contact_number": "6415586638"}	2026-02-01 03:21:32.132252
921fba68-77f0-4824-b37c-8b996cb60c56	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Bose	6974189446	Promising	PENDING	{"cohort": "Promising", "customer_name": "Harsh Bose", "contact_number": "6974189446"}	2026-02-01 03:21:32.132293
19335c62-8a01-4262-a722-c96e2bd98682	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Kapoor	9491823193	Champions	PENDING	{"cohort": "Champions", "customer_name": "Dhruv Kapoor", "contact_number": "9491823193"}	2026-02-01 03:21:32.13231
66dc8f08-13d9-4fd2-8fe7-8a47ad933f7e	a390371e-28a4-43a9-b8e3-befc774011cb	Ananya Chaudhary	8404341761	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Ananya Chaudhary", "contact_number": "8404341761"}	2026-02-01 03:21:32.132326
7bb7687c-038a-4c1b-87d7-8f24c7dbbfe7	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Gill	6471503452	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Naina Gill", "contact_number": "6471503452"}	2026-02-01 03:21:32.132407
3f10dc4b-5d92-4c4a-a9d8-feded1a3120c	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Iyer	7593385747	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Ritvik Iyer", "contact_number": "7593385747"}	2026-02-01 03:21:32.132426
36bf30e0-c8a6-49a1-a61e-8a2226e3a16f	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Singh	7167781530	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Dhruv Singh", "contact_number": "7167781530"}	2026-02-01 03:21:32.132444
85f08eb4-fe1a-4927-ae02-63f10101d928	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Reddy	9190187346	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Meera Reddy", "contact_number": "9190187346"}	2026-02-01 03:21:32.132462
8c661c97-0840-4084-9b59-4935f2edb103	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Verma	6215787642	Lost	PENDING	{"cohort": "Lost", "customer_name": "Shreya Verma", "contact_number": "6215787642"}	2026-02-01 03:21:32.13248
d41a04d1-a33e-468d-be99-4c9b36656969	a390371e-28a4-43a9-b8e3-befc774011cb	Rupali Ghosh	9163593949	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rupali Ghosh", "contact_number": "9163593949"}	2026-02-01 03:21:32.132498
1ffa1b6e-3177-4d5d-89bd-6b9d1a481b91	a390371e-28a4-43a9-b8e3-befc774011cb	Kavya Hegde	8956588099	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Kavya Hegde", "contact_number": "8956588099"}	2026-02-01 03:21:32.132515
03e728d3-ce36-4d0c-af26-6e09959f8f07	a390371e-28a4-43a9-b8e3-befc774011cb	Anvi Malhotra	6783882733	Can't Lose Them	PENDING	{"cohort": "Can't Lose Them", "customer_name": "Anvi Malhotra", "contact_number": "6783882733"}	2026-02-01 03:21:32.132531
628692b0-1711-4552-9d97-3b41465bdd3c	a390371e-28a4-43a9-b8e3-befc774011cb	Arnav Arora	9442115834	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Arnav Arora", "contact_number": "9442115834"}	2026-02-01 03:21:32.132547
b7ae9fc6-b6e2-4550-8bf7-dd9c2cb80cea	a390371e-28a4-43a9-b8e3-befc774011cb	Diya Patel	8961007449	Lost	PENDING	{"cohort": "Lost", "customer_name": "Diya Patel", "contact_number": "8961007449"}	2026-02-01 03:21:32.132567
ada1c26b-700a-44e2-b5c9-3de92c1575ff	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Bhat	6188869644	Champions	PENDING	{"cohort": "Champions", "customer_name": "Shreya Bhat", "contact_number": "6188869644"}	2026-02-01 03:21:32.132583
e7da33d7-4d2e-4227-96b5-acffa35724f2	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Srinivasan	9324047729	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Srinivasan", "contact_number": "9324047729"}	2026-02-01 03:21:32.132598
25fac91c-b233-4dad-93dc-29662e9aee7d	a390371e-28a4-43a9-b8e3-befc774011cb	Saanvi Reddy	8004359075	Champions	PENDING	{"cohort": "Champions", "customer_name": "Saanvi Reddy", "contact_number": "8004359075"}	2026-02-01 03:21:32.132614
2788aa6b-9643-4bdf-b2bb-e1f88abb86d0	a390371e-28a4-43a9-b8e3-befc774011cb	Harsh Bajaj	8408047906	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Harsh Bajaj", "contact_number": "8408047906"}	2026-02-01 03:21:32.13263
9b6e2b93-d619-4386-9a7e-f9e73529685f	a390371e-28a4-43a9-b8e3-befc774011cb	Meera Hegde	8695049533	Promising	PENDING	{"cohort": "Promising", "customer_name": "Meera Hegde", "contact_number": "8695049533"}	2026-02-01 03:21:32.132646
f9b9dcb8-0de2-4894-99d8-114883115d55	a390371e-28a4-43a9-b8e3-befc774011cb	Naina Iyer	8209775041	Lost	PENDING	{"cohort": "Lost", "customer_name": "Naina Iyer", "contact_number": "8209775041"}	2026-02-01 03:21:32.132662
2a011d09-7dc9-4a50-bd34-d0861e3eb008	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Prasad	6627041072	Champions	PENDING	{"cohort": "Champions", "customer_name": "Tanvi Prasad", "contact_number": "6627041072"}	2026-02-01 03:21:32.132677
ccceabd8-0786-4f11-90c0-2f36300a52a9	a390371e-28a4-43a9-b8e3-befc774011cb	Tanvi Gupta	8227697631	Promising	PENDING	{"cohort": "Promising", "customer_name": "Tanvi Gupta", "contact_number": "8227697631"}	2026-02-01 03:21:32.132892
d542bff1-a1f8-4734-b84c-1b67be500046	a390371e-28a4-43a9-b8e3-befc774011cb	Kunal Shetty	7478301914	Lost	PENDING	{"cohort": "Lost", "customer_name": "Kunal Shetty", "contact_number": "7478301914"}	2026-02-01 03:21:32.133127
a4118177-7033-403b-abfc-c6474022147e	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Gowda	9724627367	Promising	PENDING	{"cohort": "Promising", "customer_name": "Manav Gowda", "contact_number": "9724627367"}	2026-02-01 03:21:32.133147
702d669e-f1a2-4f21-8e5b-daa2548056c4	a390371e-28a4-43a9-b8e3-befc774011cb	Siddharth Patel	6044499263	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Siddharth Patel", "contact_number": "6044499263"}	2026-02-01 03:21:32.133164
d1482b06-f061-4abe-aad4-46a6d7524f50	a390371e-28a4-43a9-b8e3-befc774011cb	Neha Narayan	8180946960	About To Sleep	PENDING	{"cohort": "About To Sleep", "customer_name": "Neha Narayan", "contact_number": "8180946960"}	2026-02-01 03:21:32.133179
31870575-ffab-4bc1-a8f3-115cf0720565	a390371e-28a4-43a9-b8e3-befc774011cb	Rahul Sharma	8949832063	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Rahul Sharma", "contact_number": "8949832063"}	2026-02-01 03:21:32.133197
0c05504a-e413-4bc4-b734-c1e4341b3936	a390371e-28a4-43a9-b8e3-befc774011cb	Pallavi Tripathi	7751361568	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Pallavi Tripathi", "contact_number": "7751361568"}	2026-02-01 03:21:32.133441
86bf4f84-0d66-4ae0-bf8f-cc4329dce5f1	a390371e-28a4-43a9-b8e3-befc774011cb	Rashmi Deshmukh	6456372060	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Rashmi Deshmukh", "contact_number": "6456372060"}	2026-02-01 03:21:32.133459
f8d00755-5c27-49f2-8408-d3d3a077d311	a390371e-28a4-43a9-b8e3-befc774011cb	Reyansh Mishra	7967181685	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Reyansh Mishra", "contact_number": "7967181685"}	2026-02-01 03:21:32.133474
1fd480f3-03fc-4424-8b67-bd4f5d381292	a390371e-28a4-43a9-b8e3-befc774011cb	Siddharth Srinivasan	7862496924	Champions	PENDING	{"cohort": "Champions", "customer_name": "Siddharth Srinivasan", "contact_number": "7862496924"}	2026-02-01 03:21:32.13349
3728bc87-95c0-4fb4-b435-08a52879c852	a390371e-28a4-43a9-b8e3-befc774011cb	Nandini Pandey	8272039281	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Nandini Pandey", "contact_number": "8272039281"}	2026-02-01 03:21:32.133505
b9a78e11-a520-48ed-b9b4-da77b90e4e9e	a390371e-28a4-43a9-b8e3-befc774011cb	Ritvik Menon	6496141726	Lost	PENDING	{"cohort": "Lost", "customer_name": "Ritvik Menon", "contact_number": "6496141726"}	2026-02-01 03:21:32.13352
6dd531be-bd72-48d8-a939-a370918688a2	a390371e-28a4-43a9-b8e3-befc774011cb	Manav Khan	9710524816	Hibernating	PENDING	{"cohort": "Hibernating", "customer_name": "Manav Khan", "contact_number": "9710524816"}	2026-02-01 03:21:32.133554
e10d57f2-b0d4-44c6-9775-c3cba20335d6	a390371e-28a4-43a9-b8e3-befc774011cb	Dev Naik	6627955944	New Customers	PENDING	{"cohort": "New Customers", "customer_name": "Dev Naik", "contact_number": "6627955944"}	2026-02-01 03:21:32.13357
f862ac3f-55b3-4d83-b51b-4dbb5ceec29c	a390371e-28a4-43a9-b8e3-befc774011cb	Aman Saha	6509845936	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Aman Saha", "contact_number": "6509845936"}	2026-02-01 03:21:32.133585
fef1b5f8-7e9a-4e03-819c-1a167b55dfcd	a390371e-28a4-43a9-b8e3-befc774011cb	Aditi Shetty	9096383872	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Aditi Shetty", "contact_number": "9096383872"}	2026-02-01 03:21:32.133601
45a1ea0d-f183-4d3d-abc4-a2522a220531	a390371e-28a4-43a9-b8e3-befc774011cb	Dhruv Kulkarni	7103168630	Loyal Customers	PENDING	{"cohort": "Loyal Customers", "customer_name": "Dhruv Kulkarni", "contact_number": "7103168630"}	2026-02-01 03:21:32.133616
85bb5e51-9ac4-4cdc-b6fd-2476c846b474	a390371e-28a4-43a9-b8e3-befc774011cb	Nikhil Mishra	9711754053	Promising	PENDING	{"cohort": "Promising", "customer_name": "Nikhil Mishra", "contact_number": "9711754053"}	2026-02-01 03:21:32.133631
0d02591e-2a6e-4a39-9d50-9ca31a58d718	a390371e-28a4-43a9-b8e3-befc774011cb	Rashmi Kaur	9903374265	Potential Loyalist	PENDING	{"cohort": "Potential Loyalist", "customer_name": "Rashmi Kaur", "contact_number": "9903374265"}	2026-02-01 03:21:32.133647
6d2037d4-4d23-4b19-9ad7-357ee144dd56	a390371e-28a4-43a9-b8e3-befc774011cb	Shreya Saha	7720740962	Need Attention	PENDING	{"cohort": "Need Attention", "customer_name": "Shreya Saha", "contact_number": "7720740962"}	2026-02-01 03:21:32.133663
4b086c5d-47da-451f-890c-e4f72baba836	a390371e-28a4-43a9-b8e3-befc774011cb	Rohan Mukherjee	7069806808	Champions	PENDING	{"cohort": "Champions", "customer_name": "Rohan Mukherjee", "contact_number": "7069806808"}	2026-02-01 03:21:32.133678
0dd25138-c7a8-4ab6-b372-a70f157ffc97	a390371e-28a4-43a9-b8e3-befc774011cb	Mansi Shah	6472848963	Lost	PENDING	{"cohort": "Lost", "customer_name": "Mansi Shah", "contact_number": "6472848963"}	2026-02-01 03:21:32.133694
76a844c0-ddcb-4f2d-85e2-dc31d0c81245	a390371e-28a4-43a9-b8e3-befc774011cb	Anika Tiwari	7392010271	Lost	PENDING	{"cohort": "Lost", "customer_name": "Anika Tiwari", "contact_number": "7392010271"}	2026-02-01 03:21:32.13371
160ae489-c139-4cd7-aae1-a70bf4e62fa2	7b277bac-9157-4c01-9b6e-3b28b088e0b4	Anika Tiwari	7392010271	Lost	PENDING	{"cohort": "Lost", "customer_name": "Anika Tiwari", "contact_number": "7392010271"}	2026-02-01 10:22:00.49794
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campaigns (id, company_id, user_id, name, status, phone_number, team_member_role, team_member_department, decision_context, quality_score, quality_gap, brand_context, customer_context, team_member_context, preliminary_questions, question_bank, incentive_bank, cohort_questions, cohort_incentives, incentive, total_call_target, call_duration, cohort_config, selected_cohorts, execution_windows, cohort_data, created_at, updated_at, source_file_hash) FROM stdin;
66e326b8-1664-439d-820e-aff3c700aea7	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	Retention Jan 2026	DRAFT	+91 8668462386	Founder	HQ	{}	0	\N	Mumbai Pav Co is a street-food brand serving Mumbai-style favourites like Pav Bhaji, Dabeli, and Vada Pav, with a focus on consistent taste and delivery-friendly packaging.	To identify why the customer has not ordered Mumbai Pav Co recently (alternatives, pricing, quality issues, delivery experience, changing preferences) and what would make them consider ordering again.	The interview will be conducted by a Customer Experience team member from Mumbai Pav Co, focused on capturing candid feedback on food quality, delivery experience, and repeat-order drivers.	[]	["What's your favourite item from MPC's menu?", "Why MPC?", "Any bad experience with MPC?"]	["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"]	{"At Risk": ["Why MPC?"], "Champions": ["Any bad experience with MPC?", "What's your favourite item from MPC's menu?", "Why MPC?"], "About To Sleep": ["What's your favourite item from MPC's menu?"]}	{"At Risk": "Swiggy Coupon", "Champions": "₹200 UPI", "About To Sleep": "₹500 Amazon Voucher"}	₹500 Amazon Voucher	\N	1200	{"At Risk": 5, "Champions": 20, "About To Sleep": 10}	["About To Sleep", "At Risk", "Champions"]	[{"day": "2026-02-02", "end": "08:00", "start": "07:00"}]	{"At Risk": {"target": 5, "incentive": "Swiggy Coupon", "questions": ["Why MPC?"], "isSelected": true}, "Champions": {"target": 20, "incentive": "₹200 UPI", "questions": ["Any bad experience with MPC?", "What's your favourite item from MPC's menu?", "Why MPC?"], "isSelected": true}, "About To Sleep": {"target": 10, "incentive": "₹500 Amazon Voucher", "questions": ["What's your favourite item from MPC's menu?"], "isSelected": true}}	2026-02-01 01:35:08.083191	2026-02-01 02:28:04.217175	\N
a390371e-28a4-43a9-b8e3-befc774011cb	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	Retention Feb 2026	DRAFT	+91 8668462386	Founder	HQ	{}	0	\N	Mumbai Pav Co is a street-food brand serving Mumbai-style favourites like Pav Bhaji, Dabeli, and Vada Pav, with a focus on consistent taste and delivery-friendly packaging.	To capture feedback on the customer’s most recent Mumbai Pav Co order, including what worked well vs what did not (taste, temperature, delivery time, packaging, item accuracy), and the top improvement that would raise satisfaction.\n	The interview will be conducted by Tanay (Founder, Mumbai Pav Co), focused on understanding the customer’s real experience and identifying the most important improvements to product and delivery.	[]	["Why MPC?"]	["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"]	{"Loyal Customers": ["Why MPC?"]}	{"Champions": "Swiggy Coupon", "Loyal Customers": "Swiggy Coupon"}	Swiggy Coupon	\N	900	{"Champions": 15, "Loyal Customers": 30}	["Loyal Customers", "Champions"]	[{"day": "2026-02-02", "end": "08:30", "start": "07:00"}, {"day": "2026-02-03", "end": "07:00", "start": "06:00"}]	{"Champions": {"target": 15, "incentive": "Swiggy Coupon", "questions": [], "isSelected": true}, "Loyal Customers": {"target": 30, "incentive": "Swiggy Coupon", "questions": ["Why MPC?"], "isSelected": true}}	2026-02-01 03:21:32.01163	2026-02-01 10:06:59.785589	\N
7b277bac-9157-4c01-9b6e-3b28b088e0b4	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	Churn Feb 2026	DRAFT	+91 8668462386	Founder	HQ	{}	0	\N	Mumbai Pav Co is a street-food brand serving Mumbai-style favourites like Pav Bhaji, Dabeli, and Vada Pav, with a focus on consistent taste and delivery-friendly packaging.	To identify why the customer has not ordered Mumbai Pav Co recently (alternatives, pricing, quality issues, delivery experience, changing preferences) and what would make them consider ordering again.	The interview will be conducted by an Operations/Quality team member from Mumbai Pav Co, focused on consistency, packaging integrity, temperature on arrival, and order accuracy.	["Any bad experience/s with MPC?"]	["Any bad experience/s with MPC?", "Your favourite item from MPC's menu?"]	["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"]	{"Lost": ["Any bad experience/s with MPC?", "Your favourite item from MPC's menu?"], "At Risk": ["Any bad experience/s with MPC?"], "About To Sleep": ["Any bad experience/s with MPC?", "Your favourite item from MPC's menu?"]}	{"At Risk": "", "About To Sleep": "₹50 off on next order"}	₹50 off on next order	\N	600	{"Lost": 5, "At Risk": 12, "About To Sleep": 8}	["At Risk", "About To Sleep", "Lost"]	[{"day": "2026-02-02", "end": "22:00", "start": "21:00"}]	{"Lost": {"target": 5, "incentive": "₹50 off on next order", "questions": ["Any bad experience/s with MPC?", "Your favourite item from MPC's menu?"], "isSelected": true}, "At Risk": {"target": 12, "incentive": "₹50 off on next order", "questions": ["Any bad experience/s with MPC?"], "isSelected": true}, "About To Sleep": {"target": 8, "incentive": "₹50 off on next order", "questions": ["Any bad experience/s with MPC?", "Your favourite item from MPC's menu?"], "isSelected": true}}	2026-02-01 06:46:20.678656	2026-02-01 10:30:27.278172	\N
\.


--
-- Data for Name: campaigns_goals_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campaigns_goals_details (id, campaign_id, bolna_execution_id, agent_id, batch_id, created_at, updated_at, scheduled_at, initiated_at, rescheduled_at, answered_by_voice_mail, conversation_duration, total_cost, status, smart_status, user_number, agent_number, provider, transcript, summary, error_message, usage_breakdown, cost_breakdown, extracted_data, agent_extraction, custom_extractions, telephony_data, transfer_call_data, context_details, batch_run_details, latency_data, retry_config, retry_history, workflow_retries, retry_count, deleted, raw_data, system_created_at, system_updated_at) FROM stdin;
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company (created_by, updated_by, brand_name, legal_name, founded_year, tagline, tags, presence_links, currency, timezone, industry, country, hq_city, brand_context, support_email, support_phone, support_hours, stack_data, channels_data, id, created_at) FROM stdin;
QrOwZmlu4ycKYdaUMz09rh0CoCc2	QrOwZmlu4ycKYdaUMz09rh0CoCc2	Mumbai Pav Co	Tidal Food Ventures Private Limited	2023	\N	[]	[]	INR	Asia/Kolkata	QSR (Quick Service Restaurants)	India	\N	Mumbai Pav Co is a street-food brand serving Mumbai-style favourites like Pav Bhaji, Dabeli, and Vada Pav, with a focus on consistent taste and delivery-friendly packaging.	\N	\N	\N	{}	{}	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	2026-02-01 01:32:50.897474
\.


--
-- Data for Name: company_entitlement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_entitlement (id, company_id, module_id, is_enabled, expires_at) FROM stdin;
\.


--
-- Data for Name: company_membership; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_membership (id, company_id, user_id, role, created_at) FROM stdin;
fac15eae-91be-4443-8845-372d6ecf3cc8	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	QrOwZmlu4ycKYdaUMz09rh0CoCc2	OWNER	2026-02-01 01:32:50.906631
\.


--
-- Data for Name: data_source; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_source (id, name, slug, category, website_url, logo_url, description, auth_method, is_active, is_coming_soon, is_common, is_implemented, theme_color, created_at, updated_at) FROM stdin;
69413e7f-4647-4290-9d48-7213fa49aca6	Shiprocket	shiprocket	Logistics	https://www.shiprocket.in	/logos/shiprocket.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.578187	2026-02-01 01:31:25.57821
30de1e2c-b5d5-41b6-9f34-2db0bea9791c	NimbusPost	nimbuspost	Logistics	https://nimbuspost.com	/logos/nimbuspost.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.580423	2026-02-01 01:31:25.580428
4a0eb7ff-ebf6-44d9-80b7-624b754885f1	Delhivery	delhivery	Logistics	https://www.delhivery.com	/logos/delhivery.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.581403	2026-02-01 01:31:25.581407
12cfca76-ccb3-4611-b880-842902354b76	Return Prime	return_prime	Logistics	https://returnprime.com	/logos/return_prime.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.582273	2026-02-01 01:31:25.582277
ece8ce53-a717-4b33-a98e-be48faf53b75	Pickrr	pickrr	Logistics	https://www.pickrr.com	/logos/pickrr.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.583113	2026-02-01 01:31:25.583117
20abfcad-9912-4178-8987-8e93954339ba	iThink Logistics	ithink_logistics	Logistics	https://ithinklogistics.com	/logos/ithink_logistics.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.583949	2026-02-01 01:31:25.583953
f1442df1-c1e3-4570-81b3-f6b9a8beb32d	Shipyaari	shipyaari	Logistics	https://shipyaari.com	/logos/shipyaari.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.584949	2026-02-01 01:31:25.584953
b3618248-1f96-43e0-abb5-4bdcccdf51ac	Shyplite	shyplite	Logistics	https://shyplite.com	/logos/shyplite.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.585866	2026-02-01 01:31:25.58587
6e277365-4f17-46d7-bd22-2d52f95baeca	Vamaship	vamaship	Logistics	https://www.vamaship.com	/logos/vamaship.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.586773	2026-02-01 01:31:25.586776
65f77317-bf31-4315-b233-8ed3e9bb3d3b	Ecom Express	ecom_express	Logistics	https://ecomexpress.in	/logos/ecom_express.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.587518	2026-02-01 01:31:25.587522
ec2a587c-90b3-4558-8c27-ea4c4d0c2522	Xpressbees	xpressbees	Logistics	https://www.xpressbees.com	/logos/xpressbees.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.588284	2026-02-01 01:31:25.588287
e4a5c14d-19b8-4d5a-8e32-06bfade3114f	Easebuzz	easebuzz	Payment	https://easebuzz.in	/logos/easebuzz.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.590015	2026-02-01 01:31:25.59002
f6b1eea2-abcb-455f-8eea-5ced8e4bf3d7	Flipkart Ads	flipkart_ads	Marketing	https://advertising.flipkart.com	/logos/flipkart_ads.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.590914	2026-02-01 01:31:25.590918
3557e60a-d313-41f8-9fa4-0533f9b966a7	Myntra Ads	myntra_ads	Marketing	https://partners.myntra.com	/logos/myntra_ads.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.591738	2026-02-01 01:31:25.591742
96fc1c8c-5f03-4220-9114-a0eaeaf19cc1	Chartered Accountant (CA)	chartered_accountant	Accounting	\N	https://upload.wikimedia.org/wikipedia/en/thumb/5/55/ICAI_Logo.svg/512px-ICAI_Logo.svg.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.826002	2026-02-01 01:31:25.826007
d041aa46-995b-45a0-8660-25fad44cb39b	Marg ERP	marg_erp	Accounting	https://margcompusoft.com	/logos/marg_erp.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.827336	2026-02-01 01:31:25.82734
e0abd99c-d93c-4c03-8469-20911002f43c	myBillBook	mybillbook	Accounting	https://mybillbook.in	/logos/mybillbook.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.828538	2026-02-01 01:31:25.828543
7dcc090e-5998-435b-9a09-9931f72da979	DTDC	dtdc	Logistics	https://www.dtdc.com	/logos/dtdc.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.829749	2026-02-01 01:31:25.829753
9b8d311a-8d4c-4614-83f6-0d372c3cd041	Blue Dart	blue_dart	Logistics	https://www.bluedart.com	/logos/blue_dart.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.830929	2026-02-01 01:31:25.830933
b0cc75c7-55e7-4d70-a899-f4257b6403ab	Shadowfax	shadowfax	Logistics	https://www.shadowfax.in	/logos/shadowfax.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.83205	2026-02-01 01:31:25.832054
1677e85e-5f80-444b-be50-c39eb0c4da4e	India Post	india_post	Logistics	https://www.indiapost.gov.in	/logos/india_post.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.833102	2026-02-01 01:31:25.833106
a05c9896-c0fe-4c50-ac5e-8839fbf67913	Gati	gati	Logistics	https://www.gati.com	/logos/gati.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.834141	2026-02-01 01:31:25.834145
7ca32c38-0062-4099-bde5-fd7e158462f0	ClickPost	clickpost	Logistics	https://www.clickpost.ai	/logos/clickpost.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.835232	2026-02-01 01:31:25.835236
9c87dfe4-2a6d-455b-a8c2-89b20cd9fe6b	AfterShip	aftership	Logistics	https://www.aftership.com	/logos/aftership.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.836368	2026-02-01 01:31:25.836372
d94bf4eb-b63d-42da-ba3e-0ecf89183848	Eshopbox	eshopbox	Logistics	https://www.eshopbox.com	/logos/eshopbox.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.837468	2026-02-01 01:31:25.837472
8bcae931-f863-47b3-a244-42c73c5eca25	WareIQ	wareiq	Logistics	https://wareiq.com	/logos/wareiq.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.838531	2026-02-01 01:31:25.838535
83774ca0-b906-449b-8362-22f6293cc08e	AfterShip Returns	aftership_returns	Logistics	https://www.aftership.com/returns	/logos/aftership_returns.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.839543	2026-02-01 01:31:25.839547
8ae4f618-6bab-466a-b609-c02d39de6202	Loop Returns	loop_returns	Logistics	https://loopreturns.com	/logos/loop_returns.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.840476	2026-02-01 01:31:25.84048
6b46d11c-6ed9-42cb-a70c-dec910670b4c	Narvar	narvar	Logistics	https://corp.narvar.com	/logos/narvar.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.841357	2026-02-01 01:31:25.841361
23d71502-561a-44c9-9310-525aaeb62a88	NDR Panels	ndr_panels	Logistics	\N	/logos/ndr_panels.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.842345	2026-02-01 01:31:25.842349
fd3a0343-99e0-4a2f-9caf-92418ae3344e	Carrier NDR	carrier_ndr	Logistics	\N	/logos/carrier_ndr.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.843338	2026-02-01 01:31:25.843341
73883a27-c58a-4179-9b03-aa5fe247728a	Logistics - Not Applicable	logistics_not_applicable	Logistics	\N	/logos/not_applicable.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.847138	2026-02-01 01:31:25.847142
45b5f2e5-01ed-43a0-8db2-4998d88a241f	Razorpay	razorpay	Payment	https://razorpay.com	/logos/razorpay.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.84825	2026-02-01 01:31:25.848254
13a7611a-401f-4eda-b7e1-3dc876fbf82a	Cashfree	cashfree	Payment	https://www.cashfree.com	/logos/cashfree.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.849264	2026-02-01 01:31:25.849268
d7ca6c19-7092-4790-948c-bf953b7a8374	COD Reports	cod_remittance	Payment	\N	/logos/cod_remittance.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.851728	2026-02-01 01:31:25.851732
4bcf28ce-40e8-4861-9d27-28f817391ed4	PayU	payu	Payment	https://payu.in	/logos/payu.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.852737	2026-02-01 01:31:25.85274
c8479aea-444a-4b0e-a19f-b13d8f0a092c	CCAvenue	ccavenue	Payment	https://www.ccavenue.com	/logos/ccavenue.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.853728	2026-02-01 01:31:25.853732
66d202ec-c7c5-49d2-8f5a-a12f0be4d42b	PhonePe PG	phonepe_pg	Payment	https://www.phonepe.com	/logos/phonepe_pg.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.854753	2026-02-01 01:31:25.854756
55856d6b-1bab-455c-92b2-d40b41a81045	BillDesk	billdesk	Payment	https://www.billdesk.com	/logos/billdesk.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.855718	2026-02-01 01:31:25.855721
f9a6e3dc-38b2-429c-840c-2f2810635ff5	Paytm	paytm_pg	Payment	https://paytm.com	/logos/paytm_pg.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.856614	2026-02-01 01:31:25.856617
eec5e03b-7d2c-4daa-82c7-df4d8dd57e1c	Instamojo	instamojo	Payment	https://www.instamojo.com	/logos/instamojo.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.858012	2026-02-01 01:31:25.858015
9538cc80-30c8-412b-9173-8be028bcf8bf	Worldline	worldline	Payment	https://worldline.com	/logos/worldline.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.859005	2026-02-01 01:31:25.859008
c00759f8-fb32-45a9-a12c-a80deeaa4288	RazorpayX	razorpayx	Payment	https://razorpay.com/x	/logos/razorpayx.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.86	2026-02-01 01:31:25.860004
5d3588b2-7b4f-4c74-b08a-44e3992e698b	Cashfree Payouts	cashfree_payouts	Payment	https://www.cashfree.com/payouts	/logos/cashfree_payouts.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.86093	2026-02-01 01:31:25.860933
575da4eb-f75d-46f2-9785-d35c8a9dc040	Marketplace Settlements	marketplace_settlements	Payment	\N	/logos/marketplace_settlements.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.861727	2026-02-01 01:31:25.861731
134a1a70-ddd3-4089-9079-e725844a8cfe	Juspay	juspay	Payment	https://juspay.in	/logos/juspay.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.86272	2026-02-01 01:31:25.862723
3477f9e8-2c03-4c3e-aad0-39132fcb7b6b	Stripe	stripe	Payment	https://stripe.com	/logos/stripe.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.863685	2026-02-01 01:31:25.863689
58f8f6bf-6084-48d6-9b7e-555f13ed1b3b	PayPal	paypal	Payment	https://www.paypal.com	/logos/paypal.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.864659	2026-02-01 01:31:25.864663
cf771f96-552f-44fc-8608-30aa73ba68f3	Simpl	simpl	Payment	https://getsimpl.com	/logos/simpl.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.865621	2026-02-01 01:31:25.865624
3ef6b672-c897-46b4-a1c6-9d1029ce80af	LazyPay	lazypay	Payment	https://lazypay.in	/logos/lazypay.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.866624	2026-02-01 01:31:25.866628
39fa51fe-eddb-48e8-b38e-89d99adaa577	Paytm Postpaid	paytm_postpaid	Payment	https://paytm.com	/logos/paytm_postpaid.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.867436	2026-02-01 01:31:25.86744
cd760ea7-9bc4-4a11-be05-1718370a419b	Payments - Not Applicable	payment_not_applicable	Payment	\N	/logos/not_applicable.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.871012	2026-02-01 01:31:25.871016
210e1ed1-9136-472c-b894-c41cda921e7e	Meta Ads	meta_ads	Marketing	https://www.facebook.com/business/ads	/logos/meta_ads.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.872004	2026-02-01 01:31:25.872008
3f9d768c-faee-483d-a647-7c83bc5e848b	Google Ads	google_ads	Marketing	https://ads.google.com	/logos/google_ads.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.873095	2026-02-01 01:31:25.8731
15ff79cf-4044-4d78-a86f-5a65b8c2202f	Amazon Ads	amazon_ads	Marketing	https://advertising.amazon.com	/logos/amazon_ads.svg	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.873954	2026-02-01 01:31:25.873958
4b4966bc-70b3-49a9-ac73-e87d158be350	Nykaa Ads	nykaa_ads	Marketing	https://www.nykaa.com	/logos/nykaa_ads.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.875609	2026-02-01 01:31:25.875612
62e3102f-db7d-4278-bc45-6a751fb061b6	LinkedIn Ads	linkedin_ads	Marketing	https://business.linkedin.com/marketing-solutions/ads	/logos/linkedin_ads.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.87652	2026-02-01 01:31:25.876523
8cd94405-4f84-4c05-9dd0-c80726704da2	X Ads	x_ads	Marketing	https://ads.twitter.com	/logos/x_ads.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.877424	2026-02-01 01:31:25.877428
c4d84184-bd35-469f-b735-cec2af61e0ec	Snap Ads	snap_ads	Marketing	https://forbusiness.snapchat.com	/logos/snap_ads.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.878331	2026-02-01 01:31:25.878335
24a0c5a5-6bc3-4b72-97ca-76176ab51710	Marketing - Not Applicable	marketing_not_applicable	Marketing	\N	/logos/not_applicable.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.881837	2026-02-01 01:31:25.881841
855f2255-f710-4fd4-b909-7b49995ad2eb	Google Analytics	google_analytics	Analytics	https://analytics.google.com	/logos/google_analytics.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.88282	2026-02-01 01:31:25.882824
97bf2904-e363-4113-91d1-c347af91d929	WebEngage	webengage	Retention	https://webengage.com	/logos/webengage.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.883866	2026-02-01 01:31:25.883869
0b76b399-a308-4ef2-8c58-4db28ce74be1	Interakt	interakt	Communication	https://interakt.shop	/logos/interakt.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.884845	2026-02-01 01:31:25.884848
178ce61e-4f36-440b-a462-66bab3bd0448	Freshdesk	freshdesk	Communication	https://freshdesk.com	/logos/freshdesk.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.885903	2026-02-01 01:31:25.885906
589285da-9219-4e54-9f65-a85b3c6e70ce	GTM	gtm	Analytics	https://tagmanager.google.com	/logos/gtm.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.886935	2026-02-01 01:31:25.886939
1ceffab6-3793-4cf6-9de6-9bf5cceb443b	Google Search Console	gsc	Analytics	https://search.google.com/search-console	/logos/gsc.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.888099	2026-02-01 01:31:25.888103
61216a26-94d0-4712-9529-ca26d9353f59	Meta Pixel	meta_pixel	Analytics	https://www.facebook.com/business/help/742478679120153	/logos/meta_pixel.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.889119	2026-02-01 01:31:25.889123
ff8b76d3-a8f4-4abc-a091-9da5d7b130ce	Microsoft Clarity	clarity	Analytics	https://clarity.microsoft.com	/logos/clarity.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.890192	2026-02-01 01:31:25.890196
98ced063-dd66-469c-a957-94d65919f14a	Hotjar	hotjar	Analytics	https://hotjar.com	/logos/hotjar.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.892515	2026-02-01 01:31:25.892519
2d4aa5de-e892-4bc9-8406-4d778a60fb26	Mixpanel	mixpanel	Analytics	https://mixpanel.com	/logos/mixpanel.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.893395	2026-02-01 01:31:25.8934
6a1e4ff5-c14a-4c7b-9003-fc4eef4cbe4f	VWO	vwo	Analytics	https://vwo.com	/logos/vwo.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.89431	2026-02-01 01:31:25.894313
5df9f4c2-34b5-426b-b064-af8c4897b9db	AppsFlyer	appsflyer	Analytics	https://www.appsflyer.com	/logos/appsflyer.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.895179	2026-02-01 01:31:25.895183
bd8a829b-8f0b-4358-85a1-f22c63af0806	Adjust	adjust	Analytics	https://www.adjust.com	/logos/adjust.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.896227	2026-02-01 01:31:25.896232
46243588-50cb-4a2b-9b59-3ee0802c8a74	Branch	branch	Analytics	https://branch.io	/logos/branch.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.89726	2026-02-01 01:31:25.897263
5cd11e35-ce1a-42a9-8a89-e2d18334e31c	MoEngage	moengage	Retention	https://www.moengage.com	/logos/moengage.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.89824	2026-02-01 01:31:25.898244
92d73a54-d473-4fc3-b0b2-a1b59620822f	CleverTap	clevertap	Retention	https://clevertap.com	/logos/clevertap.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.899179	2026-02-01 01:31:25.899183
09b0c926-d408-4b6b-bc33-2bdda35b4f25	Netcore	netcore	Retention	https://netcorecloud.com	/logos/netcore.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.900205	2026-02-01 01:31:25.900209
989b030d-abb0-411c-b8fe-3386e6678634	Braze	braze	Retention	https://www.braze.com	/logos/braze.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.901242	2026-02-01 01:31:25.901246
d90505ee-7f50-46e0-8590-e630a3ea6fac	HubSpot	hubspot	Retention	https://www.hubspot.com	/logos/hubspot.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.902078	2026-02-01 01:31:25.902081
c27a4e32-0a50-4886-ac69-48431225f685	Klaviyo	klaviyo	Retention	https://www.klaviyo.com	/logos/klaviyo.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.903112	2026-02-01 01:31:25.903115
b67adc4f-e306-4241-a9ac-7b7f0f0f66ae	Mailchimp	mailchimp	Retention	https://mailchimp.com	/logos/mailchimp.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.904	2026-02-01 01:31:25.904005
ae43b68a-df1c-4e64-b033-4aebc05677bc	SES	ses	Retention	https://aws.amazon.com/ses	/logos/ses.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.905026	2026-02-01 01:31:25.90503
02bbabad-08a1-4cb4-b08b-4880cdc361c4	SendGrid	sendgrid	Retention	https://sendgrid.com	/logos/sendgrid.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.906079	2026-02-01 01:31:25.906083
91477261-ae97-470d-9efe-770410e0cfdb	Route Mobile	route_mobile	Retention	https://routemobile.com	/logos/route_mobile.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.906912	2026-02-01 01:31:25.906916
cb894f94-9899-4748-9c4e-061e02c0e25d	WATI	wati	Communication	https://www.wati.io	/logos/wati.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.907737	2026-02-01 01:31:25.90774
24888205-d53f-4167-ac05-17559d67aef0	Gupshup	gupshup	Communication	https://www.gupshup.io	/logos/gupshup.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.908597	2026-02-01 01:31:25.9086
d4fb8bb5-6bd4-4613-8854-1909927bce5d	LimeChat	limechat	Communication	https://www.limechat.ai	/logos/limechat.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.909542	2026-02-01 01:31:25.909546
8f1413fd-38a0-4880-bae2-99c34a875ae2	Yellow.ai	yellow_ai	Communication	https://yellow.ai	/logos/yellow_ai.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.910494	2026-02-01 01:31:25.910498
afe3ba26-b5af-495d-ba2e-bee1887435f5	Haptik	haptik	Communication	https://haptik.ai	/logos/haptik.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.911374	2026-02-01 01:31:25.911378
dc34afa8-f56d-4f50-84c1-dd7dba6350ac	Zendesk	zendesk	Communication	https://www.zendesk.com	/logos/zendesk.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.91227	2026-02-01 01:31:25.912274
44f4ae6f-1723-4fa3-8fd8-6d2ae86ad5b1	Zoho Desk	zoho_desk	Communication	https://www.zoho.com/desk	/logos/zoho_desk.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.91308	2026-02-01 01:31:25.913084
2b78ec02-af7e-4ae3-981d-a9a5b7ab41f5	Intercom	intercom	Communication	https://www.intercom.com	/logos/intercom.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.913949	2026-02-01 01:31:25.913954
a489698a-0e38-4eea-a08d-9fd6a2875e84	Gorgias	gorgias	Communication	https://www.gorgias.com	/logos/gorgias.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.914812	2026-02-01 01:31:25.914815
d07ff3b7-f11f-4f71-a3c7-cc3b280f0e5d	Not Applicable	analytics_crm_not_applicable	Analytics	\N	/logos/not_applicable.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.917947	2026-02-01 01:31:25.91795
6aaf7953-5058-468e-a168-a86f39da409b	TallyPrime	tally	Accounting	https://tallysolutions.com	/logos/tally.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.918792	2026-02-01 01:31:25.918795
0ce6ec41-5551-4844-bd3f-0629505bffee	Zoho Books	zoho_books	Accounting	https://www.zoho.com/books	/logos/zoho_books.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:25.919667	2026-02-01 01:31:25.919671
fb1e183a-f378-43ff-81c5-522fdcc0dee0	ClearTax	cleartax	Accounting	https://cleartax.in	/logos/cleartax.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.920563	2026-02-01 01:31:25.920567
c7f1ffd0-ba23-4bfc-a75e-b920ebceecec	Busy	busy	Accounting	https://busy.in	/logos/busy.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.179834	2026-02-01 01:31:26.179838
d0a8cb59-b976-49b0-99f4-300396c9b451	Vyapar	vyapar	Accounting	https://vyaparapp.in	/logos/vyapar.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.181228	2026-02-01 01:31:26.181231
52462cb8-31d1-492c-80dd-15e9f9f567fd	Giddh	giddh	Accounting	https://giddh.com	/logos/giddh.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.182674	2026-02-01 01:31:26.182678
b8dc0c02-02c8-49e0-af67-515b4fc72916	Refrens	refrens	Accounting	https://refrens.com	/logos/refrens.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.183561	2026-02-01 01:31:26.183565
d62c22cf-c365-4370-8ac6-7c307a59a0ef	RealBooks	realbooks	Accounting	https://realbooks.in	/logos/realbooks.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.184562	2026-02-01 01:31:26.184566
3790daa7-20a4-4dd6-ac7f-818eae5025eb	ProfitBooks	profitbooks	Accounting	https://profitbooks.net	/logos/profitbooks.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.185639	2026-02-01 01:31:26.185643
50e8506a-2466-494a-a444-eaab57612e92	SAP B1	sap_b1	Accounting	https://www.sap.com	/logos/sap_b1.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.186657	2026-02-01 01:31:26.18666
a6242c7b-962b-4919-9c6e-e2166e2ee18c	Dynamics 365 BC	dynamics_365	Accounting	https://dynamics.microsoft.com	/logos/default.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.470544	2026-02-01 01:31:26.470549
62717737-aaae-4bd4-b523-6dd6b646b57e	NetSuite	netsuite	Accounting	https://www.netsuite.com	/logos/netsuite.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.471881	2026-02-01 01:31:26.471885
f0f06ed9-e423-4a49-88bf-bbf110272b2d	Odoo	odoo	Accounting	https://www.odoo.com	/logos/odoo.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.4731	2026-02-01 01:31:26.473104
d0a62e86-f49f-4e92-b5f4-bdf08e0e9cf9	Keka	keka	Accounting	https://www.keka.com	/logos/keka.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.47417	2026-02-01 01:31:26.474176
db60b467-6dae-4c8f-9f9c-4f0a9f2332e2	greytHR	greythr	Accounting	https://www.greythr.com	/logos/greythr.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.475449	2026-02-01 01:31:26.475454
7cb68c6b-2021-45a7-8023-b6c456c8ea15	Zoho Payroll	zoho_payroll	Accounting	https://www.zoho.com/payroll	/logos/zoho_payroll.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.47678	2026-02-01 01:31:26.476784
0d1a1b6c-982e-4c47-9dc0-cfc5de6457e0	Accounting - Not Applicable	accounting_not_applicable	Accounting	\N	/logos/not_applicable.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.480846	2026-02-01 01:31:26.480851
2da53a05-f583-443d-bf9f-7f26116a00a8	Shopify	shopify	Storefront	https://shopify.com	/logos/shopify.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.482117	2026-02-01 01:31:26.482121
21621cb9-e96c-4cf3-bbbc-54292601b462	WooCommerce	woocommerce	Storefront	https://woocommerce.com	/logos/woocommerce.svg	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.483137	2026-02-01 01:31:26.483142
fb72bc22-af58-46ac-ac5d-67c9539f2fbb	Magento	magento	Storefront	https://business.adobe.com/products/magento/magento-commerce.html	/logos/magento.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.484203	2026-02-01 01:31:26.484207
a0000da9-bf4e-4312-ac4d-f2762877cf9d	Wix	wix	Storefront	https://wix.com	/logos/wix.svg	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.485296	2026-02-01 01:31:26.4853
90e4cf78-c4b5-4cbc-96c7-ba366f3825ff	Flipkart	flipkart	Marketplace	https://www.flipkart.com	/logos/flipkart.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.486357	2026-02-01 01:31:26.486361
3705d1c4-eb0c-4b19-9f19-f2c59aceb594	Amazon	amazon	Marketplace	https://sellercentral.amazon.in	/logos/amazon.svg	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.4874	2026-02-01 01:31:26.487404
8bf827c3-cf37-43e7-a785-3f98ae806b3d	Meesho	meesho	Marketplace	https://supplier.meesho.com	/logos/meesho.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.488408	2026-02-01 01:31:26.488412
0e2ea9ea-c075-4c23-9cb1-454e74aacb22	Myntra	myntra	Marketplace	https://partners.myntra.com	/logos/myntra.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.489456	2026-02-01 01:31:26.48946
a6f21018-4602-4527-8334-5977965ca11f	AJIO	ajio	Marketplace	https://supplier.ajio.com	/logos/ajio.svg	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.490555	2026-02-01 01:31:26.490558
e1c4c9cf-6411-49ea-9df4-a4ba5c31856b	Nykaa	nykaa	Marketplace	https://www.nykaa.com/sell-on-nykaa	/logos/nykaa.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:26.491478	2026-02-01 01:31:26.491482
b0abc6fe-d205-40de-9592-e34b3022c2d4	BigCommerce	bigcommerce	Storefront	https://www.bigcommerce.com	https://cdn.brandfetch.io/bigcommerce.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.986102	2026-02-01 01:31:26.986107
11bb03ab-e655-4093-a0c8-b21eda6daa88	Dukaan	mydukaan	Storefront	https://mydukaan.io	/logos/mydukaan.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.987352	2026-02-01 01:31:26.987356
0ded556c-d96f-4150-8c4a-d73f3a7fa2a7	Ecwid	ecwid	Storefront	https://www.ecwid.com	/logos/ecwid.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.988408	2026-02-01 01:31:26.988412
e813566d-181e-4040-a253-4217f42a90b4	Fynd Platform	fynd	Storefront	https://platform.fynd.com	/logos/fynd.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.989616	2026-02-01 01:31:26.98962
e6f37893-607e-45df-a8f8-eb5769fdfe62	Squarespace Commerce	squarespace	Storefront	https://www.squarespace.com	/logos/squarespace.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.990669	2026-02-01 01:31:26.990673
2b9a3ec4-1e29-4321-a70b-39620a91c958	StoreHippo	storehippo	Storefront	https://www.storehippo.com	/logos/storehippo.svg	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.991653	2026-02-01 01:31:26.991656
678991a8-59b6-47eb-92fb-8790b43517cd	Webflow eCommerce	webflow	Storefront	https://webflow.com	/logos/webflow.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.99277	2026-02-01 01:31:26.992773
37539436-3b6f-4264-87f0-ca12ef78b1d3	Zoho Commerce	zoho_commerce	Storefront	https://www.zoho.com/commerce	/logos/zoho_commerce.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.993735	2026-02-01 01:31:26.993739
81fd4900-e607-43f0-a4db-2065caeeb5ad	FirstCry	firstcry	Marketplace	https://www.firstcry.com	/logos/firstcry.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.99465	2026-02-01 01:31:26.994653
65ce6f63-967e-4448-bd20-de2e6bddb730	JioMart	jiomart	Marketplace	https://www.jiomart.com	/logos/jiomart.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.995591	2026-02-01 01:31:26.995594
e954d129-1d61-42ef-9798-e14c75b519bd	Pepperfry	pepperfry	Marketplace	https://www.pepperfry.com	/logos/pepperfry.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.996538	2026-02-01 01:31:26.996541
8b3997da-b516-4ee3-a80a-1f98f72aa761	PharmEasy	pharmeasy	Marketplace	https://pharmeasy.in	/logos/pharmeasy.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.997491	2026-02-01 01:31:26.997495
77248324-39e6-4059-8ddc-d29122ea7ab2	Snapdeal	snapdeal	Marketplace	https://www.snapdeal.com	/logos/snapdeal.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.998481	2026-02-01 01:31:26.998485
8d21742c-b554-49f6-a051-1cedc958bdd0	Tata 1mg	tata_1mg	Marketplace	https://www.1mg.com	/logos/tata_1mg.svg	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:26.999414	2026-02-01 01:31:26.999417
51276d62-fcbe-43b7-bb54-e733ad0345ad	Tata CLiQ	tata_cliq	Marketplace	https://www.tatacliq.com	/logos/tata_cliq.svg	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:27.000389	2026-02-01 01:31:27.000393
83445713-08e4-47aa-a991-05f217fb640a	Blinkit	blinkit	QuickCommerce	https://blinkit.com/partner	/logos/blinkit.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:27.001353	2026-02-01 01:31:27.001357
de8af585-9b20-4b82-ac62-447985c7143d	Zepto	zepto	QuickCommerce	https://zeptonow.com	/logos/zepto.svg	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:27.002379	2026-02-01 01:31:27.002383
6f0f2731-5b59-49aa-980f-130292ae304b	Swiggy Instamart	swiggy_instamart	QuickCommerce	https://partner.swiggy.com	/logos/swiggy_instamart.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:27.003426	2026-02-01 01:31:27.003429
474d6f41-0bb9-4bf3-9a26-d321d3ec4fb6	Big Basket BBNow	bbnow	QuickCommerce	https://www.bigbasket.com/bbnow	/logos/bbnow.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:27.004307	2026-02-01 01:31:27.004311
6dc7be37-673c-45d4-9bb3-2714f1844fd3	Flipkart Minutes	flipkart_minutes	QuickCommerce	https://www.flipkart.com	/logos/flipkart_minutes.png	\N	\N	t	f	t	f	#000000	2026-02-01 01:31:27.005313	2026-02-01 01:31:27.005316
c9b7d594-6afe-49e0-bb1f-e4d7209f966a	ONDC	ondc	Network	https://ondc.org	/logos/ondc.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:27.00628	2026-02-01 01:31:27.006284
d3e622ec-6f5a-463e-bdc4-8de9b08ea89c	Instagram Shopping	instagram_shopping	SocialCommerce	https://business.instagram.com/shopping	/logos/instagram_shopping.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:27.007154	2026-02-01 01:31:27.007157
238e8337-b696-4152-bb14-5a8a363a82ec	WhatsApp Business	whatsapp_business	SocialCommerce	https://business.whatsapp.com	/logos/whatsapp_business.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:27.008121	2026-02-01 01:31:27.008125
fee1bf85-9193-48e3-b812-eab3f927ebf0	Bank Statements	bank_statements	Payment	\N	/logos/bank_statements.png	\N	\N	t	f	f	f	#000000	2026-02-01 01:31:25.589151	2026-02-01 01:31:25.589155
f2564ac5-26d4-43bb-903e-9921bb414c0f	Google Sites	google_sites	Storefront	https://sites.google.com	/logos/google_sites.png	\N	\N	t	f	f	f	#000000	2026-02-01 02:17:27.263115	2026-02-01 02:17:27.263163
\.


--
-- Data for Name: feedback_learning; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_learning (id, brand_id, generator_type, refusal_reason, learning_vector, created_at) FROM stdin;
\.


--
-- Data for Name: insight_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insight_feedback (id, insight_id, brand_id, status, verification_intent, verification_status, user_comment, created_at, verified_at) FROM stdin;
\.


--
-- Data for Name: insight_generation_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insight_generation_log (id, brand_id, generated_at, insights, briefing, generation_time_ms, validation_failures) FROM stdin;
\.


--
-- Data for Name: insight_impression; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insight_impression (id, brand_id, insight_id, shown_at, clicked, dismissed, action_taken) FROM stdin;
\.


--
-- Data for Name: insight_suppression; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insight_suppression (id, brand_id, insight_id, suppressed_until, reason) FROM stdin;
\.


--
-- Data for Name: integration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration (id, company_id, workspace_id, datasource_id, status, credentials, config, metadata_info, app_version, error_message, last_sync_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: integration_daily_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_daily_metric (created_by, updated_by, id, integration_id, company_id, snapshot_date, metric_type, total_sales, net_sales, gross_sales, count_primary, count_secondary, total_discounts, total_refunds, total_tax, total_shipping, average_value, currency, meta_data) FROM stdin;
\.


--
-- Data for Name: integration_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_metric (id, company_id, integration_id, metric_date, sync_attempts, sync_successes, sync_failures, avg_sync_duration_seconds, total_records_synced, total_data_volume_bytes, error_count, last_error_message, last_error_at, health_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: interview_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interview_session (id, company_id, user_id, status, transcript, metadata_info, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: module; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.module (id, name, description) FROM stdin;
truth_engine	Truth Engine	Core reconciliation and financial truth.
decision_cards	Decision Cards	AI-powered insights and action items.
connectors	Integrations	Shopify, Amazon, and Gateway connectors.
\.


--
-- Data for Name: onboarding_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_metric (id, user_id, started_at, completed_at, abandoned_at, basics_completed_at, channels_completed_at, stack_completed_at, finish_completed_at, basics_duration_seconds, channels_duration_seconds, stack_duration_seconds, finish_duration_seconds, total_duration_seconds, drawer_opens, search_uses, datasources_selected, integration_requests, last_step_visited, drop_off_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: onboarding_state; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_state (created_by, updated_by, id, user_id, current_page, current_step, is_completed, basics_data, channels_data, stack_data, finish_data, created_at, updated_at, last_saved_at) FROM stdin;
QrOwZmlu4ycKYdaUMz09rh0CoCc2	QrOwZmlu4ycKYdaUMz09rh0CoCc2	5a8ae6b2-529f-4124-bf2c-d7c34a1fba83	QrOwZmlu4ycKYdaUMz09rh0CoCc2	finish	1	t	{"companyName": "Tidal Food Ventures Private Limited", "brandName": "Mumbai Pav Co", "category": "QSR (Quick Service Restaurants)", "region": {"country": "India", "currency": "INR", "timezone": "Asia/Kolkata"}}	{}	{}	{}	2026-02-01 01:31:35.87856	2026-02-01 02:09:13.562689	2026-02-01 02:09:13.541932
\.


--
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permission (id, description) FROM stdin;
workspace:invite	Invite new members to workspace
workspace:remove	Remove members from workspace
truth:read	View truth engine metrics
truth:reconcile	Trigger manual reconciliation
billing:manage	Manage company billing
\.


--
-- Data for Name: shopify_address; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_address (created_by, updated_by, id, integration_id, company_id, shopify_customer_id, customer_id, shopify_address_id, first_name, last_name, company, address1, address2, city, province, country, zip, phone, name, province_code, country_code, country_name, "default", raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_analytics_snapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_analytics_snapshot (created_by, updated_by, id, integration_id, company_id, report_data_id, report_id, "timestamp", granularity, data, meta_data) FROM stdin;
\.


--
-- Data for Name: shopify_balance_transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_balance_transaction (created_by, updated_by, id, integration_id, company_id, shopify_transaction_id, payout_id, shopify_payout_id, type, test, amount, currency, fee, net, source_id, source_type, processed_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_checkout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_checkout (created_by, updated_by, id, integration_id, company_id, shopify_checkout_id, token, cart_token, email, abandoned_checkout_url, subtotal_price, total_price, total_tax, currency, shopify_created_at, shopify_updated_at, shopify_completed_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_customer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_customer (created_by, updated_by, id, integration_id, company_id, shopify_customer_id, email, first_name, last_name, phone, tags, orders_count, total_spent, currency, last_order_id, state, verified_email, accepts_marketing, default_address, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_daily_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_daily_metric (created_by, updated_by, id, integration_id, company_id, snapshot_date, total_sales, net_sales, order_count, customer_count_new, average_order_value, gross_sales, total_discounts, total_refunds, total_tax, total_shipping, currency, meta_data) FROM stdin;
\.


--
-- Data for Name: shopify_discount_code; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_discount_code (created_by, updated_by, id, integration_id, company_id, price_rule_id, shopify_price_rule_id, shopify_discount_code_id, code, usage_count, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_dispute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_dispute (created_by, updated_by, id, integration_id, company_id, shopify_dispute_id, order_id, type, amount, currency, reason, status, evidence_due_by, evidence_sent_on, finalized_on, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_fulfillment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_fulfillment (created_by, updated_by, id, integration_id, company_id, order_id, shopify_order_id, shopify_fulfillment_id, status, shipment_status, location_id, tracking_company, tracking_number, tracking_url, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_inventory_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_inventory_item (created_by, updated_by, id, integration_id, company_id, shopify_inventory_item_id, sku, tracked, cost, requires_shipping, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_inventory_level; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_inventory_level (created_by, updated_by, id, integration_id, company_id, shopify_inventory_item_id, shopify_location_id, available, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_line_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_line_item (created_by, updated_by, id, integration_id, company_id, order_id, shopify_line_item_id, product_id, variant_id, sku, title, variant_title, vendor, quantity, price, total_discount) FROM stdin;
\.


--
-- Data for Name: shopify_location; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_location (created_by, updated_by, id, integration_id, company_id, shopify_location_id, name, address1, address2, city, zip, province, country, phone, active, is_primary, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_marketing_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_marketing_event (created_by, updated_by, id, integration_id, company_id, shopify_marketing_event_id, type, description, marketing_channel, paid, manage_url, preview_url, started_at, ended_at, scheduled_to_end_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_order (created_by, updated_by, id, integration_id, company_id, shopify_order_id, shopify_order_number, shopify_name, financial_status, fulfillment_status, total_price, subtotal_price, total_tax, total_discounts, total_shipping, total_shipping_tax, refunded_subtotal, refunded_tax, currency, customer_id, email, shopify_created_at, shopify_updated_at, shopify_processed_at, shopify_closed_at, shopify_cancelled_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_payout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_payout (created_by, updated_by, id, integration_id, company_id, shopify_payout_id, date, currency, amount, status, processed_at, summary, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_price_rule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_price_rule (created_by, updated_by, id, integration_id, company_id, shopify_price_rule_id, title, value_type, value, target_type, target_selection, allocation_method, usage_limit, once_per_customer, starts_at, ends_at, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_product (created_by, updated_by, id, integration_id, company_id, shopify_product_id, title, handle, vendor, product_type, status, body_html, tags, published_at, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_product_image; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_product_image (created_by, updated_by, id, integration_id, company_id, product_id, shopify_image_id, src, alt, "position", width, height, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_product_variant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_product_variant (created_by, updated_by, id, integration_id, company_id, product_id, shopify_variant_id, shopify_inventory_item_id, title, sku, barcode, price, compare_at_price, weight, weight_unit, inventory_management, inventory_policy, inventory_quantity, shopify_created_at, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_raw_ingest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_raw_ingest (created_by, updated_by, id, integration_id, company_id, object_type, shopify_object_id, shopify_updated_at, dedupe_key, dedupe_hash_canonical, source, topic, api_version, headers, payload, hmac_valid, processing_status, error_message, diff_summary, fetched_at, processed_at) FROM stdin;
\.


--
-- Data for Name: shopify_refund; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_refund (created_by, updated_by, id, integration_id, company_id, order_id, shopify_refund_id, shopify_order_id, note, restock, refund_line_items, raw_payload, processed_at) FROM stdin;
\.


--
-- Data for Name: shopify_report; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_report (created_by, updated_by, id, integration_id, company_id, shopify_report_id, name, shopify_ql, category, shopify_updated_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: shopify_report_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_report_data (created_by, updated_by, id, integration_id, company_id, report_id, query_name, captured_at, data) FROM stdin;
\.


--
-- Data for Name: shopify_transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopify_transaction (created_by, updated_by, id, integration_id, company_id, order_id, shopify_transaction_id, shopify_order_id, parent_id, amount, currency, kind, status, gateway, "authorization", error_code, message, shopify_processed_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: system_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_metric (id, "timestamp", api_requests_total, api_requests_success, api_requests_error, avg_response_time_ms, db_connections_active, db_query_avg_time_ms, error_count, error_rate, cpu_usage_percent, memory_usage_percent, overall_health_score, created_at) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (email, full_name, linkedin_profile, picture_url, is_active, is_superuser, id, created_at, last_login_at, onboarding_completed, current_company_id, contact_number, otp_verified, designation, team, role, settings) FROM stdin;
tech.unclutr@gmail.com	John Doe	param-jain	https://lh3.googleusercontent.com/a/ACg8ocKKDmYR111jgsYB3N_EoaDWtghbUAMIlsHhTsfCJKpo_KkkHA=s96-c	t	f	QrOwZmlu4ycKYdaUMz09rh0CoCc2	2026-02-01 01:31:35.738638	2026-02-01 10:30:02.423916	t	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	+91 9876543210	f	CEO	Management	owner	{"intelligence_unlocked": true}
\.


--
-- Data for Name: user_metric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_metric (id, user_id, metric_date, session_count, total_session_duration_seconds, page_views, interactions, features_used, engagement_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workspace (created_by, updated_by, id, company_id, brand_id, name, timezone, created_at) FROM stdin;
QrOwZmlu4ycKYdaUMz09rh0CoCc2	QrOwZmlu4ycKYdaUMz09rh0CoCc2	b4d29909-8a2c-4a26-8c49-603220ca9572	44f28dfd-7143-4ed1-bc23-d4b8a5d2831d	886758a9-e45a-4085-851b-ae67551e48f9	Default	Asia/Kolkata	2026-02-01 01:32:50.903526
\.


--
-- Data for Name: workspace_membership; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workspace_membership (id, workspace_id, user_id, role, created_at) FROM stdin;
9e524fee-b7e9-4868-b000-0745057c12f8	b4d29909-8a2c-4a26-8c49-603220ca9572	QrOwZmlu4ycKYdaUMz09rh0CoCc2	OWNER	2026-02-01 01:32:50.906708
\.


--
-- Name: all_requests all_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.all_requests
    ADD CONSTRAINT all_requests_pkey PRIMARY KEY (id);


--
-- Name: archived_campaign_leads archived_campaign_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archived_campaign_leads
    ADD CONSTRAINT archived_campaign_leads_pkey PRIMARY KEY (id);


--
-- Name: archived_campaigns archived_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archived_campaigns
    ADD CONSTRAINT archived_campaigns_pkey PRIMARY KEY (id);


--
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (id);


--
-- Name: brand brand_company_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand
    ADD CONSTRAINT brand_company_id_name_key UNIQUE (company_id, name);


--
-- Name: brand_metric brand_metric_brand_id_metric_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_metric
    ADD CONSTRAINT brand_metric_brand_id_metric_date_key UNIQUE (brand_id, metric_date);


--
-- Name: brand_metric brand_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_metric
    ADD CONSTRAINT brand_metric_pkey PRIMARY KEY (id);


--
-- Name: brand brand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand
    ADD CONSTRAINT brand_pkey PRIMARY KEY (id);


--
-- Name: business_metric business_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_metric
    ADD CONSTRAINT business_metric_pkey PRIMARY KEY (id);


--
-- Name: calendar_connection calendar_connection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_connection
    ADD CONSTRAINT calendar_connection_pkey PRIMARY KEY (id);


--
-- Name: campaign_leads campaign_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_leads
    ADD CONSTRAINT campaign_leads_pkey PRIMARY KEY (id);


--
-- Name: campaigns_goals_details campaigns_goals_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns_goals_details
    ADD CONSTRAINT campaigns_goals_details_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: company_entitlement company_entitlement_company_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_entitlement
    ADD CONSTRAINT company_entitlement_company_id_module_id_key UNIQUE (company_id, module_id);


--
-- Name: company_entitlement company_entitlement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_entitlement
    ADD CONSTRAINT company_entitlement_pkey PRIMARY KEY (id);


--
-- Name: company_membership company_membership_company_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_membership
    ADD CONSTRAINT company_membership_company_id_user_id_key UNIQUE (company_id, user_id);


--
-- Name: company_membership company_membership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_membership
    ADD CONSTRAINT company_membership_pkey PRIMARY KEY (id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: data_source data_source_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_source
    ADD CONSTRAINT data_source_pkey PRIMARY KEY (id);


--
-- Name: feedback_learning feedback_learning_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_learning
    ADD CONSTRAINT feedback_learning_pkey PRIMARY KEY (id);


--
-- Name: insight_feedback insight_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_feedback
    ADD CONSTRAINT insight_feedback_pkey PRIMARY KEY (id);


--
-- Name: insight_generation_log insight_generation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_generation_log
    ADD CONSTRAINT insight_generation_log_pkey PRIMARY KEY (id);


--
-- Name: insight_impression insight_impression_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_impression
    ADD CONSTRAINT insight_impression_pkey PRIMARY KEY (id);


--
-- Name: insight_suppression insight_suppression_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_suppression
    ADD CONSTRAINT insight_suppression_pkey PRIMARY KEY (id);


--
-- Name: integration_daily_metric integration_daily_metric_integration_id_snapshot_date_metri_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_daily_metric
    ADD CONSTRAINT integration_daily_metric_integration_id_snapshot_date_metri_key UNIQUE (integration_id, snapshot_date, metric_type);


--
-- Name: integration_daily_metric integration_daily_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_daily_metric
    ADD CONSTRAINT integration_daily_metric_pkey PRIMARY KEY (id);


--
-- Name: integration_metric integration_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_metric
    ADD CONSTRAINT integration_metric_pkey PRIMARY KEY (id);


--
-- Name: integration integration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration
    ADD CONSTRAINT integration_pkey PRIMARY KEY (id);


--
-- Name: interview_session interview_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_session
    ADD CONSTRAINT interview_session_pkey PRIMARY KEY (id);


--
-- Name: module module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_pkey PRIMARY KEY (id);


--
-- Name: onboarding_metric onboarding_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_metric
    ADD CONSTRAINT onboarding_metric_pkey PRIMARY KEY (id);


--
-- Name: onboarding_state onboarding_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_state
    ADD CONSTRAINT onboarding_state_pkey PRIMARY KEY (id);


--
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);


--
-- Name: shopify_address shopify_address_integration_id_shopify_address_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_address
    ADD CONSTRAINT shopify_address_integration_id_shopify_address_id_key UNIQUE (integration_id, shopify_address_id);


--
-- Name: shopify_address shopify_address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_address
    ADD CONSTRAINT shopify_address_pkey PRIMARY KEY (id);


--
-- Name: shopify_analytics_snapshot shopify_analytics_snapshot_integration_id_report_data_id_ti_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_analytics_snapshot
    ADD CONSTRAINT shopify_analytics_snapshot_integration_id_report_data_id_ti_key UNIQUE (integration_id, report_data_id, "timestamp", granularity);


--
-- Name: shopify_analytics_snapshot shopify_analytics_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_analytics_snapshot
    ADD CONSTRAINT shopify_analytics_snapshot_pkey PRIMARY KEY (id);


--
-- Name: shopify_balance_transaction shopify_balance_transaction_integration_id_shopify_transact_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_balance_transaction
    ADD CONSTRAINT shopify_balance_transaction_integration_id_shopify_transact_key UNIQUE (integration_id, shopify_transaction_id);


--
-- Name: shopify_balance_transaction shopify_balance_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_balance_transaction
    ADD CONSTRAINT shopify_balance_transaction_pkey PRIMARY KEY (id);


--
-- Name: shopify_checkout shopify_checkout_integration_id_shopify_checkout_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_checkout
    ADD CONSTRAINT shopify_checkout_integration_id_shopify_checkout_id_key UNIQUE (integration_id, shopify_checkout_id);


--
-- Name: shopify_checkout shopify_checkout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_checkout
    ADD CONSTRAINT shopify_checkout_pkey PRIMARY KEY (id);


--
-- Name: shopify_customer shopify_customer_integration_id_shopify_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_customer
    ADD CONSTRAINT shopify_customer_integration_id_shopify_customer_id_key UNIQUE (integration_id, shopify_customer_id);


--
-- Name: shopify_customer shopify_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_customer
    ADD CONSTRAINT shopify_customer_pkey PRIMARY KEY (id);


--
-- Name: shopify_daily_metric shopify_daily_metric_integration_id_snapshot_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_daily_metric
    ADD CONSTRAINT shopify_daily_metric_integration_id_snapshot_date_key UNIQUE (integration_id, snapshot_date);


--
-- Name: shopify_daily_metric shopify_daily_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_daily_metric
    ADD CONSTRAINT shopify_daily_metric_pkey PRIMARY KEY (id);


--
-- Name: shopify_discount_code shopify_discount_code_integration_id_shopify_discount_code__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_discount_code
    ADD CONSTRAINT shopify_discount_code_integration_id_shopify_discount_code__key UNIQUE (integration_id, shopify_discount_code_id);


--
-- Name: shopify_discount_code shopify_discount_code_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_discount_code
    ADD CONSTRAINT shopify_discount_code_pkey PRIMARY KEY (id);


--
-- Name: shopify_dispute shopify_dispute_integration_id_shopify_dispute_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_dispute
    ADD CONSTRAINT shopify_dispute_integration_id_shopify_dispute_id_key UNIQUE (integration_id, shopify_dispute_id);


--
-- Name: shopify_dispute shopify_dispute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_dispute
    ADD CONSTRAINT shopify_dispute_pkey PRIMARY KEY (id);


--
-- Name: shopify_fulfillment shopify_fulfillment_integration_id_shopify_fulfillment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_fulfillment
    ADD CONSTRAINT shopify_fulfillment_integration_id_shopify_fulfillment_id_key UNIQUE (integration_id, shopify_fulfillment_id);


--
-- Name: shopify_fulfillment shopify_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_fulfillment
    ADD CONSTRAINT shopify_fulfillment_pkey PRIMARY KEY (id);


--
-- Name: shopify_inventory_item shopify_inventory_item_integration_id_shopify_inventory_ite_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_item
    ADD CONSTRAINT shopify_inventory_item_integration_id_shopify_inventory_ite_key UNIQUE (integration_id, shopify_inventory_item_id);


--
-- Name: shopify_inventory_item shopify_inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_item
    ADD CONSTRAINT shopify_inventory_item_pkey PRIMARY KEY (id);


--
-- Name: shopify_inventory_level shopify_inventory_level_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_level
    ADD CONSTRAINT shopify_inventory_level_pkey PRIMARY KEY (id);


--
-- Name: shopify_line_item shopify_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_line_item
    ADD CONSTRAINT shopify_line_item_pkey PRIMARY KEY (id);


--
-- Name: shopify_location shopify_location_integration_id_shopify_location_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_location
    ADD CONSTRAINT shopify_location_integration_id_shopify_location_id_key UNIQUE (integration_id, shopify_location_id);


--
-- Name: shopify_location shopify_location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_location
    ADD CONSTRAINT shopify_location_pkey PRIMARY KEY (id);


--
-- Name: shopify_marketing_event shopify_marketing_event_integration_id_shopify_marketing_ev_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_marketing_event
    ADD CONSTRAINT shopify_marketing_event_integration_id_shopify_marketing_ev_key UNIQUE (integration_id, shopify_marketing_event_id);


--
-- Name: shopify_marketing_event shopify_marketing_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_marketing_event
    ADD CONSTRAINT shopify_marketing_event_pkey PRIMARY KEY (id);


--
-- Name: shopify_order shopify_order_integration_id_shopify_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_order
    ADD CONSTRAINT shopify_order_integration_id_shopify_order_id_key UNIQUE (integration_id, shopify_order_id);


--
-- Name: shopify_order shopify_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_order
    ADD CONSTRAINT shopify_order_pkey PRIMARY KEY (id);


--
-- Name: shopify_payout shopify_payout_integration_id_shopify_payout_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_payout
    ADD CONSTRAINT shopify_payout_integration_id_shopify_payout_id_key UNIQUE (integration_id, shopify_payout_id);


--
-- Name: shopify_payout shopify_payout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_payout
    ADD CONSTRAINT shopify_payout_pkey PRIMARY KEY (id);


--
-- Name: shopify_price_rule shopify_price_rule_integration_id_shopify_price_rule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_price_rule
    ADD CONSTRAINT shopify_price_rule_integration_id_shopify_price_rule_id_key UNIQUE (integration_id, shopify_price_rule_id);


--
-- Name: shopify_price_rule shopify_price_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_price_rule
    ADD CONSTRAINT shopify_price_rule_pkey PRIMARY KEY (id);


--
-- Name: shopify_product_image shopify_product_image_integration_id_shopify_image_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_image
    ADD CONSTRAINT shopify_product_image_integration_id_shopify_image_id_key UNIQUE (integration_id, shopify_image_id);


--
-- Name: shopify_product_image shopify_product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_image
    ADD CONSTRAINT shopify_product_image_pkey PRIMARY KEY (id);


--
-- Name: shopify_product shopify_product_integration_id_shopify_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product
    ADD CONSTRAINT shopify_product_integration_id_shopify_product_id_key UNIQUE (integration_id, shopify_product_id);


--
-- Name: shopify_product shopify_product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product
    ADD CONSTRAINT shopify_product_pkey PRIMARY KEY (id);


--
-- Name: shopify_product_variant shopify_product_variant_integration_id_shopify_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_variant
    ADD CONSTRAINT shopify_product_variant_integration_id_shopify_variant_id_key UNIQUE (integration_id, shopify_variant_id);


--
-- Name: shopify_product_variant shopify_product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_variant
    ADD CONSTRAINT shopify_product_variant_pkey PRIMARY KEY (id);


--
-- Name: shopify_raw_ingest shopify_raw_ingest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_raw_ingest
    ADD CONSTRAINT shopify_raw_ingest_pkey PRIMARY KEY (id);


--
-- Name: shopify_refund shopify_refund_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_refund
    ADD CONSTRAINT shopify_refund_pkey PRIMARY KEY (id);


--
-- Name: shopify_report_data shopify_report_data_integration_id_query_name_captured_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report_data
    ADD CONSTRAINT shopify_report_data_integration_id_query_name_captured_at_key UNIQUE (integration_id, query_name, captured_at);


--
-- Name: shopify_report_data shopify_report_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report_data
    ADD CONSTRAINT shopify_report_data_pkey PRIMARY KEY (id);


--
-- Name: shopify_report shopify_report_integration_id_shopify_report_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report
    ADD CONSTRAINT shopify_report_integration_id_shopify_report_id_key UNIQUE (integration_id, shopify_report_id);


--
-- Name: shopify_report shopify_report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report
    ADD CONSTRAINT shopify_report_pkey PRIMARY KEY (id);


--
-- Name: shopify_transaction shopify_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_transaction
    ADD CONSTRAINT shopify_transaction_pkey PRIMARY KEY (id);


--
-- Name: system_metric system_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_metric
    ADD CONSTRAINT system_metric_pkey PRIMARY KEY (id);


--
-- Name: user_metric user_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_metric
    ADD CONSTRAINT user_metric_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: workspace workspace_brand_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_brand_id_name_key UNIQUE (brand_id, name);


--
-- Name: workspace_membership workspace_membership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_membership
    ADD CONSTRAINT workspace_membership_pkey PRIMARY KEY (id);


--
-- Name: workspace_membership workspace_membership_workspace_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_membership
    ADD CONSTRAINT workspace_membership_workspace_id_user_id_key UNIQUE (workspace_id, user_id);


--
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id);


--
-- Name: idx_campaigns_source_file_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_source_file_hash ON public.campaigns USING btree (source_file_hash);


--
-- Name: ix_all_requests_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_all_requests_name ON public.all_requests USING btree (name);


--
-- Name: ix_all_requests_request_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_all_requests_request_type ON public.all_requests USING btree (request_type);


--
-- Name: ix_all_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_all_requests_user_id ON public.all_requests USING btree (user_id);


--
-- Name: ix_archived_campaign_leads_original_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_archived_campaign_leads_original_campaign_id ON public.archived_campaign_leads USING btree (original_campaign_id);


--
-- Name: ix_archived_campaigns_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_archived_campaigns_company_id ON public.archived_campaigns USING btree (company_id);


--
-- Name: ix_archived_campaigns_original_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_archived_campaigns_original_campaign_id ON public.archived_campaigns USING btree (original_campaign_id);


--
-- Name: ix_archived_campaigns_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_archived_campaigns_user_id ON public.archived_campaigns USING btree (user_id);


--
-- Name: ix_audit_trail_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_trail_action ON public.audit_trail USING btree (action);


--
-- Name: ix_audit_trail_actor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_trail_actor_id ON public.audit_trail USING btree (actor_id);


--
-- Name: ix_audit_trail_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_trail_brand_id ON public.audit_trail USING btree (brand_id);


--
-- Name: ix_audit_trail_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_trail_company_id ON public.audit_trail USING btree (company_id);


--
-- Name: ix_audit_trail_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_trail_workspace_id ON public.audit_trail USING btree (workspace_id);


--
-- Name: ix_brand_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_brand_company_id ON public.brand USING btree (company_id);


--
-- Name: ix_brand_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_brand_created_by ON public.brand USING btree (created_by);


--
-- Name: ix_brand_metric_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_brand_metric_brand_id ON public.brand_metric USING btree (brand_id);


--
-- Name: ix_brand_metric_metric_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_brand_metric_metric_date ON public.brand_metric USING btree (metric_date);


--
-- Name: ix_brand_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_brand_name ON public.brand USING btree (name);


--
-- Name: ix_brand_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_brand_updated_by ON public.brand USING btree (updated_by);


--
-- Name: ix_business_metric_metric_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_business_metric_metric_date ON public.business_metric USING btree (metric_date);


--
-- Name: ix_calendar_connection_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_calendar_connection_company_id ON public.calendar_connection USING btree (company_id);


--
-- Name: ix_calendar_connection_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_calendar_connection_user_id ON public.calendar_connection USING btree (user_id);


--
-- Name: ix_campaign_leads_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_campaign_leads_campaign_id ON public.campaign_leads USING btree (campaign_id);


--
-- Name: ix_campaigns_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_campaigns_company_id ON public.campaigns USING btree (company_id);


--
-- Name: ix_campaigns_goals_details_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_campaigns_goals_details_agent_id ON public.campaigns_goals_details USING btree (agent_id);


--
-- Name: ix_campaigns_goals_details_bolna_execution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_campaigns_goals_details_bolna_execution_id ON public.campaigns_goals_details USING btree (bolna_execution_id);


--
-- Name: ix_campaigns_goals_details_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_campaigns_goals_details_campaign_id ON public.campaigns_goals_details USING btree (campaign_id);


--
-- Name: ix_campaigns_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_campaigns_user_id ON public.campaigns USING btree (user_id);


--
-- Name: ix_company_brand_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_brand_name ON public.company USING btree (brand_name);


--
-- Name: ix_company_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_created_by ON public.company USING btree (created_by);


--
-- Name: ix_company_entitlement_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_entitlement_company_id ON public.company_entitlement USING btree (company_id);


--
-- Name: ix_company_entitlement_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_entitlement_module_id ON public.company_entitlement USING btree (module_id);


--
-- Name: ix_company_membership_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_membership_company_id ON public.company_membership USING btree (company_id);


--
-- Name: ix_company_membership_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_membership_user_id ON public.company_membership USING btree (user_id);


--
-- Name: ix_company_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_updated_by ON public.company USING btree (updated_by);


--
-- Name: ix_data_source_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_data_source_category ON public.data_source USING btree (category);


--
-- Name: ix_data_source_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_data_source_name ON public.data_source USING btree (name);


--
-- Name: ix_data_source_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_data_source_slug ON public.data_source USING btree (slug);


--
-- Name: ix_feedback_learning_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feedback_learning_brand_id ON public.feedback_learning USING btree (brand_id);


--
-- Name: ix_insight_feedback_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_feedback_brand_id ON public.insight_feedback USING btree (brand_id);


--
-- Name: ix_insight_feedback_insight_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_feedback_insight_id ON public.insight_feedback USING btree (insight_id);


--
-- Name: ix_insight_generation_log_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_generation_log_brand_id ON public.insight_generation_log USING btree (brand_id);


--
-- Name: ix_insight_generation_log_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_generation_log_generated_at ON public.insight_generation_log USING btree (generated_at);


--
-- Name: ix_insight_impression_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_impression_brand_id ON public.insight_impression USING btree (brand_id);


--
-- Name: ix_insight_impression_insight_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_impression_insight_id ON public.insight_impression USING btree (insight_id);


--
-- Name: ix_insight_suppression_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_suppression_brand_id ON public.insight_suppression USING btree (brand_id);


--
-- Name: ix_insight_suppression_suppressed_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_insight_suppression_suppressed_until ON public.insight_suppression USING btree (suppressed_until);


--
-- Name: ix_integration_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_company_id ON public.integration USING btree (company_id);


--
-- Name: ix_integration_daily_metric_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_daily_metric_company_id ON public.integration_daily_metric USING btree (company_id);


--
-- Name: ix_integration_daily_metric_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_daily_metric_created_by ON public.integration_daily_metric USING btree (created_by);


--
-- Name: ix_integration_daily_metric_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_daily_metric_integration_id ON public.integration_daily_metric USING btree (integration_id);


--
-- Name: ix_integration_daily_metric_metric_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_daily_metric_metric_type ON public.integration_daily_metric USING btree (metric_type);


--
-- Name: ix_integration_daily_metric_snapshot_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_daily_metric_snapshot_date ON public.integration_daily_metric USING btree (snapshot_date);


--
-- Name: ix_integration_daily_metric_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_daily_metric_updated_by ON public.integration_daily_metric USING btree (updated_by);


--
-- Name: ix_integration_datasource_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_datasource_id ON public.integration USING btree (datasource_id);


--
-- Name: ix_integration_metric_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_metric_company_id ON public.integration_metric USING btree (company_id);


--
-- Name: ix_integration_metric_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_metric_integration_id ON public.integration_metric USING btree (integration_id);


--
-- Name: ix_integration_metric_metric_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_metric_metric_date ON public.integration_metric USING btree (metric_date);


--
-- Name: ix_integration_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integration_workspace_id ON public.integration USING btree (workspace_id);


--
-- Name: ix_interview_session_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_session_company_id ON public.interview_session USING btree (company_id);


--
-- Name: ix_interview_session_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_session_user_id ON public.interview_session USING btree (user_id);


--
-- Name: ix_onboarding_metric_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_onboarding_metric_user_id ON public.onboarding_metric USING btree (user_id);


--
-- Name: ix_onboarding_state_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_onboarding_state_created_by ON public.onboarding_state USING btree (created_by);


--
-- Name: ix_onboarding_state_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_onboarding_state_updated_by ON public.onboarding_state USING btree (updated_by);


--
-- Name: ix_onboarding_state_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_onboarding_state_user_id ON public.onboarding_state USING btree (user_id);


--
-- Name: ix_shopify_address_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_company_id ON public.shopify_address USING btree (company_id);


--
-- Name: ix_shopify_address_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_created_by ON public.shopify_address USING btree (created_by);


--
-- Name: ix_shopify_address_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_customer_id ON public.shopify_address USING btree (customer_id);


--
-- Name: ix_shopify_address_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_integration_id ON public.shopify_address USING btree (integration_id);


--
-- Name: ix_shopify_address_shopify_address_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_shopify_address_id ON public.shopify_address USING btree (shopify_address_id);


--
-- Name: ix_shopify_address_shopify_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_shopify_customer_id ON public.shopify_address USING btree (shopify_customer_id);


--
-- Name: ix_shopify_address_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_address_updated_by ON public.shopify_address USING btree (updated_by);


--
-- Name: ix_shopify_analytics_snapshot_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_company_id ON public.shopify_analytics_snapshot USING btree (company_id);


--
-- Name: ix_shopify_analytics_snapshot_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_created_by ON public.shopify_analytics_snapshot USING btree (created_by);


--
-- Name: ix_shopify_analytics_snapshot_granularity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_granularity ON public.shopify_analytics_snapshot USING btree (granularity);


--
-- Name: ix_shopify_analytics_snapshot_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_integration_id ON public.shopify_analytics_snapshot USING btree (integration_id);


--
-- Name: ix_shopify_analytics_snapshot_report_data_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_report_data_id ON public.shopify_analytics_snapshot USING btree (report_data_id);


--
-- Name: ix_shopify_analytics_snapshot_report_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_report_id ON public.shopify_analytics_snapshot USING btree (report_id);


--
-- Name: ix_shopify_analytics_snapshot_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_timestamp ON public.shopify_analytics_snapshot USING btree ("timestamp");


--
-- Name: ix_shopify_analytics_snapshot_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_analytics_snapshot_updated_by ON public.shopify_analytics_snapshot USING btree (updated_by);


--
-- Name: ix_shopify_balance_transaction_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_company_id ON public.shopify_balance_transaction USING btree (company_id);


--
-- Name: ix_shopify_balance_transaction_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_created_by ON public.shopify_balance_transaction USING btree (created_by);


--
-- Name: ix_shopify_balance_transaction_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_integration_id ON public.shopify_balance_transaction USING btree (integration_id);


--
-- Name: ix_shopify_balance_transaction_processed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_processed_at ON public.shopify_balance_transaction USING btree (processed_at);


--
-- Name: ix_shopify_balance_transaction_shopify_payout_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_shopify_payout_id ON public.shopify_balance_transaction USING btree (shopify_payout_id);


--
-- Name: ix_shopify_balance_transaction_shopify_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_shopify_transaction_id ON public.shopify_balance_transaction USING btree (shopify_transaction_id);


--
-- Name: ix_shopify_balance_transaction_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_type ON public.shopify_balance_transaction USING btree (type);


--
-- Name: ix_shopify_balance_transaction_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_balance_transaction_updated_by ON public.shopify_balance_transaction USING btree (updated_by);


--
-- Name: ix_shopify_checkout_cart_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_cart_token ON public.shopify_checkout USING btree (cart_token);


--
-- Name: ix_shopify_checkout_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_company_id ON public.shopify_checkout USING btree (company_id);


--
-- Name: ix_shopify_checkout_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_created_by ON public.shopify_checkout USING btree (created_by);


--
-- Name: ix_shopify_checkout_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_email ON public.shopify_checkout USING btree (email);


--
-- Name: ix_shopify_checkout_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_integration_id ON public.shopify_checkout USING btree (integration_id);


--
-- Name: ix_shopify_checkout_shopify_checkout_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_shopify_checkout_id ON public.shopify_checkout USING btree (shopify_checkout_id);


--
-- Name: ix_shopify_checkout_shopify_completed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_shopify_completed_at ON public.shopify_checkout USING btree (shopify_completed_at);


--
-- Name: ix_shopify_checkout_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_shopify_created_at ON public.shopify_checkout USING btree (shopify_created_at);


--
-- Name: ix_shopify_checkout_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_shopify_updated_at ON public.shopify_checkout USING btree (shopify_updated_at);


--
-- Name: ix_shopify_checkout_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_token ON public.shopify_checkout USING btree (token);


--
-- Name: ix_shopify_checkout_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_checkout_updated_by ON public.shopify_checkout USING btree (updated_by);


--
-- Name: ix_shopify_customer_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_company_id ON public.shopify_customer USING btree (company_id);


--
-- Name: ix_shopify_customer_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_created_by ON public.shopify_customer USING btree (created_by);


--
-- Name: ix_shopify_customer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_email ON public.shopify_customer USING btree (email);


--
-- Name: ix_shopify_customer_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_integration_id ON public.shopify_customer USING btree (integration_id);


--
-- Name: ix_shopify_customer_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_shopify_created_at ON public.shopify_customer USING btree (shopify_created_at);


--
-- Name: ix_shopify_customer_shopify_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_shopify_customer_id ON public.shopify_customer USING btree (shopify_customer_id);


--
-- Name: ix_shopify_customer_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_shopify_updated_at ON public.shopify_customer USING btree (shopify_updated_at);


--
-- Name: ix_shopify_customer_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_customer_updated_by ON public.shopify_customer USING btree (updated_by);


--
-- Name: ix_shopify_daily_metric_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_daily_metric_company_id ON public.shopify_daily_metric USING btree (company_id);


--
-- Name: ix_shopify_daily_metric_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_daily_metric_created_by ON public.shopify_daily_metric USING btree (created_by);


--
-- Name: ix_shopify_daily_metric_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_daily_metric_integration_id ON public.shopify_daily_metric USING btree (integration_id);


--
-- Name: ix_shopify_daily_metric_snapshot_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_daily_metric_snapshot_date ON public.shopify_daily_metric USING btree (snapshot_date);


--
-- Name: ix_shopify_daily_metric_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_daily_metric_updated_by ON public.shopify_daily_metric USING btree (updated_by);


--
-- Name: ix_shopify_discount_code_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_code ON public.shopify_discount_code USING btree (code);


--
-- Name: ix_shopify_discount_code_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_company_id ON public.shopify_discount_code USING btree (company_id);


--
-- Name: ix_shopify_discount_code_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_created_by ON public.shopify_discount_code USING btree (created_by);


--
-- Name: ix_shopify_discount_code_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_integration_id ON public.shopify_discount_code USING btree (integration_id);


--
-- Name: ix_shopify_discount_code_price_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_price_rule_id ON public.shopify_discount_code USING btree (price_rule_id);


--
-- Name: ix_shopify_discount_code_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_shopify_created_at ON public.shopify_discount_code USING btree (shopify_created_at);


--
-- Name: ix_shopify_discount_code_shopify_discount_code_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_shopify_discount_code_id ON public.shopify_discount_code USING btree (shopify_discount_code_id);


--
-- Name: ix_shopify_discount_code_shopify_price_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_shopify_price_rule_id ON public.shopify_discount_code USING btree (shopify_price_rule_id);


--
-- Name: ix_shopify_discount_code_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_shopify_updated_at ON public.shopify_discount_code USING btree (shopify_updated_at);


--
-- Name: ix_shopify_discount_code_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_discount_code_updated_by ON public.shopify_discount_code USING btree (updated_by);


--
-- Name: ix_shopify_dispute_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_company_id ON public.shopify_dispute USING btree (company_id);


--
-- Name: ix_shopify_dispute_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_created_by ON public.shopify_dispute USING btree (created_by);


--
-- Name: ix_shopify_dispute_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_integration_id ON public.shopify_dispute USING btree (integration_id);


--
-- Name: ix_shopify_dispute_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_order_id ON public.shopify_dispute USING btree (order_id);


--
-- Name: ix_shopify_dispute_shopify_dispute_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_shopify_dispute_id ON public.shopify_dispute USING btree (shopify_dispute_id);


--
-- Name: ix_shopify_dispute_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_status ON public.shopify_dispute USING btree (status);


--
-- Name: ix_shopify_dispute_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_type ON public.shopify_dispute USING btree (type);


--
-- Name: ix_shopify_dispute_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_dispute_updated_by ON public.shopify_dispute USING btree (updated_by);


--
-- Name: ix_shopify_fulfillment_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_company_id ON public.shopify_fulfillment USING btree (company_id);


--
-- Name: ix_shopify_fulfillment_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_created_by ON public.shopify_fulfillment USING btree (created_by);


--
-- Name: ix_shopify_fulfillment_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_integration_id ON public.shopify_fulfillment USING btree (integration_id);


--
-- Name: ix_shopify_fulfillment_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_order_id ON public.shopify_fulfillment USING btree (order_id);


--
-- Name: ix_shopify_fulfillment_shipment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_shipment_status ON public.shopify_fulfillment USING btree (shipment_status);


--
-- Name: ix_shopify_fulfillment_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_shopify_created_at ON public.shopify_fulfillment USING btree (shopify_created_at);


--
-- Name: ix_shopify_fulfillment_shopify_fulfillment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_shopify_fulfillment_id ON public.shopify_fulfillment USING btree (shopify_fulfillment_id);


--
-- Name: ix_shopify_fulfillment_shopify_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_shopify_order_id ON public.shopify_fulfillment USING btree (shopify_order_id);


--
-- Name: ix_shopify_fulfillment_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_shopify_updated_at ON public.shopify_fulfillment USING btree (shopify_updated_at);


--
-- Name: ix_shopify_fulfillment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_status ON public.shopify_fulfillment USING btree (status);


--
-- Name: ix_shopify_fulfillment_tracking_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_tracking_number ON public.shopify_fulfillment USING btree (tracking_number);


--
-- Name: ix_shopify_fulfillment_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_fulfillment_updated_by ON public.shopify_fulfillment USING btree (updated_by);


--
-- Name: ix_shopify_inventory_item_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_item_company_id ON public.shopify_inventory_item USING btree (company_id);


--
-- Name: ix_shopify_inventory_item_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_item_created_by ON public.shopify_inventory_item USING btree (created_by);


--
-- Name: ix_shopify_inventory_item_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_item_integration_id ON public.shopify_inventory_item USING btree (integration_id);


--
-- Name: ix_shopify_inventory_item_shopify_inventory_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_item_shopify_inventory_item_id ON public.shopify_inventory_item USING btree (shopify_inventory_item_id);


--
-- Name: ix_shopify_inventory_item_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_item_sku ON public.shopify_inventory_item USING btree (sku);


--
-- Name: ix_shopify_inventory_item_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_item_updated_by ON public.shopify_inventory_item USING btree (updated_by);


--
-- Name: ix_shopify_inventory_level_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_company_id ON public.shopify_inventory_level USING btree (company_id);


--
-- Name: ix_shopify_inventory_level_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_created_by ON public.shopify_inventory_level USING btree (created_by);


--
-- Name: ix_shopify_inventory_level_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_integration_id ON public.shopify_inventory_level USING btree (integration_id);


--
-- Name: ix_shopify_inventory_level_shopify_inventory_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_shopify_inventory_item_id ON public.shopify_inventory_level USING btree (shopify_inventory_item_id);


--
-- Name: ix_shopify_inventory_level_shopify_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_shopify_location_id ON public.shopify_inventory_level USING btree (shopify_location_id);


--
-- Name: ix_shopify_inventory_level_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_shopify_updated_at ON public.shopify_inventory_level USING btree (shopify_updated_at);


--
-- Name: ix_shopify_inventory_level_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_inventory_level_updated_by ON public.shopify_inventory_level USING btree (updated_by);


--
-- Name: ix_shopify_line_item_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_company_id ON public.shopify_line_item USING btree (company_id);


--
-- Name: ix_shopify_line_item_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_created_by ON public.shopify_line_item USING btree (created_by);


--
-- Name: ix_shopify_line_item_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_integration_id ON public.shopify_line_item USING btree (integration_id);


--
-- Name: ix_shopify_line_item_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_order_id ON public.shopify_line_item USING btree (order_id);


--
-- Name: ix_shopify_line_item_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_product_id ON public.shopify_line_item USING btree (product_id);


--
-- Name: ix_shopify_line_item_shopify_line_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_shopify_line_item_id ON public.shopify_line_item USING btree (shopify_line_item_id);


--
-- Name: ix_shopify_line_item_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_sku ON public.shopify_line_item USING btree (sku);


--
-- Name: ix_shopify_line_item_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_updated_by ON public.shopify_line_item USING btree (updated_by);


--
-- Name: ix_shopify_line_item_variant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_line_item_variant_id ON public.shopify_line_item USING btree (variant_id);


--
-- Name: ix_shopify_location_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_company_id ON public.shopify_location USING btree (company_id);


--
-- Name: ix_shopify_location_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_created_by ON public.shopify_location USING btree (created_by);


--
-- Name: ix_shopify_location_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_integration_id ON public.shopify_location USING btree (integration_id);


--
-- Name: ix_shopify_location_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_name ON public.shopify_location USING btree (name);


--
-- Name: ix_shopify_location_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_shopify_created_at ON public.shopify_location USING btree (shopify_created_at);


--
-- Name: ix_shopify_location_shopify_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_shopify_location_id ON public.shopify_location USING btree (shopify_location_id);


--
-- Name: ix_shopify_location_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_shopify_updated_at ON public.shopify_location USING btree (shopify_updated_at);


--
-- Name: ix_shopify_location_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_location_updated_by ON public.shopify_location USING btree (updated_by);


--
-- Name: ix_shopify_marketing_event_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_company_id ON public.shopify_marketing_event USING btree (company_id);


--
-- Name: ix_shopify_marketing_event_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_created_by ON public.shopify_marketing_event USING btree (created_by);


--
-- Name: ix_shopify_marketing_event_ended_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_ended_at ON public.shopify_marketing_event USING btree (ended_at);


--
-- Name: ix_shopify_marketing_event_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_integration_id ON public.shopify_marketing_event USING btree (integration_id);


--
-- Name: ix_shopify_marketing_event_marketing_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_marketing_channel ON public.shopify_marketing_event USING btree (marketing_channel);


--
-- Name: ix_shopify_marketing_event_shopify_marketing_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_shopify_marketing_event_id ON public.shopify_marketing_event USING btree (shopify_marketing_event_id);


--
-- Name: ix_shopify_marketing_event_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_started_at ON public.shopify_marketing_event USING btree (started_at);


--
-- Name: ix_shopify_marketing_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_type ON public.shopify_marketing_event USING btree (type);


--
-- Name: ix_shopify_marketing_event_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_marketing_event_updated_by ON public.shopify_marketing_event USING btree (updated_by);


--
-- Name: ix_shopify_order_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_company_id ON public.shopify_order USING btree (company_id);


--
-- Name: ix_shopify_order_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_created_by ON public.shopify_order USING btree (created_by);


--
-- Name: ix_shopify_order_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_email ON public.shopify_order USING btree (email);


--
-- Name: ix_shopify_order_financial_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_financial_status ON public.shopify_order USING btree (financial_status);


--
-- Name: ix_shopify_order_fulfillment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_fulfillment_status ON public.shopify_order USING btree (fulfillment_status);


--
-- Name: ix_shopify_order_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_integration_id ON public.shopify_order USING btree (integration_id);


--
-- Name: ix_shopify_order_shopify_cancelled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_shopify_cancelled_at ON public.shopify_order USING btree (shopify_cancelled_at);


--
-- Name: ix_shopify_order_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_shopify_created_at ON public.shopify_order USING btree (shopify_created_at);


--
-- Name: ix_shopify_order_shopify_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_shopify_name ON public.shopify_order USING btree (shopify_name);


--
-- Name: ix_shopify_order_shopify_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_shopify_order_id ON public.shopify_order USING btree (shopify_order_id);


--
-- Name: ix_shopify_order_shopify_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_shopify_order_number ON public.shopify_order USING btree (shopify_order_number);


--
-- Name: ix_shopify_order_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_shopify_updated_at ON public.shopify_order USING btree (shopify_updated_at);


--
-- Name: ix_shopify_order_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_order_updated_by ON public.shopify_order USING btree (updated_by);


--
-- Name: ix_shopify_payout_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_company_id ON public.shopify_payout USING btree (company_id);


--
-- Name: ix_shopify_payout_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_created_by ON public.shopify_payout USING btree (created_by);


--
-- Name: ix_shopify_payout_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_date ON public.shopify_payout USING btree (date);


--
-- Name: ix_shopify_payout_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_integration_id ON public.shopify_payout USING btree (integration_id);


--
-- Name: ix_shopify_payout_shopify_payout_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_shopify_payout_id ON public.shopify_payout USING btree (shopify_payout_id);


--
-- Name: ix_shopify_payout_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_status ON public.shopify_payout USING btree (status);


--
-- Name: ix_shopify_payout_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_payout_updated_by ON public.shopify_payout USING btree (updated_by);


--
-- Name: ix_shopify_price_rule_allocation_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_allocation_method ON public.shopify_price_rule USING btree (allocation_method);


--
-- Name: ix_shopify_price_rule_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_company_id ON public.shopify_price_rule USING btree (company_id);


--
-- Name: ix_shopify_price_rule_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_created_by ON public.shopify_price_rule USING btree (created_by);


--
-- Name: ix_shopify_price_rule_ends_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_ends_at ON public.shopify_price_rule USING btree (ends_at);


--
-- Name: ix_shopify_price_rule_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_integration_id ON public.shopify_price_rule USING btree (integration_id);


--
-- Name: ix_shopify_price_rule_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_shopify_created_at ON public.shopify_price_rule USING btree (shopify_created_at);


--
-- Name: ix_shopify_price_rule_shopify_price_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_shopify_price_rule_id ON public.shopify_price_rule USING btree (shopify_price_rule_id);


--
-- Name: ix_shopify_price_rule_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_shopify_updated_at ON public.shopify_price_rule USING btree (shopify_updated_at);


--
-- Name: ix_shopify_price_rule_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_starts_at ON public.shopify_price_rule USING btree (starts_at);


--
-- Name: ix_shopify_price_rule_target_selection; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_target_selection ON public.shopify_price_rule USING btree (target_selection);


--
-- Name: ix_shopify_price_rule_target_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_target_type ON public.shopify_price_rule USING btree (target_type);


--
-- Name: ix_shopify_price_rule_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_title ON public.shopify_price_rule USING btree (title);


--
-- Name: ix_shopify_price_rule_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_updated_by ON public.shopify_price_rule USING btree (updated_by);


--
-- Name: ix_shopify_price_rule_value_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_price_rule_value_type ON public.shopify_price_rule USING btree (value_type);


--
-- Name: ix_shopify_product_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_company_id ON public.shopify_product USING btree (company_id);


--
-- Name: ix_shopify_product_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_created_by ON public.shopify_product USING btree (created_by);


--
-- Name: ix_shopify_product_handle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_handle ON public.shopify_product USING btree (handle);


--
-- Name: ix_shopify_product_image_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_company_id ON public.shopify_product_image USING btree (company_id);


--
-- Name: ix_shopify_product_image_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_created_by ON public.shopify_product_image USING btree (created_by);


--
-- Name: ix_shopify_product_image_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_integration_id ON public.shopify_product_image USING btree (integration_id);


--
-- Name: ix_shopify_product_image_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_product_id ON public.shopify_product_image USING btree (product_id);


--
-- Name: ix_shopify_product_image_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_shopify_created_at ON public.shopify_product_image USING btree (shopify_created_at);


--
-- Name: ix_shopify_product_image_shopify_image_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_shopify_image_id ON public.shopify_product_image USING btree (shopify_image_id);


--
-- Name: ix_shopify_product_image_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_shopify_updated_at ON public.shopify_product_image USING btree (shopify_updated_at);


--
-- Name: ix_shopify_product_image_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_image_updated_by ON public.shopify_product_image USING btree (updated_by);


--
-- Name: ix_shopify_product_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_integration_id ON public.shopify_product USING btree (integration_id);


--
-- Name: ix_shopify_product_product_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_product_type ON public.shopify_product USING btree (product_type);


--
-- Name: ix_shopify_product_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_published_at ON public.shopify_product USING btree (published_at);


--
-- Name: ix_shopify_product_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_shopify_created_at ON public.shopify_product USING btree (shopify_created_at);


--
-- Name: ix_shopify_product_shopify_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_shopify_product_id ON public.shopify_product USING btree (shopify_product_id);


--
-- Name: ix_shopify_product_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_shopify_updated_at ON public.shopify_product USING btree (shopify_updated_at);


--
-- Name: ix_shopify_product_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_status ON public.shopify_product USING btree (status);


--
-- Name: ix_shopify_product_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_title ON public.shopify_product USING btree (title);


--
-- Name: ix_shopify_product_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_updated_by ON public.shopify_product USING btree (updated_by);


--
-- Name: ix_shopify_product_variant_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_barcode ON public.shopify_product_variant USING btree (barcode);


--
-- Name: ix_shopify_product_variant_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_company_id ON public.shopify_product_variant USING btree (company_id);


--
-- Name: ix_shopify_product_variant_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_created_by ON public.shopify_product_variant USING btree (created_by);


--
-- Name: ix_shopify_product_variant_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_integration_id ON public.shopify_product_variant USING btree (integration_id);


--
-- Name: ix_shopify_product_variant_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_product_id ON public.shopify_product_variant USING btree (product_id);


--
-- Name: ix_shopify_product_variant_shopify_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_shopify_created_at ON public.shopify_product_variant USING btree (shopify_created_at);


--
-- Name: ix_shopify_product_variant_shopify_inventory_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_shopify_inventory_item_id ON public.shopify_product_variant USING btree (shopify_inventory_item_id);


--
-- Name: ix_shopify_product_variant_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_shopify_updated_at ON public.shopify_product_variant USING btree (shopify_updated_at);


--
-- Name: ix_shopify_product_variant_shopify_variant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_shopify_variant_id ON public.shopify_product_variant USING btree (shopify_variant_id);


--
-- Name: ix_shopify_product_variant_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_sku ON public.shopify_product_variant USING btree (sku);


--
-- Name: ix_shopify_product_variant_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_title ON public.shopify_product_variant USING btree (title);


--
-- Name: ix_shopify_product_variant_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_variant_updated_by ON public.shopify_product_variant USING btree (updated_by);


--
-- Name: ix_shopify_product_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_product_vendor ON public.shopify_product USING btree (vendor);


--
-- Name: ix_shopify_raw_ingest_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_company_id ON public.shopify_raw_ingest USING btree (company_id);


--
-- Name: ix_shopify_raw_ingest_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_created_by ON public.shopify_raw_ingest USING btree (created_by);


--
-- Name: ix_shopify_raw_ingest_dedupe_hash_canonical; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_dedupe_hash_canonical ON public.shopify_raw_ingest USING btree (dedupe_hash_canonical);


--
-- Name: ix_shopify_raw_ingest_dedupe_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_dedupe_key ON public.shopify_raw_ingest USING btree (dedupe_key);


--
-- Name: ix_shopify_raw_ingest_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_integration_id ON public.shopify_raw_ingest USING btree (integration_id);


--
-- Name: ix_shopify_raw_ingest_object_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_object_type ON public.shopify_raw_ingest USING btree (object_type);


--
-- Name: ix_shopify_raw_ingest_processing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_processing_status ON public.shopify_raw_ingest USING btree (processing_status);


--
-- Name: ix_shopify_raw_ingest_shopify_object_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_shopify_object_id ON public.shopify_raw_ingest USING btree (shopify_object_id);


--
-- Name: ix_shopify_raw_ingest_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_shopify_updated_at ON public.shopify_raw_ingest USING btree (shopify_updated_at);


--
-- Name: ix_shopify_raw_ingest_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_raw_ingest_updated_by ON public.shopify_raw_ingest USING btree (updated_by);


--
-- Name: ix_shopify_refund_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_company_id ON public.shopify_refund USING btree (company_id);


--
-- Name: ix_shopify_refund_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_created_by ON public.shopify_refund USING btree (created_by);


--
-- Name: ix_shopify_refund_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_integration_id ON public.shopify_refund USING btree (integration_id);


--
-- Name: ix_shopify_refund_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_order_id ON public.shopify_refund USING btree (order_id);


--
-- Name: ix_shopify_refund_processed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_processed_at ON public.shopify_refund USING btree (processed_at);


--
-- Name: ix_shopify_refund_shopify_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_shopify_order_id ON public.shopify_refund USING btree (shopify_order_id);


--
-- Name: ix_shopify_refund_shopify_refund_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_shopify_refund_shopify_refund_id ON public.shopify_refund USING btree (shopify_refund_id);


--
-- Name: ix_shopify_refund_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_refund_updated_by ON public.shopify_refund USING btree (updated_by);


--
-- Name: ix_shopify_report_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_company_id ON public.shopify_report USING btree (company_id);


--
-- Name: ix_shopify_report_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_created_by ON public.shopify_report USING btree (created_by);


--
-- Name: ix_shopify_report_data_captured_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_captured_at ON public.shopify_report_data USING btree (captured_at);


--
-- Name: ix_shopify_report_data_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_company_id ON public.shopify_report_data USING btree (company_id);


--
-- Name: ix_shopify_report_data_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_created_by ON public.shopify_report_data USING btree (created_by);


--
-- Name: ix_shopify_report_data_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_integration_id ON public.shopify_report_data USING btree (integration_id);


--
-- Name: ix_shopify_report_data_query_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_query_name ON public.shopify_report_data USING btree (query_name);


--
-- Name: ix_shopify_report_data_report_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_report_id ON public.shopify_report_data USING btree (report_id);


--
-- Name: ix_shopify_report_data_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_data_updated_by ON public.shopify_report_data USING btree (updated_by);


--
-- Name: ix_shopify_report_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_integration_id ON public.shopify_report USING btree (integration_id);


--
-- Name: ix_shopify_report_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_name ON public.shopify_report USING btree (name);


--
-- Name: ix_shopify_report_shopify_report_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_shopify_report_id ON public.shopify_report USING btree (shopify_report_id);


--
-- Name: ix_shopify_report_shopify_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_shopify_updated_at ON public.shopify_report USING btree (shopify_updated_at);


--
-- Name: ix_shopify_report_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_report_updated_by ON public.shopify_report USING btree (updated_by);


--
-- Name: ix_shopify_transaction_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_company_id ON public.shopify_transaction USING btree (company_id);


--
-- Name: ix_shopify_transaction_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_created_by ON public.shopify_transaction USING btree (created_by);


--
-- Name: ix_shopify_transaction_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_currency ON public.shopify_transaction USING btree (currency);


--
-- Name: ix_shopify_transaction_integration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_integration_id ON public.shopify_transaction USING btree (integration_id);


--
-- Name: ix_shopify_transaction_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_kind ON public.shopify_transaction USING btree (kind);


--
-- Name: ix_shopify_transaction_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_order_id ON public.shopify_transaction USING btree (order_id);


--
-- Name: ix_shopify_transaction_shopify_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_shopify_order_id ON public.shopify_transaction USING btree (shopify_order_id);


--
-- Name: ix_shopify_transaction_shopify_processed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_shopify_processed_at ON public.shopify_transaction USING btree (shopify_processed_at);


--
-- Name: ix_shopify_transaction_shopify_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_shopify_transaction_shopify_transaction_id ON public.shopify_transaction USING btree (shopify_transaction_id);


--
-- Name: ix_shopify_transaction_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_status ON public.shopify_transaction USING btree (status);


--
-- Name: ix_shopify_transaction_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shopify_transaction_updated_by ON public.shopify_transaction USING btree (updated_by);


--
-- Name: ix_system_metric_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_system_metric_timestamp ON public.system_metric USING btree ("timestamp");


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: ix_user_metric_metric_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_metric_metric_date ON public.user_metric USING btree (metric_date);


--
-- Name: ix_user_metric_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_metric_user_id ON public.user_metric USING btree (user_id);


--
-- Name: ix_workspace_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_brand_id ON public.workspace USING btree (brand_id);


--
-- Name: ix_workspace_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_company_id ON public.workspace USING btree (company_id);


--
-- Name: ix_workspace_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_created_by ON public.workspace USING btree (created_by);


--
-- Name: ix_workspace_membership_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_membership_user_id ON public.workspace_membership USING btree (user_id);


--
-- Name: ix_workspace_membership_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_membership_workspace_id ON public.workspace_membership USING btree (workspace_id);


--
-- Name: ix_workspace_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_name ON public.workspace USING btree (name);


--
-- Name: ix_workspace_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_workspace_updated_by ON public.workspace USING btree (updated_by);


--
-- Name: brand brand_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand
    ADD CONSTRAINT brand_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: brand_metric brand_metric_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_metric
    ADD CONSTRAINT brand_metric_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: campaign_leads campaign_leads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_leads
    ADD CONSTRAINT campaign_leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: campaigns_goals_details campaigns_goals_details_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns_goals_details
    ADD CONSTRAINT campaigns_goals_details_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: company_entitlement company_entitlement_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_entitlement
    ADD CONSTRAINT company_entitlement_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: company_entitlement company_entitlement_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_entitlement
    ADD CONSTRAINT company_entitlement_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.module(id);


--
-- Name: company_membership company_membership_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_membership
    ADD CONSTRAINT company_membership_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: company_membership company_membership_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_membership
    ADD CONSTRAINT company_membership_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: insight_generation_log insight_generation_log_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_generation_log
    ADD CONSTRAINT insight_generation_log_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: insight_impression insight_impression_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_impression
    ADD CONSTRAINT insight_impression_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: insight_suppression insight_suppression_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_suppression
    ADD CONSTRAINT insight_suppression_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: integration integration_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration
    ADD CONSTRAINT integration_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: integration_daily_metric integration_daily_metric_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_daily_metric
    ADD CONSTRAINT integration_daily_metric_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: integration_daily_metric integration_daily_metric_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_daily_metric
    ADD CONSTRAINT integration_daily_metric_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: integration integration_datasource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration
    ADD CONSTRAINT integration_datasource_id_fkey FOREIGN KEY (datasource_id) REFERENCES public.data_source(id);


--
-- Name: integration_metric integration_metric_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_metric
    ADD CONSTRAINT integration_metric_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: integration_metric integration_metric_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_metric
    ADD CONSTRAINT integration_metric_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: integration integration_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration
    ADD CONSTRAINT integration_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspace(id);


--
-- Name: onboarding_metric onboarding_metric_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_metric
    ADD CONSTRAINT onboarding_metric_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: shopify_address shopify_address_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_address
    ADD CONSTRAINT shopify_address_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_address shopify_address_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_address
    ADD CONSTRAINT shopify_address_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.shopify_customer(id) ON DELETE CASCADE;


--
-- Name: shopify_address shopify_address_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_address
    ADD CONSTRAINT shopify_address_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_analytics_snapshot shopify_analytics_snapshot_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_analytics_snapshot
    ADD CONSTRAINT shopify_analytics_snapshot_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_analytics_snapshot shopify_analytics_snapshot_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_analytics_snapshot
    ADD CONSTRAINT shopify_analytics_snapshot_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_analytics_snapshot shopify_analytics_snapshot_report_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_analytics_snapshot
    ADD CONSTRAINT shopify_analytics_snapshot_report_data_id_fkey FOREIGN KEY (report_data_id) REFERENCES public.shopify_report_data(id) ON DELETE CASCADE;


--
-- Name: shopify_analytics_snapshot shopify_analytics_snapshot_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_analytics_snapshot
    ADD CONSTRAINT shopify_analytics_snapshot_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.shopify_report(id) ON DELETE CASCADE;


--
-- Name: shopify_balance_transaction shopify_balance_transaction_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_balance_transaction
    ADD CONSTRAINT shopify_balance_transaction_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_balance_transaction shopify_balance_transaction_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_balance_transaction
    ADD CONSTRAINT shopify_balance_transaction_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_balance_transaction shopify_balance_transaction_payout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_balance_transaction
    ADD CONSTRAINT shopify_balance_transaction_payout_id_fkey FOREIGN KEY (payout_id) REFERENCES public.shopify_payout(id);


--
-- Name: shopify_checkout shopify_checkout_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_checkout
    ADD CONSTRAINT shopify_checkout_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_checkout shopify_checkout_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_checkout
    ADD CONSTRAINT shopify_checkout_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_customer shopify_customer_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_customer
    ADD CONSTRAINT shopify_customer_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_customer shopify_customer_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_customer
    ADD CONSTRAINT shopify_customer_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_daily_metric shopify_daily_metric_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_daily_metric
    ADD CONSTRAINT shopify_daily_metric_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_daily_metric shopify_daily_metric_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_daily_metric
    ADD CONSTRAINT shopify_daily_metric_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_discount_code shopify_discount_code_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_discount_code
    ADD CONSTRAINT shopify_discount_code_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_discount_code shopify_discount_code_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_discount_code
    ADD CONSTRAINT shopify_discount_code_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_discount_code shopify_discount_code_price_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_discount_code
    ADD CONSTRAINT shopify_discount_code_price_rule_id_fkey FOREIGN KEY (price_rule_id) REFERENCES public.shopify_price_rule(id) ON DELETE CASCADE;


--
-- Name: shopify_dispute shopify_dispute_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_dispute
    ADD CONSTRAINT shopify_dispute_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_dispute shopify_dispute_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_dispute
    ADD CONSTRAINT shopify_dispute_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_fulfillment shopify_fulfillment_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_fulfillment
    ADD CONSTRAINT shopify_fulfillment_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_fulfillment shopify_fulfillment_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_fulfillment
    ADD CONSTRAINT shopify_fulfillment_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_fulfillment shopify_fulfillment_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_fulfillment
    ADD CONSTRAINT shopify_fulfillment_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.shopify_order(id) ON DELETE CASCADE;


--
-- Name: shopify_inventory_item shopify_inventory_item_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_item
    ADD CONSTRAINT shopify_inventory_item_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_inventory_item shopify_inventory_item_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_item
    ADD CONSTRAINT shopify_inventory_item_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_inventory_level shopify_inventory_level_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_level
    ADD CONSTRAINT shopify_inventory_level_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_inventory_level shopify_inventory_level_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_inventory_level
    ADD CONSTRAINT shopify_inventory_level_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_line_item shopify_line_item_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_line_item
    ADD CONSTRAINT shopify_line_item_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_line_item shopify_line_item_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_line_item
    ADD CONSTRAINT shopify_line_item_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_line_item shopify_line_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_line_item
    ADD CONSTRAINT shopify_line_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.shopify_order(id) ON DELETE CASCADE;


--
-- Name: shopify_location shopify_location_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_location
    ADD CONSTRAINT shopify_location_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_location shopify_location_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_location
    ADD CONSTRAINT shopify_location_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_marketing_event shopify_marketing_event_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_marketing_event
    ADD CONSTRAINT shopify_marketing_event_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_marketing_event shopify_marketing_event_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_marketing_event
    ADD CONSTRAINT shopify_marketing_event_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_order shopify_order_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_order
    ADD CONSTRAINT shopify_order_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_order shopify_order_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_order
    ADD CONSTRAINT shopify_order_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.shopify_customer(id);


--
-- Name: shopify_order shopify_order_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_order
    ADD CONSTRAINT shopify_order_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_payout shopify_payout_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_payout
    ADD CONSTRAINT shopify_payout_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_payout shopify_payout_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_payout
    ADD CONSTRAINT shopify_payout_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_price_rule shopify_price_rule_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_price_rule
    ADD CONSTRAINT shopify_price_rule_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_price_rule shopify_price_rule_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_price_rule
    ADD CONSTRAINT shopify_price_rule_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_product shopify_product_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product
    ADD CONSTRAINT shopify_product_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_product_image shopify_product_image_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_image
    ADD CONSTRAINT shopify_product_image_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_product_image shopify_product_image_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_image
    ADD CONSTRAINT shopify_product_image_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_product_image shopify_product_image_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_image
    ADD CONSTRAINT shopify_product_image_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.shopify_product(id);


--
-- Name: shopify_product shopify_product_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product
    ADD CONSTRAINT shopify_product_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_product_variant shopify_product_variant_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_variant
    ADD CONSTRAINT shopify_product_variant_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_product_variant shopify_product_variant_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_variant
    ADD CONSTRAINT shopify_product_variant_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_product_variant shopify_product_variant_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_product_variant
    ADD CONSTRAINT shopify_product_variant_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.shopify_product(id);


--
-- Name: shopify_raw_ingest shopify_raw_ingest_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_raw_ingest
    ADD CONSTRAINT shopify_raw_ingest_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_raw_ingest shopify_raw_ingest_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_raw_ingest
    ADD CONSTRAINT shopify_raw_ingest_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_refund shopify_refund_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_refund
    ADD CONSTRAINT shopify_refund_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_refund shopify_refund_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_refund
    ADD CONSTRAINT shopify_refund_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_refund shopify_refund_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_refund
    ADD CONSTRAINT shopify_refund_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.shopify_order(id) ON DELETE CASCADE;


--
-- Name: shopify_report shopify_report_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report
    ADD CONSTRAINT shopify_report_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_report_data shopify_report_data_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report_data
    ADD CONSTRAINT shopify_report_data_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_report_data shopify_report_data_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report_data
    ADD CONSTRAINT shopify_report_data_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_report_data shopify_report_data_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report_data
    ADD CONSTRAINT shopify_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.shopify_report(id) ON DELETE CASCADE;


--
-- Name: shopify_report shopify_report_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_report
    ADD CONSTRAINT shopify_report_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_transaction shopify_transaction_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_transaction
    ADD CONSTRAINT shopify_transaction_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: shopify_transaction shopify_transaction_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_transaction
    ADD CONSTRAINT shopify_transaction_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integration(id) ON DELETE CASCADE;


--
-- Name: shopify_transaction shopify_transaction_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_transaction
    ADD CONSTRAINT shopify_transaction_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.shopify_order(id) ON DELETE CASCADE;


--
-- Name: user_metric user_metric_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_metric
    ADD CONSTRAINT user_metric_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: workspace workspace_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: workspace workspace_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: workspace_membership workspace_membership_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_membership
    ADD CONSTRAINT workspace_membership_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: workspace_membership workspace_membership_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_membership
    ADD CONSTRAINT workspace_membership_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspace(id);


--
-- PostgreSQL database dump complete
--

\unrestrict xstSRByoGwB9qNPN5QiTEdynl9JIOb0Day7qiIp1PO665urFG1y3hfvxdcyc1fy

