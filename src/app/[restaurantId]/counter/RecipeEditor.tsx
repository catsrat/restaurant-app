import React, { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save } from 'lucide-react';
import { MenuItem, Ingredient } from '@/types';

interface RecipeEditorProps {
    menuItem: MenuItem;
    isOpen: boolean;
    onClose: () => void;
}

export function RecipeEditor({ menuItem, isOpen, onClose }: RecipeEditorProps) {
    const { ingredients, recipes, updateRecipe, getRecipeForMenuItem } = useOrder();
    const [localIngredients, setLocalIngredients] = useState<{ ingredientId: string, quantity: number }[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            const currentRecipe = getRecipeForMenuItem(menuItem.id);
            setLocalIngredients(currentRecipe.map(r => ({ ingredientId: r.ingredient_id, quantity: r.quantity_required })));
        }
    }, [isOpen, menuItem.id, getRecipeForMenuItem]);

    const handleAddIngredient = () => {
        if (!selectedIngredientId || quantity <= 0) return;

        // Check if already exists
        if (localIngredients.some(i => i.ingredientId === selectedIngredientId)) {
            alert("Ingredient already added");
            return;
        }

        setLocalIngredients(prev => [...prev, { ingredientId: selectedIngredientId, quantity }]);
        setSelectedIngredientId('');
        setQuantity(0);
    };

    const handleRemoveIngredient = (id: string) => {
        setLocalIngredients(prev => prev.filter(i => i.ingredientId !== id));
    };

    const handleSave = async () => {
        await updateRecipe(menuItem.id, localIngredients);
        onClose();
    };

    const getIngredientName = (id: string) => {
        return ingredients.find(i => i.id === id)?.name || 'Unknown';
    };

    const getIngredientUnit = (id: string) => {
        return ingredients.find(i => i.id === id)?.unit || '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Recipe for {menuItem.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Ingredient</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedIngredientId}
                                onChange={(e) => setSelectedIngredientId(e.target.value)}
                            >
                                <option value="">Select Ingredient</option>
                                {ingredients.map(i => (
                                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24 space-y-2">
                            <Label>Qty</Label>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <Button onClick={handleAddIngredient} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ingredient</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {localIngredients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No ingredients linked.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    localIngredients.map((item) => (
                                        <TableRow key={item.ingredientId}>
                                            <TableCell>{getIngredientName(item.ingredientId)}</TableCell>
                                            <TableCell>{item.quantity} {getIngredientUnit(item.ingredientId)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-red-500"
                                                    onClick={() => handleRemoveIngredient(item.ingredientId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Recipe
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
