-- Fix Upsell Rule for Restaurant 13

-- 1. Clean up any existing rules for this restaurant to start fresh
DELETE FROM upsell_rules WHERE restaurant_id = 13;

-- 2. Insert the correct rule
-- We use the exact category name "Burger" from your logs
-- We use ILIKE for Fries to match "French Fries" or just "Fries"
INSERT INTO upsell_rules (
    restaurant_id, 
    trigger_category_id, 
    trigger_menu_item_id, 
    suggested_menu_item_id, 
    message
)
VALUES (
    13,
    (SELECT id FROM menu_categories WHERE name = 'Burger' AND restaurant_id = 13 LIMIT 1),
    NULL, -- No specific item trigger
    (SELECT id FROM menu_items WHERE name ILIKE '%Fries%' AND restaurant_id = 13 LIMIT 1),
    'Would you like to make it a meal with Fries? 🍟'
);

-- 3. Verify the insertion
SELECT * FROM upsell_rules WHERE restaurant_id = 13;
