-- Set default value for active column and update existing records
-- This migration fixes the issue where all farmers had active=false

-- Update all existing farmers to be active
UPDATE farmers SET active = TRUE WHERE active IS NULL OR active = FALSE;

-- Alter column to set default value for future inserts
ALTER TABLE farmers ALTER COLUMN active SET DEFAULT TRUE;
