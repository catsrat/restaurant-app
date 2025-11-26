"use client"

import React, { useState, useMemo } from 'react';


// Landing page component — visual fixes and dynamic mockup currency conversion
// - Hero mockup prices now follow the selected currency instead of hardcoded CZK
// - Adds a helper convertFromCZK to convert example item prices into the chosen currency
// - Keeps overall website layout and booking form

export default function LandingPricing() {
    const baseMonthlyINR = 2999;
    const baseYearlyINR = 30000;
    // rates are defined as: 1 INR = rates[target]
    const [rates, setRates] = useState<{ [key: string]: number }>({ INR: 1, CZK: 0.31, USD: 0.012, EUR: 0.011, GBP: 0.009 });
    const [ratesLoading, setRatesLoading] = useState(false);
    const [ratesError, setRatesError] = useState<string | null>(null);

    // Fetch live exchange rates from exchangerate.host with INR as base
    // We fetch CZK, USD, EUR, GBP. If the fetch fails, we silently keep fallback static rates.
    React.useEffect(() => {
        let mounted = true;
        async function fetchRates() {
            setRatesLoading(true);
            setRatesError(null);
            try {
                const res = await fetch('https://api.exchangerate.host/latest?base=INR&symbols=CZK,USD,EUR,GBP,INR');
                if (!res.ok) throw new Error('Failed to fetch rates');
                const data = await res.json();
                if (mounted && data && data.rates) {
                    // Ensure INR rate exists
                    const newRates = {
                        INR: 1,
                        CZK: data.rates.CZK || rates.CZK,
                        USD: data.rates.USD || rates.USD,
                        EUR: data.rates.EUR || rates.EUR,
                        GBP: data.rates.GBP || rates.GBP
                    };
                    setRates(newRates);
                }
            } catch (err) {
                console.error('Exchange rates fetch error', err);
                if (mounted) setRatesError('Could not load live exchange rates — using fallback rates');
            } finally {
                if (mounted) setRatesLoading(false);
            }
        }
        fetchRates();
        // refresh every 30 minutes
        const id = setInterval(fetchRates, 1000 * 60 * 30);
        return () => { mounted = false; clearInterval(id); };
    }, []);


    const [currency, setCurrency] = useState('INR');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string, text: string } | null>(null);
    const [showModal, setShowModal] = useState(false);

    const currencySymbol = ({ INR: '₹', CZK: 'Kč', USD: '$', EUR: '€', GBP: '£' } as any)[currency] || '';
    const convertedPrice = useMemo(() => {
        const rate = rates[currency] || 1;
        const priceINR = billingCycle === 'monthly' ? baseMonthlyINR : baseYearlyINR;
        return Math.round(priceINR * rate).toLocaleString();
    }, [currency, billingCycle, rates]);

    // Helper: convert an amount expressed in CZK into the currently selected currency.
    // We store rates as relative to INR, so to convert CZK -> target:
    // amount_in_INR = amountCZK / rates['CZK']
    // amount_in_target = amount_in_INR * rates[target]
    function convertFromCZK(amountCZK: number) {
        const rateCZK = rates['CZK'] || 1;
        const amountINR = amountCZK / rateCZK; // convert CZK -> INR
        const targetRate = rates[currency] || 1; // 1 INR -> target
        const converted = amountINR * targetRate;
        // for display, round appropriately
        if (currency === 'INR') return Math.round(converted).toLocaleString();
        if (currency === 'CZK') return Math.round(converted).toLocaleString();
        // for USD/EUR show 2 decimals
        return converted.toFixed(2);
    }

    async function handleBook(e: React.FormEvent) {
        e.preventDefault();
        if (!companyName || !contactEmail) {
            setMessage({ type: 'error', text: 'Please enter company name and contact email.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const payload = { companyName, contactEmail, phone, currency, billingCycle, notes };
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
        <div className="font-sans text-gray-800">
            {/* NAV */}
            <nav className="max-w-6xl mx-auto flex items-center justify-between py-6 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">QR</div>
                    <div>
                        <div className="text-lg font-bold">QRMenu</div>
                        <div className="text-xs text-gray-500">Digital menus & ordering</div>
                    </div>
                </div>

                {/* Navigation links now have proper anchors and smooth-scroll behavior */}
                <div className="flex items-center gap-4">
                    <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-gray-600 hover:text-indigo-600">Features</a>
                    <a href="#book" onClick={(e) => { e.preventDefault(); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-gray-600 hover:text-indigo-600">Pricing</a>


                    {/* Currency select: z-index & aria-label for accessibility */}
                    <div className="relative">
                        <select aria-label="Select currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white relative z-20">
                            <option value="INR">INR</option>
                            <option value="CZK">CZK</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <header className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-20">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">Digital menus, faster orders — built for restaurants</h1>
                        <p className="mt-4 text-lg opacity-90">QRMenu gives you QR menus, table ordering, and a real-time kitchen display — all in one simple plan. Onboard in 30 minutes.</p>

                        <div className="mt-8 flex gap-4">
                            <a href="#book" className="bg-white text-indigo-600 px-5 py-3 rounded-lg font-semibold shadow">Start free trial</a>
                            <a href="#features" className="px-5 py-3 rounded-lg border border-white/30">See features</a>
                        </div>

                        <div className="mt-6 text-sm bg-white/10 inline-block rounded px-3 py-2">Monthly: <span className="font-bold">{currencySymbol}{convertedPrice}</span> / {billingCycle === 'monthly' ? 'month' : 'year'}</div>

                        <div className="mt-6 text-xs text-white/80">14-day free trial • No credit card required to start</div>
                    </div>

                    <div className="hidden lg:block">
                        {/* Hero mockup — now uses dynamic conversion so prices match selector */}
                        <div className="bg-white rounded-2xl p-6 shadow-2xl">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-medium text-gray-800">Cafe Praga</div>
                                    <div className="text-xs text-gray-500">Table 5</div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between"><div className="text-gray-800">Margherita Pizza</div><div className="font-semibold text-indigo-700">{currencySymbol}{convertFromCZK(179)}</div></div>
                                    <div className="flex items-center justify-between"><div className="text-gray-800">Caesar Salad</div><div className="font-semibold text-indigo-700">{currencySymbol}{convertFromCZK(129)}</div></div>
                                </div>
                                <div className="mt-4 text-right"><button className="px-4 py-2 bg-indigo-600 text-white rounded">Place order</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center">Everything a restaurant needs</h2>
                <p className="text-center text-gray-600 mt-2 max-w-2xl mx-auto">A single plan with real-time orders, KDS, POS printing, analytics and multi-language support.</p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Realtime Orders" desc="Supabase Realtime & push to KDS" />
                    <Card title="QR Menu" desc="No app required — scan & order" />
                    <Card title="KDS" desc="Tablet-ready kitchen display with timers" />
                    <Card title="POS Printing" desc="80mm thermal receipt printing" />
                    <Card title="Analytics" desc="Daily revenue & popular items" />
                    <Card title="Multi-currency" desc="Set currency per restaurant" />
                </div>
            </section>

            {/* Pricing + Booking */}
            <section id="book" className="bg-gray-50 py-16">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1">
                        <h3 className="text-2xl font-bold">Simple pricing. One plan.</h3>
                        <p className="mt-3 text-gray-600">All features included. Monthly and yearly billing — cancel anytime.</p>

                        <div className="mt-6 p-6 bg-white rounded-lg shadow">
                            <div className="text-sm text-gray-500">Plan</div>
                            <div className="mt-2 text-3xl font-extrabold">{currencySymbol}{convertedPrice}</div>
                            <div className="text-sm text-gray-500 mt-1">/ {billingCycle === 'monthly' ? 'month' : 'year'}</div>

                            <div className="mt-4 flex gap-2">
                                <button onClick={() => setBillingCycle('monthly')} className={`px-3 py-2 rounded ${billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'border'}`}>Monthly</button>
                                <button onClick={() => setBillingCycle('yearly')} className={`px-3 py-2 rounded ${billingCycle === 'yearly' ? 'bg-indigo-600 text-white' : 'border'}`}>Yearly</button>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">Currency</div>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full border rounded px-3 py-2">
                                <option value="INR">INR</option>
                                <option value="CZK">CZK</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>

                            <div className="mt-6 text-sm text-gray-700">Includes: QR menus, ordering, KDS, printing, analytics, support.</div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h4 className="text-lg font-semibold mb-4">Book & Get Started</h4>

                            <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Restaurant / Company" value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} placeholder="Cafe Praga" />
                                <Input label="Contact email" type="email" value={contactEmail} onChange={(e: any) => setContactEmail(e.target.value)} placeholder="owner@restaurant.cz" />
                                <Input label="Phone (optional)" value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+420 123 456 789" />


                                <div className="md:col-span-2 flex items-center justify-between">
                                    <div className="text-sm">You will be charged <span className="font-semibold">{currencySymbol}{convertedPrice}</span> / {billingCycle === 'monthly' ? 'month' : 'year'}</div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded shadow">{loading ? 'Processing...' : 'Proceed to Payment'}</button>

                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    {message && (
                                        <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.text}</div>
                                    )}
                                </div>
                            </form>

                            <div className="mt-6 text-sm text-gray-500">By booking you agree to our <a className="underline">terms</a> and <a className="underline">privacy policy</a>.</div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded shadow">
                                <div className="font-semibold">Onboarding</div>
                                <div className="text-sm text-gray-600 mt-2">Free setup call & menu migration</div>
                            </div>
                            <div className="p-4 bg-white rounded shadow">
                                <div className="font-semibold">Support</div>
                                <div className="text-sm text-gray-600 mt-2">Email & chat support during trial</div>
                            </div>
                            <div className="p-4 bg-white rounded shadow">
                                <div className="font-semibold">Custom brand</div>
                                <div className="text-sm text-gray-600 mt-2">Add restaurant logo to menus & QR sheets</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-white border-t mt-10">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">© {new Date().getFullYear()} QRMenu. Vercel + Supabase</div>
                    <div className="flex items-center gap-4 text-sm">
                        <a className="text-gray-600">Privacy</a>
                        <a className="text-gray-600">Terms</a>
                        <a className="text-gray-600">Contact</a>
                    </div>
                </div>
            </footer>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-2xl w-full rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-2">Terms & Conditions</h4>
                        <p className="text-sm text-gray-700 mb-4">This is a demo T&C. Replace with your legal copy before going live. Payments handled by Stripe.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Card({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-6 bg-white rounded-lg shadow text-center">
            <div className="text-indigo-600 font-bold mb-2">✓</div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-600 mt-2">{desc}</div>
        </div>
    );
}

function Input({ label, type = 'text', value, onChange, placeholder }: { label: string, type?: string, value: string, onChange: any, placeholder: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full border rounded px-3 py-2 text-sm" />
        </div>
    );
}
