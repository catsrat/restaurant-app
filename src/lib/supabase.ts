import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validation check for common configuration error
if (supabaseUrl && supabaseUrl.includes('supabase.com/dashboard')) {
    console.error('🚨 CRITICAL CONFIG ERROR: You are using the Supabase Dashboard URL!');
    console.error('Please use the Project URL from Supabase Settings -> API.');
    console.error('Expected format: https://<project-id>.supabase.co');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
