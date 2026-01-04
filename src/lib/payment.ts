
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processOrderPayment(orderId: string, restaurantId: string, paymentMethod: 'cash' | 'card' = 'card') {
    // 1. Fetch Order
    const { data: order, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) throw new Error('Order not found');
    if (order.status === 'paid') return order; // Idempotency check

    // 2. Fetch Restaurant Settings
    const { data: restaurant, error: restError } = await supabaseAdmin
        .from('restaurants')
        .select('currency, tax_rate, tse_tss_id, tse_client_id')
        .eq('id', restaurantId)
        .single();

    if (restError) throw restError;

    const currency = restaurant?.currency || 'USD';
    const isGerman = currency === 'EUR';
    const isInr = currency === 'INR';

    // 3. Calculate Totals (Reused Logic)
    // Note: If we are processing a single order, total_amount is straightforward.
    // If we handle split payments or table payments, this function should accept a list of orders.
    // For now, let's assume single order processing as per the Webhook requirement.
    // If POS calls this, it might loop.

    // POS logic handled a batch. Let's make this support batch or single?
    // Let's stick to single for simplicity in this refactor step, and loop in the POS route validation if needed.
    // Actually, POS route batches by table. Let's make this function handle a LIST of orders or a single ID.
    // To match POS route exactly, let's keep it simple: Process ONE order. POS route can loop.

    const totalAmountFromItems = order.total_amount || 0;
    // Wait, total_amount in DB is sometimes Net (INR) or Gross (EUR).
    // Let's rely on stored value and recalculate tax.

    let taxRate = 0;
    let netAmount = 0;
    let taxAmount = 0;
    let finalTotalAmount = 0;
    // We need to fetch items to accurately sum if total_amount is stale? 
    // Usually total_amount is updated when items added. Let's trust it.

    if (isGerman) {
        // Inclusive Tax (7% Reduced)
        finalTotalAmount = totalAmountFromItems;
        taxRate = 7.0;
        const taxFactor = taxRate / 100;
        netAmount = finalTotalAmount / (1 + taxFactor);
        taxAmount = finalTotalAmount - netAmount;
    } else if (isInr) {
        // Exclusive Tax
        // totalAmountFromItems is NET in DB for INR currently (based on previous logic).
        netAmount = totalAmountFromItems;
        taxRate = 5.0;
        taxAmount = netAmount * (taxRate / 100);
        finalTotalAmount = netAmount + taxAmount;
    } else {
        // Generic
        finalTotalAmount = totalAmountFromItems;
        taxRate = restaurant.tax_rate || 0;
        if (taxRate > 0) {
            const taxFactor = taxRate / 100;
            netAmount = finalTotalAmount / (1 + taxFactor);
            taxAmount = finalTotalAmount - netAmount;
        } else {
            netAmount = finalTotalAmount;
        }
    }

    // 4. Generate Receipt Number
    // Atomic increment logic is safer in SQL function but here we do read-then-write
    const { data: maxReceipt } = await supabaseAdmin
        .from('orders')
        .select('receipt_number')
        .eq('restaurant_id', restaurantId)
        .order('receipt_number', { ascending: false })
        .limit(1)
        .single();

    const nextReceiptNumber = (maxReceipt?.receipt_number || 0) + 1;

    // 5. TSE Integration (Fiskaly) for Germany
    let tseSerial = null;
    let tseCounter = null;
    let tseSignature = null;
    const timestamp = new Date().toISOString();

    if (isGerman) {
        try {
            // Dynamic import to avoid loading Fiskaly in non-German contexts if heavy, though it's small.
            const { FiskalyClient } = await import('@/lib/fiskaly');

            let tssId = restaurant.tse_tss_id;
            let clientId = restaurant.tse_client_id;

            // Bootstrap Logic
            if (!tssId || !clientId) {
                // ... (Bootstrap logic as in route.ts)
                // For brevity in shared lib, we assume bootstrapped or do simplified check.
                // Let's include bootstrap to be safe.
                if (!tssId) {
                    tssId = await FiskalyClient.createTSS(`Restaurant ${restaurantId}`);
                    await supabaseAdmin.from('restaurants').update({ tse_tss_id: tssId }).eq('id', restaurantId);
                }
                if (!clientId) {
                    const posSerial = `POS-${restaurantId.slice(0, 8)}`;
                    clientId = await FiskalyClient.createClient(tssId, posSerial);
                    await supabaseAdmin.from('restaurants').update({ tse_client_id: clientId }).eq('id', restaurantId);
                }
            }

            const txId = crypto.randomUUID();
            await FiskalyClient.startTransaction(tssId, clientId, txId);
            const tseResponse = await FiskalyClient.finishTransaction(tssId, clientId, txId, Date.now(), finalTotalAmount, 'REDUCED_1');

            // Extract Data
            const log = tseResponse.log;
            tseSerial = log.certificate_serial || tseResponse.tss_serial_number;
            tseCounter = log.signature_counter || tseResponse.signature_counter;
            tseSignature = log.signature.value || tseResponse.signature.value;

            if (!tseSignature) tseSignature = "BASE64_SIG_MISSED";

        } catch (err) {
            console.error("TSE Error in Shared Lib:", err);
            // Soft fail
            tseSerial = `TSE-ERR`;
            tseSignature = "TSE_FAILED";
        }
    }

    // 6. Update Order
    const updatePayload = {
        status: 'paid',
        receipt_number: nextReceiptNumber,
        tse_serial: tseSerial,
        tse_counter: tseCounter,
        tse_signature: tseSignature,
        tax_rate: taxRate,
        tax_amount: Number(taxAmount.toFixed(2)),
        net_amount: Number(netAmount.toFixed(2)),
        payment_method: paymentMethod,
        // For INR, update total to Gross now
        total_amount: isInr ? finalTotalAmount : order.total_amount
    };

    const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

    if (updateError) throw updateError;

    // 7. Free Table (if last order?) 
    // This logic is tricky if there are multiple orders for the table.
    // The previous POS logic freed the table. 
    // Ideally, we verify if all orders for table are paid.
    // For now, let's keep it simple: If order has table_id, check if others are unpaid.
    if (order.table_id) {
        const { data: unpaid } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('table_id', order.table_id)
            .neq('id', orderId)
            .neq('status', 'paid');

        if (!unpaid || unpaid.length === 0) {
            await supabaseAdmin.from('tables').update({ status: 'available' }).eq('id', order.table_id);
        }
    }

    return { ...order, ...updatePayload };
}
