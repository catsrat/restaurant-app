"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, ChefHat, ArrowRight } from 'lucide-react';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('CZK');
  const [existingId, setExistingId] = useState('');

  const [userRestaurantId, setUserRestaurantId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRestaurant() {
      if (user) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, subscription_status')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching restaurant:", error);
          return;
        }

        if (data) {
          setUserRestaurantId(String(data.id));
          setExistingId(String(data.id));
          setSubscriptionStatus(data.subscription_status);
        }
      }
    }
    fetchUserRestaurant();
  }, [user]);

  const handleCreate = async () => {
    if (!restaurantName) return;

    // If not logged in, redirect to login first? 
    // Or allow public creation? 
    // With RLS, we need to be logged in.
    if (!user) {
      router.push('/login?redirect=create');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: restaurantName,
          currency,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating restaurant:', error);
        alert(`Error creating restaurant: ${error.message}`);
        return;
      }

      if (data) {
        router.push(`/${data.id}/counter`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert(`Unexpected error: ${err.message || err}`);
    }
  };

  const handleVisit = () => {
    if (!existingId) return;
    router.push(`/${existingId}/menu/Table1`); // Default to Table 1 for demo
  };


  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const success = searchParams?.get('success');

  useEffect(() => {
    if (success) {
      alert("Payment Successful! You can now create your restaurant.");
      // Ideally use a toast or nicer UI, but alert is fine for now.
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Payment Successful! </strong>
          <span className="block sm:inline">Thank you for subscribing. Please create your restaurant below.</span>
        </div>
      )}
      <div className="text-center mb-12 relative w-full max-w-4xl">

        <div className="absolute top-0 right-0">
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : user ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Hi, {user.email}</span>
                {/* We could add a logout button here, but let's keep it simple */}
              </div>
              {userRestaurantId && (
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-mono">
                  Your Restaurant ID: <strong>{userRestaurantId}</strong>
                </div>
              )}
            </div>
          ) : (
            <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
          )}
        </div>
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-4 rounded-full">
            <Utensils className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Restaurant OS</h1>
        <p className="text-xl text-gray-600">The complete operating system for your restaurant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow border-blue-100">
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
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={!restaurantName}>
              {user ? 'Create & Start' : 'Login to Create'} <ArrowRight className="ml-2 h-4 w-4" />
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
              {userRestaurantId && (
                <p className="text-xs text-gray-500">
                  Found your restaurant: <span className="font-mono font-bold text-blue-600">{userRestaurantId}</span>
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${existingId}/counter`)}
                  disabled={!existingId || subscriptionStatus !== 'active'}
                  className={subscriptionStatus !== 'active' && existingId ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {subscriptionStatus === 'active' ? 'Admin' : 'Subscribe First'}
                </Button>
                <Button variant="outline" onClick={() => router.push(`/${existingId}/kitchen`)} disabled={!existingId}>
                  Kitchen
                </Button>
              </div>
              {existingId && subscriptionStatus !== 'active' && (
                <p className="text-xs text-red-500 mt-2">
                  Subscription inactive. Please subscribe to access Admin Dashboard.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
