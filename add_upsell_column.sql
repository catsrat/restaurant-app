-- Add is_upsell column to order_items table
ALTER TABLE order_items ADD COLUMN is_upsell boolean DEFAULT false;
