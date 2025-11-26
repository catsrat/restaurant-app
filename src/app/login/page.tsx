"use client"

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Redirect will be handled by AuthContext or manual push
                // We need to know where to go. For now, pick a default.
                // Ideally, we check if they have a restaurantId associated, 
                // but for this MVP, let's just go to the first restaurant or a dashboard.
                // Since we don't have a global dashboard, let's just go to a placeholder or ask them.
                // Wait, the previous AdminGuard used params.restaurantId.
                // We might need a "Select Restaurant" page if we have multiple.
                // For now, let's assume single tenant or just redirect to a known one if possible.
                // Actually, let's just redirect to root and let them navigate, or maybe '/admin' if we had one.
                // Let's check if we can find a restaurant.

                // Fetch the first restaurant
                const { data: restaurants } = await supabase.from('restaurants').select('id').limit(1);
                if (restaurants && restaurants.length > 0) {
                    router.push(`/${restaurants[0].id}/counter`);
                } else {
                    // Create one? Or just stay here?
                    router.push('/');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Lock className="h-6 w-6 text-primary" />
                        {mode === 'login' ? 'Admin Login' : 'Create Account'}
                    </CardTitle>
                    <CardDescription>
                        {mode === 'login'
                            ? 'Enter your credentials to access the dashboard'
                            : 'Sign up for a new restaurant account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@restaurant.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                        </Button>

                        <div className="text-center text-sm text-gray-500">
                            {mode === 'login' ? (
                                <>
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('signup')}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('login')}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Sign in
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
