"use client"

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top fixed top-0 left-0 right-0 z-50">
            <WifiOff className="h-4 w-4" />
            <span>You are offline. Please check your internet connection.</span>
        </div>
    );
}
