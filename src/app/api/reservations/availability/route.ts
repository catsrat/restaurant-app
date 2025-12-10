import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTimeSlots } from '@/lib/reservations';

// GET - Check available time slots
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const date = searchParams.get('date');
        const partySize = searchParams.get('partySize');

        if (!restaurantId || !date) {
            return NextResponse.json(
                { error: 'Restaurant ID and date are required' },
                { status: 400 }
            );
        }

        const partySizeNum = partySize ? parseInt(partySize) : 1;

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
                { error: 'Reservations are currently disabled' },
                { status: 403 }
            );
        }

        // Generate all possible time slots
        const allSlots = generateTimeSlots(
            settings.opening_time,
            settings.closing_time,
            settings.slot_duration_minutes
        );

        // Get existing reservations for this date
        const { data: existingReservations, error: reservationsError } = await supabase
            .from('reservations')
            .select('reservation_time, table_id, party_size')
            .eq('restaurant_id', restaurantId)
            .eq('reservation_date', date)
            .in('status', ['pending', 'confirmed', 'seated']);

        if (reservationsError) {
            console.error('Error fetching reservations:', reservationsError);
            return NextResponse.json(
                { error: 'Failed to check availability' },
                { status: 500 }
            );
        }

        // Get all tables for the restaurant
        const { data: tables, error: tablesError } = await supabase
            .from('tables')
            .select('id, name')
            .eq('restaurant_id', restaurantId);

        if (tablesError) {
            console.error('Error fetching tables:', tablesError);
            return NextResponse.json(
                { error: 'Failed to fetch tables' },
                { status: 500 }
            );
        }

        const totalTables = tables?.length || 0;

        // Calculate availability for each slot
        const availableSlots = allSlots.map(slot => {
            // Count how many tables are reserved at this time
            const reservedCount = existingReservations?.filter(
                r => r.reservation_time === slot + ':00'
            ).length || 0;

            const remainingCapacity = totalTables - reservedCount;

            return {
                time: slot,
                available: remainingCapacity > 0,
                remainingCapacity,
            };
        });

        // Filter out past times if the date is today
        const now = new Date();
        const selectedDate = new Date(date);
        const isToday = selectedDate.toDateString() === now.toDateString();

        const filteredSlots = isToday
            ? availableSlots.filter(slot => {
                const [hours, minutes] = slot.time.split(':').map(Number);
                const slotTime = new Date(now);
                slotTime.setHours(hours, minutes, 0, 0);
                return slotTime > now;
            })
            : availableSlots;

        return NextResponse.json({
            slots: filteredSlots,
            settings: {
                slotDuration: settings.slot_duration_minutes,
                maxPartySize: settings.max_party_size,
            },
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
