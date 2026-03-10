"use client";

import React from 'react';
import {
    CheckCircle2,
    XCircle,
    Info,
    Zap
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MatchIndicatorProps {
    score: number;
    matched: string[];
    missing: string[];
    className?: string;
}

const CircularProgress = ({ score, colors }: { score: number; colors: ReturnType<typeof getStatusColors> }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
                {/* Track ring */}
                <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-slate-100"
                />
                {/* Progress ring */}
                <motion.circle
                    cx="45"
                    cy="45"
                    r={radius}
                    fill="none"
                    stroke="url(#matchGradient)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <defs>
                    <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.gradientFrom} />
                        <stop offset="100%" stopColor={colors.gradientTo} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 leading-none">{score}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">%</span>
            </div>
        </div>
    );
};

const getStatusColors = (s: number) => {
    if (s >= 80) return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        label: "Excellent Match",
        dotColor: "bg-emerald-500",
        gradientFrom: "#10b981",
        gradientTo: "#14b8a6",
    };
    if (s >= 60) return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        label: "Good Match",
        dotColor: "bg-blue-500",
        gradientFrom: "#3b82f6",
        gradientTo: "#6366f1",
    };
    if (s >= 40) return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        label: "Moderate Match",
        dotColor: "bg-amber-500",
        gradientFrom: "#f59e0b",
        gradientTo: "#f97316",
    };
    return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-600",
        label: "Low Match",
        dotColor: "bg-slate-400",
        gradientFrom: "#94a3b8",
        gradientTo: "#64748b",
    };
};

export const MatchIndicator = ({ score, matched, missing, className }: MatchIndicatorProps) => {
    const colors = getStatusColors(score);

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "group relative flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer w-full",
                            colors.bg,
                            colors.border
                        )}
                    >
                        {/* Circular Progress */}
                        <CircularProgress score={score} colors={colors} />

                        {/* Text Content */}
                        <div className="flex-1 text-left">
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", colors.text)}>
                                Eligibility Score
                            </p>
                            <p className="text-base font-extrabold text-slate-900 leading-tight">
                                {colors.label}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                                {matched.length} met · {missing.length} missing
                            </p>
                        </div>

                        {/* Pulsing dot indicator */}
                        <div className="flex flex-col items-center gap-1 pr-1">
                            <span className={cn("w-2 h-2 rounded-full animate-pulse", colors.dotColor)} />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Details</span>
                        </div>
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-80 p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl"
                    side="bottom"
                    align="start"
                >
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <h4 className="font-bold text-sm">Eligibility Breakdown</h4>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            Analyzed {matched.length + missing.length} criteria from your profile.
                        </p>
                    </div>

                    {/* Criteria list */}
                    <div className="p-3 max-h-[300px] overflow-y-auto bg-white space-y-1.5">
                        {matched.map((m, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-[11px] font-medium text-emerald-900 leading-tight">{m}</span>
                            </div>
                        ))}
                        {missing.map((m, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <XCircle className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                                <span className="text-[11px] font-medium text-slate-600 leading-tight">{m}</span>
                            </div>
                        ))}
                        {matched.length === 0 && missing.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-xs italic">
                                No details available for this match.
                            </div>
                        )}
                    </div>

                    {/* Footer CTA */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-[10px] text-slate-500 font-medium">
                            Complete your profile to improve eligibility!
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
