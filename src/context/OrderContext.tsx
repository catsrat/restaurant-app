"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, OrderItem, OrderStatus, OrderType, MenuItem, MENU_ITEMS as INITIAL_MENU_ITEMS, Table } from '@/types';
import { supabase } from '@/lib/supabase';

interface OrderContextType {
    orders: Order[];
    addOrder: (items: OrderItem[], orderType: OrderType, details: { tableId?: string, contactNumber?: string }) => Promise<Order>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    cart: OrderItem[];
    addToCart: (item: OrderItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    // Menu Management
    menuItems: MenuItem[];
    addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
    updateMenuItem: (item: MenuItem) => Promise<void>;
    deleteMenuItem: (id: string) => Promise<void>;
    // Table Management
    tables: Table[];
    addTable: (name: string) => Promise<void>;
    deleteTable: (id: string) => Promise<void>;
    markTablePaid: (tableId: string) => Promise<void>;
    resetTableStatus: (tableId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children, restaurantId }: { children: React.ReactNode, restaurantId: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);

    // Fetch Initial Data
    useEffect(() => {
        if (!restaurantId) return;

        const fetchData = async () => {
            // Fetch Menu
            const { data: menuData, error: menuError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_available', true);

            if (menuError) console.error("Error fetching menu items:", menuError);
            if (menuData) setMenuItems(menuData);

            // Fetch Tables
            const { data: tableData, error: tableError } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (tableError) console.error("Error fetching tables:", tableError);
            if (tableData) {
                setTables(tableData.map((t: any) => ({ ...t, id: String(t.id) })));
            }

            // Fetch Orders (Active only for performance)
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
    *,
    items: order_items(*)
                `)
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: true });

            if (orderError) console.error("Error fetching orders:", orderError);
            if (orderData) {
                const parsedOrders = orderData.map((o: any) => ({
                    ...o,
                    id: String(o.id), // Ensure ID is string
                    tableId: String(o.table_id), // Ensure tableId is string
                    totalAmount: o.total_amount,
                    orderType: o.order_type, // Map snake_case to camelCase
                    createdAt: new Date(o.created_at),
                    items: o.items.map((i: any) => ({ ...i, id: String(i.menu_item_id) })) // Map back to internal structure
                }));
                setOrders(parsedOrders);
            }
        };

        fetchData();

        // Realtime Subscriptions
        const channel = supabase
            .channel(`restaurant_${restaurantId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Realtime Order Update (No Filter):', payload);
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
                console.log('Realtime Table Update');
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                console.log('Realtime Menu Update');
                fetchData();
            })
            .subscribe((status) => {
                console.log(`Realtime subscription status for restaurant ${restaurantId}:`, status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to realtime changes');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime channel error');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const addOrder = async (items: OrderItem[], orderType: OrderType, details: { tableId?: string, contactNumber?: string }) => {
        // 1. Create Order
        const table = details.tableId ? tables.find(t => t.name === details.tableId) : null;

        console.log("Creating order...", { items, orderType, details, tableId: table?.id });

        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                restaurant_id: restaurantId,
                table_id: table ? table.id : null,
                status: 'pending',
                total_amount: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
                order_type: orderType,
                customer_name: details.contactNumber
            })
            .select()
            .single();

        if (error || !order) throw error;

        // 2. Create Order Items
        const orderItems = items.map(item => ({
            order_id: order.id,
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        await supabase.from('order_items').insert(orderItems);

        // 3. Update Table Status if needed
        if (orderType === 'dine-in' && details.tableId) {
            const table = tables.find(t => t.name === details.tableId);
            if (table) {
                await supabase
                    .from('tables')
                    .update({ status: 'occupied' })
                    .eq('id', table.id);
            }
        }

        clearCart();
        return { ...order, items, createdAt: new Date(order.created_at) };
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        console.log(`Updating order ${orderId} to status: ${status}`);

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }

            console.log("Order updated successfully via fetch");
        } catch (error: any) {
            console.error("Error updating order status:", error);
            console.error("Failed Order ID:", orderId, typeof orderId);
            // Revert on error
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'pending' } : o)); // Simple revert
            alert(`Failed to update order status: ${error.message}`);
        }
    };

    const addToCart = (item: OrderItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
    };

    // Menu Actions
    const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
        const { data, error } = await supabase.from('menu_items').insert({
            ...item,
            restaurant_id: restaurantId
        }).select().single();

        if (error) {
            console.error("Error adding menu item:", error);
            alert("Failed to add menu item: " + error.message);
        } else if (data) {
            setMenuItems(prev => [...prev, data]);
        }
    };

    const updateMenuItem = async (updatedItem: MenuItem) => {
        const { error } = await supabase
            .from('menu_items')
            .update({
                name: updatedItem.name,
                price: updatedItem.price,
                category: updatedItem.category,
                description: updatedItem.description,
                image_url: updatedItem.image_url,
                is_available: updatedItem.is_available
            })
            .eq('id', updatedItem.id);

        if (!error) {
            setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        }
    };

    const deleteMenuItem = async (id: string) => {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (!error) {
            setMenuItems(prev => prev.filter(item => item.id !== id));
        }
    };

    // Table Actions
    const addTable = async (name: string) => {
        console.log("Adding table:", name, "for restaurant:", restaurantId);
        const { data, error } = await supabase.from('tables').insert({
            name,
            restaurant_id: restaurantId,
            status: 'available'
        }).select().single();

        if (error) {
            console.error("Error adding table:", error);
            alert("Failed to add table: " + error.message);
        } else if (data) {
            console.log("Table added successfully");
            setTables(prev => [...prev, data]);
        }
    };

    const deleteTable = async (id: string) => {
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (!error) {
            setTables(prev => prev.filter(t => t.id !== id));
        }
    };

    const markTablePaid = async (tableId: string) => {
        // Find table by ID (more robust than name)
        const table = tables.find(t => t.id === tableId);
        if (!table) {
            console.error("markTablePaid: Table not found for ID", tableId);
            return;
        }

        // Optimistic Updates
        setOrders(prev => prev.map(o => o.tableId === tableId && o.status !== 'paid' ? { ...o, status: 'paid' } : o));
        setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: 'available' } : t));

        // Update all active orders for this table to 'paid'
        // Update all active orders for this table to 'paid'
        try {
            // 1. Mark orders as paid
            const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?table_id=eq.${table.id}&status=neq.paid`, {
                method: 'PATCH',
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'paid' })
            });

            if (!orderResponse.ok) console.error("Error marking orders paid via fetch:", await orderResponse.text());

            // 2. Free the table
            const tableResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tables?id=eq.${table.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'available' })
            });

            if (!tableResponse.ok) console.error("Error freeing table via fetch:", await tableResponse.text());
            else console.log("Table marked available successfully via fetch");

        } catch (error) {
            console.error("Error in markTablePaid:", error);
            // Revert optimistic update if needed (omitted for simplicity as partial failure is complex)
        }
    };

    const resetTableStatus = async (tableId: string) => {
        // Optimistic update
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'available' } : t));

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tables?id=eq.${tableId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'available' })
            });

            if (!response.ok) {
                console.error("Error resetting table status:", await response.text());
                // Revert if needed
            } else {
                console.log("Table status reset successfully");
            }
        } catch (error) {
            console.error("Error in resetTableStatus:", error);
        }
    };

    return (
        <OrderContext.Provider value={{
            orders,
            menuItems,
            tables,
            addOrder,
            updateOrderStatus,
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            addMenuItem,
            updateMenuItem,
            deleteMenuItem,
            addTable,
            deleteTable,
            markTablePaid,
            resetTableStatus
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}
