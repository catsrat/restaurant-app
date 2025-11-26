
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; // NOTE: This needs to be a SERVICE ROLE client for backend updates

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia', // Suppress type error if needed or update package
} as any);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const headerList = headers(); // In Next 13/14 headers() is synchronous, in 15 it might be async.
    // Assuming Next 14 based on usage context, but if it errors, we treat it as sync for now or check version.
    // The error says "Property 'get' does not exist on type 'Promise<ReadonlyHeaders>'", implying Next 15 or latest types.
    const signature = (await headerList).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve the subscription details to get the end date
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = session.customer as string;
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();

        if (userId) {
            // Update the restaurant/user record
            // We are assuming 1 restaurant per user for now, or we can update based on user_id
            // Since we added columns to 'restaurants', we need to find the restaurant by user_id

            // IMPORTANT: We need a Supabase client with SERVICE_ROLE key to bypass RLS
            // Since we don't have that exported in lib/supabase.ts (it likely uses anon key),
            // we should create one here or update lib/supabase.ts.
            // For now, let's assume we can use a direct fetch or create a local client if we had the key.
            // BUT, since we are in a server route, we can use the secret key if we have it in env.

            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { error } = await supabaseAdmin
                .from('restaurants')
                .update({
                    subscription_status: 'active',
                    stripe_customer_id: customerId,
                    subscription_end_date: endDate
                })
                .eq('user_id', userId);

            if (error) {
                console.error('Error updating database:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            console.log(`Successfully updated subscription for user ${userId}`);
        } else {
            console.error('No userId found in session metadata');
        }
    }

    return NextResponse.json({ received: true });
}
