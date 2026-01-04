
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const restaurantId = searchParams.get('restaurantId');
        const refresh = searchParams.get('refresh');

        if (!restaurantId) {
            return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000'; // Or construct from host

        // If 'refresh' is true, it means they clicked "Link" but it expired or they navigated away.
        // We should just redirect them back to the Admin page to click "Link" again.
        if (refresh) {
            return NextResponse.redirect(new URL(`/${restaurantId}/admin`, req.url));
        }

        // Otherwise (success case implied by return_url from Stripe), we verify the account.
        const { data: restaurant } = await supabaseAdmin
            .from('restaurants')
            .select('stripe_account_id')
            .eq('id', restaurantId)
            .single();

        if (restaurant?.stripe_account_id) {
            const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);
            // We could check account.details_submitted or account.charges_enabled
            if (account.details_submitted) {
                // Good to go
            }
        }

        // Redirect back to Admin with success flag
        return NextResponse.redirect(new URL(`/${restaurantId}/admin?connected=true`, req.url));

    } catch (error: any) {
        console.error('Stripe Callback Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
