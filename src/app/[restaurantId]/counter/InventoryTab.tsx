import React, { useState } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Ingredient } from '@/types';

export function InventoryTab() {
    const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useOrder();
    const [isAdding, setIsAdding] = useState(false);
    const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'kg', stock: 0, threshold: 5 });

    const handleAdd = async () => {
        if (!newIngredient.name) return;
        await addIngredient(newIngredient.name, newIngredient.unit, newIngredient.stock, newIngredient.threshold);
        setNewIngredient({ name: '', unit: 'kg', stock: 0, threshold: 5 });
        setIsAdding(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
                    <p className="text-muted-foreground">Track stock levels and manage ingredients.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                </Button>
            </div>

            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Ingredient</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Name</Label>
                                <Input
                                    placeholder="e.g. Tomato"
                                    value={newIngredient.name}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newIngredient.unit}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="l">l</option>
                                    <option value="ml">ml</option>
                                    <option value="pcs">pcs</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Initial Stock</Label>
                                <Input
                                    type="number"
                                    value={newIngredient.stock}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, stock: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Low Stock Alert</Label>
                                <Input
                                    type="number"
                                    value={newIngredient.threshold}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, threshold: Number(e.target.value) })}
                                />
                            </div>
                            <Button onClick={handleAdd}>Save</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ingredients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No ingredients added yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                ingredients.map((ingredient) => (
                                    <TableRow key={ingredient.id}>
                                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => updateIngredient(ingredient.id, { current_stock: Math.max(0, ingredient.current_stock - 1) })}
                                                >
                                                    -
                                                </Button>
                                                <span className="w-12 text-center">{ingredient.current_stock}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => updateIngredient(ingredient.id, { current_stock: ingredient.current_stock + 1 })}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{ingredient.unit}</TableCell>
                                        <TableCell>
                                            {ingredient.current_stock <= ingredient.low_stock_threshold ? (
                                                <span className="flex items-center text-red-500 text-sm font-medium">
                                                    <AlertTriangle className="h-4 w-4 mr-1" /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-green-600 text-sm font-medium">
                                                    <Package className="h-4 w-4 mr-1" /> Good
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => deleteIngredient(ingredient.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
