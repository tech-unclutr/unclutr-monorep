-- Drop redundant columns from campaigns table
ALTER TABLE campaigns DROP COLUMN IF EXISTS phone_number;
ALTER TABLE campaigns DROP COLUMN IF EXISTS team_member_role;
ALTER TABLE campaigns DROP COLUMN IF EXISTS team_member_department;
-- Drop redundant columns from archived_campaigns table
ALTER TABLE archived_campaigns DROP COLUMN IF EXISTS phone_number;
ALTER TABLE archived_campaigns DROP COLUMN IF EXISTS team_member_role;
ALTER TABLE archived_campaigns DROP COLUMN IF EXISTS team_member_department;