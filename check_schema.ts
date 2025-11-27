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
    console.log("--- Checking Restaurants Table Schema ---");
    const { data, error } = await supabase.from('restaurants').select('*').limit(1);
    if (error) { console.error(error); return; }
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
        console.log("Sample Data:", data[0]);
    } else {
        console.log("No data found in restaurants table.");
    }
}

main();
