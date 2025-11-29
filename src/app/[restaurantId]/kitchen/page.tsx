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

    // Recall system
    const [lastCompletedOrderIds, setLastCompletedOrderIds] = useState<string[] | null>(null);

    const kitchenOrders = orders.filter(o => o.status === 'preparing');

    // Initialize audio once
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioRef.current) {
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.7;
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

        // Check for new kitchen orders (including from 0 to 1)
        if (currentCount > lastKitchenCount && lastKitchenCount >= 0) {
            if (audioEnabled && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.error('Kitchen: Sound play failed:', e));
            }
        }
        setLastKitchenCount(currentCount);
    }, [kitchenOrders.length, lastKitchenCount, audioEnabled]);

    const testSound = () => {
        if (audioRef.current) {
            setAudioEnabled(true);
            audioRef.current.currentTime = 0;
            audioRef.current.play()
                .then(() => alert('Sound test successful! 🔔'))
                .catch(() => alert('Sound blocked by browser. Please check your browser settings.'));
        } else {
            alert('Audio not initialized');
        }
    };

    const handleMarkReady = (groupOrders: typeof orders) => {
        const ids = groupOrders.map(o => o.id);
        setLastCompletedOrderIds(ids);
        groupOrders.forEach(o => updateOrderStatus(o.id, 'ready'));
    };

    const handleRecall = () => {
        if (lastCompletedOrderIds) {
            lastCompletedOrderIds.forEach(id => updateOrderStatus(id, 'preparing'));
            setLastCompletedOrderIds(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-6">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <ChefHat className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Kitchen Display</h1>
                        <p className="text-slate-400">Live orders feed</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                    {lastCompletedOrderIds && (
                        <Button variant="outline" onClick={handleRecall} className="bg-slate-800 border-orange-500/50 text-orange-400 hover:bg-slate-700 hover:text-orange-300 animate-in fade-in slide-in-from-top-2">
                            ↩️ Undo Last
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                        🔄 Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={testSound} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                        🔔 Test
                    </Button>
                    <Button variant="ghost" size="sm" onClick={signOut} className="text-red-400 hover:bg-slate-800 hover:text-red-300">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
                        <span className="font-bold text-xl text-orange-500">{kitchenOrders.length}</span>
                        <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Pending</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {kitchenOrders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-600">
                        <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-slate-800">
                            <CheckCircle2 className="h-12 w-12 opacity-20" />
                        </div>
                        <p className="text-2xl font-medium text-slate-500">All caught up!</p>
                        <p className="text-slate-600 mt-2">Waiting for new orders...</p>
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

                        // Calculate oldest order time for the group
                        const oldestTime = group.reduce((oldest, o) => {
                            const time = new Date(o.createdAt).getTime();
                            return time < oldest ? time : oldest;
                        }, Date.now());

                        return (
                            <OrderCard
                                key={isTableGroup ? `table-${firstOrder.tableId}` : firstOrder.id}
                                group={group}
                                isTableGroup={isTableGroup}
                                tables={tables}
                                oldestTime={oldestTime}
                                onMarkReady={() => handleMarkReady(group)}
                                onUpdateItemStatus={updateOrderItemStatus}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

function OrderCard({ group, isTableGroup, tables, oldestTime, onMarkReady, onUpdateItemStatus }: any) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - oldestTime) / 1000));
        }, 1000);
        setElapsed(Math.floor((Date.now() - oldestTime) / 1000)); // Initial
        return () => clearInterval(interval);
    }, [oldestTime]);

    const getUrgencyColor = (seconds: number) => {
        if (seconds > 1200) return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'; // > 20 mins
        if (seconds > 600) return 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'; // > 10 mins
        return 'border-slate-700';
    };

    const getUrgencyHeader = (seconds: number) => {
        if (seconds > 1200) return 'bg-red-950/50 text-red-200';
        if (seconds > 600) return 'bg-yellow-950/30 text-yellow-200';
        return 'bg-slate-800/50 text-slate-200';
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const firstOrder = group[0];

    return (
        <Card className={`bg-slate-900 text-slate-50 transition-all duration-300 border-2 ${getUrgencyColor(elapsed)}`}>
            <CardHeader className={`${getUrgencyHeader(elapsed)} rounded-t-lg pb-3 border-b border-white/5`}>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {(() => {
                                if (isTableGroup) {
                                    const table = tables.find((t: any) => String(t.id) === String(firstOrder.tableId));
                                    return table ? `Table ${table.name}` : `Table ${firstOrder.tableId}`;
                                }
                                return `Takeaway #${firstOrder.contactNumber?.slice(-4) || 'N/A'}`;
                            })()}
                        </CardTitle>
                        <div className="text-xs opacity-70 mt-1 font-mono">
                            #{firstOrder.id.slice(0, 6)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 font-mono text-lg font-bold bg-black/20 px-2 py-1 rounded">
                            <Timer className="h-4 w-4" />
                            <span>{formatTime(elapsed)}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="py-5">
                <ul className="space-y-3">
                    {group.flatMap((o: any) => (Array.isArray(o.items) ? o.items : []).map((i: any) => ({ ...i, orderId: o.id }))).map((item: any, idx: number) => (
                        <li key={`${item.orderId}-${item.id}-${idx}`}
                            className="flex justify-between items-start p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                            onClick={() => onUpdateItemStatus(item.orderId, item.id, item.status === 'ready' ? 'pending' : 'ready')}
                        >
                            <div className="flex gap-3 w-full">
                                <div className={`mt-0.5 w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${item.status === 'ready' ? 'bg-green-500 border-green-500' : 'border-slate-600 group-hover:border-slate-400'}`}>
                                    {item.status === 'ready' && <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`font-bold text-lg ${item.status === 'ready' ? 'text-green-400/50' : 'text-orange-400'}`}>
                                            {item.quantity}x
                                        </span>
                                        <span className={`text-lg font-medium truncate ${item.status === 'ready' ? 'text-slate-500 line-through decoration-2' : 'text-slate-100'}`}>
                                            {item.name}
                                        </span>
                                    </div>

                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                        <div className="text-sm text-slate-400 mt-1 pl-1 border-l-2 border-slate-700 ml-1">
                                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-slate-500">{key}: </span>
                                                    <span className="text-slate-300">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {item.notes && (
                                        <div className="mt-1.5 bg-yellow-950/30 text-yellow-200/90 text-sm px-2 py-1 rounded border border-yellow-500/20 inline-block">
                                            📝 {item.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="pt-0">
                <Button
                    className="w-full bg-slate-800 hover:bg-green-600 hover:text-white text-slate-200 font-bold py-6 text-lg transition-all border border-slate-700 hover:border-green-500"
                    onClick={onMarkReady}
                >
                    Mark All Ready
                </Button>
            </CardFooter>
        </Card>
    );
}
