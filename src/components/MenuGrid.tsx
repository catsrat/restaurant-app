import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { MenuItem } from '@/types';

interface MenuGridProps {
    menuItems: MenuItem[];
    onAddToCart: (item: MenuItem) => void;
}

export function MenuGrid({ menuItems, onAddToCart }: MenuGridProps) {
    const { format } = useCurrency();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video w-full relative">
                        <img
                            src={item.image_url || item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-gray-900 font-bold">{item.name}</CardTitle>
                            <span className="font-bold text-gray-900">{format(item.price)}</span>
                        </div>
                        <CardDescription className="text-gray-600 font-medium">{item.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            className="w-full bg-gray-900 text-white font-bold hover:bg-gray-800"
                            onClick={() => onAddToCart(item)}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add to Order
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
