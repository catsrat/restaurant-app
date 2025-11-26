-- Enable RLS on all tables (already done in schema.sql, but good to ensure)
-- We need to update policies to restrict write access to authenticated users

-- Restaurants
create policy "Enable insert for authenticated users only" on restaurants for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on restaurants for update to authenticated using (true);
create policy "Enable delete for authenticated users only" on restaurants for delete to authenticated using (true);

-- Tables
-- Drop existing public policy if it's too broad (schema.sql had "Public tables access" using true)
-- We want public READ, but private WRITE
drop policy "Public tables access" on tables;
create policy "Public tables are viewable by everyone" on tables for select using (true);
create policy "Authenticated users can insert tables" on tables for insert to authenticated with check (true);
create policy "Authenticated users can update tables" on tables for update to authenticated using (true);
create policy "Authenticated users can delete tables" on tables for delete to authenticated using (true);

-- Menu Categories
drop policy "Public menu_categories access" on menu_categories;
create policy "Public menu_categories are viewable by everyone" on menu_categories for select using (true);
create policy "Authenticated users can manage categories" on menu_categories for all to authenticated using (true);

-- Menu Items
drop policy "Public menu_items access" on menu_items;
create policy "Public menu_items are viewable by everyone" on menu_items for select using (true);
create policy "Authenticated users can manage menu items" on menu_items for all to authenticated using (true);

-- Orders
-- Customers need to INSERT orders (public)
-- Customers need to SELECT their own orders (maybe by ID or cookie? For now public select is okay for MVP tracking)
-- Admin needs to UPDATE orders (status)
drop policy "Public orders access" on orders;
create policy "Public orders are viewable by everyone" on orders for select using (true);
create policy "Public can create orders" on orders for insert with check (true);
create policy "Authenticated users can update orders" on orders for update to authenticated using (true);

-- Order Items
drop policy "Public order_items access" on order_items;
create policy "Public order_items are viewable by everyone" on order_items for select using (true);
create policy "Public can create order items" on order_items for insert with check (true);

-- Banners
-- Already had specific policies in schema.sql, but let's ensure
-- "Owners can manage their banners" was for ALL using true. 
-- We should restrict it to authenticated.
drop policy "Owners can manage their banners" on restaurant_banners;
create policy "Authenticated users can manage banners" on restaurant_banners for all to authenticated using (true);
