"use client"

import React from 'react';
import { TimeSlot } from '@/types';
import { formatTimeDisplay } from '@/lib/reservations';

interface TimeSlotPickerProps {
    slots: TimeSlot[];
    selectedTime?: string;
    onSelect: (time: string) => void;
    loading?: boolean;
}

export function TimeSlotPicker({
    slots,
    selectedTime,
    onSelect,
    loading = false
}: TimeSlotPickerProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="h-12 bg-gray-200 rounded-lg animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No available time slots for this date.</p>
                <p className="text-sm mt-2">Please select a different date.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slots.map((slot) => (
                <button
                    key={slot.time}
                    onClick={() => slot.available && onSelect(slot.time)}
                    disabled={!slot.available}
                    className={`
            h-12 rounded-lg font-medium text-sm transition-all
            ${selectedTime === slot.time
                            ? 'bg-purple-600 text-white shadow-lg scale-105'
                            : slot.available
                                ? 'bg-white text-gray-700 border border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
          `}
                >
                    <div>{formatTimeDisplay(slot.time)}</div>
                    {slot.available && slot.remainingCapacity !== undefined && slot.remainingCapacity <= 2 && (
                        <div className="text-xs text-orange-600 mt-0.5">
                            {slot.remainingCapacity} left
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
