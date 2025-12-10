"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Users, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSlot, ReservationSettings } from '@/types';
import { formatDate, formatReservationDateTime, isValidEmail, isValidPhone } from '@/lib/reservations';
import { motion, AnimatePresence } from 'framer-motion';

type BookingStep = 'party-size' | 'date' | 'time' | 'details' | 'confirmation';

export default function ReservationsPage() {
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.restaurantId as string;

    const [step, setStep] = useState<BookingStep>('party-size');
    const [partySize, setPartySize] = useState<number>(2);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedTime, setSelectedTime] = useState<string>();
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    const [settings, setSettings] = useState<ReservationSettings | null>(null);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmationId, setConfirmationId] = useState<string | null>(null);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, [restaurantId]);

    // Fetch available slots when date changes
    useEffect(() => {
        if (selectedDate && settings) {
            fetchAvailableSlots();
        }
    }, [selectedDate, partySize]);

    async function fetchSettings() {
        try {
            const res = await fetch(`/api/reservations/settings?restaurantId=${restaurantId}`);
            const data = await res.json();

            if (!res.ok) {
                setError('Failed to load reservation settings');
                return;
            }

            if (!data.settings.is_enabled) {
                setError('Reservations are currently not available');
                return;
            }

            setSettings(data.settings);
        } catch (err) {
            setError('Failed to load reservation settings');
        }
    }

    async function fetchAvailableSlots() {
        if (!selectedDate) return;

        setSlotsLoading(true);
        try {
            const dateStr = formatDate(selectedDate);
            const res = await fetch(
                `/api/reservations/availability?restaurantId=${restaurantId}&date=${dateStr}&partySize=${partySize}`
            );
            const data = await res.json();

            if (res.ok) {
                setAvailableSlots(data.slots || []);
            } else {
                setError('Failed to check availability');
            }
        } catch (err) {
            setError('Failed to check availability');
        } finally {
            setSlotsLoading(false);
        }
    }

    async function handleSubmit() {
        if (!selectedDate || !selectedTime || !customerName) {
            setError('Please fill in all required fields');
            return;
        }

        // Validation
        if (settings?.require_email && (!customerEmail || !isValidEmail(customerEmail))) {
            setError('Please enter a valid email address');
            return;
        }

        if (settings?.require_phone && (!customerPhone || !isValidPhone(customerPhone))) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    customerName,
                    customerEmail: customerEmail || null,
                    customerPhone: customerPhone || null,
                    partySize,
                    reservationDate: formatDate(selectedDate),
                    reservationTime: selectedTime,
                    specialRequests: specialRequests || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create reservation');
                return;
            }

            setConfirmationId(data.reservation.id);
            setStep('confirmation');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleNext() {
        setError(null);

        if (step === 'party-size') {
            setStep('date');
        } else if (step === 'date' && selectedDate) {
            setStep('time');
        } else if (step === 'time' && selectedTime) {
            setStep('details');
        }
    }

    function handleBack() {
        setError(null);

        if (step === 'date') {
            setStep('party-size');
        } else if (step === 'time') {
            setStep('date');
        } else if (step === 'details') {
            setStep('time');
        }
    }

    if (!settings && !error) {
        return (
            <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (error && !settings) {
        return (
            <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">{error}</p>
                        <Button onClick={() => router.push('/')} className="mt-4 w-full">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0C10] text-gray-300 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Reserve a Table</h1>
                    <p className="text-gray-400">Book your dining experience in just a few steps</p>
                </div>

                {/* Progress Steps */}
                {step !== 'confirmation' && (
                    <div className="flex items-center justify-center mb-8 gap-2">
                        {['party-size', 'date', 'time', 'details'].map((s, i) => (
                            <React.Fragment key={s}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                            ? 'bg-purple-600 text-white'
                                            : ['party-size', 'date', 'time', 'details'].indexOf(step) > i
                                                ? 'bg-purple-600/30 text-purple-400'
                                                : 'bg-gray-700 text-gray-500'
                                        }`}
                                >
                                    {i + 1}
                                </div>
                                {i < 3 && (
                                    <div
                                        className={`w-12 h-1 ${['party-size', 'date', 'time', 'details'].indexOf(step) > i
                                                ? 'bg-purple-600/30'
                                                : 'bg-gray-700'
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Main Card */}
                <Card className="bg-gray-900/50 border-white/10">
                    <CardContent className="p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Party Size */}
                            {step === 'party-size' && (
                                <motion.div
                                    key="party-size"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <Users className="w-6 h-6 text-purple-400" />
                                        <h2 className="text-2xl font-bold text-white">Party Size</h2>
                                    </div>

                                    <p className="text-gray-400 mb-6">How many people will be dining?</p>

                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
                                        {[...Array(settings?.max_party_size || 12)].map((_, i) => {
                                            const size = i + 1;
                                            return (
                                                <button
                                                    key={size}
                                                    onClick={() => setPartySize(size)}
                                                    className={`h-16 rounded-lg font-semibold text-lg transition-all ${partySize === size
                                                            ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <Button onClick={handleNext} className="w-full bg-purple-600 hover:bg-purple-700">
                                        Continue
                                    </Button>
                                </motion.div>
                            )}

                            {/* Step 2: Date */}
                            {step === 'date' && (
                                <motion.div
                                    key="date"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <Calendar className="w-6 h-6 text-purple-400" />
                                        <h2 className="text-2xl font-bold text-white">Select Date</h2>
                                    </div>

                                    <p className="text-gray-400 mb-6">Choose your preferred date</p>

                                    <div className="flex justify-center mb-8 bg-white rounded-xl p-4">
                                        <DatePicker
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            advanceBookingDays={settings?.advance_booking_days}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button onClick={handleBack} variant="outline" className="flex-1">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!selectedDate}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Time */}
                            {step === 'time' && (
                                <motion.div
                                    key="time"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <Clock className="w-6 h-6 text-purple-400" />
                                        <h2 className="text-2xl font-bold text-white">Select Time</h2>
                                    </div>

                                    <p className="text-gray-400 mb-6">
                                        Available times for {selectedDate?.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>

                                    <div className="mb-8">
                                        <TimeSlotPicker
                                            slots={availableSlots}
                                            selectedTime={selectedTime}
                                            onSelect={setSelectedTime}
                                            loading={slotsLoading}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button onClick={handleBack} variant="outline" className="flex-1">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!selectedTime}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Details */}
                            {step === 'details' && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6">Your Details</h2>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <Label className="text-gray-300">Name *</Label>
                                            <Input
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="John Doe"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-gray-300">
                                                Email {settings?.require_email && '*'}
                                            </Label>
                                            <Input
                                                type="email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                placeholder="john@example.com"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-gray-300">
                                                Phone {settings?.require_phone && '*'}
                                            </Label>
                                            <Input
                                                type="tel"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="+1 234 567 8900"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-gray-300">Special Requests (Optional)</Label>
                                            <textarea
                                                value={specialRequests}
                                                onChange={(e) => setSpecialRequests(e.target.value)}
                                                placeholder="Any dietary restrictions or special occasions?"
                                                rows={3}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Reservation Summary */}
                                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4 mb-6">
                                        <h3 className="font-semibold text-white mb-3">Reservation Summary</h3>
                                        <div className="space-y-2 text-sm text-gray-300">
                                            <div className="flex justify-between">
                                                <span>Party Size:</span>
                                                <span className="font-medium text-white">{partySize} {partySize === 1 ? 'person' : 'people'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date & Time:</span>
                                                <span className="font-medium text-white">
                                                    {selectedDate && selectedTime && formatReservationDateTime(
                                                        formatDate(selectedDate),
                                                        selectedTime
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button onClick={handleBack} variant="outline" className="flex-1" disabled={loading}>
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading || !customerName}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Confirming...
                                                </>
                                            ) : (
                                                'Confirm Reservation'
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 5: Confirmation */}
                            {step === 'confirmation' && (
                                <motion.div
                                    key="confirmation"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    >
                                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                                    </motion.div>

                                    <h2 className="text-3xl font-bold text-white mb-4">Reservation Confirmed!</h2>
                                    <p className="text-gray-400 mb-8">
                                        We've received your reservation and {settings?.auto_confirm ? 'confirmed it' : 'will confirm it shortly'}.
                                    </p>

                                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8 text-left">
                                        <h3 className="font-semibold text-white mb-4">Reservation Details</h3>
                                        <div className="space-y-3 text-gray-300">
                                            <div className="flex justify-between">
                                                <span>Confirmation ID:</span>
                                                <span className="font-mono text-purple-400">#{confirmationId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Name:</span>
                                                <span className="font-medium text-white">{customerName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Party Size:</span>
                                                <span className="font-medium text-white">{partySize} {partySize === 1 ? 'person' : 'people'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date & Time:</span>
                                                <span className="font-medium text-white">
                                                    {selectedDate && selectedTime && formatReservationDateTime(
                                                        formatDate(selectedDate),
                                                        selectedTime
                                                    )}
                                                </span>
                                            </div>
                                            {customerEmail && (
                                                <div className="flex justify-between">
                                                    <span>Email:</span>
                                                    <span className="font-medium text-white">{customerEmail}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => router.push(`/${restaurantId}/menu/walk-in`)}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                            View Menu
                                        </Button>
                                        <Button
                                            onClick={() => router.push('/')}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Back to Home
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
