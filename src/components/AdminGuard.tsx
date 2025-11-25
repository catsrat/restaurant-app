"use client"

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const ADMIN_PIN = "1234"; // Simple PIN for MVP

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const restaurantId = params.restaurantId as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    // Check session storage on mount to persist login during session
    useEffect(() => {
        if (!restaurantId) return;
        const auth = sessionStorage.getItem(`adminAuth_${restaurantId}`);
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, [restaurantId]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true);
            sessionStorage.setItem(`adminAuth_${restaurantId}`, 'true');
            setError(false);
        } else {
            setError(true);
            setPin("");
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Admin Access
                    </CardTitle>
                    <CardDescription>Please enter the PIN for {restaurantId}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className={error ? "border-red-500" : ""}
                            autoFocus
                        />
                        {error && <p className="text-sm text-red-500">Incorrect PIN</p>}
                        <Button type="submit" className="w-full">Unlock</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
