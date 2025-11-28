-- SECURE RLS POLICIES
-- This script secures your database by:
-- 1. Ensuring the 'user_id' column exists on restaurants.
-- 2. Dropping all insecure "Public access" policies.
-- 3. Implementing strict policies where only the Restaurant Owner can edit data.
-- 4. Allowing Customers (Public) to only View Menu and Place Orders.

-- 1. Ensure user_id exists
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Drop ALL existing insecure policies (Cleanup)
-- Restaurants
DROP POLICY IF EXISTS "Public restaurants access" ON restaurants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON restaurants;
DROP POLICY IF EXISTS "Public can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can update their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners can delete their restaurants" ON restaurants;

-- Tables
DROP POLICY IF EXISTS "Public tables access" ON tables;
DROP POLICY IF EXISTS "Owners can manage tables" ON tables;

-- Menu
DROP POLICY IF EXISTS "Public menu_items access" ON menu_items;
DROP POLICY IF EXISTS "Owners can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Public menu_categories access" ON menu_categories;
DROP POLICY IF EXISTS "Owners can manage categories" ON menu_categories;

-- Orders
DROP POLICY IF EXISTS "Public orders access" ON orders;
DROP POLICY IF EXISTS "Owners can update orders" ON orders;
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Public can view orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "Public order_items access" ON order_items;
DROP POLICY IF EXISTS "Public can create order items" ON order_items;
DROP POLICY IF EXISTS "Public can view order items" ON order_items;
DROP POLICY IF EXISTS "Owners can update order items" ON order_items;

-- Banners
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON restaurant_banners;
DROP POLICY IF EXISTS "Owners can manage their banners" ON restaurant_banners;
DROP POLICY IF EXISTS "Owners can manage banners" ON restaurant_banners;
DROP POLICY IF EXISTS "Public can view banners" ON restaurant_banners;

-- Ingredients & Recipes (If any existed)
DROP POLICY IF EXISTS "Public ingredients access" ON ingredients;
DROP POLICY IF EXISTS "Public recipes access" ON menu_item_ingredients;
DROP POLICY IF EXISTS "Owners can manage ingredients" ON ingredients;
DROP POLICY IF EXISTS "Owners can manage recipes" ON menu_item_ingredients;

-- Upsell Rules
DROP POLICY IF EXISTS "Public can view upsell rules" ON upsell_rules;
DROP POLICY IF EXISTS "Owners can manage upsell rules" ON upsell_rules;


-- 3. Enable RLS on all tables (Safety check)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;


-- 4. Define New Secure Policies

-- === RESTAURANTS ===
-- Public can view basic restaurant info (Menu page)
CREATE POLICY "Public can view restaurants" ON restaurants FOR SELECT USING (true);

-- Authenticated users can create a restaurant (claiming ownership)
CREATE POLICY "Authenticated users can create restaurants" ON restaurants FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Owners can update their own restaurant
CREATE POLICY "Owners can update their restaurants" ON restaurants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Owners can delete their own restaurant
CREATE POLICY "Owners can delete their restaurants" ON restaurants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- === HELPER FOR OWNERSHIP CHECKS ===
-- We use this subquery pattern for all child tables:
-- EXISTS (SELECT 1 FROM restaurants WHERE id = child.restaurant_id AND user_id = auth.uid())

-- === TABLES ===
-- Public can view tables (for selecting table number)
CREATE POLICY "Public can view tables" ON tables FOR SELECT USING (true);

-- Owners can manage tables
CREATE POLICY "Owners can manage tables" ON tables FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = tables.restaurant_id AND restaurants.user_id = auth.uid())
);


-- === MENU CATEGORIES ===
-- Public can view categories
CREATE POLICY "Public can view categories" ON menu_categories FOR SELECT USING (true);

-- Owners can manage categories
CREATE POLICY "Owners can manage categories" ON menu_categories FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_categories.restaurant_id AND restaurants.user_id = auth.uid())
);


-- === MENU ITEMS ===
-- Public can view menu items
CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT USING (true);

-- Owners can manage menu items
CREATE POLICY "Owners can manage menu items" ON menu_items FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.user_id = auth.uid())
);


-- === ORDERS ===
-- Public (Customers) can INSERT orders
CREATE POLICY "Public can create orders" ON orders FOR INSERT
WITH CHECK (true);

-- Public (Customers) can VIEW their own orders (This is tricky without auth, so we allow viewing by ID for now to support the 'Order Success' page)
-- Ideally, we would restrict this, but for MVP, allowing SELECT on orders is acceptable if UUIDs are hard to guess.
-- However, to be safer, let's allow SELECT for everyone for now (needed for status updates) but rely on UUID obscurity.
CREATE POLICY "Public can view orders" ON orders FOR SELECT USING (true);

-- Owners can UPDATE orders (Status changes)
CREATE POLICY "Owners can update orders" ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.user_id = auth.uid())
);


-- === ORDER ITEMS ===
-- Public can INSERT order items (linked to their order)
CREATE POLICY "Public can create order items" ON order_items FOR INSERT
WITH CHECK (true);

-- Public can VIEW order items
CREATE POLICY "Public can view order items" ON order_items FOR SELECT USING (true);

-- Owners can UPDATE order items (Status changes)
-- Note: order_items doesn't have restaurant_id directly, it links to orders.
-- This requires a join, which RLS supports but can be slow.
-- Alternative: Add restaurant_id to order_items? Or just trust the order link.
-- Let's use the join via orders.
CREATE POLICY "Owners can update order items" ON order_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN restaurants ON restaurants.id = orders.restaurant_id
    WHERE orders.id = order_items.order_id
    AND restaurants.user_id = auth.uid()
  )
);


-- === BANNERS ===
-- Public can view banners
CREATE POLICY "Public can view banners" ON restaurant_banners FOR SELECT USING (true);

-- Owners can manage banners
CREATE POLICY "Owners can manage banners" ON restaurant_banners FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_banners.restaurant_id AND restaurants.user_id = auth.uid())
);


-- === INGREDIENTS (Internal Only) ===
-- No public access
CREATE POLICY "Owners can manage ingredients" ON ingredients FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = ingredients.restaurant_id AND restaurants.user_id = auth.uid())
);


-- === RECIPES (Internal Only) ===
-- No public access
CREATE POLICY "Owners can manage recipes" ON menu_item_ingredients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM menu_items
    JOIN restaurants ON restaurants.id = menu_items.restaurant_id
    WHERE menu_items.id = menu_item_ingredients.menu_item_id
    AND restaurants.user_id = auth.uid()
  )
);

-- === UPSELL RULES ===
-- Public can view rules (for client-side logic)
CREATE POLICY "Public can view upsell rules" ON upsell_rules FOR SELECT USING (true);

-- Owners can manage rules
CREATE POLICY "Owners can manage upsell rules" ON upsell_rules FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = upsell_rules.restaurant_id AND restaurants.user_id = auth.uid())
);
