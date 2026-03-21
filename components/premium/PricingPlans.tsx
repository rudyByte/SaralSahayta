'use client';

import React, { useState } from 'react';
import { Check, Shield, Zap, Sparkles, Clock, Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PricingPlansProps {
    onSuccess?: () => void;
    schemeId?: string; // Optional: Only provided for per-scheme fast-track
    className?: string;
}

export const PricingPlans = ({ onSuccess, schemeId, className }: PricingPlansProps) => {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (type: 'monthly' | 'per_scheme') => {
        try {
            setLoading(type);
            
            // 1. Create Order
            const response = await fetch('/api/premium/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, schemeId }),
            });

            const order = await response.json();
            if (order.error) throw new Error(order.error);

            // 2. Load Razorpay Script
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);

            script.onload = () => {
                const options = {
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: "Saral Sahayta",
                    description: type === 'monthly' ? "Premium Subscription" : "Fast-Track Application",
                    order_id: order.id,
                    handler: async (response: any) => {
                        toast.success('Payment Successful!');
                        if (onSuccess) onSuccess();
                        // The webhook handles DB updates, but we can trigger a refresh
                        window.location.reload();
                    },
                    prefill: {
                        name: "User",
                        email: "user@example.com",
                    },
                    theme: { color: "#0F172A" },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            };

        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error(error.message || 'Payment initiation failed');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={cn("grid md:grid-cols-2 gap-8 items-stretch", className)}>
            {/* Monthly Subscription */}
            <div className="relative group p-8 rounded-3xl bg-white border border-slate-200 shadow-xl hover:border-primary/50 transition-all flex flex-col">
                <div className="absolute -top-4 left-6 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-primary/20">
                    <Sparkles className="h-3 w-3" /> MOST POPULAR
                </div>
                
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Premium Pro</h3>
                    <p className="text-sm text-slate-500 mt-1">Full access to simplify your life</p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-slate-900">₹199</span>
                    <span className="text-slate-500 font-medium">/month</span>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                    <FeatureItem icon={<Zap className="h-4 w-4 text-amber-500" />} text="Priority Admin Processing" />
                    <FeatureItem icon={<Bell className="h-4 w-4 text-blue-500" />} text="SMS & WhatsApp Alerts" />
                    <FeatureItem icon={<Shield className="h-4 w-4 text-emerald-500" />} text="Verified Scheme Matching" />
                    <FeatureItem icon={<MessageSquare className="h-4 w-4 text-purple-500" />} text="1-on-1 Help Support" />
                </div>

                <Button 
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold"
                    onClick={() => handleSubscribe('monthly')}
                    disabled={!!loading}
                >
                    {loading === 'monthly' ? 'Initialising...' : 'Get Unlimited Access'}
                </Button>
            </div>

            {/* Per-Scheme Fast Track */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Fast-Track Only</h3>
                    <p className="text-sm text-slate-500 mt-1">Single application priority</p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-slate-900">₹99</span>
                    <span className="text-slate-500 font-medium text-sm">per scheme</span>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                    <FeatureItem icon={<Clock className="h-4 w-4 text-slate-400" />} text="24-Hour Admin Review" />
                    <FeatureItem icon={<Check className="h-4 w-4 text-slate-400" />} text="Doc Error Correction" />
                    <FeatureItem icon={<Check className="h-4 w-4 text-slate-400" />} text="Application Tracking" />
                </div>

                <Button 
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-300 text-slate-700 font-bold hover:bg-white"
                    onClick={() => handleSubscribe('per_scheme')}
                    disabled={!!loading}
                >
                    {loading === 'per_scheme' ? 'Initialising...' : 'Expedite Current Application'}
                </Button>
            </div>
        </div>
    );
};

const FeatureItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div className="flex items-center gap-3">
        <div className="p-1 rounded bg-white shadow-sm border border-slate-100">
            {icon}
        </div>
        <span className="text-sm font-medium text-slate-700">{text}</span>
    </div>
);
