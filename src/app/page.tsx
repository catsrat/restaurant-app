"use client"

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { ChefHat, Smartphone, CreditCard, TrendingUp, Globe, Zap, Check, QrCode, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="bg-[#0B0C10] text-gray-300 min-h-screen font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0C10]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">QR</div>
                        <div className="text-white font-semibold tracking-tight">Order QR</div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-400 hover:text-white transition">Features</a>
                        <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</a>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500 transition cursor-pointer hover:bg-white/10"
                        >
                            <option value="INR">INR</option>
                            <option value="CZK">CZK</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-[#0B0C10] border-b border-white/10 overflow-hidden"
                        >
                            <div className="flex flex-col p-6 gap-4">
                                <a
                                    href="#features"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-gray-400 hover:text-white transition py-2"
                                >
                                    Features
                                </a>
                                <a
                                    href="#pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-gray-400 hover:text-white transition py-2"
                                >
                                    Pricing
                                </a>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero */}
            <section className="pt-32 lg:pt-48 px-6 overflow-hidden relative">
                {/* Animated Background Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none perspective-grid-container">
                    <div className="perspective-grid"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10 mb-12 lg:mb-20">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false }}
                        variants={fadeInUp}
                        className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Modern QR Ordering Platform
                    </motion.div>

                    <motion.h1
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false }}
                        variants={fadeInUp}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-8"
                    >
                        Restaurant ordering,
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400 bg-clip-text text-transparent bg-300% animate-gradient">
                            reimagined
                        </span>
                    </motion.h1>

                    <motion.p
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false }}
                        variants={fadeInUp}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        QR menus, real-time kitchen display, and seamless payments.
                        Everything you need to run a modern restaurant efficiently.
                    </motion.p>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false }}
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition transform hover:scale-105 active:scale-95">
                            Start free trial
                        </a>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 border border-white/10 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition backdrop-blur-sm">
                            See features
                        </a>
                    </motion.div>
                </div>

                {/* Linear-style 3D Hero Composition */}
                <div className="relative w-full max-w-[1400px] mx-auto h-[300px] sm:h-[500px] md:h-[600px] perspective-[2000px]">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[500px] bg-purple-500/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>

                    {/* Layer 1: Kitchen Display (Left, Back) */}
                    <motion.div
                        initial={{ opacity: 0, x: -100, rotateY: 15, rotateX: 5, z: -100 }}
                        whileInView={{ opacity: 0.6, x: 0, rotateY: 15, rotateX: 5, z: -100 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                        className="absolute top-10 md:top-20 left-[-5%] md:left-[5%] w-[60%] md:w-[50%] rounded-xl shadow-2xl border border-white/5 overflow-hidden z-0"
                    >
                        <Image src="/dashboard-kitchen.png" alt="Kitchen Display" width={1200} height={800} className="w-full h-auto" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] to-transparent opacity-80"></div>
                    </motion.div>

                    {/* Layer 2: Admin Dashboard (Center, Main) */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, rotateX: 10 }}
                        whileInView={{ opacity: 1, y: 0, rotateX: 10 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="absolute top-0 left-[15%] md:left-[20%] w-[70%] md:w-[60%] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-10 bg-[#0B0C10]"
                    >
                        <Image src="/dashboard-counter.png" alt="Admin Dashboard" width={1920} height={1080} className="w-full h-auto" />
                    </motion.div>

                    {/* Layer 3: Mobile Menu (Right, Front) */}
                    <motion.div
                        initial={{ opacity: 0, x: 100, rotateY: -15, rotateX: 5, z: 50 }}
                        whileInView={{ opacity: 1, x: 0, rotateY: -15, rotateX: 5, z: 50 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1.2, delay: 0.6 }}
                        className="absolute top-16 md:top-32 right-[2%] md:right-[15%] w-[30%] md:w-[20%] rounded-[1rem] md:rounded-[2rem] shadow-2xl border-[3px] md:border-[6px] border-[#1a1b20] overflow-hidden z-20 bg-black"
                    >
                        <Image src="/dashboard-menu.png" alt="Mobile Menu" width={375} height={812} className="w-full h-auto" />
                    </motion.div>

                    {/* Bottom Fade Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 md:h-40 bg-gradient-to-t from-[#0B0C10] to-transparent z-30"></div>
                </div>
            </section>

            {/* Features Bento Grid */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-10 lg:py-20 relative z-20 bg-[#0B0C10]">
                <div className="text-center mb-12 lg:mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        className="text-3xl md:text-5xl font-bold text-white mb-6"
                    >
                        Everything you need
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg md:text-xl"
                    >
                        One platform, infinite possibilities
                    </motion.p>
                </div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Large Card - Kitchen Display */}
                    <motion.div variants={fadeInUp} className="lg:col-span-2 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-3xl p-8 border border-white/10 hover:border-purple-500/30 transition group overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <ChefHat className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-medium text-green-400">Live Sync</span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Kitchen Display System</h3>
                            <p className="text-gray-400 mb-8 max-w-md">Real-time order sync with timers and status tracking. Keep your kitchen organized and efficient.</p>
                        </div>
                        <div className="relative mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-500">
                            <Image
                                src="/dashboard-kitchen.png"
                                alt="Kitchen Display"
                                width={800}
                                height={450}
                                className="w-full h-auto"
                            />
                            {/* Animated Overlay for "New Order" simulation */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: [0, 0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="absolute inset-0 bg-purple-500/10 pointer-events-none"
                            />
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                    </motion.div>

                    {/* Medium Card - QR Menu */}
                    <motion.div
                        variants={fadeInUp}
                        className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-3xl p-8 border border-white/10 hover:border-blue-500/30 transition group overflow-hidden relative"
                        whileHover="hover"
                    >
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Smartphone className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">QR Menu</h3>
                            <p className="text-gray-400 mb-8">Scan and order from any device. No app required.</p>
                        </div>

                        {/* Phone Mockup Container */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative mt-auto mx-auto w-56 h-[22rem] rounded-[2.5rem] border-[8px] border-[#121212] ring-1 ring-white/10 overflow-hidden shadow-2xl bg-black"
                        >
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#121212] rounded-b-[1rem] z-20"></div>

                            {/* Status Bar Time (Fake) */}
                            <div className="absolute top-2 left-6 text-[10px] font-medium text-white/80 z-20">9:41</div>
                            {/* Status Bar Icons (Fake) */}
                            <div className="absolute top-2 right-6 flex gap-1 z-20">
                                <div className="w-3 h-3 rounded-full border border-white/30"></div>
                                <div className="w-3 h-3 rounded-full bg-white/80"></div>
                            </div>

                            {/* Interactive Scrolling Content */}
                            <motion.div
                                variants={{
                                    hover: { y: -180 }
                                }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="w-full"
                            >
                                <Image
                                    src="/dashboard-menu.png"
                                    alt="Mobile Menu"
                                    width={300}
                                    height={600}
                                    className="w-full h-auto object-cover"
                                />
                            </motion.div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full z-20"></div>
                        </motion.div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full -ml-32 -mb-32 pointer-events-none"></div>
                    </motion.div>

                    {/* Small Card - Multi-currency */}
                    <motion.div variants={fadeInUp} className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-3xl p-8 border border-white/10 hover:border-green-500/30 transition group">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Globe className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Multi-currency</h3>
                        <p className="text-gray-400 mb-4">Support for global payments.</p>
                        <div className="flex gap-3 text-2xl font-mono text-gray-500 h-8 overflow-hidden">
                            <motion.div
                                animate={{ y: [0, -32, -64, -96, 0] }}
                                transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" }}
                                className="flex flex-col text-green-400"
                            >
                                <span>₹</span><span>$</span><span>€</span><span>Kč</span><span>₹</span>
                            </motion.div>
                            <motion.div
                                animate={{ y: [-32, -64, -96, 0, -32] }}
                                transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" }}
                                className="flex flex-col"
                            >
                                <span>$</span><span>€</span><span>Kč</span><span>₹</span><span>$</span>
                            </motion.div>
                            <motion.div
                                animate={{ y: [-64, -96, 0, -32, -64] }}
                                transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" }}
                                className="flex flex-col"
                            >
                                <span>€</span><span>Kč</span><span>₹</span><span>$</span><span>€</span>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Small Card - Stripe */}
                    <motion.div variants={fadeInUp} className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-3xl p-8 border border-white/10 hover:border-purple-500/30 transition group">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <CreditCard className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Stripe</h3>
                        <p className="text-gray-400 mb-4">Secure, instant payouts.</p>
                        <div className="flex items-center gap-2 text-sm text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full w-fit relative overflow-hidden">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse z-10"></div>
                            <span className="z-10">Connected</span>
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-purple-500/20 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Small Card - Analytics */}
                    <motion.div variants={fadeInUp} className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-3xl p-8 border border-white/10 hover:border-orange-500/30 transition group">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
                        <p className="text-gray-400 mb-4">Track revenue & growth.</p>
                        <div className="h-12 flex items-end gap-1">
                            {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: "0%" }}
                                    whileInView={{ height: `${h}%` }}
                                    viewport={{ once: false }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="flex-1 bg-orange-500/20 rounded-t-sm hover:bg-orange-500/40 transition-colors"
                                ></motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="max-w-7xl mx-auto px-6 py-32 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent blur-3xl -z-10"></div>
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-white mb-6"
                    >
                        Simple pricing
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg md:text-xl"
                    >
                        Start for free, upgrade when you grow
                    </motion.p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Pricing Card */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-purple-400 uppercase tracking-wider">Pro Plan</div>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500 transition cursor-pointer hover:bg-white/10"
                                    >
                                        <option value="INR">INR</option>
                                        <option value="CZK">CZK</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <div className="text-5xl md:text-6xl font-bold text-white">{currencySymbol}{convertedPrice}</div>
                                    <div className="text-xl text-gray-400">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                                </div>
                                <div className="text-gray-400 mb-8">Everything you need to run your restaurant.</div>

                                <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8 w-fit">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Yearly <span className="text-xs text-green-600 ml-1">-17%</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        'Unlimited QR Menus',
                                        'Real-time Kitchen Display',
                                        'POS & Receipt Printing',
                                        'Advanced Analytics',
                                        'Multi-currency Support',
                                        '24/7 Priority Support'
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-300">
                                            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-purple-400" />
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Booking Form */}
                            <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/5">
                                <h3 className="text-xl font-bold text-white mb-6">Create your account</h3>
                                <form onSubmit={handleBook} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Restaurant Name</label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g. Cafe Praga"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="name@restaurant.com"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black rounded-xl px-6 py-4 font-bold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {loading ? 'Processing...' : 'Start 14-day free trial'}
                                    </button>
                                    <p className="text-xs text-center text-gray-500 mt-4">
                                        By signing up, you agree to our Terms and Privacy Policy.
                                    </p>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-20 bg-[#0B0C10]">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">QR</div>
                        <span className="text-gray-400 text-sm">© {new Date().getFullYear()} Order QR</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                        <a href="/privacy" className="text-gray-500 hover:text-white transition">Privacy</a>
                        <a href="/terms" className="text-gray-500 hover:text-white transition">Terms</a>
                        <a href="mailto:support@orderqr.in" className="text-gray-500 hover:text-white transition">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
