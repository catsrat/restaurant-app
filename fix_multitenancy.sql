-- Add user_id to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS for restaurants
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Public restaurants access" ON restaurants;

-- Drop new policies if they exist (to make script idempotent)
DROP POLICY IF EXISTS "Public can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can update their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can delete their restaurants" ON restaurants;

-- 1. Public can view restaurants (needed for customers to see menu)
CREATE POLICY "Public can view restaurants" ON restaurants FOR SELECT USING (true);

-- 2. Authenticated users can create restaurants (and automatically become owner)
CREATE POLICY "Authenticated users can create restaurants" ON restaurants FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Owners can update their own restaurants
CREATE POLICY "Owners can update their restaurants" ON restaurants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Owners can delete their own restaurants
CREATE POLICY "Owners can delete their restaurants" ON restaurants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Update RLS for other tables to enforce ownership via restaurant_id
-- We need to ensure that when an admin modifies a table/menu/order, they own the restaurant.

-- Menu Categories
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON menu_categories;
DROP POLICY IF EXISTS "Owners can manage categories" ON menu_categories;

CREATE POLICY "Owners can manage categories" ON menu_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = menu_categories.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

-- Menu Items
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Owners can manage menu items" ON menu_items;

CREATE POLICY "Owners can manage menu items" ON menu_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = menu_items.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

-- Tables
DROP POLICY IF EXISTS "Authenticated users can insert tables" ON tables;
DROP POLICY IF EXISTS "Authenticated users can update tables" ON tables;
DROP POLICY IF EXISTS "Authenticated users can delete tables" ON tables;
DROP POLICY IF EXISTS "Owners can manage tables" ON tables;

-- Consolidate into one "manage" policy for owners
CREATE POLICY "Owners can manage tables" ON tables FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = tables.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

-- Orders
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Owners can update orders" ON orders;

CREATE POLICY "Owners can update orders" ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

-- Banners
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON restaurant_banners;
DROP POLICY IF EXISTS "Owners can manage banners" ON restaurant_banners;

CREATE POLICY "Owners can manage banners" ON restaurant_banners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = restaurant_banners.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);
