"use client"

import { OrderProvider } from '@/context/OrderContext';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RestaurantLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const params = useParams();
    const restaurantId = params.restaurantId as string;
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
        const checkRestaurant = async () => {
            const { data, error } = await supabase
                .from('restaurants')
                .select('id')
                .eq('id', restaurantId)
                .single();

            if (data) {
                setIsValid(true);
            } else {
                setIsValid(false);
            }
        };

        checkRestaurant();
    }, [restaurantId]);

    if (isValid === null) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isValid === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Restaurant Not Found</h1>
                <p className="text-gray-600 mb-6">The restaurant ID "{restaurantId}" does not exist.</p>
                <a href="/" className="text-blue-600 hover:underline">Go back home</a>
            </div>
        );
    }

    return (
        <OrderProvider restaurantId={restaurantId}>
            {children}
        </OrderProvider>
    );
}
