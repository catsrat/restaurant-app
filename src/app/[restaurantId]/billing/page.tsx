"use client"

import React from 'react';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
    const { subscriptionStatus, subscriptionEndDate, isLoading } = useOrder();
    const { signOut } = useAuth();
    const router = useRouter();

    const handleSubscribe = () => {
        // TODO: Replace this with your actual Stripe Payment Link
        // You can get this from your Stripe Dashboard -> Payment Links
        const STRIPE_LINK = '';

        if (STRIPE_LINK) {
            window.location.href = STRIPE_LINK;
        } else {
            alert("Payment Integration Required: You need to add your Stripe Payment Link in src/app/[restaurantId]/billing/page.tsx");
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const isTrialExpired = subscriptionStatus === 'trialing' && subscriptionEndDate && new Date(subscriptionEndDate) < new Date();
    const isInactive = subscriptionStatus === 'inactive' || subscriptionStatus === 'past_due';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                        <Lock className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl">Subscription Required</CardTitle>
                    <CardDescription>
                        {isTrialExpired
                            ? "Your 14-day free trial has expired."
                            : "You need an active subscription to access the dashboard."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-left">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">Status</span>
                            <span className="font-medium capitalize text-red-600">{subscriptionStatus}</span>
                        </div>
                        {subscriptionEndDate && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Expires on</span>
                                <span className="font-medium">{new Date(subscriptionEndDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">
                        Upgrade to the Pro plan to continue managing your restaurant, orders, and menu.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button onClick={handleSubscribe} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscribe Now
                    </Button>
                    <Button variant="ghost" onClick={handleLogout} className="w-full text-gray-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
