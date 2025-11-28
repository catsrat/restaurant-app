"use client"

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/context/OrderContext';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { subscriptionStatus, subscriptionEndDate, isLoading } = useOrder();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const checkSubscription = () => {
            // 1. If active, allow
            if (subscriptionStatus === 'active') return;

            // 2. If trialing, check date
            if (subscriptionStatus === 'trialing') {
                if (subscriptionEndDate && new Date(subscriptionEndDate) > new Date()) {
                    return; // Trial is still valid
                }
            }

            // 3. Otherwise (inactive, past_due, or expired trial), redirect
            router.push('/billing');
        };

        checkSubscription();
    }, [subscriptionStatus, subscriptionEndDate, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Double check render logic to avoid flash of content
    const isTrialValid = subscriptionStatus === 'trialing' && subscriptionEndDate && new Date(subscriptionEndDate) > new Date();
    const isActive = subscriptionStatus === 'active';

    if (!isActive && !isTrialValid) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
