"use client"

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { addDays } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
    selected?: Date;
    onSelect: (date: Date | undefined) => void;
    advanceBookingDays?: number;
    disabled?: boolean;
}

export function DatePicker({
    selected,
    onSelect,
    advanceBookingDays = 30,
    disabled = false
}: DatePickerProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = addDays(today, advanceBookingDays);

    return (
        <div className="date-picker-container">
            <style jsx global>{`
        .date-picker-container .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #8b5cf6;
          --rdp-background-color: #ede9fe;
          margin: 0;
        }
        
        .date-picker-container .rdp-months {
          justify-content: center;
        }
        
        .date-picker-container .rdp-day_selected {
          background-color: #8b5cf6;
          color: white;
        }
        
        .date-picker-container .rdp-day_today {
          font-weight: bold;
          color: #8b5cf6;
        }
        
        .date-picker-container .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #f3f4f6;
        }
        
        .date-picker-container .rdp-day_disabled {
          opacity: 0.3;
        }
        
        @media (max-width: 640px) {
          .date-picker-container .rdp {
            --rdp-cell-size: 36px;
          }
        }
      `}</style>

            <DayPicker
                mode="single"
                selected={selected}
                onSelect={onSelect}
                disabled={[
                    { before: today },
                    { after: maxDate }
                ]}
                modifiersClassNames={{
                    selected: 'rdp-day_selected',
                    today: 'rdp-day_today',
                }}
            />
        </div>
    );
}
