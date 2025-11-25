"use client"

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useOrder } from '@/context/OrderContext';
import { useCurrency } from '@/hooks/useCurrency';
import { MENU_ITEMS, OrderItem, OrderType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Plus, Minus, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

import { MenuGrid } from '@/components/MenuGrid';
import { CartDrawer } from '@/components/CartDrawer';

export default function MenuPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const tableId = params.tableId as string;
    const orderType = (searchParams.get('type') as OrderType) || 'dine-in';
    const contactNumber = searchParams.get('contact') || undefined;

    const { cart, addToCart, removeFromCart, addOrder, menuItems } = useOrder();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleAddToCart = (item: any) => {
        addToCart({ ...item, quantity: 1 } as OrderItem);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        const newOrder = await addOrder(cart, orderType, { tableId: orderType === 'dine-in' ? tableId : undefined, contactNumber });
        setIsCartOpen(false);
        // Redirect to order tracking page
        router.push(`/${params.restaurantId}/track/${newOrder.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ChefHat className="h-6 w-6" />
                        {orderType === 'dine-in' ? `Table ${tableId}` : 'Takeaway Order'}
                    </h1>
                    <Button
                        variant="outline"
                        className="relative"
                        onClick={() => setIsCartOpen(!isCartOpen)}
                    >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        <span className="font-semibold">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <MenuGrid menuItems={menuItems} onAddToCart={handleAddToCart} />
            </main>

            {/* Add to Cart Toast Overlay */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4">
                    <div className="bg-black/90 text-white p-4 rounded-lg shadow-lg flex justify-between items-center backdrop-blur-sm animate-in slide-in-from-bottom-5 fade-in">
                        <span className="font-medium">Item added to cart!</span>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="font-bold text-gray-900 bg-white hover:bg-gray-100"
                            onClick={() => {
                                setIsCartOpen(true);
                                setShowToast(false);
                            }}
                        >
                            View Cart
                        </Button>
                    </div>
                </div>
            )}

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onRemove={removeFromCart}
                onAdd={(item) => addToCart(item)}
                onPlaceOrder={handlePlaceOrder}
                totalAmount={totalAmount}
            >
                {orderType === 'takeaway' && (
                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-gray-700">Your Name / Number</label>
                        <input
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. John / 9876543210"
                            value={contactNumber || ''}
                            onChange={(e) => {
                                const url = new URL(window.location.href);
                                url.searchParams.set('contact', e.target.value);
                                router.replace(url.pathname + url.search);
                            }}
                        />
                    </div>
                )}
            </CartDrawer>
        </div>
    );
}
