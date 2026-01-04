
"use client"

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminPage() {
    const params = useParams();
    const restaurantId = params.restaurantId as string;

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        if (!restaurantId) return;
        fetchRestaurant();
    }, [restaurantId]);

    const fetchRestaurant = async () => {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', restaurantId)
            .single();

        if (data) setRestaurant(data);
        setLoading(false);
    };

    const handleConnectStripe = async () => {
        setConnecting(true);
        try {
            const res = await fetch('/api/stripe/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error getting connect URL: " + data.error);
                setConnecting(false);
            }
        } catch (e) {
            console.error(e);
            alert("Connection failed");
            setConnecting(false);
        }
    };

    if (loading) return <div className="p-8">Loading Settings...</div>;

    const isStripeConnected = !!restaurant?.stripe_account_id;
    const isTseEnabled = !!restaurant?.tse_client_id;
    const isGerman = restaurant?.currency === 'EUR';

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Restaurant Administration</h1>
                    <p className="text-gray-500">Manage compliance, payments, and settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PAYMENTS CARD */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Stripe Payments (Connect)
                                {isStripeConnected ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="secondary">Setup Required</Badge>}
                            </CardTitle>
                            <CardDescription>
                                Connect your own Stripe account to receive payouts directly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isStripeConnected ? (
                                <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-green-900">Connected Successfully</p>
                                        <p className="text-sm text-green-700">
                                            Account ID: {restaurant.stripe_account_id}
                                        </p>
                                        <p className="text-sm text-green-700 mt-1">
                                            Funds from online orders will be automatically routed to this account.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800 mb-4">
                                        To receive payments instantly, you must link a valid bank account via Stripe.
                                    </p>
                                    <Button
                                        onClick={handleConnectStripe}
                                        disabled={connecting}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {connecting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Start Onboarding
                                    </Button>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        You will be redirected to Stripe to verify your identity.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* COMPLIANCE CARD */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Fiscal Compliance (TSE)
                                {isTseEnabled ? <Badge className="bg-green-600">Active</Badge> : (isGerman ? <Badge variant="destructive">Missing</Badge> : <Badge variant="outline">Optional</Badge>)}
                            </CardTitle>
                            <CardDescription>
                                {isGerman ? 'German KassenSichV requirements.' : 'Fiscalization settings.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isTseEnabled ? (
                                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium">TSS Initialized</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium">Client Registered</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 font-mono break-all">
                                        TSS ID: {restaurant.tse_tss_id}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {isGerman ? (
                                        <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-red-900">Compliance Required</p>
                                                <p className="text-sm text-red-800">
                                                    As a German business, you must have an active TSE.
                                                    <br />
                                                    <strong>It will be auto-created on your first transaction.</strong>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            Not required for your region ({restaurant.currency}).
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
