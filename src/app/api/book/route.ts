
import { NextResponse } from 'next/server';
import Stripe from 'stripe';



export async function POST(req: Request) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Missing STRIPE_SECRET_KEY');
        }
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const { companyName, contactEmail, currency, billingCycle } = await req.json();

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        // Base prices in INR
        const baseMonthlyINR = 2999;
        const baseYearlyINR = 30000;

        // Exchange rates (should match frontend or fetch live)
        // For simplicity and robustness, we use fixed rates here to ensure we charge what we expect.
        // In a real app, you might want to fetch these or lock them in.
        const rates: { [key: string]: number } = { INR: 1, CZK: 0.31, USD: 0.012, EUR: 0.011, GBP: 0.009 };

        const rate = rates[currency] || 1;
        const priceINR = billingCycle === 'monthly' ? baseMonthlyINR : baseYearlyINR;
        const unitAmount = Math.round(priceINR * rate * 100); // Stripe expects cents/smallest unit

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: `Restaurant OS - ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Plan`,
                            description: `Subscription for ${companyName}`,
                        },
                        unit_amount: unitAmount,
                        recurring: {
                            interval: billingCycle === 'monthly' ? 'month' : 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/portal?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${origin}/?canceled=true`,
            customer_email: contactEmail,
            metadata: {
                companyName,
            },
        });

        return NextResponse.json({ checkoutUrl: session.url });
    } catch (err: any) {
        console.error('Stripe error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
