"use client";

import React, { useState } from 'react';
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, CreditCard, Rocket, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentModalProps {
    onSuccess?: (paymentId: string) => void;
    planName: string;
    amount: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ planName, amount, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    // Mock implementation for Razorpay integration
    const handlePayment = () => {
        setLoading(true);
        // Simulate Razorpay SDK loading and checkout
        setTimeout(() => {
            setLoading(false);
            onSuccess?.("pay_mock_123456789");
        }, 2000);
    };

    return (
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-primary/5 p-8 border-b border-primary/10">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-white rounded-3xl shadow-xl shadow-primary/10 flex items-center justify-center mb-6 border border-primary/10">
                        <Rocket className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900">Secure Checkout</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium mt-2">
                        You&apos;re about to upgrade to <span className="text-primary font-bold">{planName}</span>
                    </DialogDescription>
                </DialogHeader>
            </div>

            <div className="p-8 space-y-8">
                <div className="flex justify-between items-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total to Pay</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">₹{amount.toLocaleString()}</span>
                            <span className="text-xs text-slate-500 font-medium">/ year</span>
                        </div>
                    </div>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-1 font-bold">
                        Tax included
                    </Badge>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Everything you get:</h4>
                    <ul className="space-y-3">
                        {[
                            'AI-Powered Eligibility Check',
                            'Fast-Track Application Review',
                            'Priority SMS Alerts',
                            'Expert Support 24/7'
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-4 space-y-4">
                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-bold text-lg gap-2 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <CreditCard className="h-5 w-5" />
                                Pay with Razorpay
                            </>
                        )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-tighter">
                        <ShieldCheck className="h-4 w-4" />
                        Secured by Razorpay Standard
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};
