"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useOrder } from '@/context/OrderContext';
import { useParams } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Utensils, QrCode, List, DollarSign, BarChart3, Trash2, Plus, BadgeCheck, Clock, CheckCircle2, ChefHat, Printer, Download, TrendingUp, Image as ImageIcon, LogOut, Package } from 'lucide-react';
import { Receipt } from '@/components/Receipt';
import { cn } from '@/lib/utils';
import AdminGuard from '@/components/AdminGuard';
import { Order, OrderStatus, MenuItem, Table, MenuCategory, OrderItem, OrderType } from '@/types';
import QRCodeLib from 'qrcode';
import { MenuGrid } from '@/components/MenuGrid';
import { CartDrawer, CartContent } from '@/components/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { InventoryTab } from './InventoryTab';
import { SettingsTab } from './SettingsTab';
import { RecipeEditor } from './RecipeEditor';

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
    const { orders, updateOrderStatus, menuItems, addMenuItem, deleteMenuItem, tables, addTable, deleteTable, markTablePaid, resetTableStatus, addOrder, banners, addBanner, deleteBanner, categories, addCategory, deleteCategory, applyDiscount, taxSettings, restaurantName } = useOrder();
    const { user, signOut } = useAuth();
    const { format } = useCurrency();
    const [activeTab, setActiveTab] = useState<'orders' | 'tables' | 'menu' | 'sales' | 'qrcodes' | 'analytics' | 'banners' | 'inventory' | 'settings'>('orders');

    // POS State
    const [isPOSOpen, setIsPOSOpen] = useState(false);
    const [posCart, setPosCart] = useState<OrderItem[]>([]);
    const [posOrderType, setPosOrderType] = useState<OrderType>('dine-in');
    const [posTableId, setPosTableId] = useState<string>('');
    const [posContactNumber, setPosContactNumber] = useState<string>('');
    const [editingRecipeItem, setEditingRecipeItem] = useState<MenuItem | null>(null);

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

    const [isPosLoading, setIsPosLoading] = useState(false);

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

        setIsPosLoading(true);
        try {
            const result = await addOrder(posCart, posOrderType, {
                tableId: posOrderType === 'dine-in' ? posTableId : undefined,
                contactNumber: posOrderType === 'takeaway' ? posContactNumber : undefined
            });

            if (!result) return;

            setPosCart([]);
            setIsPOSOpen(false);
            setPosContactNumber('');
            setPosTableId('');
        } catch (error) {
            console.error("POS Order Error:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setIsPosLoading(false);
        }
    };

    // Printing Logic
    const [printingData, setPrintingData] = useState<{ tableName: string, orders: typeof orders, totalAmount: number } | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = (tableName: string, groupOrders: typeof orders, totalAmount: number) => {
        // Calculate totals including discount
        const total = groupOrders.reduce((sum, order) => sum + order.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
        const discountAmount = groupOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
        const finalTotal = total - discountAmount;

        // Use the state-based approach which triggers a re-render and then prints
        // This is often more reliable than window.open in some frameworks/browsers
        setPrintingData({
            tableName,
            orders: groupOrders,
            totalAmount: finalTotal // Pass the discounted total if needed, or handle in render
        });

        // We need to generate the HTML for the print window here if we want to stick to the window.open approach 
        // BUT the user said "it stopped", implying a crash or failure.
        // Let's try to be robust. If we use window.open, let's make sure we don't rely on external state.

        // Actually, let's go back to the window.open approach but make it safer.
        // The previous error might be due to `window.open` returning null (popup blocker).

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to print the bill.");
            return;
        }

        const billItems = groupOrders.flatMap(o => o.items);

        printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${tableName}</title>
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
              <p>Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
              <p>${tableName}</p>
            </div>
            ${billItems.map((item: any) => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>${format(item.price * item.quantity)}</span>
              </div>
            `).join('')}
            <div class="total">
              <span>Subtotal</span>
              <span>${format(total)}</span>
            </div>
            ${discountAmount > 0 ? `
            <div class="item" style="color: red;">
              <span>Discount</span>
              <span>-${format(Number(discountAmount))}</span>
            </div>
            ` : ''}
            <div class="total" style="border-top: 2px solid #000; font-size: 1.2em;">
              <span>TOTAL</span>
              <span>${format(finalTotal)}</span>
            </div>
            <div style="text-align: center; margin-top: 20px;">Thank you for dining with us!<br>Please visit again.</div>
            <script>
                window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
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
    // Helper to get local YYYY-MM-DD
    const getLocalDate = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState<string>(getLocalDate(new Date()));

    // Only consider PAID orders for sales
    const paidOrders = orders.filter(o => {
        if (o.status !== 'paid') return false;
        const orderDate = getLocalDate(new Date(o.createdAt));
        return orderDate === selectedDate;
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0), 0);
    const totalOrders = paidOrders.length;

    const handlePaymentDone = (order: any) => {
        // If it's a table order, we might want to aggregate ALL orders for that table
        // But for now, let's stick to the requested flow: "Payment Done" -> Generates Bill -> Marks Table Available

        // Generate Bill (Aggregate if table)
        let billItems = order.items;
        let subtotal = order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

        if (order.orderType === 'dine-in') {
            // Find all other served/ready orders for this table to include in bill?
            // The requirement says "only one bill should be generated". 
            // So we should find ALL unpaid orders for this table.
            const tableOrders = orders.filter(o => o.tableId === order.tableId && o.status !== 'paid');
            billItems = tableOrders.flatMap(o => o.items);
            subtotal = billItems.reduce((s: any, i: any) => s + i.price * i.quantity, 0);
        }

        const discountAmount = order.discount || 0;

        // Calculate Tax
        const taxRate = taxSettings?.tax_rate || 0;
        const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
        const total = subtotal - discountAmount + taxAmount;

        const printWindow = window.open('', '', 'width=300,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Bill #${order.id}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 10px 0; }
                        .tax-row { display: flex; justify-content: space-between; font-size: 11px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>${restaurantName}</h2>
                        <p>Order #${order.id}</p>
                        <p>${new Date().toLocaleString()}</p>
                        ${taxSettings?.tax_number ? `<p>Tax ID: ${taxSettings.tax_number}</p>` : ''}
                    </div>
                    <div class="divider"></div>
                    ${billItems.map(item => `
                        <div class="item">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>${format(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                    <div class="divider"></div>
                    <div class="item">
                        <span>Subtotal</span>
                        <span>${format(subtotal)}</span>
                    </div>
                    ${discountAmount > 0 ? `
                    <div class="item" style="color: red;">
                        <span>Discount</span>
                        <span>-${format(discountAmount)}</span>
                    </div>` : ''}
                    
                    ${taxRate > 0 ? (
                    taxSettings.tax_name?.toUpperCase() === 'GST' ? `
                            <div class="tax-row">
                                <span>CGST (${taxRate / 2}%)</span>
                                <span>${format(taxAmount / 2)}</span>
                            </div>
                            <div class="tax-row">
                                <span>SGST (${taxRate / 2}%)</span>
                                <span>${format(taxAmount / 2)}</span>
                            </div>
                        ` : `
                            <div class="tax-row">
                                <span>${taxSettings.tax_name || 'Tax'} (${taxRate}%)</span>
                                <span>${format(taxAmount)}</span>
                            </div>
                        `
                ) : ''}

                    <div class="total item">
                        <span>Total</span>
                        <span>${format(total)}</span>
                    </div>
                    <div class="header" style="margin-top: 20px;">
                        <p>Thank you for dining with us!</p>
                    </div>
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
                     <td>${format(order.items.reduce((s: any, i: any) => s + i.price * i.quantity, 0))}</td>
                   </tr>
                 `).join('')}
               </tbody>
             </table>
 
             <div class="summary">
               <div>Total Orders: ${totalOrders}</div>
               <div>Total Revenue: ${format(totalRevenue)}</div>
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
                        <Button variant={activeTab === 'inventory' ? 'default' : 'outline'} onClick={() => setActiveTab('inventory')} className="whitespace-nowrap">
                            <Package className="h-4 w-4 mr-2" /> Inventory
                        </Button>
                        <Button variant={activeTab === 'settings' ? 'default' : 'outline'} onClick={() => setActiveTab('settings')} className="whitespace-nowrap">
                            <Settings className="h-4 w-4 mr-2" /> Settings
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
                                        <div className="mt-4 pt-2 border-t space-y-1">
                                            <div className="flex justify-between text-gray-500">
                                                <span>Subtotal</span>
                                                <span>{format(totalAmount)}</span>
                                            </div>
                                            {orders[0]?.discount && orders[0].discount > 0 ? (
                                                <div className="flex justify-between text-red-500">
                                                    <span>Discount</span>
                                                    <span>-{format(orders[0].discount || 0)}</span>
                                                </div>
                                            ) : null}
                                            <div className="flex justify-between font-bold text-lg pt-1 border-t">
                                                <span>Total</span>
                                                <span>{format(totalAmount - (orders[0]?.discount || 0))}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex-col gap-2">
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-slate-400 hover:bg-slate-100"
                                                onClick={() => handlePrint(tableName, groupOrders, totalAmount)}
                                            >
                                                <Printer className="h-4 w-4 mr-2" /> Print
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50"
                                                onClick={() => {
                                                    const percentage = prompt("Enter discount percentage (%):", "0");
                                                    if (percentage !== null) {
                                                        const numPercentage = parseFloat(percentage);
                                                        if (!isNaN(numPercentage) && numPercentage >= 0 && numPercentage <= 100) {
                                                            if (orders[0]) {
                                                                // Calculate amount based on total
                                                                const discountAmount = (totalAmount * numPercentage) / 100;
                                                                applyDiscount(orders[0].id, discountAmount);
                                                            }
                                                        } else {
                                                            alert("Invalid percentage");
                                                        }
                                                    }
                                                }}
                                            >
                                                <DollarSign className="h-4 w-4 mr-2" /> Discount
                                            </Button>
                                        </div>
                                        {allServed ? (
                                            <Button
                                                className="w-full bg-green-700 hover:bg-green-800"
                                                onClick={() => {
                                                    if (groupOrders[0].orderType === 'dine-in' && groupOrders[0].tableId && groupOrders[0].tableId !== 'null') {
                                                        // Pass the Table ID (UUID) not the name
                                                        markTablePaid(groupOrders[0].tableId);
                                                    } else {
                                                        // For takeaway or bugged orders (no table), just mark all as paid
                                                        groupOrders.forEach(o => updateOrderStatus(o.id, 'paid'));
                                                    }
                                                }}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Payment Done
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
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingRecipeItem(item)} title="Manage Recipe">
                                            <Utensils className="h-4 w-4" />
                                        </Button>
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
                            <CardContent><div className="text-2xl font-bold">{format(totalOrders > 0 ? totalRevenue / totalOrders : 0)}</div></CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Transactions for {selectedDate}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {paidOrders.slice().reverse().map(order => (
                                    <div key={order.id} className="flex justify-between items-start border-b pb-4 last:border-0">
                                        <div>
                                            <div className="font-medium">
                                                {order.orderType === 'dine-in'
                                                    ? (tables.find(t => t.id === String(order.tableId))?.name || `Table ${order.tableId}`)
                                                    : `Takeaway (${order.contactNumber})`}
                                            </div>
                                            <div className="text-sm text-gray-500 mb-1">
                                                {new Date(order.createdAt).toLocaleTimeString()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx}>
                                                        {item.quantity}x {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="font-bold">
                                            {format(order.items.reduce((s: any, i: any) => s + i.price * i.quantity, 0))}
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

            {activeTab === 'analytics' && (
                <AnalyticsTab orders={orders} tables={tables} />
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

            {activeTab === 'inventory' && (
                <InventoryTab />
            )}

            {activeTab === 'settings' && (
                <SettingsTab />
            )}

            {editingRecipeItem && (
                <RecipeEditor
                    menuItem={editingRecipeItem}
                    isOpen={!!editingRecipeItem}
                    onClose={() => setEditingRecipeItem(null)}
                />
            )}

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
                                                        <option key={table.id} value={table.name}>
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
                                        isLoading={isPosLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
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

function AnalyticsTab({ orders, tables }: { orders: Order[], tables: Table[] }) {
    const { format } = useCurrency();

    // Filter for paid orders only
    const paidOrders = orders.filter(o => o.status === 'paid');

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0), 0);
    const totalOrders = paidOrders.length;

    // Hourly Sales
    const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: i, sales: 0 }));
    paidOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyData[hour].sales += order.totalAmount;
    });

    const activeHourlyData = hourlyData.filter(d => d.sales > 0).map(d => ({
        ...d,
        hourLabel: `${d.hour}:00`
    }));

    // Top Items
    const itemCounts: Record<string, number> = {};
    paidOrders.forEach(order => {
        order.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });

    const topItemsData = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{format(totalRevenue)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{totalOrders}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Avg. Order Value</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {format(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Hourly Sales Performance</CardTitle>
                        <CardDescription>When are you busiest?</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeHourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hourLabel" />
                                <YAxis tickFormatter={(value) => format(value)} />
                                <Tooltip formatter={(value: number) => format(value)} />
                                <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Selling Items</CardTitle>
                        <CardDescription>Your most popular dishes</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItemsData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
