import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidEmail, isValidPhone } from '@/lib/reservations';

// GET - List reservations with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const date = searchParams.get('date');
        const status = searchParams.get('status');
        const tableId = searchParams.get('tableId');

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('reservations')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('reservation_date', { ascending: true })
            .order('reservation_time', { ascending: true });

        if (date) {
            query = query.eq('reservation_date', date);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (tableId) {
            query = query.eq('table_id', tableId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching reservations:', error);
            return NextResponse.json(
                { error: 'Failed to fetch reservations' },
                { status: 500 }
            );
        }

        return NextResponse.json({ reservations: data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new reservation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            restaurantId,
            tableId,
            customerName,
            customerEmail,
            customerPhone,
            partySize,
            reservationDate,
            reservationTime,
            specialRequests,
        } = body;

        // Validation
        if (!restaurantId || !customerName || !partySize || !reservationDate || !reservationTime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (partySize < 1 || partySize > 50) {
            return NextResponse.json(
                { error: 'Party size must be between 1 and 50' },
                { status: 400 }
            );
        }

        // Get reservation settings
        const { data: settings, error: settingsError } = await supabase
            .from('reservation_settings')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Restaurant reservation settings not found' },
                { status: 404 }
            );
        }

        if (!settings.is_enabled) {
            return NextResponse.json(
                { error: 'Reservations are currently disabled for this restaurant' },
                { status: 403 }
            );
        }

        // Validate email if required
        if (settings.require_email && (!customerEmail || !isValidEmail(customerEmail))) {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        // Validate phone if required
        if (settings.require_phone && (!customerPhone || !isValidPhone(customerPhone))) {
            return NextResponse.json(
                { error: 'Valid phone number is required' },
                { status: 400 }
            );
        }

        // Validate party size
        if (partySize > settings.max_party_size) {
            return NextResponse.json(
                { error: `Party size cannot exceed ${settings.max_party_size}` },
                { status: 400 }
            );
        }

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservationDateObj = new Date(reservationDate);

        if (reservationDateObj < today) {
            return NextResponse.json(
                { error: 'Cannot book reservations in the past' },
                { status: 400 }
            );
        }

        // Check if date is within booking window
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + settings.advance_booking_days);

        if (reservationDateObj > maxDate) {
            return NextResponse.json(
                { error: `Cannot book more than ${settings.advance_booking_days} days in advance` },
                { status: 400 }
            );
        }

        // Check for conflicts if table is specified
        if (tableId) {
            const { data: conflicts } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('table_id', tableId)
                .eq('reservation_date', reservationDate)
                .eq('reservation_time', reservationTime)
                .in('status', ['pending', 'confirmed', 'seated']);

            if (conflicts && conflicts.length > 0) {
                return NextResponse.json(
                    { error: 'This table is already reserved for the selected time' },
                    { status: 409 }
                );
            }
        }

        // Determine initial status
        const initialStatus = settings.auto_confirm ? 'confirmed' : 'pending';

        // Create reservation
        const { data: reservation, error: insertError } = await supabase
            .from('reservations')
            .insert({
                restaurant_id: restaurantId,
                table_id: tableId || null,
                customer_name: customerName,
                customer_email: customerEmail || null,
                customer_phone: customerPhone || null,
                party_size: partySize,
                reservation_date: reservationDate,
                reservation_time: reservationTime,
                status: initialStatus,
                special_requests: specialRequests || null,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating reservation:', insertError);
            return NextResponse.json(
                { error: 'Failed to create reservation' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                reservation,
                message: initialStatus === 'confirmed'
                    ? 'Reservation confirmed successfully'
                    : 'Reservation created and pending confirmation'
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
