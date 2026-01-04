
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

export async function POST(req: Request) {
    try {
        const { restaurantId } = await req.json();
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        if (!restaurantId) {
            return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
        }

        // 1. Fetch Restaurant
        const { data: restaurant, error: fetchError } = await supabaseAdmin
            .from('restaurants')
            .select('id, name, stripe_account_id')
            .eq('id', restaurantId)
            .single();

        if (fetchError || !restaurant) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        let accountId = restaurant.stripe_account_id;

        // 2. Create Stripe Account if missing
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'DE', // Defaulting to DE for this German-focused app, or make dynamic?
                // capabilities: {
                //   card_payments: { requested: true },
                //   transfers: { requested: true },
                // },
                business_type: 'company',
                company: {
                    name: restaurant.name,
                },
            });
            accountId = account.id;

            // Save to DB
            await supabaseAdmin
                .from('restaurants')
                .update({ stripe_account_id: accountId })
                .eq('id', restaurantId);
        }

        // 3. Create Account Link (Onboarding Flow)
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${origin}/api/stripe/callback?restaurantId=${restaurantId}&refresh=true`,
            return_url: `${origin}/${restaurantId}/admin?connected=true`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error: any) {
        console.error('Stripe Connect Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
