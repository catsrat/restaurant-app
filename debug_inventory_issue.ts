import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("--- Debugging Inventory Issue ---");

    // 1. Fetch Menu Items to find "Burger"
    const { data: menuItems, error: menuError } = await supabase.from('menu_items').select('*');
    if (menuError) { console.error("Menu Error:", menuError); return; }

    const burgerItems = menuItems.filter(m => m.name.toLowerCase().includes('burger'));
    console.log(`Found ${burgerItems.length} 'Burger' menu items:`);
    burgerItems.forEach(b => console.log(`- [${b.id}] ${b.name}`));

    // 2. Fetch Ingredients
    const { data: ingredients, error: ingError } = await supabase.from('ingredients').select('*');
    if (ingError) { console.error("Ingredient Error:", ingError); return; }

    console.log("\n--- Ingredients (Burger/Chicken related) ---");
    const relevantIngredients = ingredients.filter(i =>
        i.name.toLowerCase().includes('burger') ||
        i.name.toLowerCase().includes('chicken') ||
        i.name.toLowerCase().includes('fillet')
    );
    relevantIngredients.forEach(i => console.log(`- [${i.id}] ${i.name}: Stock ${i.current_stock} ${i.unit}`));

    // 3. Fetch Recipes for these items
    const { data: recipes, error: recipeError } = await supabase.from('menu_item_ingredients').select('*');
    if (recipeError) { console.error("Recipe Error:", recipeError); return; }

    console.log("\n--- Recipes for Burger Items ---");
    for (const item of burgerItems) {
        const itemRecipe = recipes.filter(r => String(r.menu_item_id) === String(item.id));
        if (itemRecipe.length > 0) {
            console.log(`Recipe for '${item.name}' (${item.id}):`);
            itemRecipe.forEach(r => {
                const ingName = ingredients.find(i => String(i.id) === String(r.ingredient_id))?.name || 'Unknown';
                console.log(`  - ${r.quantity_required} x ${ingName} (${r.ingredient_id})`);
            });
        } else {
            console.log(`No recipe found for '${item.name}' (${item.id})`);
        }
    }
    // 4. Fetch Recent Orders
    console.log("\n--- Recent Orders ---");
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (orderError) { console.error("Order Error:", orderError); return; }

    orders.forEach(o => {
        console.log(`Order #${o.id} (${o.order_type}) - ${new Date(o.created_at).toLocaleString()}`);
        o.items.forEach((i: any) => {
            console.log(`  - ${i.quantity} x ${i.name} (Item ID: ${i.menu_item_id})`);
        });
    });
}

main();
