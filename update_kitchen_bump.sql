-- Add status to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'; -- pending, ready
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Enable Realtime for order_items so UI updates when items change
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Update RLS for order_items to allow owners to update
-- (Assuming we want to tighten security or at least ensure it works)
-- For now, we'll ensure authenticated users can update if they own the restaurant via the order
DROP POLICY IF EXISTS "Public order_items access" ON order_items;

-- Allow public read (for customers)
CREATE POLICY "Public can view order_items" ON order_items FOR SELECT USING (true);

-- Allow public insert (for customers placing orders)
CREATE POLICY "Public can insert order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Allow owners to update order_items
CREATE POLICY "Owners can update order_items" ON order_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN restaurants ON orders.restaurant_id = restaurants.id
    WHERE orders.id = order_items.order_id
    AND restaurants.user_id = auth.uid()
  )
);

-- Allow owners to delete order_items (if needed)
CREATE POLICY "Owners can delete order_items" ON order_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN restaurants ON orders.restaurant_id = restaurants.id
    WHERE orders.id = order_items.order_id
    AND restaurants.user_id = auth.uid()
  )
);
