-- Add Tax/TSE fields to restaurants
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS address text;

-- Add Tax/TSE fields to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS receipt_number bigint,
ADD COLUMN IF NOT EXISTS tse_signature text,
ADD COLUMN IF NOT EXISTS tse_serial text,
ADD COLUMN IF NOT EXISTS tse_counter integer,
ADD COLUMN IF NOT EXISTS tax_rate numeric default 19.0,
ADD COLUMN IF NOT EXISTS tax_amount numeric,
ADD COLUMN IF NOT EXISTS net_amount numeric;

-- Create a sequence for receipt numbers if it doesn't exist (per restaurant)
-- NOTE: In a real app complexity varies, for now global or just simple increment per order logic in API
-- We will use a simple approach: The backend will query max(receipt_number) + 1 for now, 
-- or we can use a sequence. Let's rely on API logic to set this or use a trigger.
-- For simplicity in this demo, we just add the column.
