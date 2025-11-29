
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

async function testUpdate() {
    console.log('Testing update on order_items...');

    // Try to update item 17 (from user logs)
    // We need to find a valid item ID first if 17 doesn't exist.

    const { data: items } = await supabase.from('order_items').select('id, status').limit(1);

    if (!items || items.length === 0) {
        console.log('No items found to test.');
        return;
    }

    const item = items[0];
    console.log(`Attempting to update Item ${item.id} (Current Status: ${item.status})...`);

    const newStatus = item.status === 'ready' ? 'pending' : 'ready';

    const { data, error, count } = await supabase
        .from('order_items')
        .update({ status: newStatus })
        .eq('id', item.id)
        .select(); // Use select() to get data back

    if (error) {
        console.error('❌ Update FAILED with error:', error.message);
    } else if (!data || data.length === 0) {
        console.error('❌ Update FAILED: 0 rows affected (RLS blocked it).');
    } else {
        console.log('✅ Update SUCCEEDED!');
        console.log('New Status:', data[0].status);

        // Revert
        console.log('Reverting...');
        await supabase.from('order_items').update({ status: item.status }).eq('id', item.id);
    }
}

testUpdate();
