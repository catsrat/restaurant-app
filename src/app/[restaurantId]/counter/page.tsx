"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useOrder } from '@/context/OrderContext';
import { useParams } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Utensils, QrCode, List, DollarSign, BarChart3, Trash2, Plus, BadgeCheck, Clock, CheckCircle2, ChefHat, Printer, Download, TrendingUp, Image as ImageIcon, LogOut } from 'lucide-react';
import { Receipt } from '@/components/Receipt';
import { cn } from '@/lib/utils';
import AdminGuard from '@/components/AdminGuard';
import { Order, OrderStatus, MenuItem, Table, MenuCategory, OrderItem, OrderType } from '@/types';
import QRCodeLib from 'qrcode';
import { MenuGrid } from '@/components/MenuGrid';
import { CartDrawer, CartContent } from '@/components/CartDrawer';
import { useAuth } from '@/context/AuthContext';

export default function CounterPage() {
    return (
        <AdminGuard>
            <CounterContent />
        </AdminGuard>
    );
}

function CounterContent() {
    const params = useParams();
    const restaurantId = params.restaurantId as string;
    const { orders, updateOrderStatus, menuItems, addMenuItem, deleteMenuItem, tables, addTable, deleteTable, markTablePaid, resetTableStatus, addOrder, banners, addBanner, deleteBanner, categories, addCategory, deleteCategory } = useOrder();
    const { user, signOut } = useAuth();
    const { format } = useCurrency();
    const [activeTab, setActiveTab] = useState<'orders' | 'tables' | 'menu' | 'sales' | 'qrcodes' | 'analytics' | 'banners'>('orders');

    // POS State
    const [isPOSOpen, setIsPOSOpen] = useState(false);
    const [posCart, setPosCart] = useState<OrderItem[]>([]);
    const [posOrderType, setPosOrderType] = useState<OrderType>('dine-in');
    const [posTableId, setPosTableId] = useState<string>('');
    const [posContactNumber, setPosContactNumber] = useState<string>('');

    const handleAddToPosCart = (item: MenuItem | OrderItem) => {
        setPosCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            // Ensure we have all MenuItem properties. If coming from OrderItem, it should have them.
            // If not, we might need to fetch or ensure they are present.
            // For now, assuming OrderItem has compatible structure or we just need core fields.
            return [...prev, { ...item, quantity: 1 } as OrderItem];
        });
    };

    const handleRemoveFromPosCart = (itemId: string) => {
        setPosCart(prev => prev.reduce((acc, item) => {
            if (item.id === itemId) {
                if (item.quantity > 1) return [...acc, { ...item, quantity: item.quantity - 1 }];
                return acc;
            }
            return [...acc, item];
        }, [] as OrderItem[]));
    };

    const handlePlacePosOrder = async () => {
        if (posCart.length === 0) return;
        if (posOrderType === 'dine-in' && !posTableId) {
            alert('Please select a table');
            return;
        }
        if (posOrderType === 'takeaway' && !posContactNumber) {
            alert('Please enter contact number/name');
            return;
        }

        await addOrder(posCart, posOrderType, {
            tableId: posOrderType === 'dine-in' ? posTableId : undefined,
            contactNumber: posOrderType === 'takeaway' ? posContactNumber : undefined
        });

        setPosCart([]);
        setIsPOSOpen(false);
        setPosContactNumber('');
        setPosTableId('');
    };

    // Printing Logic
    const [printingData, setPrintingData] = useState<{ tableName: string, orders: typeof orders, totalAmount: number } | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = (tableName: string, groupOrders: typeof orders, totalAmount: number) => {
        setPrintingData({ tableName, orders: groupOrders, totalAmount });
        // Wait for state update and render
        setTimeout(() => {
            window.print();
            // Optional: Clear printing data after print dialog closes (though browser behavior varies)
            // setPrintingData(null); 
        }, 100);
    };

    // Notification system
    const [lastOrderCount, setLastOrderCount] = useState(0);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio once
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioRef.current) {
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.7;
            console.log('Audio initialized');
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
                    console.log('Audio enabled successfully');
                } catch (error) {
                    console.log('Audio enable failed:', error);
                }
            }
        };

        document.addEventListener('click', enableAudio, { once: true });
        return () => document.removeEventListener('click', enableAudio);
    }, [audioEnabled]);

    // Check for new orders
    useEffect(() => {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const currentCount = pendingOrders.length;

        console.log('Order check:', {
            pendingCount: currentCount,
            lastCount: lastOrderCount,
            audioEnabled,
            willPlaySound: currentCount > lastOrderCount && lastOrderCount >= 0
        });

        // Play sound if count increased (including from 0 to 1)
        if (currentCount > lastOrderCount && lastOrderCount >= 0) {
            console.log('New order detected! Attempting to play sound...');
            if (audioEnabled && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play()
                    .then(() => console.log('🔔 Sound played successfully'))
                    .catch(e => console.error('❌ Sound play failed:', e));
            } else {
                console.log('⚠️ Audio not enabled or ref missing');
            }

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Order!', {
                    body: `${currentCount} pending order(s)`,
                    icon: '/favicon.ico'
                });
            }
        }

        setLastOrderCount(currentCount);
    }, [orders, audioEnabled, lastOrderCount]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const testSound = () => {
        console.log('Test sound clicked');
        if (audioRef.current) {
            setAudioEnabled(true);
            audioRef.current.currentTime = 0;
            audioRef.current.play()
                .then(() => {
                    console.log('Test sound played successfully');
                    alert('Sound test successful! 🔔');
                })
                .catch(e => {
                    console.error('Test sound failed:', e);
                    alert('Sound blocked by browser. Please check your browser settings.');
                });
        } else {
            console.error('Audio ref is null');
            alert('Audio not initialized');
        }
    };

    // --- Orders Logic ---
    // Show all active orders (not paid)
    const activeOrders = orders.filter(o => o.status !== 'paid');
    activeOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateA - dateB;
    });

    // Group by table for billing
    const ordersByTable = activeOrders.reduce((acc, order) => {
        const key = order.orderType === 'dine-in'
            ? (tables.find(t => t.id === order.tableId)?.name || `Table ${order.tableId}`)
            : `Takeaway - ${order.contactNumber}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(order);
        return acc;
    }, {} as Record<string, typeof orders>);

    // --- Table Logic ---
    const [newTableName, setNewTableName] = useState('');
    const handleAddTable = () => {
        if (!newTableName) return;
        addTable(newTableName);
        setNewTableName('');
    };

    // --- Menu Logic ---
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: '', description: '', price: 0, category: '', image_url: ''
    });

    const handleAddItem = () => {
        if (!newItem.name || !newItem.price) return;
        addMenuItem({
            name: newItem.name!,
            description: newItem.description || '',
            price: Number(newItem.price),
            category: newItem.category || 'General',
            image_url: newItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D'
        });
        setNewItem({ name: '', description: '', price: 0, category: '', image_url: '' });
    };

    // --- Banner Logic ---
    const [newBannerUrl, setNewBannerUrl] = useState('');
    const [newBannerTitle, setNewBannerTitle] = useState('');

    const handleAddBanner = async () => {
        if (!newBannerUrl) return;
        await addBanner(newBannerUrl, newBannerTitle);
        setNewBannerUrl('');
        setNewBannerTitle('');
    };

    // --- Sales Logic ---
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Only consider PAID orders for sales
    const paidOrders = orders.filter(o => {
        if (o.status !== 'paid') return false;
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate;
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0), 0);
    const totalOrders = paidOrders.length;

    const handlePaymentDone = (order: any) => {
        // If it's a table order, we might want to aggregate ALL orders for that table
        // But for now, let's stick to the requested flow: "Payment Done" -> Generates Bill -> Marks Table Available

        // Generate Bill (Aggregate if table)
        let billItems = order.items;
        let total = order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

        if (order.orderType === 'dine-in') {
            // Find all other served/ready orders for this table to include in bill?
            // The requirement says "only one bill should be generated". 
            // So we should find ALL unpaid orders for this table.
            const tableOrders = orders.filter(o => o.tableId === order.tableId && o.status !== 'paid');
            billItems = tableOrders.flatMap(o => o.items);
            total = billItems.reduce((s: any, i: any) => s + i.price * i.quantity, 0);
        }

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${order.orderType === 'dine-in' ? `Table ${order.tableId}` : 'Takeaway'}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Restaurant Name</h2>
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <p>${order.orderType === 'dine-in' ? `Table ${order.tableId}` : `Takeaway #${order.contactNumber}`}</p>
            </div>
            ${billItems.map((item: any) => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="total">
              <span>TOTAL</span>
              <span>$${total.toFixed(2)}</span>
            </div>
            <div style="text-align: center; margin-top: 20px;">Thank you!</div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }

        // Mark as paid and free table
        if (order.orderType === 'dine-in' && order.tableId) {
            markTablePaid(order.tableId);
        } else {
            // For takeaway, just mark this specific order as paid
            updateOrderStatus(order.id, 'paid');
        }
    };

    const downloadReport = () => {
        // ... (Same as before but using paidOrders)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
         <html>
           <head>
             <title>Sales Report - ${selectedDate}</title>
             <style>
               body { font-family: sans-serif; padding: 40px; }
               h1 { text-align: center; margin-bottom: 10px; }
               .meta { text-align: center; color: #666; margin-bottom: 40px; }
               table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
               th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
               th { background-color: #f4f4f4; }
               .summary { display: flex; justify-content: flex-end; gap: 40px; font-size: 1.2em; font-weight: bold; }
             </style>
           </head>
           <body>
             <h1>Daily Sales Report</h1>
             <div class="meta">Date: ${selectedDate}</div>
             
             <table>
               <thead>
                 <tr>
                   <th>Order ID</th>
                   <th>Time</th>
                   <th>Type</th>
                   <th>Items</th>
                   <th>Total</th>
                 </tr>
               </thead>
               <tbody>
                 ${paidOrders.map((order: any) => `
                   <tr>
                     <td>#${order.id.slice(0, 4)}</td>
                     <td>${new Date(order.createdAt).toLocaleTimeString()}</td>
                     <td>${order.orderType === 'dine-in' ? `Table ${order.tableId}` : `Takeaway (${order.contactNumber})`}</td>
                     <td>${order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}</td>
                     <td>$${order.items.reduce((s: any, i: any) => s + i.price * i.quantity, 0).toFixed(2)}</td>
                   </tr>
                 `).join('')}
               </tbody>
             </table>
 
             <div class="summary">
               <div>Total Orders: ${totalOrders}</div>
               <div>Total Revenue: $${totalRevenue.toFixed(2)}</div>
             </div>
           </body>
         </html>
       `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500">Manage orders, tables, menu, and sales</p>
                    <div className="flex flex-col gap-1 mt-1">
                        {user && <p className="text-xs text-gray-400">Logged in as: {user.email}</p>}
                        <p className="text-xs text-gray-400 font-mono">ID: {restaurantId}</p>
                    </div>
                </div>
                <div className="flex flex-col w-full md:w-auto gap-4">
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        {orders.filter(o => o.status === 'pending').length > 0 && (
                            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full animate-pulse">
                                <span className="font-bold text-lg">{orders.filter(o => o.status === 'pending').length}</span>
                                <span className="text-sm">New Order{orders.filter(o => o.status === 'pending').length > 1 ? 's' : ''}</span>
                            </div>
                        )}
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsPOSOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">New Order (POS)</span><span className="sm:hidden">POS</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={testSound} title="Test notification sound">
                            🔔 <span className="hidden sm:inline">Test Sound</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 hover:bg-red-50">
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                        <Button variant={activeTab === 'orders' ? 'default' : 'outline'} onClick={() => setActiveTab('orders')} className="whitespace-nowrap">
                            <Utensils className="h-4 w-4 mr-2" /> Orders
                        </Button>
                        <Button variant={activeTab === 'tables' ? 'default' : 'outline'} onClick={() => setActiveTab('tables')} className="whitespace-nowrap">
                            <BadgeCheck className="h-4 w-4 mr-2" /> Tables
                        </Button>
                        <Button variant={activeTab === 'qrcodes' ? 'default' : 'outline'} onClick={() => setActiveTab('qrcodes')} className="whitespace-nowrap">
                            <QrCode className="h-4 w-4 mr-2" /> QR Codes
                        </Button>
                        <Button variant={activeTab === 'menu' ? 'default' : 'outline'} onClick={() => setActiveTab('menu')} className="whitespace-nowrap">
                            <List className="h-4 w-4 mr-2" /> Menu
                        </Button>
                        <Button variant={activeTab === 'sales' ? 'default' : 'outline'} onClick={() => setActiveTab('sales')} className="whitespace-nowrap">
                            <DollarSign className="h-4 w-4 mr-2" /> Sales
                        </Button>
                        <Button variant={activeTab === 'analytics' ? 'default' : 'outline'} onClick={() => setActiveTab('analytics')} className="whitespace-nowrap">
                            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                        </Button>
                        <Button variant={activeTab === 'banners' ? 'default' : 'outline'} onClick={() => setActiveTab('banners')} className="whitespace-nowrap">
                            <ImageIcon className="h-4 w-4 mr-2" /> Banners
                        </Button>
                    </div>
                </div>
            </header>

            {activeTab === 'orders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Object.keys(ordersByTable).length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <Utensils className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-xl">No active orders</p>
                        </div>
                    ) : (
                        Object.entries(ordersByTable).map(([tableName, groupOrders]) => {
                            const orders = groupOrders as Order[];
                            const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
                            const hasPending = orders.some(o => o.status === 'pending');
                            const hasPreparing = orders.some(o => o.status === 'preparing');
                            const hasReady = orders.some(o => o.status === 'ready');
                            const allServed = orders.every(o => o.status === 'served');

                            return (
                                <Card key={tableName} className={cn("shadow-md border-l-4", allServed ? "border-l-green-500 bg-green-50" : "border-l-blue-500")}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">{tableName}</CardTitle>
                                            <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-full">{groupOrders.length} Orders</div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="py-4 space-y-4">
                                        {groupOrders.map(order => (
                                            <div key={order.id} className="border-b pb-2 last:border-0">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Order #{order.id}</span>
                                                    <span className="uppercase font-bold">{order.status}</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {order.items?.map((item, idx) => (
                                                        <li key={idx} className="flex justify-between text-sm">
                                                            <span>{item.quantity}x {item.name}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        <div className="mt-4 pt-2 border-t flex justify-between font-bold text-lg">
                                            <span>Total Bill</span>
                                            <span>{format(totalAmount)}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-full border-slate-400 hover:bg-slate-100"
                                            onClick={() => handlePrint(tableName, groupOrders, totalAmount)}
                                        >
                                            <Printer className="h-4 w-4 mr-2" /> Print Bill
                                        </Button>
                                        {allServed ? (
                                            <Button
                                                className="w-full bg-green-700 hover:bg-green-800"
                                                onClick={() => {
                                                    if (groupOrders[0].orderType === 'dine-in') {
                                                        // Pass the Table ID (UUID) not the name
                                                        markTablePaid(groupOrders[0].tableId!);
                                                    } else {
                                                        // For takeaway, just mark all as paid
                                                        groupOrders.forEach(o => updateOrderStatus(o.id, 'paid'));
                                                    }
                                                }}
                                            >
                                                <DollarSign className="h-4 w-4 mr-2" /> Payment Done (All)
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col gap-2 w-full">
                                                {hasPending && (
                                                    <Button
                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => groupOrders.filter(o => o.status === 'pending').forEach(o => updateOrderStatus(o.id, 'preparing'))}
                                                    >
                                                        Push Pending to Kitchen
                                                    </Button>
                                                )}
                                                {hasPreparing && (
                                                    <Button
                                                        className="w-full bg-orange-500 hover:bg-orange-600"
                                                        disabled
                                                    >
                                                        <Clock className="h-4 w-4 mr-2 animate-pulse" /> Kitchen Preparing...
                                                    </Button>
                                                )}
                                                {hasReady && (
                                                    <Button
                                                        className="w-full bg-green-600 hover:bg-green-700"
                                                        onClick={() => groupOrders.filter(o => o.status === 'ready').forEach(o => updateOrderStatus(o.id, 'served'))}
                                                    >
                                                        Mark Ready as Served
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'tables' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Tables</CardTitle>
                            <CardDescription>Add tables to your restaurant</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input
                                placeholder="Table Name (e.g. 1, 2, VIP)"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                className="max-w-xs"
                            />
                            <Button onClick={handleAddTable}><Plus className="h-4 w-4 mr-2" /> Add Table</Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {tables.map(table => (
                            <Card key={table.id} className={cn("text-center transition-colors", table.status === 'occupied' ? "bg-red-100 border-red-300" : "bg-green-100 border-green-300")}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-2xl">{table.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <span className={cn("text-sm font-bold px-2 py-1 rounded-full", table.status === 'occupied' ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800")}>
                                        {table.status.toUpperCase()}
                                    </span>
                                </CardContent>
                                <CardFooter className="justify-center gap-2">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteTable(table.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    {table.status === 'occupied' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                            onClick={() => resetTableStatus(table.id)}
                                            title="Force reset to Available"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'menu' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Add New Item</CardTitle>
                            <CardDescription>Create a new menu item</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Burger" />
                            </div>
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input type="number" value={newItem.price || ''} onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })} placeholder="9.99" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            </div>

                            {/* Category Management */}
                            <div className="pt-4 border-t">
                                <Label className="mb-2 block">Manage Categories</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="New Category"
                                        id="new-category-input"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const input = document.getElementById('new-category-input') as HTMLInputElement;
                                            if (input.value) {
                                                addCategory(input.value);
                                                input.value = '';
                                            }
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <div key={c.id} className="bg-gray-100 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                            {c.name}
                                            <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Delicious..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <Button className="w-full" onClick={handleAddItem}>
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuItems.map(item => (
                            <Card key={item.id} className="flex flex-row overflow-hidden h-32">
                                <div className="w-32 h-full bg-gray-200 shrink-0">
                                    <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between font-bold">
                                            <span>{item.name}</span>
                                            <span>{format(item.price)}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMenuItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date">Select Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-[200px]"
                                />
                            </div>
                        </div>
                        <Button onClick={downloadReport}>
                            <Printer className="h-4 w-4 mr-2" /> Download Report
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{format(totalRevenue)}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Orders Served</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{totalOrders}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Average Order Value</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}</div></CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Transactions for {selectedDate}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {paidOrders.slice().reverse().map(order => (
                                    <div key={order.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                                        <div>
                                            <div className="font-medium">
                                                {order.orderType === 'dine-in' ? `Table ${order.tableId}` : `Takeaway (${order.contactNumber})`}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <div className="font-bold">
                                            ${order.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                                {paidOrders.length === 0 && <div className="text-center text-gray-500">No sales found for this date.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'qrcodes' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>QR Codes for Tables</CardTitle>
                            <CardDescription>
                                Generate and download QR codes for your tables. Print and place them on each table so customers can scan and order without entering table numbers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tables.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p>No tables yet. Add tables in the Tables tab first.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tables.map(table => (
                                        <QRCodeCard
                                            key={table.id}
                                            tableName={table.name}
                                            restaurantId={restaurantId}
                                        />
                                    ))}
                                    {/* Takeaway QR Code */}
                                    <QRCodeCard
                                        tableName="Takeaway"
                                        restaurantId={restaurantId}
                                        isTakeaway={true}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'banners' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Banners</CardTitle>
                            <CardDescription>Add promotional banners to your menu</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Image URL</Label>
                                    <Input
                                        placeholder="https://example.com/banner.jpg"
                                        value={newBannerUrl}
                                        onChange={(e) => setNewBannerUrl(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Title (Optional)</Label>
                                    <Input
                                        placeholder="Special Offer"
                                        value={newBannerTitle}
                                        onChange={(e) => setNewBannerTitle(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={handleAddBanner} disabled={!newBannerUrl}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Banner
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banners.map(banner => (
                            <Card key={banner.id} className="overflow-hidden">
                                <div className="aspect-video relative bg-gray-100">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title || 'Banner'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <span className="font-medium truncate">{banner.title || 'Untitled Banner'}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => deleteBanner(banner.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        {banners.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No banners added yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (() => {
                const servedOrders = orders.filter(o => o.status === 'served' || o.status === 'paid');
                const totalRevenue = servedOrders.reduce((sum, order) =>
                    sum + order.items.reduce((s, i) => s + i.price * i.quantity, 0), 0
                );
                const totalOrders = servedOrders.length;
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                // Popular items analysis
                const itemSales: { [key: string]: { count: number, revenue: number } } = {};
                servedOrders.forEach(order => {
                    order.items.forEach(item => {
                        if (!itemSales[item.name]) {
                            itemSales[item.name] = { count: 0, revenue: 0 };
                        }
                        itemSales[item.name].count += item.quantity;
                        itemSales[item.name].revenue += item.price * item.quantity;
                    });
                });
                const popularItems = Object.entries(itemSales)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 5);

                // Peak hours analysis
                const hourlyOrders: { [key: number]: number } = {};
                servedOrders.forEach(order => {
                    const hour = new Date(order.createdAt).getHours();
                    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
                });
                const peakHour = Object.entries(hourlyOrders)
                    .sort((a, b) => b[1] - a[1])[0];

                // Order type breakdown
                const dineInOrders = servedOrders.filter(o => o.orderType === 'dine-in').length;
                const takeawayOrders = servedOrders.filter(o => o.orderType === 'takeaway').length;

                return (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">{format(totalRevenue)}</div>
                                    <p className="text-xs text-gray-500 mt-1">From {totalOrders} orders</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Avg Order Value</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600">{format(avgOrderValue)}</div>
                                    <p className="text-xs text-gray-500 mt-1">Per order</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-600">{totalOrders}</div>
                                    <p className="text-xs text-gray-500 mt-1">Completed</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Peak Hour</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {peakHour ? `${peakHour[0]}:00` : 'N/A'}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {peakHour ? `${peakHour[1]} orders` : 'No data'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Popular Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Top 5 Popular Items
                                </CardTitle>
                                <CardDescription>Best selling menu items</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {popularItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {popularItems.map(([name, data], index) => (
                                            <div key={name} className="flex items-center justify-between border-b pb-3 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white",
                                                        index === 0 ? "bg-yellow-500" :
                                                            index === 1 ? "bg-gray-400" :
                                                                index === 2 ? "bg-orange-600" : "bg-gray-300"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{name}</p>
                                                        <p className="text-sm text-gray-500">{data.count} sold</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">{format(data.revenue)}</p>
                                                    <p className="text-xs text-gray-500">Revenue</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 py-8">No sales data yet</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Type Breakdown & Hourly Distribution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Type Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium">Dine-In</span>
                                                <span className="font-bold">{dineInOrders} ({totalOrders > 0 ? Math.round(dineInOrders / totalOrders * 100) : 0}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-blue-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${totalOrders > 0 ? (dineInOrders / totalOrders * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium">Takeaway</span>
                                                <span className="font-bold">{takeawayOrders} ({totalOrders > 0 ? Math.round(takeawayOrders / totalOrders * 100) : 0}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-green-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${totalOrders > 0 ? (takeawayOrders / totalOrders * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Hourly Order Distribution</CardTitle>
                                    <CardDescription>Orders by hour of day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(hourlyOrders)
                                            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                            .map(([hour, count]) => (
                                                <div key={hour} className="flex items-center gap-2">
                                                    <span className="text-sm font-medium w-16">{hour}:00</span>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${(count / Math.max(...Object.values(hourlyOrders))) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold w-8">{count}</span>
                                                </div>
                                            ))}
                                        {Object.keys(hourlyOrders).length === 0 && (
                                            <p className="text-center text-gray-400 py-4">No hourly data yet</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            })()}
            {/* Hidden Receipt Component for Printing */}
            {printingData && (
                <div className="hidden print:block">
                    <Receipt
                        ref={receiptRef}
                        restaurantName="My Restaurant" // Ideally fetch this
                        tableName={printingData.tableName}
                        orders={printingData.orders}
                        totalAmount={printingData.totalAmount}
                        currencyFormatter={format}
                    />
                </div>
            )}

            {/* POS Modal */}
            {
                isPOSOpen && (
                    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-in fade-in">
                        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ChefHat className="h-6 w-6" /> New Order (POS)
                            </h2>
                            <Button variant="ghost" onClick={() => setIsPOSOpen(false)}>Close</Button>
                        </header>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6">
                                <MenuGrid menuItems={menuItems} categories={categories} onAddToCart={handleAddToPosCart} />
                            </div>
                            <div className="w-96 bg-white border-l shadow-xl flex flex-col">
                                <div className="p-4 border-b bg-gray-50">
                                    <h3 className="font-bold text-lg mb-4">Order Details</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Order Type</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant={posOrderType === 'dine-in' ? 'default' : 'outline'}
                                                    onClick={() => setPosOrderType('dine-in')}
                                                    className="flex-1"
                                                >
                                                    Dine-In
                                                </Button>
                                                <Button
                                                    variant={posOrderType === 'takeaway' ? 'default' : 'outline'}
                                                    onClick={() => setPosOrderType('takeaway')}
                                                    className="flex-1"
                                                >
                                                    Takeaway
                                                </Button>
                                            </div>
                                        </div>

                                        {posOrderType === 'dine-in' ? (
                                            <div className="space-y-2">
                                                <Label>Select Table</Label>
                                                <select
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={posTableId}
                                                    onChange={(e) => setPosTableId(e.target.value)}
                                                >
                                                    <option value="" disabled>Select a table</option>
                                                    {tables.map(table => (
                                                        <option key={table.id} value={table.id}>
                                                            {table.name} ({table.status})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>Customer Name / Number</Label>
                                                <Input
                                                    placeholder="e.g. John / 9876543210"
                                                    value={posContactNumber}
                                                    onChange={(e) => setPosContactNumber(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    <CartContent
                                        onClose={() => { }}
                                        cart={posCart}
                                        onRemove={handleRemoveFromPosCart}
                                        onAdd={(item) => handleAddToPosCart(item)}
                                        onPlaceOrder={handlePlacePosOrder}
                                        totalAmount={posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function QRCodeCard({ tableName, restaurantId, isTakeaway = false }: { tableName: string, restaurantId: string, isTakeaway?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qrGenerated, setQrGenerated] = useState(false);

    useEffect(() => {
        if (canvasRef.current) {
            const url = isTakeaway
                ? `${window.location.origin}/${restaurantId}/menu/Takeaway?type=takeaway`
                : `${window.location.origin}/${restaurantId}/menu/${tableName}`;
            QRCodeLib.toCanvas(canvasRef.current, url, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, (error) => {
                if (error) console.error(error);
                else setQrGenerated(true);
            });
        }
    }, [tableName, restaurantId]);

    const downloadQRCode = () => {
        if (canvasRef.current) {
            const url = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `table-${tableName}-qr.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle className="text-2xl">Table {tableName}</CardTitle>
                <CardDescription className="text-xs break-all">
                    {typeof window !== 'undefined' && `${window.location.origin}/${restaurantId}/menu/${tableName}`}
                </CardDescription>
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                    <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mt-2 text-left">
                        <strong>Note:</strong> QR codes generated on localhost will only work on this device. To scan with your phone, use your computer's local IP address (e.g., 192.168.x.x:3000) or deploy to Vercel.
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <canvas ref={canvasRef} className="border-2 border-gray-200 rounded-lg" />
            </CardContent>
            <CardFooter className="justify-center">
                <Button onClick={downloadQRCode} disabled={!qrGenerated}>
                    <Download className="h-4 w-4 mr-2" /> Download QR Code
                </Button>
            </CardFooter>
        </Card>
    );
}
