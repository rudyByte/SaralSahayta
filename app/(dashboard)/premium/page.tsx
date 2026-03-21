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
    Users,
    TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

const BENEFITS = [
    { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Priority Queue', desc: 'Your applications jump to the front of the admin review queue instantly.' },
    { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', title: '24–48 Hr Processing', desc: 'Guaranteed review within one to two business days — not weeks.' },
    { icon: FileCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Expert Doc Review', desc: 'We check your documents before submission to avoid rejections.' },
    { icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-50', title: 'WhatsApp Support', desc: 'Direct access to a support agent anytime you need help.' },
    { icon: BellRing, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Instant SMS Alerts', desc: 'Get notified the moment your application status changes.' },
    { icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50', title: 'Unlimited Schemes', desc: 'Apply for any number of schemes with one monthly subscription.' },
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
        <div className="min-h-screen bg-slate-50 -m-6">

            {/* ── Active Sub Banner ─────────────────────────────────── */}
            {isActive && (
                <div className="bg-emerald-600 text-white py-3 px-6 text-center text-sm font-semibold flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Premium Active — valid until {expiryDate ? format(expiryDate, 'dd MMM yyyy') : '—'}
                    <Link href="/applications" className="ml-3 underline underline-offset-2 opacity-80 hover:opacity-100">View Applications →</Link>
                </div>
            )}

            {/* ── Above-the-Fold: CTA strip + Pricing ──────────────── */}
            <div className="max-w-5xl mx-auto px-4 pt-8 pb-6">

                {/* Compact Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                        <Crown className="w-3.5 h-3.5" />
                        Saral Sahayta Premium
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
                        Get your scheme approved <span className="text-emerald-600">2× faster</span>
                    </h1>
                    <p className="text-slate-500 text-base max-w-lg mx-auto">
                        Priority processing, expert document review, and real-time SMS alerts.
                        Start free — upgrade only when you need speed.
                    </p>

                    {/* Social proof strip */}
                    <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            2,400+ applicants served
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                            87% approval rate with Premium
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
                            Razorpay secured · Cancel anytime
                        </div>
                    </div>
                </div>

                {/* ── Pricing Cards (above the fold) ────────────────── */}
                <PricingPlans />
                <p className="text-center text-xs text-slate-400 mt-4">
                    UPI · Cards · Netbanking accepted via Razorpay · No hidden fees
                </p>
            </div>

            {/* ── Divider ───────────────────────────────────────────── */}
            <div className="border-t border-slate-200 mx-6 my-2" />

            {/* ── Benefits Grid ─────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
                    What you unlock with Premium
                </h2>
                <p className="text-slate-400 text-center text-sm mb-10">
                    Everything you need to secure government benefits faster and with confidence.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {BENEFITS.map((b) => (
                        <div key={b.title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-slate-200 transition-all duration-200">
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

            {/* ── Bottom CTA Banner ─────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 pb-14">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl px-8 py-10 text-white text-center">
                    <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl" />
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-extrabold mb-2">Ready to get faster approval?</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                        Join thousands of applicants who got their benefits approved in 24–48 hours with Saral Premium.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-emerald-900/30">
                            Get Premium — ₹199/mo
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-white/20 text-white bg-white/10 hover:bg-white/20 rounded-xl h-12 px-8">
                            <Link href="/discover">Browse Schemes First</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
