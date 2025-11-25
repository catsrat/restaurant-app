// Currency configuration
export const CURRENCIES = {
    CZK: { symbol: 'Kč', name: 'Czech Koruna', code: 'CZK' },
    USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
    GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
    EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
    INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatPrice(amount: number, currencyCode: CurrencyCode = 'CZK'): string {
    const currency = CURRENCIES[currencyCode];
    // For CZK and INR, symbol goes after the number
    if (currencyCode === 'CZK' || currencyCode === 'INR') {
        return `${amount.toFixed(2)} ${currency.symbol}`;
    }
    // For USD, GBP, EUR, symbol goes before
    return `${currency.symbol}${amount.toFixed(2)}`;
}
