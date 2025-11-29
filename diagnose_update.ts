
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

async function diagnoseUpdate() {
    console.log('--- DIAGNOSING UPDATE FAILURE ---');

    // 1. Check Schema (Columns)
    console.log('1. Checking order_items columns...');
    const { data: item, error: fetchError } = await supabase
        .from('order_items')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error('❌ Error fetching item:', fetchError.message);
        return;
    }

    if (!item || item.length === 0) {
        console.log('⚠️ No items found to test.');
        return;
    }

    console.log('Sample Item:', item[0]);

    // 2. Test Update
    const testId = item[0].id;
    const currentStatus = item[0].status;
    const targetStatus = currentStatus === 'ready' ? 'pending' : 'ready';

    console.log(`2. Attempting to update Item ${testId} from '${currentStatus}' to '${targetStatus}'...`);

    const { data: updated, error: updateError } = await supabase
        .from('order_items')
        .update({ status: targetStatus })
        .eq('id', testId)
        .select();

    if (updateError) {
        console.error('❌ Update FAILED with error:', updateError.message);
        console.error('Details:', updateError.details);
        console.error('Hint:', updateError.hint);
    } else if (!updated || updated.length === 0) {
        console.error('❌ Update FAILED: 0 rows affected.');
        console.error('POSSIBLE CAUSES:');
        console.error(' - RLS Policy is still blocking updates.');
        console.error(' - Row was deleted.');
        console.error(' - Trigger prevented update.');
    } else {
        console.log('✅ Update SUCCEEDED!');
        console.log('Updated Item:', updated[0]);

        // Revert
        console.log('Reverting change...');
        await supabase.from('order_items').update({ status: currentStatus }).eq('id', testId);
    }
}

diagnoseUpdate();
