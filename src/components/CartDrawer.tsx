import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { OrderItem } from '@/types';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: OrderItem[];
    onRemove: (id: string) => void;
    onAdd: (item: OrderItem) => void;
    onPlaceOrder: () => void;
    totalAmount: number;
    children?: React.ReactNode; // For extra inputs like Table Selection in POS
}

export function CartContent({ onClose, cart, onRemove, onAdd, onPlaceOrder, totalAmount, children }: Omit<CartDrawerProps, 'isOpen'>) {
    const { format } = useCurrency();

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
                {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-gray-900">Close</Button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 font-medium">
                        Your cart is empty.
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                            <div>
                                <h3 className="font-bold text-gray-900">{item.name}</h3>
                                <p className="text-sm text-gray-600 font-medium">{format(item.price)} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-gray-900 border-gray-300"
                                    onClick={() => onRemove(item.id)}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-4 text-center font-bold text-gray-900">{item.quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-gray-900 border-gray-300"
                                    onClick={() => onAdd(item)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t bg-gray-50 space-y-4">
                {children}

                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{format(totalAmount)}</span>
                </div>
                <Button
                    className="w-full bg-gray-900 text-white font-bold text-lg py-6 hover:bg-gray-800"
                    size="lg"
                    disabled={cart.length === 0}
                    onClick={onPlaceOrder}
                >
                    Place Order
                </Button>
            </div>
        </div>
    );
}

export function CartDrawer({ isOpen, onClose, cart, onRemove, onAdd, onPlaceOrder, totalAmount, children }: CartDrawerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right">
                <CartContent
                    onClose={onClose}
                    cart={cart}
                    onRemove={onRemove}
                    onAdd={onAdd}
                    onPlaceOrder={onPlaceOrder}
                    totalAmount={totalAmount}
                >
                    {children}
                </CartContent>
            </div>
        </div>
    );
}
