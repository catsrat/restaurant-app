
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any, // Bypass strict version check or use latest
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { orderId, restaurantId } = await req.json();
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        if (!orderId || !restaurantId) {
            return NextResponse.json({ error: 'Missing orderId or restaurantId' }, { status: 400 });
        }

        // 1. Fetch Order and Items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                items: order_items(
                    *,
                    menu_item: menu_items(name)
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'paid') {
            return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
        }

        // 2. Fetch Restaurant Settings (Currency & Tax)
        const { data: restaurant, error: restError } = await supabaseAdmin
            .from('restaurants')
            .select('currency, tax_rate, name')
            .eq('id', restaurantId)
            .single();

        if (restError) throw restError;

        const currency = restaurant?.currency || 'usd';
        const isGerman = currency === 'EUR';
        const isInr = currency === 'INR';

        // 3. Construct Line Items for Stripe
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        // Helper to get item name
        const getItemName = (item: any) => {
            return Array.isArray(item.menu_item)
                ? item.menu_item[0]?.name
                : item.menu_item?.name || item.name || 'Item';
        };

        // For INR, prices in DB are Net. We need to add Tax for the checkout total if we want to charge Gross.
        // Or we pass Net to Stripe and add a "Tax" line item?
        // Stripe has its own Tax auto-calculation, but we are doing custom logic.
        // Easiest: Pass items with their GROSS unit price if possible, or simple 1 line item for total.
        // Let's try to pass detailed items.

        let totalCalculated = 0;

        for (const item of order.items) {
            let unitPrice = item.price; // Base price from DB

            if (isInr) {
                // DB stores Net. We need to charge Gross (Net + 5%).
                // Stripe amounts are in smallest currency unit (e.g., paise).
                // 5% Tax -> price * 1.05
                // To avoid rounding issues with line items, it might be safer to add a separate Tax line item?
                // Or just bump the unit price. Let's bump unit price.
                const taxRate = 5.0;
                const grossPrice = unitPrice * (1 + taxRate / 100);
                unitPrice = grossPrice;
            }
            // For EUR, DB price is already Gross (Innovative). No change needed.
            // For Others, DB price is likely Gross (Inclusive).

            // Convert to cents/paise
            const unitAmount = Math.round(unitPrice * 100);

            line_items.push({
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: getItemName(item),
                        metadata: {
                            itemId: item.id
                        }
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            });
        }

        // 4. Create Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/${restaurantId}/track/${orderId}?payment_success=true`,
            cancel_url: `${origin}/${restaurantId}/track/${orderId}?payment_cancelled=true`,
            client_reference_id: orderId, // Crucial for Webhook
            metadata: {
                restaurantId,
                orderId,
                orderType: order.order_type // 'dine-in' or 'takeaway'
            }
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
