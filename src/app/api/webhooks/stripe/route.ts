
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { processOrderPayment } from '@/lib/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve metadata
        const orderId = session.client_reference_id; // or session.metadata?.orderId
        const restaurantId = session.metadata?.restaurantId;

        if (orderId && restaurantId) {
            try {
                console.log(`Processing Order Payment via Webhook: ${orderId}`);
                await processOrderPayment(orderId, restaurantId, 'card');
                console.log(`Order ${orderId} successfully processed.`);
            } catch (err) {
                console.error(`Error processing order ${orderId}:`, err);
                return NextResponse.json({ error: 'Internal Processing Error' }, { status: 500 });
            }
        } else {
            console.error('Webhook missing metadata', session.metadata);
        }
    }

    return NextResponse.json({ received: true });
}
