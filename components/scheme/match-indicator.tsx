"use client";

import React from 'react';
import {
    CheckCircle2,
    Target,
    ChevronDown,
    Zap,
    Info
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

export const MatchIndicator = ({ score, matched, missing, className }: MatchIndicatorProps) => {
    const getStatusColors = (s: number) => {
        if (s >= 80) return {
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            text: "text-emerald-700",
            progress: "bg-emerald-500",
            icon: "text-emerald-500",
            label: "Excellent Match",
            gradient: "from-emerald-500 to-teal-400"
        };
        if (s >= 60) return {
            bg: "bg-blue-50",
            border: "border-blue-100",
            text: "text-blue-700",
            progress: "bg-blue-500",
            icon: "text-blue-500",
            label: "Good Match",
            gradient: "from-blue-500 to-indigo-400"
        };
        if (s >= 40) return {
            bg: "bg-amber-50",
            border: "border-amber-100",
            text: "text-amber-700",
            progress: "bg-amber-500",
            icon: "text-amber-500",
            label: "Moderate Match",
            gradient: "from-amber-500 to-orange-400"
        };
        return {
            bg: "bg-slate-50",
            border: "border-slate-100",
            text: "text-slate-600",
            progress: "bg-slate-400",
            icon: "text-slate-400",
            label: "Low Match",
            gradient: "from-slate-400 to-slate-300"
        };
    };

    const colors = getStatusColors(score);

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "group relative flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 hover:shadow-md active:scale-[0.98]",
                        colors.bg,
                        colors.border
                    )}>
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-lg bg-white shadow-sm", colors.icon)}>
                                    <Target className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", colors.text)}>
                                        Match Score
                                    </span>
                                    <span className="text-sm font-extrabold text-slate-900 leading-none">
                                        {colors.label}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                                <span className="text-lg font-black text-slate-900">
                                    {score}<span className="text-[10px] text-slate-400 ml-0.5">%</span>
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-white/20">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn("h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(0,0,0,0.1)]", colors.gradient)}
                            />
                        </div>

                        <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">
                                Based on your profile
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary animate-pulse">
                                Detail <ChevronDown className="h-2 w-2" />
                            </div>
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl" side="bottom" align="start">
                    <div className="p-4 bg-slate-900 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <h4 className="font-bold text-sm">Eligibility Breakdown</h4>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            We analyzed your profile against {matched.length + missing.length} scheme requirements.
                        </p>
                    </div>

                    <div className="p-2 max-h-[300px] overflow-y-auto bg-white">
                        <div className="space-y-1">
                            {matched.map((m, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-[11px] font-medium text-emerald-900 leading-tight">{m}</span>
                                </div>
                            ))}
                            {missing.map((m, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                    <Info className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                    <span className="text-[11px] font-medium text-slate-600 leading-tight">{m}</span>
                                </div>
                            ))}
                            {matched.length === 0 && missing.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-xs italic">
                                    No details available for this match.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-[10px] text-slate-500 font-medium">
                            Complete your profile to increase your score!
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
