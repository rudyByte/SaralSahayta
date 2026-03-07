"use client";

import React from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Calendar,
    FileText,
    IndianRupee,
    Info,
    Bookmark,
    Target
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Scheme, SchemeType, SchemeCategory } from '@prisma/client';
import { MatchIndicator } from './match-indicator';
import { ConfidenceBadge } from './confidence-badge';

interface SchemeCardProps {
    scheme: Scheme & {
        matchScore?: number | null;
        matchDetails?: {
            score: number;
            matched: string[];
            missing: string[];
        } | null;
    };
}

const TYPE_COLORS: Record<SchemeType, string> = {
    CENTRAL: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    STATE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    PRIVATE: 'bg-amber-50 text-amber-700 border-amber-100',
    NGO: 'bg-rose-50 text-rose-700 border-rose-100',
};

const CATEGORY_ICONS: Partial<Record<SchemeCategory, React.ReactNode>> = {
    EDUCATION: <FileText className="h-3 w-3 mr-1" />,
    AGRICULTURE: <Target className="h-3 w-3 mr-1" />,
    HEALTHCARE: <Info className="h-3 w-3 mr-1" />,
};

export const SchemeCard = React.memo(({ scheme }: SchemeCardProps) => {
    const hasDeadline = scheme.deadline && !scheme.isRolling;
    const daysLeft = hasDeadline ? Math.ceil((new Date(scheme.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <Card className="group relative hover:shadow-2xl transition-all duration-500 border-slate-200 overflow-hidden hover:-translate-y-1 flex flex-col h-full bg-white">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

            <CardHeader className="p-6 pb-2 relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={cn("font-bold uppercase text-[10px] py-0.5", TYPE_COLORS[scheme.schemeType])}>
                            {scheme.schemeType}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-bold py-0.5 bg-slate-100 text-slate-600 border-transparent">
                            {CATEGORY_ICONS[scheme.category] || <Info className="h-3 w-3 mr-1" />}
                            {scheme.category.replace('_', ' ')}
                        </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                        <Bookmark className="h-5 w-5" />
                    </Button>
                </div>

                {/* AI Approval Probability Badge */}
                <div className="mb-4">
                    <ConfidenceBadge schemeId={scheme.id} />
                </div>

                <div>
                    <Link href={`/schemes/${scheme.id}`} className="block">
                        <h3 className="text-xl font-extrabold leading-tight text-slate-900 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                            {scheme.name}
                        </h3>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-6 pt-4 flex-grow relative z-10">
                {/* Premium Match Indicator */}
                {scheme.matchDetails && (
                    <MatchIndicator
                        score={scheme.matchDetails.score}
                        matched={scheme.matchDetails.matched}
                        missing={scheme.matchDetails.missing}
                        className="mb-6"
                    />
                )}

                <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
                            <IndianRupee className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benefit Amount</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-900">
                                    {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString()}` : "Variable"}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 italic">
                                    {scheme.benefitType === 'MONETARY' ? "grant" : scheme.benefitType.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 min-h-[4.5rem]">
                        {scheme.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                        <div className={cn(
                            "flex items-center gap-2 p-2 rounded-xl border transition-colors",
                            hasDeadline && daysLeft !== null && daysLeft < 7
                                ? "bg-rose-50 border-rose-100 text-rose-700"
                                : "bg-slate-50 border-slate-100 text-slate-600"
                        )}>
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase opacity-60 leading-none mb-0.5">Deadline</span>
                                <span className="text-[11px] font-bold truncate">
                                    {hasDeadline ? (daysLeft !== null && daysLeft > 0 ? `${daysLeft} days left` : "Ending Soon") : "Rolling"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase opacity-60 leading-none mb-0.5">Documents</span>
                                <span className="text-[11px] font-bold truncate">
                                    {scheme.requiredDocuments.length} Required
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 bg-white relative z-10 flex gap-3">
                <Button asChild className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 font-bold text-sm tracking-wide group/btn overflow-hidden relative">
                    <Link href={`/schemes/${scheme.id}`}>
                        <span className="relative z-10 flex items-center justify-center">
                            Secure Benefit
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-600 to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
});

SchemeCard.displayName = 'SchemeCard';
