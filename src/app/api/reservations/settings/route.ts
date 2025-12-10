import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch reservation settings
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('reservation_settings')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .single();

        if (error) {
            // If settings don't exist, create default settings
            if (error.code === 'PGRST116') {
                const { data: newSettings, error: insertError } = await supabase
                    .from('reservation_settings')
                    .insert({
                        restaurant_id: restaurantId,
                        is_enabled: true,
                        advance_booking_days: 30,
                        slot_duration_minutes: 30,
                        opening_time: '10:00:00',
                        closing_time: '22:00:00',
                        max_party_size: 12,
                        require_phone: false,
                        require_email: true,
                        auto_confirm: true,
                        booking_buffer_minutes: 0,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating default settings:', insertError);
                    return NextResponse.json(
                        { error: 'Failed to create reservation settings' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ settings: newSettings });
            }

            console.error('Error fetching settings:', error);
            return NextResponse.json(
                { error: 'Failed to fetch reservation settings' },
                { status: 500 }
            );
        }

        return NextResponse.json({ settings: data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update reservation settings
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            restaurantId,
            isEnabled,
            advanceBookingDays,
            slotDurationMinutes,
            openingTime,
            closingTime,
            maxPartySize,
            requirePhone,
            requireEmail,
            autoConfirm,
            bookingBufferMinutes,
        } = body;

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        // Validation
        if (advanceBookingDays !== undefined && (advanceBookingDays < 1 || advanceBookingDays > 365)) {
            return NextResponse.json(
                { error: 'Advance booking days must be between 1 and 365' },
                { status: 400 }
            );
        }

        if (slotDurationMinutes !== undefined && ![15, 30, 60, 90, 120].includes(slotDurationMinutes)) {
            return NextResponse.json(
                { error: 'Slot duration must be 15, 30, 60, 90, or 120 minutes' },
                { status: 400 }
            );
        }

        if (maxPartySize !== undefined && (maxPartySize < 1 || maxPartySize > 50)) {
            return NextResponse.json(
                { error: 'Max party size must be between 1 and 50' },
                { status: 400 }
            );
        }

        // Build update object
        const updates: any = {};
        if (isEnabled !== undefined) updates.is_enabled = isEnabled;
        if (advanceBookingDays !== undefined) updates.advance_booking_days = advanceBookingDays;
        if (slotDurationMinutes !== undefined) updates.slot_duration_minutes = slotDurationMinutes;
        if (openingTime !== undefined) updates.opening_time = openingTime;
        if (closingTime !== undefined) updates.closing_time = closingTime;
        if (maxPartySize !== undefined) updates.max_party_size = maxPartySize;
        if (requirePhone !== undefined) updates.require_phone = requirePhone;
        if (requireEmail !== undefined) updates.require_email = requireEmail;
        if (autoConfirm !== undefined) updates.auto_confirm = autoConfirm;
        if (bookingBufferMinutes !== undefined) updates.booking_buffer_minutes = bookingBufferMinutes;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        // Upsert settings
        const { data, error } = await supabase
            .from('reservation_settings')
            .upsert({
                restaurant_id: restaurantId,
                ...updates,
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating settings:', error);
            return NextResponse.json(
                { error: 'Failed to update reservation settings' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            settings: data,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
