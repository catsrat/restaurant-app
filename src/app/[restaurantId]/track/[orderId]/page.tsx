"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ChefHat, Utensils, DollarSign, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderTrackingPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;
    const restaurantId = params.restaurantId as string;
    const { orders, tables } = useOrder();
    const { format } = useCurrency();

    const [fetchedOrder, setFetchedOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orders.length > 0) {
            // Use loose equality to match number ID with string param
            const found = orders.find(o => o.id == orderId);
            if (found) {
                setFetchedOrder(found);
                setLoading(false);
                return;
            }
        }

        // Fallback: Fetch from Supabase directly
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    items: order_items(*)
                `)
                .eq('id', orderId)
                .single();

            if (data) {
                const parsedOrder = {
                    ...data,
                    createdAt: new Date(data.created_at),
                    items: data.items.map((i: any) => ({ ...i, id: i.menu_item_id }))
                };
                setFetchedOrder(parsedOrder);
            }
            setLoading(false);
        };

        fetchOrder();
    }, [orderId, orders]);

    const currentOrder = fetchedOrder;

    // Get all orders for this table (if dine-in) or this contact (if takeaway)
    // Note: If we fetched a single order, we might not have the full history unless we fetch that too.
    // For now, we'll rely on context for history or just show the current order if context is empty.
    const tableOrders = currentOrder
        ? (orders.length > 0 ? orders : [currentOrder]).filter(o => {
            const isSameGroup = currentOrder.orderType === 'dine-in'
                ? o.tableId === currentOrder.tableId
                : o.contactNumber === currentOrder.contactNumber;

            if (!isSameGroup) return false;

            // Always show the current order being tracked
            if (o.id === currentOrder.id) return true;

            // Show other orders only if they are NOT paid (active session)
            // This hides previous customers' paid orders for the same table
            return o.status !== 'paid';
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading order...</div>;
    }

    if (!currentOrder) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Order Not Found</CardTitle>
                        <CardDescription>
                            We couldn't find an order with ID: {orderId}
                        </CardDescription>
                        <Button variant="outline" onClick={() => router.push(`/${restaurantId}/menu/Table1`)} className="mt-4">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Menu
                        </Button>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const statusSteps = [
        { key: 'pending', label: 'Order Received', icon: CheckCircle2, color: 'blue' },
        { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'orange' },
        { key: 'ready', label: 'Ready', icon: Utensils, color: 'green' },
        { key: 'served', label: 'Served', icon: CheckCircle2, color: 'gray' },
        { key: 'paid', label: 'Payment Done', icon: DollarSign, color: 'green' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order Status</h1>
                        <p className="text-sm font-medium text-gray-500">
                            {(() => {
                                if (currentOrder.orderType === 'dine-in') {
                                    const table = tables.find(t => String(t.id) === String(currentOrder.tableId));
                                    return table ? `Table ${table.name}` : `Table ${currentOrder.tableId}`;
                                }
                                return `Takeaway - ${currentOrder.contactNumber}`;
                            })()}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (currentOrder.orderType === 'dine-in') {
                                const table = tables.find(t => String(t.id) === String(currentOrder.tableId));
                                const tableName = table ? table.name : currentOrder.tableId;
                                router.push(`/${restaurantId}/menu/${tableName}`);
                            } else {
                                router.push(`/${restaurantId}`);
                            }
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Menu
                    </Button>
                </div>

                {/* All Orders for this table/contact */}
                {tableOrders.map((order, index) => {
                    const statusIndex = statusSteps.findIndex(s => s.key === order.status);

                    return (
                        <div key={order.id} className="space-y-4">
                            {index > 0 && <div className="border-t pt-6" />}

                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    Order #{order.id}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                </span>
                            </div>

                            {/* Order Status Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {statusSteps.map((step, stepIndex) => {
                                        const isCompleted = stepIndex <= statusIndex;
                                        const isCurrent = stepIndex === statusIndex;
                                        const Icon = step.icon;

                                        return (
                                            <div key={step.key} className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                                    isCompleted
                                                        ? `bg-${step.color}-600 text-white`
                                                        : "bg-gray-200 text-gray-400",
                                                    isCurrent && "ring-4 ring-blue-200 animate-pulse"
                                                )}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        "font-semibold",
                                                        isCompleted ? "text-gray-900" : "text-gray-400"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <p className={cn("text-sm font-medium", step.key === 'paid' ? "text-green-600" : "text-blue-600")}>
                                                            {step.key === 'paid' ? 'Completed' : 'In Progress...'}
                                                        </p>
                                                    )}
                                                </div>
                                                {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* Order Items */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {order.items.map((item: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-center border-b pb-3 last:border-0">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{item.quantity}x {item.name}</span>
                                                        {item.status === 'ready' && (
                                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                                <CheckCircle2 className="h-3 w-3" /> Ready
                                                            </span>
                                                        )}
                                                        {(item.status === 'pending' || !item.status) && (
                                                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> Prep
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-semibold">{format(item.price * item.quantity)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-lg font-bold">
                                        <span>Total</span>
                                        <span>{format(order.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0))}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}

                {/* Total Summary */}
                {tableOrders.length > 1 && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Grand Total ({tableOrders.length} orders)</span>
                                <span className="text-blue-600">
                                    {format(tableOrders.reduce((sum: number, order: any) =>
                                        sum + order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0), 0
                                    ))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
