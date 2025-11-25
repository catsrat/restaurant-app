"use client"

import { useParams } from 'next/navigation';
import { CURRENCIES, formatPrice, type CurrencyCode } from '@/lib/currency';

export function useCurrency() {
    const params = useParams();
    const restaurantId = params.restaurantId as string;

    // Get restaurant currency from localStorage
    const getCurrency = (): CurrencyCode => {
        if (typeof window === 'undefined') return 'CZK';

        const restaurantData = JSON.parse(localStorage.getItem('restaurant_data') || '{}');
        return restaurantData[restaurantId]?.currency || 'CZK';
    };

    const currency = getCurrency();
    const currencyInfo = CURRENCIES[currency];

    const format = (amount: number) => formatPrice(amount, currency);

    return {
        currency,
        currencyInfo,
        format,
    };
}
