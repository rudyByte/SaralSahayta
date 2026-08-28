'use client';

import React, { useState } from 'react';
import { TrendingUp, Zap, AlertCircle, Target } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import useSWR from 'swr';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
    schemeId: string;
    fallbackScore?: number | null;
    fallbackDocumentScore?: number | null;
    fallbackHistoricalRate?: number | null;
    className?: string;
}

const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: 'no-store' });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || body?.error || 'Failed to load score');
    return body;
};

function clampPercent(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeRatio(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const ratio = numeric > 1 ? numeric / 100 : numeric;
    return Math.max(0, Math.min(1, ratio));
}

function fallbackBreakdown(score: number) {
    const inferredHistorical = score / 70;
    return {
        historicalRate: Math.max(0, Math.min(1, inferredHistorical)),
        docsComplete: 0,
    };
}

function MiniCircle({ score, color }: { score: number; color: string }) {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;

    return (
        <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90 shrink-0">
            <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
            <circle
                cx="22" cy="22" r={r}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
        </svg>
    );
}

export function ConfidenceBadge({
    schemeId,
    fallbackScore,
    fallbackDocumentScore,
    fallbackHistoricalRate,
    className
}: ConfidenceBadgeProps) {
    const { data, isLoading, mutate } = useSWR(
        `/api/schemes/${schemeId}/confidence`,
        fetcher,
        { revalidateOnFocus: true, revalidateOnReconnect: true, dedupingInterval: 1000 }
    );
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = (open: boolean) => {
        setIsOpen(open);
        if (open) mutate(); // force-refresh when user hovers
    };

    // If still loading and no fallback score is provided yet, show skeleton
    if (isLoading && fallbackScore === undefined && !data) {
        return <div className="h-10 w-10 animate-pulse bg-slate-100 rounded-full" />;
    }

    // Determine the active score from one normalized source.
    const apiScore = clampPercent(data?.score ?? data?.probability ?? data?.confidence);
    const score = apiScore ?? clampPercent(fallbackScore) ?? 0;
    const liveBreakdown = {
        historicalRate: normalizeRatio(data?.breakdown?.historicalRate ?? fallbackHistoricalRate),
        docsComplete: normalizeRatio(data?.breakdown?.docsComplete ?? fallbackDocumentScore),
    };
    const hasLiveBreakdown = Object.values(liveBreakdown).some((value) => value !== null && value > 0);
    const displayBreakdown = hasLiveBreakdown
        ? {
            historicalRate: liveBreakdown.historicalRate ?? 0,
            docsComplete: liveBreakdown.docsComplete ?? 0,
        }
        : fallbackBreakdown(score);


    const config =
        score >= 80
            ? { color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', label: 'High', icon: <TrendingUp className="h-2.5 w-2.5" /> }
            : score >= 50
            ? { color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', label: 'Med', icon: <Zap className="h-2.5 w-2.5" /> }
            : { color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', label: 'Low', icon: <AlertCircle className="h-2.5 w-2.5" /> };

    return (
        <Popover open={isOpen} onOpenChange={handleOpen}>
            <PopoverTrigger asChild>
                <button
                    onMouseEnter={() => handleOpen(true)}
                    onMouseLeave={() => handleOpen(false)}
                    className={cn(
                        'relative inline-flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-help rounded-full',
                        className
                    )}
                >
                    <MiniCircle score={score} color={config.color} />
                    {/* Centre label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-[9px] font-black text-slate-900">{score}%</span>
                    </div>
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="top"
                align="start"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="w-64 p-0 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-slate-900 p-4 text-white">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Prediction</span>
                        <span className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-black uppercase',
                            score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : score >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        )}>
                            {config.label} Chance
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{score}%</span>
                        <span className="text-xs font-bold text-slate-400">Approval Probability</span>
                    </div>
                </div>

                {/* Breakdown bars */}
                <div className="p-4 space-y-3">
                    {(isLoading && !data) ? (
                        <div className="space-y-4 py-2">
                            <div className="h-2 bg-slate-100 rounded-full animate-pulse w-3/4" />
                            <div className="h-2 bg-slate-100 rounded-full animate-pulse w-1/2" />
                            <p className="text-[10px] font-bold text-slate-400 animate-pulse">Analysing your profile...</p>
                        </div>
                    ) : !data && fallbackScore === undefined ? (
                        <p className="text-[10px] text-slate-400 py-2">Hover again to load breakdown</p>
                    ) : (
                        <>
                            {([
                                { label: 'Historical Success Rate', val: displayBreakdown.historicalRate, weight: '70%' },
                                { label: 'Document Verification', val: displayBreakdown.docsComplete, weight: '30%' },
                            ] as { label: string; val: number; weight: string }[]).map(({ label, val, weight }) => (
                                <div key={label} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <span>{label}</span>
                                            <span className="text-[8px] px-1 py-0.5 bg-slate-100 rounded text-slate-400 font-black tracking-tighter">{weight}</span>
                                        </div>
                                        <span>{Math.round(val * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.max(0, Math.min(1, val)) * 100}%`, backgroundColor: config.color }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {data?.suggestions?.length > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                        How to improve
                                    </span>
                                    <div className="space-y-1.5">
                                        {data.suggestions.map((s: any, i: number) => (
                                            <div key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-700 leading-tight">{s.text}</p>
                                                    <p className="text-[9px] font-black text-emerald-600 mt-0.5">+{s.impact}% Impact</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>

                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium">*Statistical prediction, not a guarantee.</p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
