import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem } from '@/types';
import { Plus, X } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void;
    suggestedItem: MenuItem;
    message: string;
}

export function UpsellModal({ isOpen, onClose, onAdd, suggestedItem, message }: UpsellModalProps) {
    const { format } = useCurrency();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">✨ Special Offer!</DialogTitle>
                    <DialogDescription className="text-center text-lg text-gray-700 mt-2">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-full aspect-video rounded-lg overflow-hidden relative shadow-md">
                        <img
                            src={suggestedItem.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                            alt={suggestedItem.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                            <span className="text-white font-bold text-xl">{suggestedItem.name}</span>
                        </div>
                    </div>

                    <div className="text-2xl font-bold text-green-600">
                        Only {format(suggestedItem.price)}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        No, thanks
                    </Button>
                    <Button onClick={onAdd} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold animate-pulse">
                        <Plus className="h-4 w-4 mr-2" /> Add to Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
