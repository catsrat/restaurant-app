"use client"

import { useOrder } from '@/context/OrderContext';
import { CURRENCIES, formatPrice } from '@/lib/currency';

export function useCurrency() {
    const { currency } = useOrder();
    const currencyInfo = CURRENCIES[currency];

    const format = (amount: number) => formatPrice(amount, currency);

    return {
        currency,
        currencyInfo,
        format,
    };
}
