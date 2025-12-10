import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get single reservation
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Reservation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ reservation: data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update reservation
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const {
            status,
            tableId,
            customerName,
            customerEmail,
            customerPhone,
            partySize,
            reservationDate,
            reservationTime,
            specialRequests,
        } = body;

        // Build update object with only provided fields
        const updates: any = {};

        if (status !== undefined) {
            const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: 'Invalid status' },
                    { status: 400 }
                );
            }
            updates.status = status;
        }

        if (tableId !== undefined) updates.table_id = tableId;
        if (customerName !== undefined) updates.customer_name = customerName;
        if (customerEmail !== undefined) updates.customer_email = customerEmail;
        if (customerPhone !== undefined) updates.customer_phone = customerPhone;
        if (partySize !== undefined) {
            if (partySize < 1 || partySize > 50) {
                return NextResponse.json(
                    { error: 'Party size must be between 1 and 50' },
                    { status: 400 }
                );
            }
            updates.party_size = partySize;
        }
        if (reservationDate !== undefined) updates.reservation_date = reservationDate;
        if (reservationTime !== undefined) updates.reservation_time = reservationTime;
        if (specialRequests !== undefined) updates.special_requests = specialRequests;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('reservations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating reservation:', error);
            return NextResponse.json(
                { error: 'Failed to update reservation' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Reservation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ reservation: data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel reservation
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Instead of deleting, we'll update status to 'cancelled'
        const { data, error } = await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error cancelling reservation:', error);
            return NextResponse.json(
                { error: 'Failed to cancel reservation' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Reservation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Reservation cancelled successfully',
            reservation: data
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
