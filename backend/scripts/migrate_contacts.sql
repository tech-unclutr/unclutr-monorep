-- Contact Entity Migration
-- Idempotent: Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks)
-- 1. Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    full_name VARCHAR,
    title VARCHAR,
    email VARCHAR,
    linkedin_url VARCHAR,
    company_name VARCHAR,
    industry VARCHAR,
    employee_count VARCHAR,
    primary_phone VARCHAR NOT NULL,
    alt_phone VARCHAR,
    city VARCHAR,
    country VARCHAR,
    custom_fields JSONB DEFAULT '{}',
    source VARCHAR DEFAULT 'csv_upload',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT uq_company_contact_phone UNIQUE (company_id, primary_phone)
);
-- 2. Indexes on contacts
CREATE INDEX IF NOT EXISTS ix_contacts_company_id ON contacts (company_id);
CREATE INDEX IF NOT EXISTS ix_contacts_primary_phone ON contacts (primary_phone);
-- 3. Add contact_id to campaign_leads (only if not already present)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaign_leads'
        AND column_name = 'contact_id'
) THEN
ALTER TABLE campaign_leads
ADD COLUMN contact_id UUID REFERENCES contacts(id);
CREATE INDEX ix_campaign_leads_contact_id ON campaign_leads (contact_id);
END IF;
END $$;