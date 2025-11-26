import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem, OrderItem } from '@/types';
import { Plus, Minus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useCurrency } from '@/hooks/useCurrency';

interface ItemModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (item: OrderItem) => void;
}

export function ItemModal({ item, isOpen, onClose, onAddToCart }: ItemModalProps) {
    const { format } = useCurrency();
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});

    if (!item) return null;

    const handleOptionChange = (optionName: string, value: string, type: 'radio' | 'checkbox', price: number) => {
        if (type === 'radio') {
            setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
        } else {
            // Checkbox logic (array of strings)
            setSelectedOptions(prev => {
                const current = (prev[optionName] as string[]) || [];
                if (current.includes(value)) {
                    return { ...prev, [optionName]: current.filter(v => v !== value) };
                } else {
                    return { ...prev, [optionName]: [...current, value] };
                }
            });
        }
    };

    const calculateTotal = () => {
        let total = item.price;
        // Add option prices
        if (item.options) {
            item.options.forEach(opt => {
                const selected = selectedOptions[opt.name];
                if (selected) {
                    if (Array.isArray(selected)) {
                        selected.forEach(val => {
                            const choice = opt.choices.find(c => c.name === val);
                            if (choice) total += choice.price;
                        });
                    } else {
                        const choice = opt.choices.find(c => c.name === selected);
                        if (choice) total += choice.price;
                    }
                }
            });
        }
        return total * quantity;
    };

    const handleAdd = () => {
        onAddToCart({
            id: item.id,
            name: item.name,
            price: calculateTotal() / quantity, // Unit price with options
            quantity,
            status: 'pending',
            notes: notes.trim() || undefined,
            selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
        });
        // Reset
        setQuantity(1);
        setNotes('');
        setSelectedOptions({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>{item.description}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Image */}
                    {item.image_url && (
                        <div className="w-full h-48 rounded-lg overflow-hidden">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Options */}
                    {item.options?.map((option) => (
                        <div key={option.name} className="space-y-3">
                            <Label className="text-base font-semibold">{option.name}</Label>
                            {option.type === 'radio' ? (
                                <RadioGroup
                                    onValueChange={(val) => {
                                        const choice = option.choices.find(c => c.name === val);
                                        handleOptionChange(option.name, val, 'radio', choice?.price || 0);
                                    }}
                                >
                                    {option.choices.map((choice) => (
                                        <div key={choice.name} className="flex items-center justify-between space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={choice.name} id={`${option.name}-${choice.name}`} />
                                                <Label htmlFor={`${option.name}-${choice.name}`}>{choice.name}</Label>
                                            </div>
                                            {choice.price > 0 && <span className="text-sm text-gray-500">+{format(choice.price)}</span>}
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="space-y-2">
                                    {option.choices.map((choice) => (
                                        <div key={choice.name} className="flex items-center justify-between space-x-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`${option.name}-${choice.name}`}
                                                    onCheckedChange={() => handleOptionChange(option.name, choice.name, 'checkbox', choice.price)}
                                                />
                                                <Label htmlFor={`${option.name}-${choice.name}`}>{choice.name}</Label>
                                            </div>
                                            {choice.price > 0 && <span className="text-sm text-gray-500">+{format(choice.price)}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-base font-semibold">Special Instructions</Label>
                        <Textarea
                            id="notes"
                            placeholder="e.g. No onions, extra spicy..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <span className="font-semibold">Quantity</span>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-bold w-4 text-center">{quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleAdd} className="w-full text-lg py-6 font-bold">
                        Add to Cart - {format(calculateTotal())}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
