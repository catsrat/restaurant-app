"use client"

import React, { useState, useMemo } from 'react';
import { ChefHat, Smartphone, CreditCard, TrendingUp, Globe, Zap } from 'lucide-react';

export default function LandingPage() {
    const baseMonthlyINR = 2999;
    const baseYearlyINR = 30000;
    const [rates, setRates] = useState<{ [key: string]: number }>({ INR: 1, CZK: 0.31, USD: 0.012, EUR: 0.011, GBP: 0.009 });

    React.useEffect(() => {
        async function fetchRates() {
            try {
                const res = await fetch('https://api.exchangerate.host/latest?base=INR&symbols=CZK,USD,EUR,GBP,INR');
                if (!res.ok) return;
                const data = await res.json();
                if (data?.rates) {
                    setRates({
                        INR: 1,
                        CZK: data.rates.CZK || rates.CZK,
                        USD: data.rates.USD || rates.USD,
                        EUR: data.rates.EUR || rates.EUR,
                        GBP: data.rates.GBP || rates.GBP
                    });
                }
            } catch (err) {
                console.error('Exchange rates fetch error', err);
            }
        }
        fetchRates();
    }, []);

    const [currency, setCurrency] = useState('INR');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string, text: string } | null>(null);

    const currencySymbol = ({ INR: '₹', CZK: 'Kč', USD: '$', EUR: '€', GBP: '£' } as any)[currency] || '';
    const convertedPrice = useMemo(() => {
        const rate = rates[currency] || 1;
        const priceINR = billingCycle === 'monthly' ? baseMonthlyINR : baseYearlyINR;
        return Math.round(priceINR * rate).toLocaleString();
    }, [currency, billingCycle, rates]);

    async function handleBook(e: React.FormEvent) {
        e.preventDefault();
        if (!companyName || !contactEmail) {
            setMessage({ type: 'error', text: 'Please enter company name and contact email.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const payload = { companyName, contactEmail, currency, billingCycle };
            const res = await fetch('/api/book', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.checkoutUrl) return window.location.href = data.checkoutUrl;
            setMessage({ type: 'success', text: 'Booking recorded. We will contact you shortly.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Something went wrong — try again later.' });
        } finally { setLoading(false); }
    }

    return (
        <div className="bg-[#0B0C10] text-gray-300 min-h-screen">
            {/* Nav */}
            <nav className="max-w-7xl mx-auto flex items-center justify-between py-6 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">QR</div>
                    <div className="text-white font-semibold">Order QR</div>
                </div>
                <div className="flex items-center gap-6">
                    <a href="#features" className="text-sm hover:text-white transition">Features</a>
                    <a href="#pricing" className="text-sm hover:text-white transition">Pricing</a>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm"
                    >
                        <option value="INR">INR</option>
                        <option value="CZK">CZK</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-block mb-6 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm">
                        ✨ Modern QR Ordering Platform
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
                        Restaurant ordering,
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">reimagined</span>
                    </h1>
                    <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
                        QR menus, real-time kitchen display, and seamless payments. Everything you need to run a modern restaurant.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-4">
                        <a href="#pricing" className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition">
                            Start free trial
                        </a>
                        <a href="#features" className="px-6 py-3 border border-white/20 rounded-lg font-semibold hover:bg-white/5 transition">
                            See features
                        </a>
                    </div>
                    <div className="mt-6 text-sm text-gray-500">
                        14-day free trial • No credit card required
                    </div>
                </div>

                {/* Hero Mockup */}
                <div className="mt-20 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl"></div>
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 shadow-2xl transform perspective-1000 rotate-x-2">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="h-3 bg-white/10 rounded"></div>
                            <div className="h-3 bg-white/10 rounded"></div>
                            <div className="h-3 bg-white/10 rounded"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded"></div>
                                    <div>
                                        <div className="h-3 w-24 bg-white/20 rounded mb-2"></div>
                                        <div className="h-2 w-16 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-6 w-20 bg-green-500/20 rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded"></div>
                                    <div>
                                        <div className="h-3 w-24 bg-white/20 rounded mb-2"></div>
                                        <div className="h-2 w-16 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-6 w-20 bg-orange-500/20 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Bento Grid */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Everything you need</h2>
                    <p className="text-gray-400 text-lg">One platform, infinite possibilities</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Large Card - Kitchen Display */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition group">
                        <ChefHat className="w-10 h-10 text-purple-400 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Kitchen Display System</h3>
                        <p className="text-gray-400 mb-6">Real-time order sync with timers and status tracking</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="text-orange-400 font-mono text-sm mb-1">⏱ 12:34</div>
                                <div className="text-xs text-gray-500">Table 5 • Burger</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="text-green-400 font-mono text-sm mb-1">✓ Ready</div>
                                <div className="text-xs text-gray-500">Table 3 • Pizza</div>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card - QR Menu */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition">
                        <Smartphone className="w-10 h-10 text-blue-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">QR Menu</h3>
                        <p className="text-gray-400 mb-6">Scan and order from any device</p>
                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            <div className="h-3 bg-white/10 rounded w-3/4"></div>
                            <div className="h-3 bg-white/10 rounded w-1/2"></div>
                            <div className="h-8 bg-blue-500/20 rounded mt-4"></div>
                        </div>
                    </div>

                    {/* Small Card - Multi-currency */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 hover:border-green-500/50 transition">
                        <Globe className="w-10 h-10 text-green-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Multi-currency</h3>
                        <p className="text-gray-400">₹ • Kč • $ • €</p>
                    </div>

                    {/* Small Card - Stripe */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition">
                        <CreditCard className="w-10 h-10 text-purple-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Stripe</h3>
                        <p className="text-gray-400">Secure payments</p>
                    </div>

                    {/* Small Card - Analytics */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 hover:border-orange-500/50 transition">
                        <TrendingUp className="w-10 h-10 text-orange-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
                        <p className="text-gray-400">Revenue insights</p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Simple pricing</h2>
                    <p className="text-gray-400 text-lg">One plan, all features included</p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Pricing Card */}
                            <div>
                                <div className="text-sm text-gray-500 mb-2">Starting at</div>
                                <div className="text-5xl font-bold text-white mb-2">{currencySymbol}{convertedPrice}</div>
                                <div className="text-gray-400 mb-6">/ {billingCycle === 'monthly' ? 'month' : 'year'}</div>

                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-4 py-2 rounded-lg transition ${billingCycle === 'monthly' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-4 py-2 rounded-lg transition ${billingCycle === 'yearly' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        Yearly
                                    </button>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> QR Menus & Ordering</div>
                                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> Kitchen Display System</div>
                                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> POS Printing</div>
                                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> Analytics Dashboard</div>
                                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> Multi-currency Support</div>
                                </div>
                            </div>

                            {/* Booking Form */}
                            <div>
                                <form onSubmit={handleBook} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Restaurant Name</label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Cafe Praga"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="owner@restaurant.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black rounded-lg px-6 py-3 font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Start free trial'}
                                    </button>
                                    {message && (
                                        <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                            {message.text}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-20">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-500">© {new Date().getFullYear()} Order QR</div>
                    <div className="flex items-center gap-6 text-sm">
                        <a href="/privacy" className="text-gray-400 hover:text-white transition">Privacy</a>
                        <a href="/terms" className="text-gray-400 hover:text-white transition">Terms</a>
                        <a href="mailto:support@orderqr.in" className="text-gray-400 hover:text-white transition">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
