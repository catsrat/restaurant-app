import React from 'react';
import { Order, OrderItem } from '@/types';

interface ReceiptProps {
    restaurantName: string;
    tableName: string;
    orders: Order[];
    totalAmount: number;
    currencyFormatter: (value: number) => string;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ restaurantName, tableName, orders, totalAmount, currencyFormatter }, ref) => {
    // Aggregate items from all orders
    const allItems: { name: string; quantity: number; price: number }[] = [];
    orders.forEach(order => {
        order.items.forEach(item => {
            const existingItem = allItems.find(i => i.name === item.name);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                allItems.push({ name: item.name, quantity: item.quantity, price: item.price });
            }
        });
    });

    return (
        <div ref={ref} className="hidden print:block p-4 bg-white text-black font-mono text-sm w-[80mm] mx-auto">
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold uppercase">{restaurantName}</h1>
                <p className="text-xs mt-1">{new Date().toLocaleString()}</p>
            </div>

            <div className="border-b border-black pb-2 mb-2">
                <p className="font-bold text-lg">{tableName}</p>
            </div>

            <div className="space-y-2 mb-4">
                {allItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{currencyFormatter(item.price * item.quantity)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-black pt-2 mb-4">
                <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL</span>
                    <span>{currencyFormatter(totalAmount)}</span>
                </div>
            </div>

            <div className="text-center text-xs mt-8">
                <p>Thank you for dining with us!</p>
                <p>Please visit again.</p>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
