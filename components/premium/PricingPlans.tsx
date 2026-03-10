'use client';

import React, { useState } from 'react';
import { Check, Zap, Shield, Clock, Star, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingPlansProps {
    onSubscribeSuccess?: (orderId: string) => void;
    onSubscribeError?: (error: string) => void;
    schemeId?: string;
    applicationId?: string;
}

const loadRazorpayScript = (src: string): Promise<boolean> =>
    new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const plans = [
    {
        id: 'freemium',
        name: 'Free',
        tagline: 'Get started at no cost',
        price: '₹0',
        period: '/forever',
        badge: null,
        badgeClass: '',
        cardClass: 'border-slate-200 bg-white',
        headerClass: 'text-slate-800',
        priceClass: 'text-slate-800',
        ctaLabel: 'Current Plan',
        ctaClass: 'border-slate-200 text-slate-600 bg-slate-50 cursor-default',
        ctaVariant: 'outline' as const,
        isFreemium: true,
        features: [
            { label: 'Discover eligible schemes', included: true },
            { label: 'Profile completion & management', included: true },
            { label: 'Document upload (manual)', included: true },
            { label: 'Standard application queue', included: true },
            { label: 'Basic email notifications', included: true },
            { label: 'Priority processing queue', included: false },
            { label: 'WhatsApp & call support', included: false },
            { label: 'SMS & real-time alerts', included: false },
        ],
    },
    {
        id: 'monthly',
        name: 'Saral Premium',
        tagline: 'Priority access for every scheme',
        price: '₹199',
        period: '/month',
        badge: '⭐ Best Value',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        cardClass: 'border-emerald-300 bg-gradient-to-b from-emerald-50/60 to-white shadow-xl shadow-emerald-100/50 scale-[1.02]',
        headerClass: 'text-emerald-900',
        priceClass: 'text-emerald-600',
        ctaLabel: 'Subscribe — ₹199/mo',
        ctaClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200',
        ctaVariant: 'default' as const,
        isFreemium: false,
        planType: 'monthly',
        accentBar: 'bg-gradient-to-r from-emerald-400 to-teal-400',
        features: [
            { label: 'Everything in Free', included: true },
            { label: 'Priority admin processing queue', included: true },
            { label: '24–48 hr processing guarantee', included: true },
            { label: 'Real-time SMS & Email alerts', included: true },
            { label: 'Dedicated WhatsApp support', included: true },
            { label: 'Expert document review', included: true },
            { label: 'Unlimited scheme applications', included: true },
            { label: 'Auto-renewal (cancel anytime)', included: true },
        ],
    },
    {
        id: 'per_scheme',
        name: 'Fast-Track',
        tagline: 'Urgent processing for one scheme',
        price: '₹99',
        period: '/scheme',
        badge: '⚡ One-Time',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        cardClass: 'border-amber-200 bg-white',
        headerClass: 'text-slate-800',
        priceClass: 'text-amber-600',
        ctaLabel: 'Fast-Track This Scheme',
        ctaClass: 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100',
        ctaVariant: 'outline' as const,
        isFreemium: false,
        planType: 'per_scheme',
        features: [
            { label: 'Single scheme priority queue', included: true },
            { label: '24–48 hr processing guarantee', included: true },
            { label: 'One-time secure payment', included: true },
            { label: 'Standard email notification', included: true },
            { label: 'Unlimited schemes', included: false },
            { label: 'WhatsApp support', included: false },
            { label: 'SMS alerts', included: false },
            { label: 'Expert document review', included: false },
        ],
    },
];

export function PricingPlans({ onSubscribeSuccess, onSubscribeError, schemeId, applicationId }: PricingPlansProps) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (planType: 'monthly' | 'per_scheme') => {
        try {
            setLoadingPlan(planType);
            const response = await fetch('/api/premium/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType, schemeId, applicationId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to initialize payment');

            const ready = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
            if (!ready) throw new Error('Razorpay SDK failed to load.');

            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: 'Saral Sahayta',
                description: planType === 'monthly' ? 'Premium Monthly Subscription' : 'Priority Scheme Processing',
                order_id: data.orderId,
                handler: () => {
                    if (onSubscribeSuccess) onSubscribeSuccess(data.orderId);
                    else window.location.href = '/premium?success=true';
                },
                theme: { color: '#16a34a' },
            };

            const rp = new (window as any).Razorpay(options);
            rp.on('payment.failed', (r: any) => {
                if (onSubscribeError) onSubscribeError(r.error?.description || 'Payment failed.');
            });
            rp.open();
        } catch (err: any) {
            if (onSubscribeError) onSubscribeError(err.message);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="w-full">
            <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            'relative rounded-2xl border-2 p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-lg',
                            plan.cardClass
                        )}
                    >
                        {/* Top accent bar for premium */}
                        {plan.accentBar && (
                            <div className={cn('absolute top-0 inset-x-0 h-1 rounded-t-2xl', plan.accentBar)} />
                        )}

                        {/* Badge */}
                        {plan.badge && (
                            <Badge className={cn('self-start text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5', plan.badgeClass)}>
                                {plan.badge}
                            </Badge>
                        )}

                        {/* Name & Tagline */}
                        <div>
                            <h3 className={cn('text-xl font-extrabold', plan.headerClass)}>{plan.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{plan.tagline}</p>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1">
                            <span className={cn('text-4xl font-black', plan.priceClass)}>{plan.price}</span>
                            <span className="text-sm text-slate-400 font-medium">{plan.period}</span>
                        </div>

                        {/* CTA */}
                        <Button
                            variant={plan.ctaVariant}
                            className={cn('w-full h-11 font-bold text-sm rounded-xl', plan.ctaClass)}
                            disabled={plan.isFreemium || loadingPlan !== null}
                            onClick={() => {
                                if (plan.planType) handleSubscribe(plan.planType as any);
                            }}
                        >
                            {loadingPlan === plan.id ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                            ) : plan.isFreemium ? (
                                plan.ctaLabel
                            ) : (
                                <>{plan.ctaLabel} <ArrowRight className="w-4 h-4 ml-1.5" /></>
                            )}
                        </Button>

                        {/* Feature list */}
                        <ul className="space-y-2.5">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2.5 text-sm">
                                    {f.included ? (
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-slate-200 shrink-0" />
                                    )}
                                    <span className={f.included ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                        {f.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
