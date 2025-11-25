"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CURRENCIES, formatPrice, type CurrencyCode } from '@/lib/currency';

export function useCurrency() {
    const params = useParams();
    const restaurantId = params.restaurantId as string;
    const [currency, setCurrency] = useState<CurrencyCode>('CZK');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const restaurantData = JSON.parse(localStorage.getItem('restaurant_data') || '{}');
            const storedCurrency = restaurantData[restaurantId]?.currency;
            if (storedCurrency) {
                setCurrency(storedCurrency);
            }
        }
    }, [restaurantId]);

    const currencyInfo = CURRENCIES[currency];

    const format = (amount: number) => formatPrice(amount, currency);

    return {
        currency,
        currencyInfo,
        format,
    };
}
