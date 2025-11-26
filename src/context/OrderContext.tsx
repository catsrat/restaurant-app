"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, OrderItem, OrderStatus, OrderType, MenuItem, MENU_ITEMS as INITIAL_MENU_ITEMS, Table, Banner, MenuCategory } from '@/types';
import { supabase } from '@/lib/supabase';

interface OrderContextType {
    orders: Order[];
    addOrder: (items: OrderItem[], orderType: OrderType, details: { tableId?: string, contactNumber?: string }) => Promise<Order>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    updateOrderItemStatus: (orderId: string, itemId: string, status: 'pending' | 'ready') => Promise<void>;
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
    // Banner Management
    banners: Banner[];
    addBanner: (url: string, title?: string) => Promise<void>;
    deleteBanner: (id: string) => Promise<void>;
    // Category Management
    categories: MenuCategory[];
    addCategory: (name: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    // Upsell
    checkUpsell: (addedItem: OrderItem) => { rule: any, suggestedItem: MenuItem } | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children, restaurantId }: { children: React.ReactNode, restaurantId: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);

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

            // Fetch Banners
            const { data: bannerData, error: bannerError } = await supabase
                .from('restaurant_banners')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (bannerError) console.error("Error fetching banners:", bannerError);
            if (bannerData) setBanners(bannerData);

            // Fetch Categories
            const { data: categoryData, error: categoryError } = await supabase
                .from('menu_categories')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('display_order', { ascending: true });

            if (categoryError) console.error("Error fetching categories:", categoryError);
            if (categoryData) setCategories(categoryData);

            // Fetch Orders (Active only for performance)
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
    *,
    items: order_items(
        *,
        menu_item: menu_items(name)
    )
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
                    items: Array.isArray(o.items) ? o.items.map((i: any) => {
                        const menuItemName = Array.isArray(i.menu_item)
                            ? i.menu_item[0]?.name
                            : i.menu_item?.name;
                        return {
                            ...i,
                            id: String(i.id),
                            status: i.status || 'pending',
                            name: i.name || menuItemName || 'Unknown Item'
                        };
                    }) : [] // Map back to internal structure
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
                console.log('Realtime Order Items Update');
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
            quantity: item.quantity,
            status: 'pending',
            notes: item.notes,
            selected_options: item.selectedOptions,
            is_upsell: item.isUpsell || false
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
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId);

            if (error) throw error;

            console.log("Order updated successfully via supabase client");
        } catch (error: any) {
            console.error("Error updating order status:", error);
            // Revert on error
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'pending' } : o)); // Simple revert (imperfect if previous wasn't pending)
            alert(`Failed to update order status: ${error.message}`);
        }
    };

    const updateOrderItemStatus = async (orderId: string, itemId: string, status: 'pending' | 'ready') => {
        console.log(`Updating item ${itemId} in order ${orderId} to ${status}`);

        // Optimistic update
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const updatedItems = o.items.map(i => i.id === itemId ? { ...i, status } : i);

                // Auto-calculate parent status
                const allReady = updatedItems.every(i => i.status === 'ready');
                const someReady = updatedItems.some(i => i.status === 'ready');
                let newOrderStatus = o.status;

                if (allReady && o.status !== 'served' && o.status !== 'paid') {
                    newOrderStatus = 'ready';
                } else if (someReady && o.status === 'pending') {
                    newOrderStatus = 'preparing';
                } else if (!someReady && o.status === 'ready') {
                    // If we uncheck everything, go back to preparing or pending?
                    // Let's say preparing if it was ready.
                    newOrderStatus = 'preparing';
                }

                return { ...o, items: updatedItems, status: newOrderStatus };
            }
            return o;
        }));

        try {
            // 1. Update Item
            const { error: itemError } = await supabase
                .from('order_items')
                .update({ status })
                .eq('id', itemId);

            if (itemError) throw itemError;

            // 2. Check siblings to update parent order
            // We need to fetch fresh items to be sure, or trust our optimistic logic.
            // For robustness, let's fetch.
            const { data: siblingItems, error: fetchError } = await supabase
                .from('order_items')
                .select('status')
                .eq('order_id', orderId);

            if (fetchError) throw fetchError;

            if (siblingItems) {
                const allReady = siblingItems.every((i: any) => i.status === 'ready');
                const someReady = siblingItems.some((i: any) => i.status === 'ready');

                // Fetch current order status to avoid overwriting 'served' or 'paid'
                const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();

                if (currentOrder && currentOrder.status !== 'served' && currentOrder.status !== 'paid') {
                    let newStatus: OrderStatus | null = null;

                    if (allReady) newStatus = 'ready';
                    else if (someReady) newStatus = 'preparing';

                    if (newStatus && newStatus !== currentOrder.status) {
                        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
                    }
                }
            }

        } catch (error: any) {
            console.error("Error updating item status:", error);
            alert(`Failed to update item: ${error.message}`);
            // Revert logic would go here (complex to revert parent status change)
        }
    };

    const addToCart = (item: OrderItem) => {
        setCart((prev) => {
            // Check for existing item with SAME options and notes
            const existingIndex = prev.findIndex((i) =>
                i.id === item.id &&
                i.notes === item.notes &&
                JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
            );

            if (existingIndex > -1) {
                const newCart = [...prev];
                newCart[existingIndex].quantity += item.quantity;
                return newCart;
            }
            // Add new item with unique cartId
            return [...prev, { ...item, cartId: `${item.id}-${Date.now()}-${Math.random()}` }];
        });
    };

    const removeFromCart = (cartId: string) => {
        setCart((prev) => {
            const existingItem = prev.find(i => i.cartId === cartId);
            if (existingItem && existingItem.quantity > 1) {
                return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter((i) => i.cartId !== cartId);
        });
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

        try {
            // 1. Mark orders as paid
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('table_id', table.id)
                .neq('status', 'paid');

            if (orderError) throw orderError;

            // 2. Free the table
            const { error: tableError } = await supabase
                .from('tables')
                .update({ status: 'available' })
                .eq('id', table.id);

            if (tableError) throw tableError;

            console.log("Table marked available successfully via supabase client");

        } catch (error: any) {
            console.error("Error in markTablePaid:", error);
            alert(`Failed to mark table paid: ${error.message}`);
            // Revert optimistic update if needed (omitted for simplicity)
        }
    };

    const resetTableStatus = async (tableId: string) => {
        // Optimistic update
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'available' } : t));

        try {
            const { error } = await supabase
                .from('tables')
                .update({ status: 'available' })
                .eq('id', tableId);

            if (error) throw error;

            console.log("Table status reset successfully");
        } catch (error: any) {
            console.error("Error in resetTableStatus:", error);
            alert(`Failed to reset table: ${error.message}`);
        }
    };

    // Banner Actions
    const addBanner = async (url: string, title?: string) => {
        const { data, error } = await supabase.from('restaurant_banners').insert({
            restaurant_id: restaurantId,
            image_url: url,
            title,
            is_active: true
        }).select().single();

        if (error) {
            console.error("Error adding banner:", error);
            alert("Failed to add banner: " + error.message);
        } else if (data) {
            setBanners(prev => [data, ...prev]);
        }
    };

    const deleteBanner = async (id: string) => {
        const { error } = await supabase.from('restaurant_banners').delete().eq('id', id);
        if (!error) {
            setBanners(prev => prev.filter(b => b.id !== id));
        }
    };

    // Category Actions
    const addCategory = async (name: string) => {
        const { data, error } = await supabase.from('menu_categories').insert({
            restaurant_id: restaurantId,
            name,
            display_order: categories.length
        }).select().single();

        if (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category: " + error.message);
        } else if (data) {
            setCategories(prev => [...prev, data]);
        }
    };

    const deleteCategory = async (id: string) => {
        const { error } = await supabase.from('menu_categories').delete().eq('id', id);
        if (!error) {
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    // Upsell Logic
    const [upsellRules, setUpsellRules] = useState<any[]>([]);

    useEffect(() => {
        if (!restaurantId) return;
        const fetchUpsells = async () => {
            const { data, error } = await supabase
                .from('upsell_rules')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true);
            if (error) console.error("Error fetching upsell rules:", error);
            if (data) setUpsellRules(data);
        };
        fetchUpsells();
    }, [restaurantId]);

    const checkUpsell = (addedItem: OrderItem): { rule: any, suggestedItem: MenuItem } | null => {
        console.log("Checking upsell for:", addedItem.name, "ID:", addedItem.id);

        // Find the full menu item to get the category
        const fullItem = menuItems.find(i => String(i.id) === String(addedItem.id));
        if (!fullItem) {
            console.log("Full item not found in menuItems");
            return null;
        }
        console.log("Full item found:", fullItem.name, "Category:", fullItem.category);

        // Find a matching rule
        const rule = upsellRules.find(r => {
            console.log("Checking rule:", r);
            // Check specific item trigger
            if (r.trigger_menu_item_id && String(r.trigger_menu_item_id) === String(addedItem.id)) {
                console.log("Item trigger match!");
                return true;
            }
            // Check category trigger
            if (r.trigger_category_id) {
                const category = categories.find(c => String(c.id) === String(r.trigger_category_id));
                console.log("Checking category trigger. Rule Cat ID:", r.trigger_category_id, "Found Cat:", category?.name);

                if (category && fullItem.category === category.name) {
                    console.log("Category match!");
                    return true;
                }
            }
            return false;
        });

        if (rule) {
            console.log("Rule matched:", rule);
            const suggestedItem = menuItems.find(i => String(i.id) === String(rule.suggested_menu_item_id));
            if (suggestedItem) return { rule, suggestedItem };
            else console.log("Suggested item not found:", rule.suggested_menu_item_id);
        } else {
            console.log("No database rule matched. Trying Auto-Discovery...");

            // Auto-Discovery Heuristics
            const categoryName = fullItem.category.toLowerCase();
            let targetKeyword = '';
            let message = '';

            if (categoryName.includes('burger') || categoryName.includes('sandwich')) {
                targetKeyword = 'fries';
                message = `Complete your meal with some crispy Fries! 🍟`;
            } else if (categoryName.includes('pizza') || categoryName.includes('pasta')) {
                targetKeyword = 'cola'; // or drink
                message = `Thirsty? Add a refreshing drink! 🥤`;
            } else if (categoryName.includes('coffee') || categoryName.includes('tea')) {
                targetKeyword = 'muffin'; // or pastry, cookie
                message = `A sweet treat goes perfectly with your drink! 🧁`;
            }

            if (targetKeyword) {
                // Find a matching item in the CURRENT restaurant's menu
                const suggestedItem = menuItems.find(i => i.name.toLowerCase().includes(targetKeyword) && i.id !== addedItem.id);
                if (suggestedItem) {
                    console.log("Auto-Discovery matched:", suggestedItem.name);
                    return {
                        rule: { message },
                        suggestedItem
                    };
                }
            }
        }
        return null;
    };

    return (
        <OrderContext.Provider value={{
            orders,
            menuItems,
            tables,
            addOrder,
            updateOrderStatus,
            updateOrderItemStatus,
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
            resetTableStatus,
            banners,
            addBanner,
            deleteBanner,
            categories,
            addCategory,
            deleteCategory,
            checkUpsell
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
