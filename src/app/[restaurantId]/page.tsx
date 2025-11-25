"use client"

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Utensils, ArrowRight } from 'lucide-react';

export default function RestaurantHomePage() {
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.restaurantId as string;
    const [tableNumber, setTableNumber] = useState('');

    // Get restaurant name from localStorage
    const restaurantData = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('restaurant_data') || '{}')
        : {};
    const restaurantName = restaurantData[restaurantId]?.name || `Restaurant ${restaurantId}`;

    const handleContinue = () => {
        if (!tableNumber) return;
        router.push(`/${restaurantId}/menu/${tableNumber}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <div className="bg-orange-600 p-4 rounded-full">
                        <Utensils className="h-12 w-12 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurantName}</h1>
                <p className="text-gray-600">Welcome! Please enter your table number to view the menu.</p>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Table Selection</CardTitle>
                    <CardDescription>Enter the table number from your table card</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="text"
                        placeholder="e.g., 1, 2, VIP"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
                        autoFocus
                        className="text-lg text-center"
                    />
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleContinue}
                        disabled={!tableNumber}
                    >
                        View Menu <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardContent>
            </Card>

            <p className="mt-8 text-sm text-gray-500">
                Restaurant ID: {restaurantId}
            </p>
        </div>
    );
}
