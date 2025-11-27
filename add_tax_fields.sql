-- Add tax configuration fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS tax_name TEXT DEFAULT 'Tax',
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_number TEXT;
