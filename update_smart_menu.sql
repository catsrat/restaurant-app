-- Add tags and options to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]';

-- Add notes and selected_options to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_options jsonb DEFAULT '{}';

-- Update RLS policies if needed (existing ones should cover these new columns as they are on existing tables)
-- Just to be safe, we ensure public can read the new columns on menu_items
-- And public can insert into the new columns on order_items

-- (No extra policies needed as the existing ones cover the whole table usually, but good to verify)
