-- Add is_upsell column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS is_upsell BOOLEAN DEFAULT FALSE;

-- Update existing items to be false (optional, as default handles new ones)
UPDATE order_items SET is_upsell = FALSE WHERE is_upsell IS NULL;
