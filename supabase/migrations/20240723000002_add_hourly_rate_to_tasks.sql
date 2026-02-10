-- Add hourly_rate column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);
