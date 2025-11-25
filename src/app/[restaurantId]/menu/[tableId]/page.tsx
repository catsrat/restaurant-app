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

export default function MenuPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const tableId = params.tableId as string;
    const orderType = (searchParams.get('type') as OrderType) || 'dine-in';
    const contactNumber = searchParams.get('contact') || undefined;

    const { cart, addToCart, removeFromCart, addOrder, clearCart, menuItems } = useOrder();
    const { format } = useCurrency();
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-video w-full relative">
                                {/* In a real app, use Next.js Image */}
                                <img
                                    src={item.image_url || item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <span className="font-bold text-primary">{format(item.price)}</span>
                                </div>
                                <CardDescription>{item.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => handleAddToCart(item)}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add to Order
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Add to Cart Toast Overlay */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4">
                    <div className="bg-black/80 text-white p-4 rounded-lg shadow-lg flex justify-between items-center backdrop-blur-sm animate-in slide-in-from-bottom-5 fade-in">
                        <span>Item added to cart!</span>
                        <Button
                            size="sm"
                            variant="secondary"
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

            {/* Cart Drawer / Bottom Sheet */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold">Your Order</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)}>Close</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    Your cart is empty.
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                                        <div>
                                            <h3 className="font-medium">{item.name}</h3>
                                            <p className="text-sm text-gray-500">{format(item.price)} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-4 text-center">{item.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => addToCart(item)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50">
                            <div className="flex justify-between items-center mb-4 text-lg font-bold">
                                <span>Total</span>
                                <span>{format(totalAmount)}</span>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={handlePlaceOrder}
                            >
                                Place Order
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
