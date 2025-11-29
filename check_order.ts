
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder() {
    console.log('Checking latest order...');

    // 1. Fetch latest order
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            items: order_items(
                *,
                menu_item: menu_items(name)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching order:', error);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('No orders found.');
        return;
    }

    const order = orders[0];
    console.log('Order ID:', order.id);
    console.log('Items Raw:', JSON.stringify(order.items, null, 2));

    if (!order.items || order.items.length === 0) {
        console.log('⚠️ Items array is empty or null!');

        // 2. Check order_items table directly
        console.log('Checking order_items table directly...');
        const { data: directItems, error: directError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        if (directError) {
            console.error('Error fetching direct items:', directError);
        } else {
            console.log('Direct Items:', directItems);
        }
    } else {
        console.log('✅ Items found via join.');
    }
}

checkOrder();
