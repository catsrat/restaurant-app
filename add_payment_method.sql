-- Add payment_method to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method text;
