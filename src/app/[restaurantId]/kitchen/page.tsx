"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ChefHat, Timer, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import AdminGuard from '@/components/AdminGuard';

export default function KitchenPage() {
    return (
        <AdminGuard>
            <KitchenContent />
        </AdminGuard>
    );
}

function KitchenContent() {
    const { orders, updateOrderStatus, updateOrderItemStatus, tables } = useOrder();
    const { signOut } = useAuth();

    // Notification system
    const [lastKitchenCount, setLastKitchenCount] = useState(0);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const kitchenOrders = orders.filter(o => o.status === 'preparing');

    // Initialize audio once
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioRef.current) {
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.7;
            console.log('Kitchen: Audio initialized');
        }
    }, []);

    // Enable audio on first user interaction
    useEffect(() => {
        const enableAudio = async () => {
            if (audioRef.current && !audioEnabled) {
                try {
                    await audioRef.current.play();
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setAudioEnabled(true);
                    console.log('Kitchen: Audio enabled successfully');
                } catch (error) {
                    console.log('Kitchen: Audio enable failed:', error);
                }
            }
        };

        document.addEventListener('click', enableAudio, { once: true });
        return () => document.removeEventListener('click', enableAudio);
    }, [audioEnabled]);

    useEffect(() => {
        const currentCount = kitchenOrders.length;

        console.log('Kitchen order check:', {
            kitchenCount: currentCount,
            lastCount: lastKitchenCount,
            audioEnabled,
            willPlaySound: currentCount > lastKitchenCount && lastKitchenCount >= 0
        });

        // Check for new kitchen orders (including from 0 to 1)
        if (currentCount > lastKitchenCount && lastKitchenCount >= 0) {
            console.log('Kitchen: New order detected! Attempting to play sound...');
            if (audioEnabled && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play()
                    .then(() => console.log('Kitchen: 🔔 Sound played successfully'))
                    .catch(e => console.error('Kitchen: ❌ Sound play failed:', e));
            } else {
                console.log('Kitchen: ⚠️ Audio not enabled or ref missing');
            }
        }
        setLastKitchenCount(currentCount);
    }, [kitchenOrders.length, lastKitchenCount, audioEnabled]);

    const testSound = () => {
        console.log('Kitchen: Test sound clicked');
        if (audioRef.current) {
            setAudioEnabled(true);
            audioRef.current.currentTime = 0;
            audioRef.current.play()
                .then(() => {
                    console.log('Kitchen: Test sound played successfully');
                    alert('Sound test successful! 🔔');
                })
                .catch(e => {
                    console.error('Kitchen: Test sound failed:', e);
                    alert('Sound blocked by browser. Please check your browser settings.');
                });
        } else {
            console.error('Kitchen: Audio ref is null');
            alert('Audio not initialized');
        }
    };


    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <ChefHat className="h-8 w-8 text-orange-500" />
                    <div>
                        <h1 className="text-3xl font-bold">Kitchen Display</h1>
                        <p className="text-slate-400">Orders to prepare</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 self-end md:self-auto">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700">
                        🔄 <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={testSound} className="bg-slate-800 hover:bg-slate-700">
                        🔔 <span className="hidden sm:inline">Test Sound</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={signOut} className="text-red-400 hover:bg-slate-800 hover:text-red-300">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <span className="font-bold text-xl text-orange-500">{kitchenOrders.length}</span> Active
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kitchenOrders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                        <CheckCircle2 className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-xl">All caught up!</p>
                    </div>
                ) : (
                    // Group orders by table
                    Object.values(kitchenOrders.reduce((acc, order) => {
                        const key = order.orderType === 'dine-in' && order.tableId
                            ? `table-${order.tableId}`
                            : `order-${order.id}`;

                        if (!acc[key]) acc[key] = [];
                        acc[key].push(order);
                        return acc;
                    }, {} as { [key: string]: typeof kitchenOrders })).map((group) => {
                        const firstOrder = group[0];
                        const isTableGroup = firstOrder.orderType === 'dine-in';

                        return (
                            <Card key={isTableGroup ? `table-${firstOrder.tableId}` : firstOrder.id} className="bg-slate-800 border-slate-700 text-slate-50">
                                <CardHeader className="bg-slate-700/50 rounded-t-lg pb-3">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-2xl text-orange-400">
                                            {(() => {
                                                if (isTableGroup) {
                                                    const table = tables.find(t => String(t.id) === String(firstOrder.tableId));
                                                    return table ? `Table ${table.name}` : `Table ${firstOrder.tableId}`;
                                                }
                                                return `Takeaway #${firstOrder.contactNumber || 'N/A'}`;
                                            })()}
                                        </CardTitle>
                                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                                            <Timer className="h-4 w-4" />
                                            <span>{new Date(firstOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-6">
                                    <ul className="space-y-4">
                                        {group.flatMap(o => o.items).map((item, idx) => (
                                            <li key={`${o.id}-${item.id}-${idx}`} className="flex justify-between items-center text-lg p-2 hover:bg-slate-700/50 rounded cursor-pointer"
                                                onClick={() => updateOrderItemStatus(o.id, item.id, item.status === 'ready' ? 'pending' : 'ready')}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${item.status === 'ready' ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                                                        {item.status === 'ready' && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                    </div>
                                                    <span className={`font-bold ${item.status === 'ready' ? 'text-green-400' : 'text-slate-200'}`}>{item.quantity}x</span>
                                                    <span className={`flex-1 ${item.status === 'ready' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.name}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-6 text-lg"
                                        onClick={() => group.forEach(o => updateOrderStatus(o.id, 'ready'))}
                                    >
                                        Mark All Ready
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
