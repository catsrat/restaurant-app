"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, OrderStatus, OrderType, MenuItem, MENU_ITEMS as INITIAL_MENU_ITEMS, Table, Banner, MenuCategory, Ingredient, MenuItemIngredient } from '@/types';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { supabase } from '@/lib/supabase';
import { CurrencyCode } from '@/lib/currency';

interface OrderContextType {
    orders: Order[];
    addOrder: (items: OrderItem[], orderType: OrderType, details: { tableId?: string, contactNumber?: string }) => Promise<Order | null>;
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
    // Upsell
    checkUpsell: (addedItem: OrderItem) => { rule: any, suggestedItem: MenuItem } | null;
    // Discount
    applyDiscount: (orderId: string, discount: number) => Promise<void>;
    currency: CurrencyCode;
    // Inventory
    ingredients: Ingredient[];
    addIngredient: (name: string, unit: string, stock: number, threshold: number) => Promise<void>;
    updateIngredient: (id: string, updates: Partial<Ingredient>) => Promise<void>;
    deleteIngredient: (id: string) => Promise<void>;
    // Recipes
    recipes: MenuItemIngredient[];
    updateRecipe: (menuItemId: string, ingredients: { ingredientId: string, quantity: number }[]) => Promise<void>;
    getRecipeForMenuItem: (menuItemId: string) => MenuItemIngredient[];
    taxSettings: TaxSettings;
    updateTaxSettings: (settings: Partial<TaxSettings>) => Promise<void>;
    restaurantName: string;
    isLoading: boolean;
    subscriptionStatus: string;
    subscriptionEndDate: Date | null;
    refreshData: () => Promise<void>;
}

export interface TaxSettings {
    tax_name: string;
    tax_rate: number;
    tax_number?: string;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children, restaurantId }: { children: React.ReactNode, restaurantId: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [currency, setCurrency] = useState<CurrencyCode>('INR');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<MenuItemIngredient[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSettings>({ tax_name: 'Tax', tax_rate: 0 });
    const [restaurantName, setRestaurantName] = useState<string>('My Restaurant');
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive');
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);

    const { user } = useAuth(); // Get current user

    // Fetch Initial Data
    const fetchData = useCallback(async () => {
        if (!restaurantId) return;

        // Fetch Menu
        const { data: menuData, error: menuError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_available', true);

        if (menuError) console.error("Error fetching menu items:", menuError);
        if (menuData) setMenuItems(menuData.map((m: any) => ({ ...m, id: String(m.id) })));

        // Fetch Restaurant Details (Currency, Tax, Subscription)
        const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('name, currency, tax_name, tax_rate, tax_number, subscription_status, subscription_end_date, user_id')
            .eq('id', restaurantId)
            .single();

        if (restaurantError) console.error("Error fetching restaurant details:", restaurantError);
        if (restaurantData) {
            setRestaurantName(restaurantData.name || 'My Restaurant');
            setCurrency(restaurantData.currency || 'INR');
            setTaxSettings({
                tax_name: restaurantData.tax_name || 'Tax',
                tax_rate: restaurantData.tax_rate || 0,
                tax_number: restaurantData.tax_number
            });
            setSubscriptionStatus(restaurantData.subscription_status || 'inactive');
            setSubscriptionEndDate(restaurantData.subscription_end_date ? new Date(restaurantData.subscription_end_date) : null);

            // OWNERSHIP CHECK
            if (user && restaurantData.user_id && user.id !== restaurantData.user_id) {
                console.error(`❌ OWNERSHIP MISMATCH! User ${user.id} does not own Restaurant ${restaurantId} (Owner: ${restaurantData.user_id})`);
                // alert(`⚠️ Critical Error: You do not have permission to manage this restaurant.\n\nUser ID: ${user.id}\nOwner ID: ${restaurantData.user_id}\n\nPlease contact support or run the RLS fix script.`);
            } else if (user && !restaurantData.user_id) {
                console.warn(`⚠️ Restaurant has NO owner. Attempting to claim...`);
                const { error: claimError } = await supabase
                    .from('restaurants')
                    .update({ user_id: user.id })
                    .eq('id', restaurantId);

                if (claimError) console.error("Failed to claim restaurant:", claimError);
                else {
                    console.log("✅ Restaurant claimed successfully!");
                    alert("Restaurant ownership claimed! You can now manage orders.");
                }
            }
        }

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
        if (bannerData) setBanners(bannerData.map((b: any) => ({ ...b, created_at: new Date(b.created_at) })));

        // Fetch Ingredients
        const { data: ingredientData, error: ingredientError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name');

        if (ingredientError) console.error("Error fetching ingredients:", ingredientError);
        if (ingredientData) setIngredients(ingredientData.map((i: any) => ({ ...i, id: String(i.id), created_at: new Date(i.created_at) })));

        // Fetch Recipes
        const { data: recipeData, error: recipeError } = await supabase
            .from('menu_item_ingredients')
            .select('*');

        if (recipeError) console.error("Error fetching recipes:", recipeError);
        if (recipeData) setRecipes(recipeData.map((r: any) => ({
            ...r,
            id: String(r.id),
            menu_item_id: String(r.menu_item_id),
            ingredient_id: String(r.ingredient_id),
            created_at: new Date(r.created_at)
        })));

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
                discount: o.discount || 0,
                orderType: o.order_type, // Map snake_case to camelCase
                createdAt: new Date(o.created_at),
                items: (Array.isArray(o.items) ? o.items : []).map((i: any) => {
                    const menuItemName = Array.isArray(i.menu_item)
                        ? i.menu_item[0]?.name
                        : i.menu_item?.name;

                    return {
                        id: i.id, // Use the actual order_items.id, not menu_item_id
                        menuItemId: i.menu_item_id, // Keep menu_item_id for reference
                        name: menuItemName || i.name || 'Unknown Item',
                        price: i.price,
                        quantity: i.quantity,
                        notes: i.notes,
                        selectedOptions: i.selected_options,
                        status: i.status || 'pending' // Ensure status is included
                    };
                })
            }));
            setOrders(parsedOrders);
        }
        setIsLoading(false);
    }, [restaurantId]);

    useEffect(() => {
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, (payload) => {
                console.log('Realtime Order Items Update:', payload);
                if (payload.eventType === 'UPDATE' && payload.new) {
                    // Update the specific item in state without refetching everything
                    setOrders(prev => prev.map(o => ({
                        ...o,
                        items: o.items.map(i =>
                            String(i.id) === String(payload.new.id)
                                ? { ...i, status: payload.new.status }
                                : i
                        )
                    })));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
                console.log('Realtime Ingredients Update');
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_item_ingredients' }, () => {
                console.log('Realtime Recipes Update');
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

        // Polling Fallback (every 15 seconds)
        const pollInterval = setInterval(() => {
            console.log('Polling for updates...');
            fetchData();
        }, 15000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [fetchData, restaurantId]);

    const addOrder = async (items: OrderItem[], orderType: OrderType, details: { tableId?: string, contactNumber?: string }) => {
        alert(`DEBUG: addOrder called with ${items.length} items`);
        console.log('[addOrder] Starting order creation');
        console.log('[addOrder] Ingredients available:', ingredients.length, ingredients.map(i => `${i.name}: ${i.current_stock}`));
        console.log('[addOrder] Recipes available:', recipes.length);
        console.log('[addOrder] Items to order:', items.map(i => ({ id: i.id, name: i.name, qty: i.quantity })));

        // 1. Create Order
        let table = null;
        if (details.tableId) {
            const searchName = details.tableId.trim().toLowerCase();
            table = tables.find(t => t.name.toLowerCase() === searchName);

            if (!table && orderType === 'dine-in') {
                console.warn(`Table '${details.tableId}' not found. Available tables:`, tables.map(t => t.name));
                alert(`Table '${details.tableId}' not found! Please check the table name.`);
                return null; // Stop execution
            }
        }

        console.log("Creating order...", { items, orderType, details, tableId: table?.id });

        if (items.length === 0) {
            console.error("addOrder called with empty items!");
            throw new Error("Cannot place an empty order.");
        }

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
            // is_upsell: item.isUpsell || false // FIXME: Uncomment after migration is applied
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
            console.error("Error inserting order items:", itemsError);
            // Optional: Delete the order if items fail?
            // await supabase.from('orders').delete().eq('id', order.id);
            throw itemsError;
        }

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

        // 3. Deduct Inventory
        // ALWAYS fetch FRESH ingredients and recipes from DB (don't rely on context state)
        // This ensures mobile browsers that don't load the full context still deduct inventory
        console.log('[Inventory] Fetching fresh ingredients and recipes from database...');

        const { data: freshIngredients, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('restaurant_id', restaurantId);

        const { data: freshRecipes, error: recipesError } = await supabase
            .from('menu_item_ingredients')
            .select('*');

        if (ingredientsError) {
            console.error('[Inventory] Failed to fetch ingredients:', ingredientsError);
        }
        if (recipesError) {
            console.error('[Inventory] Failed to fetch recipes:', recipesError);
        }

        // DEBUG: Show what was fetched
        alert(`FETCH RESULTS:\nIngredients: ${freshIngredients?.length || 0}\nRecipes: ${freshRecipes?.length || 0}\nRecipe Error: ${recipesError?.message || 'none'}`);

        if (!freshIngredients || !freshRecipes || freshIngredients.length === 0 || freshRecipes.length === 0) {
            console.warn('[Inventory] No ingredients or recipes found. Skipping inventory deduction.');
            clearCart();
            return { ...order, items, createdAt: new Date(order.created_at) };
        }

        console.log('[Inventory] Fresh ingredients fetched:', freshIngredients.length, freshIngredients.map(i => `${i.name}: ${i.current_stock}`));
        console.log('[Inventory] Fresh recipes fetched:', freshRecipes.length);

        // DEBUG: Always show alert to diagnose issue
        alert(`DEBUG Inventory:\nIngredients: ${freshIngredients.length}\nRecipes: ${freshRecipes.length}\nItems to order: ${items.length}`);

        // Use a local map to track stock changes within this transaction
        const stockUpdates = new Map<string, number>();

        // Initialize map with FRESH stock
        freshIngredients.forEach(i => stockUpdates.set(String(i.id), i.current_stock));

        console.log("[Inventory] Starting deduction. Items:", items.map(i => ({ id: i.id, name: i.name, qty: i.quantity })));
        console.log("[Inventory] Available Recipes:", freshRecipes.length, freshRecipes.slice(0, 3)); // Log first 3 to check structure

        for (const item of items) {
            // Use String() for robust comparison
            const itemRecipe = freshRecipes.filter(r => String(r.menu_item_id) === String(item.id));
            console.log(`[Inventory] Looking for recipe for item ${item.id} (${item.name}). Found ingredients:`, itemRecipe.length);

            if (itemRecipe.length > 0) {
                for (const ingredient of itemRecipe) {
                    const quantityToDeduct = ingredient.quantity_required * item.quantity;
                    const ingredientId = String(ingredient.ingredient_id);

                    const currentStock = stockUpdates.get(ingredientId);

                    if (currentStock !== undefined) {
                        const newStock = currentStock - quantityToDeduct;
                        stockUpdates.set(ingredientId, newStock);
                        const ingredientName = freshIngredients.find(i => String(i.id) === ingredientId)?.name || 'Unknown';
                        console.log(`[Inventory] Deducting ${quantityToDeduct} from ingredient ${ingredientId} (${ingredientName}). Old: ${currentStock}, New: ${newStock}`);
                    } else {
                        console.warn(`[Inventory] Ingredient ${ingredientId} NOT FOUND in local stock map. Available keys:`, Array.from(stockUpdates.keys()));
                    }
                }
            } else {
                console.warn(`[Inventory] No recipe found for item ${item.name} (ID: ${item.id}). Recipe IDs available:`, freshRecipes.map(r => r.menu_item_id));
            }
        }

        // Apply all updates to DB and State
        const updatePromises: any[] = [];

        for (const [id, newStock] of stockUpdates.entries()) {
            const original = freshIngredients.find(i => String(i.id) === id);
            if (original && original.current_stock !== newStock) {
                const deductAmount = original.current_stock - newStock;

                // Use atomic decrement to prevent race conditions
                // Instead of setting the value, we decrement it
                updatePromises.push(
                    supabase.rpc('decrement_ingredient_stock', {
                        ingredient_id: id,
                        amount: deductAmount
                    }).then(({ error }) => {
                        if (error) {
                            console.error(`Failed to decrement ingredient ${id}:`, error);
                            // Fallback to direct update if RPC fails
                            return supabase
                                .from('ingredients')
                                .update({ current_stock: newStock })
                                .eq('id', id);
                        }
                    })
                );

                // Update State (Optimistic/Immediate)
                setIngredients(prev => prev.map(i => String(i.id) === id ? { ...i, current_stock: newStock } : i));
            }
        }

        // Wait for all DB updates to complete in parallel
        const results = await Promise.all(updatePromises);

        // DEBUG: Show deduction results
        alert(`DEDUCTION COMPLETE:\nUpdates attempted: ${updatePromises.length}\nStock map size: ${stockUpdates.size}`);

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
            if (String(o.id) === String(orderId)) {
                const updatedItems = o.items.map(i => {
                    if (String(i.id) === String(itemId)) {
                        return { ...i, status };
                    }
                    return i;
                });
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
            const { data: updatedItems, error: itemError } = await supabase
                .from('order_items')
                .update({ status })
                .eq('id', itemId)
                .select();

            const count = updatedItems ? updatedItems.length : 0;

            console.log(`[Update Item] Result:`, { count, error: itemError });

            if (count === 0) {
                console.error("❌ Update failed: 0 rows affected. RLS is likely blocking this.");
                alert("Failed to update item: Permission denied (RLS). Please run the fix script.");
                // Revert optimistic update?
                fetchData(); // Force refresh to revert
                return;
            }

            if (itemError) throw itemError;

            // 2. Check siblings to update parent order
            // We need to fetch fresh items to be sure, or trust our optimistic logic.
            // For robustness, let's fetch.
            const { data: siblingItems, error: fetchError } = await supabase
                .from('order_items')
                .select('id, status')
                .eq('order_id', orderId);

            if (fetchError) throw fetchError;

            if (siblingItems) {
                // Force the updated item's status in the check to handle potential read-after-write lag
                const effectiveSiblings = siblingItems.map((i: any) =>
                    String(i.id) === String(itemId) ? { ...i, status: status } : i
                );

                const allReady = effectiveSiblings.every((i: any) => i.status === 'ready');
                const someReady = effectiveSiblings.some((i: any) => i.status === 'ready');

                console.log(`[Status Update] Item ID types - itemId: ${typeof itemId} (${itemId}), sibling IDs:`, siblingItems.map((i: any) => `${typeof i.id} (${i.id})`));
                console.log(`[Status Update] Order ${orderId} raw siblings:`, siblingItems.map((i: any) => i.status));
                console.log(`[Status Update] Order ${orderId} effective siblings:`, effectiveSiblings.map((i: any) => i.status), `All Ready: ${allReady}`);

                // Fetch current order status to avoid overwriting 'served' or 'paid'
                const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();

                if (currentOrder && currentOrder.status !== 'served' && currentOrder.status !== 'paid') {
                    let newStatus: OrderStatus | null = null;

                    if (allReady) newStatus = 'ready';
                    else if (someReady) newStatus = 'preparing';

                    if (newStatus && newStatus !== currentOrder.status) {
                        console.log(`[Status Update] Updating Order ${orderId} status to ${newStatus}`);
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
        // Soft delete: Mark as unavailable instead of hard deleting
        // This prevents foreign key constraint errors with existing orders
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: false })
            .eq('id', id);

        if (error) {
            console.error("Error deleting menu item:", error);
            alert("Failed to delete item. It might be linked to existing orders.");
        } else {
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
    const applyDiscount = async (orderId: string, discount: number) => {
        console.log(`Applying discount of ${discount} to order ${orderId}`);

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, discount } : o));

        try {
            const { error } = await supabase
                .from('orders')
                .update({ discount })
                .eq('id', orderId);

            if (error) throw error;
            console.log("Discount applied successfully");
        } catch (error: any) {
            console.error("Error applying discount:", error);
            alert(`Failed to apply discount: ${error.message}`);
            // Revert
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, discount: 0 } : o));
        }
    };
    // Inventory Management
    const addIngredient = async (name: string, unit: string, stock: number, threshold: number) => {
        const { data, error } = await supabase
            .from('ingredients')
            .insert({
                restaurant_id: restaurantId,
                name,
                unit,
                current_stock: stock,
                low_stock_threshold: threshold
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding ingredient:", error);
            return;
        }

        setIngredients(prev => [...prev, { ...data, id: String(data.id), created_at: new Date(data.created_at) }]);
    };

    const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
        const { error } = await supabase
            .from('ingredients')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error("Error updating ingredient:", error);
            return;
        }

        setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const deleteIngredient = async (id: string) => {
        const { error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting ingredient:", error);
            return;
        }

        setIngredients(prev => prev.filter(i => i.id !== id));
    };

    // Recipe Management
    const updateRecipe = async (menuItemId: string, newIngredients: { ingredientId: string, quantity: number }[]) => {
        // 1. Delete existing recipe for this item
        const { error: deleteError } = await supabase
            .from('menu_item_ingredients')
            .delete()
            .eq('menu_item_id', menuItemId);

        if (deleteError) {
            console.error("Error clearing recipe:", deleteError);
            return;
        }

        if (newIngredients.length === 0) {
            setRecipes(prev => prev.filter(r => r.menu_item_id !== menuItemId));
            return;
        }

        // 2. Insert new ingredients
        const insertPayload = newIngredients.map(i => ({
            menu_item_id: menuItemId,
            ingredient_id: i.ingredientId,
            quantity_required: i.quantity
        }));
        console.log("[OrderContext] Inserting recipe ingredients:", insertPayload);

        const { data, error: insertError } = await supabase
            .from('menu_item_ingredients')
            .insert(insertPayload)
            .select();

        if (insertError) {
            console.error("Error updating recipe:", insertError);
            return;
        }

        // Update local state
        setRecipes(prev => {
            const filtered = prev.filter(r => r.menu_item_id !== menuItemId);
            const added = data.map((r: any) => ({
                ...r,
                id: String(r.id),
                menu_item_id: String(r.menu_item_id),
                ingredient_id: String(r.ingredient_id),
                created_at: new Date(r.created_at)
            }));
            return [...filtered, ...added];
        });
    };

    const getRecipeForMenuItem = (menuItemId: string) => {
        return recipes.filter(r => String(r.menu_item_id) === String(menuItemId));
    };

    // Tax Settings (State declared above)

    const updateTaxSettings = async (settings: Partial<TaxSettings>) => {
        // Optimistic update
        setTaxSettings(prev => ({ ...prev, ...settings }));

        const { error } = await supabase
            .from('restaurants')
            .update(settings)
            .eq('id', restaurantId);

        if (error) {
            console.error("Error updating tax settings:", error);
            // Revert? For now just log
        }
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
            checkUpsell,
            applyDiscount,
            currency,
            ingredients,
            addIngredient,
            updateIngredient,
            deleteIngredient,
            recipes,
            updateRecipe,
            getRecipeForMenuItem,
            taxSettings,
            updateTaxSettings,
            restaurantName,
            isLoading,
            subscriptionStatus,
            subscriptionEndDate,
            refreshData: fetchData
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
