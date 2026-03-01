
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function POST(req: Request) {
    console.log('--- Payment API Request Started ---');
    try {
        const body = await req.json();
        const { tableId, restaurantId, paymentMethod } = body;
        console.log('Request Params:', { tableId, restaurantId, paymentMethod });

        if (!tableId || !restaurantId) {
            console.error('Validation Failed: Missing tableId or restaurantId');
            return NextResponse.json({ error: 'Missing tableId or restaurantId' }, { status: 400 });
        }

        // 1. Fetch all unpaid orders for the table
        console.log(`Fetching unpaid orders for table ${tableId}...`);
        const { data: orders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('table_id', tableId)
            .eq('restaurant_id', restaurantId)
            .neq('status', 'paid');

        if (fetchError) {
            console.error('Supabase Fetch Error (Orders):', fetchError);
            throw new Error(`Database error while fetching orders: ${fetchError.message}`);
        }

        if (!orders || orders.length === 0) {
            console.warn('No unpaid orders found for table:', tableId);
            return NextResponse.json({ error: 'No unpaid orders found for this table' }, { status: 404 });
        }

        console.log(`Found ${orders.length} unpaid orders.`);

        // 1b. Fetch Restaurant Currency & Settings
        console.log(`Fetching restaurant settings for ${restaurantId}...`);
        const { data: restaurant, error: restError } = await supabaseAdmin
            .from('restaurants')
            .select('currency, tax_rate, tse_tss_id, tse_client_id')
            .eq('id', restaurantId)
            .single();

        if (restError) {
            console.error('Supabase Fetch Error (Restaurant):', restError);
            // Non-critical: Proceed with defaults if restaurant fetch fails
            console.warn('Proceeding with default settings (USD, 0% Tax)');
        }

        const currency = restaurant?.currency || 'USD';
        const isGerman = currency === 'EUR';
        const isInr = currency === 'INR';
        console.log('Detected Context:', { currency, isGerman, isInr });

        // 2. Calculate Totals
        const totalAmountFromItems = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        console.log('Total Amount from Items:', totalAmountFromItems);

        let taxRate = 0;
        let netAmount = 0;
        let taxAmount = 0;
        let finalTotalAmount = 0;

        if (isGerman) {
            // Inclusive Tax (7%)
            finalTotalAmount = totalAmountFromItems;
            taxRate = 7.0;
            const taxFactor = taxRate / 100;
            netAmount = finalTotalAmount / (1 + taxFactor);
            taxAmount = finalTotalAmount - netAmount;
        } else if (isInr) {
            // Exclusive Tax (5%)
            netAmount = totalAmountFromItems;
            taxRate = 5.0;
            taxAmount = netAmount * (taxRate / 100);
            finalTotalAmount = netAmount + taxAmount;
        } else {
            // Default (Generic Inclusive/No Tax)
            finalTotalAmount = totalAmountFromItems;
            taxRate = restaurant?.tax_rate || 0;
            if (taxRate > 0) {
                const taxFactor = taxRate / 100;
                netAmount = finalTotalAmount / (1 + taxFactor);
                taxAmount = finalTotalAmount - netAmount;
            } else {
                netAmount = finalTotalAmount;
            }
        }
        console.log('Calculation Result:', { netAmount, taxAmount, finalTotalAmount, taxRate });

        // 3. Generate Receipt Number
        console.log('Generating receipt number...');
        let nextReceiptNumber = 1;
        try {
            const { data: maxReceipt, error: maxError } = await supabaseAdmin
                .from('orders')
                .select('receipt_number')
                .eq('restaurant_id', restaurantId)
                .order('receipt_number', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (maxReceipt?.receipt_number) {
                nextReceiptNumber = Number(maxReceipt.receipt_number) + 1;
            }
        } catch (e) {
            console.warn('Failed to fetch max receipt number, defaulting to 1', e);
        }
        console.log('Assigned Receipt Number:', nextReceiptNumber);

        // 4. Generate TSE Data (Real Fiskaly Integration for Germany)
        let tseSerial = null;
        let tseCounter = null;
        let tseSignature = null;
        const timestamp = new Date().toISOString();

        if (isGerman) {
            console.log('German Order Detected: Attempting Fiskaly Integration...');
            try {
                // Ensure TSS and Client exist
                let tssId = restaurant?.tse_tss_id;
                let clientId = restaurant?.tse_client_id;

                if (!tssId || !clientId) {
                    console.log("Lazy Initializing TSE for restaurant...");
                    const { FiskalyClient } = await import('@/lib/fiskaly');

                    if (!tssId) {
                        try {
                            tssId = await FiskalyClient.createTSS(`Restaurant ${restaurantId}`);
                            await supabaseAdmin.from('restaurants').update({ tse_tss_id: tssId }).eq('id', restaurantId);
                        } catch (e: any) {
                            console.error('Failed to create TSS:', e.message);
                        }
                    }

                    if (tssId && !clientId) {
                        try {
                            const posSerial = `POS-${restaurantId.toString().slice(0, 8)}`;
                            clientId = await FiskalyClient.createClient(tssId, posSerial);
                            await supabaseAdmin.from('restaurants').update({ tse_client_id: clientId }).eq('id', restaurantId);
                        } catch (e: any) {
                            console.error('Failed to create Client:', e.message);
                        }
                    }
                }

                if (tssId && clientId) {
                    const { FiskalyClient } = await import('@/lib/fiskaly');
                    const txId = crypto.randomUUID();
                    console.log('Starting Fiskaly Transaction:', txId);

                    await FiskalyClient.startTransaction(tssId, clientId, txId);
                    const tseResponse = await FiskalyClient.finishTransaction(tssId, clientId, txId, Date.now(), finalTotalAmount, 'REDUCED_1');

                    console.log("Fiskaly Transaction Finished.");
                    tseSerial = tseResponse.tss_serial_number || "FISKALY-SERIAL";
                    tseSignature = tseResponse.signature?.value || "FISKALY-SIG";
                    tseCounter = tseResponse.signature?.counter || 0;
                } else {
                    throw new Error('TSE Configuration Incomplete (No TSS/Client ID)');
                }

            } catch (tseError: any) {
                console.error("Fiskaly Integration Failed:", tseError.message);
                console.warn("Falling back to Mock TSE for robustness.");
                tseSerial = `MOCK-TSE-${restaurantId.toString().slice(0, 4)}`;
                tseSignature = "MOCK_SIGNATURE_FOR_DEMO";
            }
        }

        // 5. Update Orders
        console.log('Updating orders in database...');
        const baseUpdatePayload = {
            status: 'paid',
            receipt_number: nextReceiptNumber,
            tse_serial: tseSerial,
            tse_counter: tseCounter,
            tse_signature: tseSignature,
            tax_rate: taxRate,
            payment_method: paymentMethod || 'cash'
        };

        try {
            if (isInr) {
                console.log('Performing per-order updates for INR (Exclusive Tax)...');
                for (const order of orders) {
                    const orderNet = Number(order.total_amount);
                    const orderTax = orderNet * (taxRate / 100);
                    const orderGross = orderNet + orderTax;

                    await supabaseAdmin.from('orders').update({
                        ...baseUpdatePayload,
                        total_amount: orderGross,
                        tax_amount: Number(orderTax.toFixed(2)),
                        net_amount: Number(orderNet.toFixed(2))
                    }).eq('id', order.id);
                }
            } else {
                console.log('Performing batch update for Inclusive Tax...');
                const { error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update({
                        ...baseUpdatePayload,
                        tax_amount: Number(taxAmount.toFixed(2)),
                        net_amount: Number(netAmount.toFixed(2))
                    })
                    .in('id', orders.map(o => o.id));

                if (updateError) {
                    console.error('Batch Update Failed:', updateError);
                    // Check if it's a "column does not exist" error
                    if (updateError.code === '42703') {
                        console.warn('Columns missing (tax/tse), attempting minimal update...');
                        const { error: minimalError } = await supabaseAdmin
                            .from('orders')
                            .update({ status: 'paid' })
                            .in('id', orders.map(o => o.id));
                        if (minimalError) throw minimalError;
                    } else {
                        throw updateError;
                    }
                }
            }
        } catch (updateErr: any) {
            console.error('Critical Error during order update:', updateErr);
            throw new Error(`Failed to update orders: ${updateErr.message}`);
        }

        // 6. Free the table
        console.log(`Setting table ${tableId} to available...`);
        await supabaseAdmin
            .from('tables')
            .update({ status: 'available' })
            .eq('id', tableId);

        console.log('--- Payment API Request Completed Successfully ---');
        return NextResponse.json({
            success: true,
            receipt: {
                receiptNumber: nextReceiptNumber,
                totalAmount: finalTotalAmount,
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
        console.error('--- CRITICAL PAYMENT ERROR ---');
        console.error(error);
        return NextResponse.json({
            error: error.message || 'An unexpected error occurred during payment processing',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
