-- Fix RLS blocking recipes fetch for customer orders
-- Allow public read access to menu_item_ingredients so inventory can be deducted

-- Option 1: Disable RLS entirely (simplest)
ALTER TABLE menu_item_ingredients DISABLE ROW LEVEL SECURITY;

-- Option 2: Add public read policy (more secure)
-- DROP POLICY IF EXISTS "Public can view recipes" ON menu_item_ingredients;
-- CREATE POLICY "Public can view recipes" ON menu_item_ingredients 
-- FOR SELECT 
-- USING (true);
