'use client';

import React, { useState } from 'react';
import {
    AlertCircle,
    TrendingUp,
    Zap,
    Target,
    Info
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import useSWR from 'swr';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
    schemeId: string;
    className?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ConfidenceBadge({ schemeId, className }: ConfidenceBadgeProps) {
    const { data, error, isLoading } = useSWR(`/api/schemes/${schemeId}/confidence`, fetcher);
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) return <div className="h-6 w-24 animate-pulse bg-slate-100 rounded-full" />;
    if (error || !data) return null;

    const score = data.score;

    const getStatusColor = (s: number) => {
        if (s >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-100 ring-emerald-500/10 shadow-sm shadow-emerald-100/50';
        if (s >= 50) return 'text-amber-700 bg-amber-50 border-amber-100 ring-amber-500/10 shadow-sm shadow-amber-100/50';
        return 'text-rose-700 bg-rose-50 border-rose-100 ring-rose-500/10 shadow-sm shadow-rose-100/50';
    };

    const getStatusIcon = (s: number) => {
        if (s >= 80) return <TrendingUp className="h-3 w-3" />;
        if (s >= 50) return <Zap className="h-3 w-3" />;
        return <AlertCircle className="h-3 w-3" />;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider cursor-help transition-all hover:scale-105 active:scale-95 group",
                        getStatusColor(score),
                        className
                    )}
                >
                    {getStatusIcon(score)}
                    <span className="opacity-90">{score}% Approval Chance</span>
                    <Info className="h-2.5 w-2.5 ml-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                className="w-72 p-0 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div className="bg-slate-900 p-4 text-white">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Prediction</span>
                        <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                            score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : score >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        )}>
                            {score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low'} Accuracy
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{score}%</span>
                        <span className="text-xs font-bold text-slate-400">Approval Probability</span>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Historical Success</span>
                            <span>{Math.round(data.breakdown.historicalRate * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-300 rounded-full" style={{ width: `${data.breakdown.historicalRate * 100}%` }} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Document Readiness</span>
                            <span>{Math.round(data.breakdown.docsComplete * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${data.breakdown.docsComplete * 100}%` }} />
                        </div>
                    </div>

                    {data.suggestions?.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">How to increase odds</span>
                            <div className="space-y-2">
                                {data.suggestions.map((suggestion: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 group hover:border-primary/20 hover:bg-white transition-all">
                                        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm mt-0.5 group-hover:border-primary/30 transition-colors">
                                            <Target className="h-2.5 w-2.5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-700 leading-tight">{suggestion.text}</p>
                                            <p className="text-[9px] font-black text-emerald-600 mt-0.5 flex items-center gap-1">
                                                <TrendingUp className="h-2 w-2" />
                                                +{suggestion.impact}% Impact
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 p-3 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                        *Predictions are based on statistical models and do not guarantee official approval.
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
