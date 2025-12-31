-- Add TSE fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS tse_tss_id TEXT,
ADD COLUMN IF NOT EXISTS tse_client_id TEXT;
