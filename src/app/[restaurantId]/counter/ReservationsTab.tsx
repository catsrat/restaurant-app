"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, Phone, Mail, MessageSquare, Settings, RefreshCw, Check, X, UserCheck, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { Reservation, ReservationSettings, Table } from '@/types';
import { formatReservationDateTime, formatDate, getStatusColor, getStatusDisplayName } from '@/lib/reservations';
import { supabase } from '@/lib/supabase';

interface ReservationsTabProps {
    restaurantId: string;
    tables: Table[];
}

export function ReservationsTab({ restaurantId, tables }: ReservationsTabProps) {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [settings, setSettings] = useState<ReservationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showNewBooking, setShowNewBooking] = useState(false);
    const [filterDate, setFilterDate] = useState<string>(formatDate(new Date()));
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // New booking form state
    const [newBooking, setNewBooking] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        partySize: 2,
        reservationDate: formatDate(new Date()),
        reservationTime: '',
        specialRequests: '',
        tableId: ''
    });

    useEffect(() => {
        fetchReservations();
        fetchSettings();
        subscribeToReservations();
    }, [restaurantId, filterDate, filterStatus]);

    async function fetchReservations() {
        setLoading(true);
        try {
            let url = `/api/reservations?restaurantId=${restaurantId}`;
            if (filterDate) url += `&date=${filterDate}`;
            if (filterStatus !== 'all') url += `&status=${filterStatus}`;

            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setReservations(data.reservations || []);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSettings() {
        try {
            const res = await fetch(`/api/reservations/settings?restaurantId=${restaurantId}`);
            const data = await res.json();
            if (res.ok) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    }

    function subscribeToReservations() {
        const channel = supabase
            .channel('reservations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                () => {
                    fetchReservations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    async function updateReservationStatus(id: string, status: string, reservation?: Reservation) {
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                // Update table status when seating or completing
                if (reservation?.table_id) {
                    if (status === 'seated') {
                        // Mark table as occupied using Supabase directly
                        await supabase
                            .from('tables')
                            .update({ status: 'occupied' })
                            .eq('id', reservation.table_id);
                    } else if (status === 'completed' || status === 'cancelled' || status === 'no-show') {
                        // Mark table as available using Supabase directly
                        await supabase
                            .from('tables')
                            .update({ status: 'available' })
                            .eq('id', reservation.table_id);
                    }
                }
                fetchReservations();
            }
        } catch (error) {
            console.error('Error updating reservation:', error);
        }
    }

    async function assignTable(reservationId: string, tableId: string) {
        try {
            const res = await fetch(`/api/reservations/${reservationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId }),
            });

            if (res.ok) {
                fetchReservations();
            }
        } catch (error) {
            console.error('Error assigning table:', error);
        }
    }

    async function updateSettings(updates: Partial<ReservationSettings>) {
        try {
            const res = await fetch('/api/reservations/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    ...updates,
                }),
            });

            if (res.ok) {
                fetchSettings();
                alert('Settings updated successfully');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        }
    }

    async function createReservation() {
        if (!newBooking.customerName || !newBooking.reservationTime) {
            alert('Please fill in customer name and time');
            return;
        }

        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    customerName: newBooking.customerName,
                    customerEmail: newBooking.customerEmail || null,
                    customerPhone: newBooking.customerPhone || null,
                    partySize: newBooking.partySize,
                    reservationDate: newBooking.reservationDate,
                    reservationTime: newBooking.reservationTime,
                    specialRequests: newBooking.specialRequests || null,
                    tableId: newBooking.tableId || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowNewBooking(false);
                setNewBooking({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    partySize: 2,
                    reservationDate: formatDate(new Date()),
                    reservationTime: '',
                    specialRequests: '',
                    tableId: ''
                });
                fetchReservations();
                alert('Reservation created successfully!');
            } else {
                alert(`Error: ${data.error || 'Failed to create reservation'}`);
            }
        } catch (error) {
            console.error('Error creating reservation:', error);
            alert('Failed to create reservation');
        }
    }

    const todayReservations = reservations.filter(r => r.reservation_date === formatDate(new Date()));
    const upcomingToday = todayReservations.filter(r => ['pending', 'confirmed'].includes(r.status));
    const seatedNow = todayReservations.filter(r => r.status === 'seated');

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Today's Reservations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{todayReservations.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{upcomingToday.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Currently Seated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{seatedNow.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Manage Reservations</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => setShowNewBooking(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Booking
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchReservations}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="max-w-xs"
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="seated">Seated</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no-show">No Show</option>
                            </select>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && settings && (
                        <Card className="mb-4 bg-gray-50">
                            <CardHeader>
                                <CardTitle className="text-lg">Reservation Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Enable Reservations</Label>
                                        <select
                                            value={settings.is_enabled ? 'true' : 'false'}
                                            onChange={(e) => updateSettings({ is_enabled: e.target.value === 'true' })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="true">Enabled</option>
                                            <option value="false">Disabled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Slot Duration (minutes)</Label>
                                        <select
                                            value={settings.slot_duration_minutes}
                                            onChange={(e) => updateSettings({ slot_duration_minutes: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="60">60 minutes</option>
                                            <option value="90">90 minutes</option>
                                            <option value="120">120 minutes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Opening Time</Label>
                                        <Input
                                            type="time"
                                            value={settings.opening_time}
                                            onChange={(e) => updateSettings({ opening_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Closing Time</Label>
                                        <Input
                                            type="time"
                                            value={settings.closing_time}
                                            onChange={(e) => updateSettings({ closing_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Max Party Size</Label>
                                        <Input
                                            type="number"
                                            value={settings.max_party_size}
                                            onChange={(e) => updateSettings({ max_party_size: parseInt(e.target.value) })}
                                            min="1"
                                            max="50"
                                        />
                                    </div>
                                    <div>
                                        <Label>Advance Booking (days)</Label>
                                        <Input
                                            type="number"
                                            value={settings.advance_booking_days}
                                            onChange={(e) => updateSettings({ advance_booking_days: parseInt(e.target.value) })}
                                            min="1"
                                            max="365"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.auto_confirm}
                                            onChange={(e) => updateSettings({ auto_confirm: e.target.checked })}
                                        />
                                        <span>Auto-confirm reservations</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.require_email}
                                            onChange={(e) => updateSettings({ require_email: e.target.checked })}
                                        />
                                        <span>Require email</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.require_phone}
                                            onChange={(e) => updateSettings({ require_phone: e.target.checked })}
                                        />
                                        <span>Require phone</span>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* New Booking Form */}
                    {showNewBooking && (
                        <Card className="mb-4 bg-purple-50 border-purple-200">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Create New Reservation</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowNewBooking(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Customer Name *</Label>
                                        <Input
                                            value={newBooking.customerName}
                                            onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <Label>Party Size *</Label>
                                        <Input
                                            type="number"
                                            value={newBooking.partySize}
                                            onChange={(e) => setNewBooking({ ...newBooking, partySize: parseInt(e.target.value) })}
                                            min="1"
                                            max={settings?.max_party_size || 12}
                                        />
                                    </div>
                                    <div>
                                        <Label>Date *</Label>
                                        <Input
                                            type="date"
                                            value={newBooking.reservationDate}
                                            onChange={(e) => setNewBooking({ ...newBooking, reservationDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Time *</Label>
                                        <Input
                                            type="time"
                                            value={newBooking.reservationTime}
                                            onChange={(e) => setNewBooking({ ...newBooking, reservationTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={newBooking.customerEmail}
                                            onChange={(e) => setNewBooking({ ...newBooking, customerEmail: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            type="tel"
                                            value={newBooking.customerPhone}
                                            onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                    <div>
                                        <Label>Assign Table (Optional)</Label>
                                        <select
                                            value={newBooking.tableId}
                                            onChange={(e) => setNewBooking({ ...newBooking, tableId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">No table assigned</option>
                                            {tables.map(table => (
                                                <option key={table.id} value={table.id}>{table.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label>Special Requests</Label>
                                    <textarea
                                        value={newBooking.specialRequests}
                                        onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
                                        placeholder="Any dietary restrictions or special occasions?"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={createReservation}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    >
                                        Create Reservation
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowNewBooking(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reservations List */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : reservations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No reservations found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reservations.map((reservation) => (
                                <Card key={reservation.id} className="border-l-4" style={{ borderLeftColor: getStatusColor(reservation.status).includes('green') ? '#10b981' : getStatusColor(reservation.status).includes('blue') ? '#3b82f6' : getStatusColor(reservation.status).includes('yellow') ? '#f59e0b' : '#ef4444' }}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg">{reservation.customer_name}</h3>
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                                                        {getStatusDisplayName(reservation.status)}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(reservation.reservation_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {reservation.reservation_time}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
                                                    </div>
                                                    {reservation.table_id && (
                                                        <div className="flex items-center gap-1">
                                                            <UserCheck className="h-4 w-4" />
                                                            {tables.find(t => t.id === reservation.table_id)?.name || 'Table'}
                                                        </div>
                                                    )}
                                                </div>
                                                {reservation.customer_email && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                        <Mail className="h-4 w-4" />
                                                        {reservation.customer_email}
                                                    </div>
                                                )}
                                                {reservation.customer_phone && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                        <Phone className="h-4 w-4" />
                                                        {reservation.customer_phone}
                                                    </div>
                                                )}
                                                {reservation.special_requests && (
                                                    <div className="flex items-start gap-1 text-sm text-gray-600 mt-2 bg-yellow-50 p-2 rounded">
                                                        <MessageSquare className="h-4 w-4 mt-0.5" />
                                                        <span>{reservation.special_requests}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                {reservation.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => updateReservationStatus(reservation.id, 'confirmed', reservation)}
                                                        >
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-300 text-red-600 hover:bg-red-50"
                                                            onClick={() => updateReservationStatus(reservation.id, 'cancelled', reservation)}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </Button>
                                                    </>
                                                )}
                                                {reservation.status === 'confirmed' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                            onClick={() => updateReservationStatus(reservation.id, 'seated', reservation)}
                                                        >
                                                            <UserCheck className="h-4 w-4 mr-1" />
                                                            Seat
                                                        </Button>
                                                        {!reservation.table_id && (
                                                            <select
                                                                className="text-sm px-2 py-1 border rounded"
                                                                onChange={(e) => assignTable(reservation.id, e.target.value)}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Assign Table</option>
                                                                {tables.filter(t => t.status === 'available').map(table => (
                                                                    <option key={table.id} value={table.id}>{table.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                            onClick={() => updateReservationStatus(reservation.id, 'no-show', reservation)}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            No Show
                                                        </Button>
                                                    </>
                                                )}
                                                {reservation.status === 'seated' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => updateReservationStatus(reservation.id, 'completed', reservation)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
