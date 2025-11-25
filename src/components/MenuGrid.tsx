import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { MenuItem, MenuCategory } from '@/types';
import { cn } from '@/lib/utils';

interface MenuGridProps {
    menuItems: MenuItem[];
    categories: MenuCategory[];
    onAddToCart: (item: MenuItem) => void;
}

export function MenuGrid({ menuItems, categories, onAddToCart }: MenuGridProps) {
    const { format } = useCurrency();
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Group items by category
    const groupedItems = React.useMemo(() => {
        const grouped: Record<string, MenuItem[]> = {};

        // Initialize with known categories
        categories.forEach(cat => {
            grouped[cat.name] = [];
        });
        grouped['Other'] = [];

        menuItems.forEach(item => {
            const catName = item.category || 'Other';
            // If category exists in our list (case insensitive check could be added here)
            const matchedCat = categories.find(c => c.name === catName);
            const key = matchedCat ? matchedCat.name : 'Other';

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        return grouped;
    }, [menuItems, categories]);

    const scrollToCategory = (categoryName: string) => {
        setActiveCategory(categoryName);
        const element = document.getElementById(`category-${categoryName}`);
        if (element) {
            const headerOffset = 140; // Adjust for sticky headers
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Sticky Category Navigation */}
            {categories.length > 0 && (
                <div className="sticky top-[72px] z-10 bg-gray-50/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-200 overflow-x-auto no-scrollbar flex gap-2">
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.name ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap rounded-full"
                            onClick={() => scrollToCategory(cat.name)}
                        >
                            {cat.name}
                        </Button>
                    ))}
                    {groupedItems['Other']?.length > 0 && (
                        <Button
                            variant={activeCategory === 'Other' ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap rounded-full"
                            onClick={() => scrollToCategory('Other')}
                        >
                            Other
                        </Button>
                    )}
                </div>
            )}

            {/* Menu Sections */}
            {categories.map(cat => {
                const items = groupedItems[cat.name] || [];
                if (items.length === 0) return null;

                return (
                    <div key={cat.id} id={`category-${cat.name}`} className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{cat.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item) => (
                                <MenuItemCard key={item.id} item={item} format={format} onAddToCart={onAddToCart} />
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Other Items Section */}
            {groupedItems['Other']?.length > 0 && (
                <div id="category-Other" className="scroll-mt-32">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Other</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedItems['Other'].map((item) => (
                            <MenuItemCard key={item.id} item={item} format={format} onAddToCart={onAddToCart} />
                        ))}
                    </div>
                </div>
            )}

            {/* Fallback if no categories defined yet */}
            {categories.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <MenuItemCard key={item.id} item={item} format={format} onAddToCart={onAddToCart} />
                    ))}
                </div>
            )}
        </div>
    );
}

function MenuItemCard({ item, format, onAddToCart }: { item: MenuItem, format: (p: number) => string, onAddToCart: (i: MenuItem) => void }) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="aspect-video w-full relative bg-gray-100">
                <img
                    src={item.image_url || item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            <CardHeader className="flex-1">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg text-gray-900 font-bold leading-tight">{item.name}</CardTitle>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{format(item.price)}</span>
                </div>
                <CardDescription className="text-gray-600 font-medium line-clamp-2">{item.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
                <Button
                    className="w-full bg-gray-900 text-white font-bold hover:bg-gray-800"
                    onClick={() => onAddToCart(item)}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
            </CardFooter>
        </Card>
    );
}
