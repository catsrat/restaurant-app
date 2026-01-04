
-- Add Stripe Connect Account ID to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
