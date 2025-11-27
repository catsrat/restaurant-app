import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrder } from '@/context/OrderContext';
import { Save } from 'lucide-react';

export function SettingsTab() {
    const { taxSettings, updateTaxSettings } = useOrder();
    const [formData, setFormData] = useState(taxSettings);
    const [isSaving, setIsSaving] = useState(false);

    // Sync with context when it loads
    useEffect(() => {
        setFormData(taxSettings);
    }, [taxSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateTaxSettings({
            tax_name: formData.tax_name,
            tax_rate: Number(formData.tax_rate),
            tax_number: formData.tax_number
        });
        setIsSaving(false);
        alert("Settings saved successfully!");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tax Configuration</CardTitle>
                    <CardDescription>
                        Configure how taxes are calculated and displayed on your bills.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax_name">Tax Name</Label>
                            <Input
                                id="tax_name"
                                placeholder="e.g. GST, VAT, Sales Tax"
                                value={formData.tax_name}
                                onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                            />
                            Tip: Set to "GST" for automatic CGST/SGST breakdown on bills (INR only).
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                            <Input
                                id="tax_rate"
                                type="number"
                                placeholder="e.g. 5, 18"
                                value={formData.tax_rate}
                                onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax_number">Tax ID / GSTIN (Optional)</Label>
                        <Input
                            id="tax_number"
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            value={formData.tax_number || ''}
                            onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                        />
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
