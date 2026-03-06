"use client";

import React from 'react';
import { Check, Zap, Shield, Star, Crown, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
    { name: 'Detailed Scheme Match Breakdown', free: true, premium: true },
    { name: 'AI-Powered Application Assistant', free: false, premium: true },
    { name: 'Fast-Track Application Review', free: false, premium: true },
    { name: 'Priority SMS & WhatsApp Alerts', free: false, premium: true },
    { name: 'Document Expiry Tracking', free: "Basic", premium: "Advanced" },
    { name: 'Dedicated Support Agent', free: false, premium: true },
];

export default function PremiumPage() {
    return (
        <div className="container max-w-6xl py-12 px-6">
            <div className="text-center mb-16 space-y-4">
                <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 rounded-full font-bold uppercase tracking-wider">
                    Premium Access
                </Badge>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                    Unlock the Full Potential of <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Sahayog</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Get VIP access to government benefits with AI assistance, priority processing, and 24/7 expert support.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-20 relative">
                {/* Background Accents */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

                {/* Free Plan */}
                <Card className="relative border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="p-8">
                        <CardTitle className="text-2xl font-bold text-slate-900">Basic</CardTitle>
                        <div className="flex items-baseline gap-1 mt-4">
                            <span className="text-4xl font-black">₹0</span>
                            <span className="text-slate-500 text-sm">/perpetual</span>
                        </div>
                        <p className="text-slate-500 mt-4 text-sm">Essential tools for scheme discovery and simple tracking.</p>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-4">
                        {FEATURES.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {feature.free ? (
                                    <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border border-slate-200 shrink-0" />
                                )}
                                <span className={feature.free ? "text-slate-700 font-medium text-sm" : "text-slate-400 text-sm italic"}>
                                    {feature.name} {typeof feature.free === 'string' && `(${feature.free})`}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="p-8">
                        <Button variant="outline" className="w-full h-12 rounded-2xl font-bold" disabled>
                            Current Plan
                        </Button>
                    </CardFooter>
                </Card>

                {/* Premium Plan */}
                <Card className="relative border-primary shadow-2xl shadow-primary/20 scale-105 z-10 bg-white overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge className="bg-primary text-white font-bold px-3 py-1 animate-pulse">
                            MOST POPULAR
                        </Badge>
                    </div>

                    <CardHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
                            <Crown className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Sahayog Premium</CardTitle>
                        <div className="flex items-baseline gap-1 mt-4">
                            <span className="text-5xl font-black text-slate-900">₹999</span>
                            <span className="text-slate-500 text-sm">/year</span>
                        </div>
                        <p className="text-slate-600 mt-4 text-sm">Experience the fastest, smartest way to secure your benefits.</p>
                    </CardHeader>

                    <CardContent className="p-8 space-y-4">
                        {FEATURES.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-slate-700 font-bold text-sm">
                                    {feature.name} {typeof feature.premium === 'string' && `(${feature.premium})`}
                                </span>
                            </div>
                        ))}
                    </CardContent>

                    <CardFooter className="p-8 pt-0">
                        <Button className="w-full h-14 rounded-2xl shadow-xl shadow-primary/30 font-bold text-lg group overflow-hidden relative">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Upgrade to Premium
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-600 to-primary opacity-90 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-slate-200">
                <div className="flex items-start gap-4 p-4">
                    <Shield className="h-8 w-8 text-slate-400" />
                    <div>
                        <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-1">Secure Payments</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Encrypted transactions powered by Razorpay's world-class security.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4">
                    <Zap className="h-8 w-8 text-slate-400" />
                    <div>
                        <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-1">Instant Activation</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Upgrade now and unlock all premium features instantly on your dashboard.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4">
                    <Star className="h-8 w-8 text-slate-400" />
                    <div>
                        <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest mb-1">24/7 Expert Help</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Premium members get a direct line to our scheme specialists.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
