
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jvuqunljnzxxdfbddzbl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dXF1bmxqbnp4eGRmYmRkemJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgwODgsImV4cCI6MjA3OTU4NDA4OH0.PwyInWNSojqYKCSjNODyR_q7GkMBLIqDAJcqTt9dW3o';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugInventory() {
    console.log("--- Starting Inventory Debug ---");

    // 1. Fetch Menu Items
    const { data: menuItems, error: menuError } = await supabase.from('menu_items').select('*');
    if (menuError) console.error("Menu Error:", menuError);
    console.log(`Found ${menuItems?.length} menu items.`);
    if (menuItems && menuItems.length > 0) {
        console.log("Sample Menu Item:", menuItems[0]);
    }

    // 2. Fetch Ingredients
    const { data: ingredients, error: ingError } = await supabase.from('ingredients').select('*');
    if (ingError) console.error("Ingredient Error:", ingError);
    console.log(`Found ${ingredients?.length} ingredients.`);
    if (ingredients && ingredients.length > 0) {
        console.log("Sample Ingredient:", ingredients[0]);
    }

    // 3. Fetch Recipes
    const { data: recipes, error: recipeError } = await supabase.from('menu_item_ingredients').select('*');
    if (recipeError) console.error("Recipe Error:", recipeError);
    console.log(`Found ${recipes?.length} recipe links.`);
    if (recipes && recipes.length > 0) {
        console.log("Sample Recipe Link:", recipes[0]);
    }

    // 4. Simulate Deduction
    console.log("\n--- Simulating Deduction for Restaurant 14 ---");
    if (!menuItems || !ingredients || !recipes) return;

    const targetRestaurantId = 14;

    // Try to find a burger for this restaurant
    const burger = menuItems.find(m => m.name.toLowerCase().includes('burger') && m.restaurant_id === targetRestaurantId);

    if (!burger) {
        console.log(`No 'Burger' found for restaurant ${targetRestaurantId}.`);
        console.log("Available items for 14:", menuItems.filter(m => m.restaurant_id === targetRestaurantId).map(m => m.name));
    } else {
        console.log(`Found Burger for 14: ${burger.name} (ID: ${burger.id})`);

        // Find recipe for burger
        const burgerRecipe = recipes.filter(r => String(r.menu_item_id) === String(burger.id));
        console.log(`Recipe for Burger:`, burgerRecipe);

        if (burgerRecipe.length === 0) {
            console.log("!!! WARNING: No recipe found for Burger. This is likely the issue.");
        } else {
            for (const r of burgerRecipe) {
                const ing = ingredients.find(i => String(i.id) === String(r.ingredient_id));
                if (ing) {
                    console.log(`- Uses ${r.quantity_required} ${ing.unit} of ${ing.name} (Current Stock: ${ing.current_stock})`);
                    console.log(`  -> After ordering 2, stock should be: ${ing.current_stock - (r.quantity_required * 2)}`);
                } else {
                    console.log(`- Uses ingredient ID ${r.ingredient_id} (NOT FOUND in ingredients table)`);
                }
            }
        }
    }
}

debugInventory();
