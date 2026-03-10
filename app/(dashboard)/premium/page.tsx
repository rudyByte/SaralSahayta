import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { PricingPlans } from '@/components/premium/PricingPlans';
import {
    ShieldCheck,
    CheckCircle2,
    Clock,
    Star,
    Zap,
    MessageCircle,
    BellRing,
    FileCheck2,
    Crown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const BENEFITS = [
    {
        icon: Zap,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        title: 'Priority Queue',
        desc: 'Your applications jump straight to the top of the admin review queue, skipping standard wait times.',
    },
    {
        icon: Clock,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        title: '24–48 Hr Guarantee',
        desc: 'Premium and Fast-Track applications are processed and reviewed within one to two business days.',
    },
    {
        icon: FileCheck2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        title: 'Expert Doc Review',
        desc: 'Our team checks your uploaded documents before final submission to minimize rejection risk.',
    },
    {
        icon: MessageCircle,
        color: 'text-violet-500',
        bg: 'bg-violet-50',
        title: 'WhatsApp Support',
        desc: 'Reach a dedicated support agent via WhatsApp or call for real-time help with applications.',
    },
    {
        icon: BellRing,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        title: 'Real-Time Alerts',
        desc: 'Instant SMS and email notifications whenever your application status changes.',
    },
    {
        icon: Star,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        title: 'Unlimited Schemes',
        desc: 'Apply for unlimited government schemes without any per-scheme charges under the monthly plan.',
    },
];

export default async function PremiumPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_premium, premium_expires_at, full_name')
        .eq('user_id', user.id)
        .single();

    const isPremium = profile?.is_premium;
    const expiryDate = profile?.premium_expires_at ? new Date(profile.premium_expires_at) : null;
    const isActive = isPremium && expiryDate && expiryDate > new Date();

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Hero ───────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-teal-600/20 blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
                    <Badge className="mb-5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
                        <Crown className="w-3 h-3 mr-1.5 inline" />
                        Saral Sahayta Premium
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-5">
                        Fast-Track Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                            Government Benefits
                        </span>
                    </h1>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
                        Skip the queue, get expert support, and receive real-time alerts.
                        Choose a plan that fits your needs — from free to fully priority.
                    </p>

                    {isActive && (
                        <div className="inline-flex items-center gap-2.5 mt-8 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-5 py-2.5 text-sm font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            Premium Active until {expiryDate ? format(expiryDate, 'dd MMM yyyy') : '—'}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Active Sub Banner (if active) ─────────────────────── */}
            {isActive && (
                <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10">
                    <Card className="border-emerald-200 bg-emerald-50 shadow-lg shadow-emerald-100/50">
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 rounded-xl">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-900">You have an active Premium subscription</p>
                                    <p className="text-sm text-emerald-700">
                                        Valid until {expiryDate ? format(expiryDate, 'dd MMM yyyy') : '—'}
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 shrink-0">
                                <Link href="/applications">View My Applications</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── Pricing Plans ─────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Start for free, upgrade when you need speed. Cancel anytime.
                    </p>
                </div>
                <PricingPlans />
                <p className="text-center text-xs text-slate-400 mt-6">
                    Payments secured by Razorpay · UPI, Cards & Netbanking accepted · No hidden fees
                </p>
            </div>

            {/* ── Features Grid ─────────────────────────────────────── */}
            <div className="bg-white border-t border-slate-100 py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                            What Premium Unlocks
                        </h2>
                        <p className="text-slate-500">
                            Everything you need to secure government benefits faster, easier.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {BENEFITS.map((b) => (
                            <div key={b.title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 bg-white">
                                <div className={`p-3 rounded-xl shrink-0 ${b.bg}`}>
                                    <b.icon className={`w-5 h-5 ${b.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-1">{b.title}</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FAQ / Reassurance strip ───────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 py-14">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
                    <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl" />
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-extrabold mb-2">100% Secure Payments</h3>
                    <p className="text-slate-400 max-w-lg mx-auto mb-6 text-sm">
                        All transactions are processed through Razorpay's PCI-DSS compliant gateway.
                        Your card or UPI details are never stored on our servers.
                    </p>
                    <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-8 h-12">
                        <Link href="/discover">← Browse Schemes</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
