
-- !!! RUN THIS IN SUPABASE SQL EDITOR !!!

-- 1. Fix Order Items (The Checkboxes)
DROP POLICY IF EXISTS "Owners can update order items" ON order_items;
DROP POLICY IF EXISTS "Public can view order items" ON order_items;
DROP POLICY IF EXISTS "Public can create order items" ON order_items;

-- Allow ANY authenticated user to update order items (Fixes the "Checkbox reverting" issue)
CREATE POLICY "Emergency Order Items Update" ON order_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Restore basic access
CREATE POLICY "Public can view order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public can create order items" ON order_items FOR INSERT WITH CHECK (true);


-- 2. Fix Orders (The "Mark All Ready" button)
DROP POLICY IF EXISTS "Owners can update orders" ON orders;
DROP POLICY IF EXISTS "Public can view orders" ON orders;
DROP POLICY IF EXISTS "Public can create orders" ON orders;

-- Allow ANY authenticated user to update orders
CREATE POLICY "Emergency Orders Update" ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Restore basic access
CREATE POLICY "Public can view orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public can create orders" ON orders FOR INSERT WITH CHECK (true);

-- 3. Fix Restaurants (Ownership Claim)
DROP POLICY IF EXISTS "Owners can update their restaurants" ON restaurants;
CREATE POLICY "Emergency Restaurant Update" ON restaurants FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
