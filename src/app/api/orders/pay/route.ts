
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { tableId, restaurantId, paymentMethod } = await req.json();

        if (!tableId || !restaurantId) {
            return NextResponse.json({ error: 'Missing tableId or restaurantId' }, { status: 400 });
        }

        // 1. Fetch all unpaid orders for the table
        const { data: orders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('table_id', tableId)
            .eq('restaurant_id', restaurantId)
            .neq('status', 'paid');

        if (fetchError) throw fetchError;
        if (!orders || orders.length === 0) {
            return NextResponse.json({ error: 'No unpaid orders found for this table' }, { status: 404 });
        }

        // 2. Calculate Totals
        const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const taxRate = 19.0; // Standard DE VAT
        const taxFactor = taxRate / 100;
        // Gross = Net * (1 + rate)  => Net = Gross / (1 + rate)
        const netAmount = totalAmount / (1 + taxFactor);
        const taxAmount = totalAmount - netAmount;

        // 3. Generate Receipt Number (Simulated Sequence)
        // In a real app, use a DB Sequence or strict locking. 
        // Here we query the max receipt_number for the restaurant.
        const { data: maxReceipt } = await supabaseAdmin
            .from('orders')
            .select('receipt_number')
            .eq('restaurant_id', restaurantId)
            .order('receipt_number', { ascending: false })
            .limit(1)
            .single();

        const nextReceiptNumber = (maxReceipt?.receipt_number || 0) + 1;

        // 4. Generate Mock TSE Data
        const tseSerial = `TSE-DEMO-${restaurantId.slice(0, 4)}-${new Date().getFullYear()}`;
        const tseCounter = nextReceiptNumber; // Simplified: syncing counter with receipt #
        const timestamp = new Date().toISOString();
        const tseSignature = Buffer.from(`${tseSerial}|${tseCounter}|${totalAmount}|${timestamp}`).toString('base64');

        // 5. Update Orders
        // We apply the same receipt info to ALL orders in this batch
        const updatePayload = {
            status: 'paid',
            receipt_number: nextReceiptNumber,
            tse_serial: tseSerial,
            tse_counter: tseCounter,
            tse_signature: tseSignature,
            tax_rate: taxRate,
            tax_amount: Number(taxAmount.toFixed(2)),
            net_amount: Number(netAmount.toFixed(2)),
            payment_method: paymentMethod || 'cash' // Default to cash if not provided
        };

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updatePayload)
            .in('id', orders.map(o => o.id));

        if (updateError) throw updateError;

        // 6. Free the table
        await supabaseAdmin
            .from('tables')
            .update({ status: 'available' })
            .eq('id', tableId);

        return NextResponse.json({
            success: true,
            receipt: {
                receiptNumber: nextReceiptNumber,
                totalAmount,
                netAmount,
                taxAmount,
                taxRate,
                tse: {
                    serial: tseSerial,
                    counter: tseCounter,
                    signature: tseSignature,
                    timestamp
                }
            }
        });

    } catch (error: any) {
        console.error('Payment Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
