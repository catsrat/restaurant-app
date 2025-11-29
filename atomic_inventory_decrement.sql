-- Create a PostgreSQL function for atomic inventory decrement
-- This prevents race conditions when multiple orders are placed simultaneously

CREATE OR REPLACE FUNCTION decrement_ingredient_stock(
    ingredient_id bigint,
    amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atomic decrement using UPDATE with arithmetic
    UPDATE ingredients
    SET current_stock = current_stock - amount
    WHERE id = ingredient_id;
    
    -- Optional: Check if stock went negative and raise error
    -- PERFORM 1 FROM ingredients 
    -- WHERE id = ingredient_id AND current_stock < 0;
    -- IF FOUND THEN
    --     RAISE EXCEPTION 'Insufficient stock for ingredient %', ingredient_id;
    -- END IF;
END;
$$;
