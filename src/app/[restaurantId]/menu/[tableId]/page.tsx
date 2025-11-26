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

import { SearchBar } from '@/components/SearchBar';
import { CategoryNav } from '@/components/CategoryNav';
import { ItemModal } from '@/components/ItemModal';
import { UpsellModal } from '@/components/UpsellModal';
import { MenuItem } from '@/types';

export default function MenuPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const tableId = params.tableId as string;
    const orderType = (searchParams.get('type') as OrderType) || 'dine-in';
    const contactNumber = searchParams.get('contact') || undefined;

    const { cart, addToCart, removeFromCart, addOrder, menuItems, banners, categories, checkUpsell } = useOrder();
    const { format } = useCurrency();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Smart Menu State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    // Upsell State
    const [upsellItem, setUpsellItem] = useState<MenuItem | null>(null);
    const [upsellMessage, setUpsellMessage] = useState('');

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Filter Logic
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || item.category === categories.find(c => c.id === activeCategory)?.name;

        return matchesSearch && matchesCategory;
    });

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
    };

    const handleAddToCart = (item: OrderItem) => {
        addToCart(item);
        setSelectedItem(null); // Close modal

        // Check for upsell
        const upsell = checkUpsell(item);
        if (upsell) {
            setUpsellItem(upsell.suggestedItem);
            setUpsellMessage(upsell.rule.message);
        } else {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
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
            <header className="bg-white shadow-sm sticky top-0 z-20">
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

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Banners Carousel */}
                {banners.length > 0 && (
                    <div className="w-full overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory flex gap-4">
                        {banners.map(banner => (
                            <div key={banner.id} className="snap-center shrink-0 w-[85vw] md:w-[400px] aspect-video rounded-xl overflow-hidden shadow-md relative">
                                <img
                                    src={banner.image_url}
                                    alt={banner.title || 'Offer'}
                                    className="w-full h-full object-cover"
                                />
                                {banner.title && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                                        <h3 className="text-white font-bold text-lg">{banner.title}</h3>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Smart Menu Controls */}
                <div className="space-y-4 sticky top-[72px] z-10 bg-gray-50 pt-2 pb-4 -mx-4 px-4 shadow-sm">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    <CategoryNav
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                    />
                </div>

                {/* Filtered Menu Grid */}
                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleItemClick(item)}>
                                <div className="aspect-video w-full overflow-hidden relative">
                                    <img
                                        src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                    />
                                    {!item.is_available && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-md uppercase tracking-wider">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{item.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-1">{item.description}</CardDescription>
                                        </div>
                                        <span className="font-bold text-lg bg-green-50 text-green-700 px-2 py-1 rounded-md">
                                            {format(item.price)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardFooter>
                                    <Button
                                        className="w-full font-bold"
                                        disabled={!item.is_available}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleItemClick(item);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No items found matching your search.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>Clear Filters</Button>
                    </div>
                )}
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

            <ItemModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                onAddToCart={handleAddToCart}
            />

            <UpsellModal
                isOpen={!!upsellItem}
                onClose={() => {
                    setUpsellItem(null);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }}
                onAdd={() => {
                    if (upsellItem) {
                        addToCart({ ...upsellItem, quantity: 1, status: 'pending' });
                        setUpsellItem(null);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                    }
                }}
                suggestedItem={upsellItem!}
                message={upsellMessage}
            />
        </div>
    );
}
