"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, ChefHat, ArrowRight } from 'lucide-react';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('CZK');
  const [existingId, setExistingId] = useState('');

  const handleCreate = async () => {
    if (!restaurantName) return;

    const { data, error } = await supabase
      .from('restaurants')
      .insert({ name: restaurantName, currency })
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      return;
    }

    if (data) {
      router.push(`/${data.id}/counter`);
    }
  };

  const handleVisit = () => {
    if (!existingId) return;
    router.push(`/${existingId}/menu/Table1`); // Default to Table 1 for demo
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-4 rounded-full">
            <Utensils className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Restaurant OS</h1>
        <p className="text-xl text-gray-600">The complete operating system for your restaurant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-blue-600" />
              Create New Restaurant
            </CardTitle>
            <CardDescription>Start managing your restaurant today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input
                placeholder="Restaurant Name (e.g. Joe's Pizza)"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>
                    {curr.symbol} - {curr.name} ({code})
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!restaurantName}>
              Create & Start <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-6 w-6 text-green-600" />
              Visit Existing
            </CardTitle>
            <CardDescription>Go to your restaurant dashboard or menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Restaurant ID"
                value={existingId}
                onChange={(e) => setExistingId(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => router.push(`/${existingId}/counter`)} disabled={!existingId}>
                  Admin
                </Button>
                <Button variant="outline" onClick={() => router.push(`/${existingId}/kitchen`)} disabled={!existingId}>
                  Kitchen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
