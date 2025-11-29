
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

async function checkSchema() {
    console.log('Checking order_items schema...');

    // Try to insert a dummy item with is_upsell to see if it errors
    // actually, let's just inspect the error from a failed insert if possible, 
    // or better, just try to select it.

    const { error } = await supabase
        .from('order_items')
        .select('is_upsell')
        .limit(1);

    if (error) {
        console.log('❌ Error selecting is_upsell:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('CONFIRMED: is_upsell column is MISSING.');
        }
    } else {
        console.log('✅ is_upsell column EXISTS.');
    }
}

checkSchema();
