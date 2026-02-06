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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Scheme, SchemeType, SchemeCategory } from '@prisma/client';

interface SchemeCardProps {
    scheme: Scheme & { matchScore?: number | null };
}

const TYPE_COLORS: Record<SchemeType, string> = {
    CENTRAL: 'bg-blue-100 text-blue-800 border-blue-200',
    STATE: 'bg-green-100 text-green-800 border-green-200',
    PRIVATE: 'bg-orange-100 text-orange-800 border-orange-200',
    NGO: 'bg-purple-100 text-purple-800 border-purple-200',
};

const CATEGORY_ICONS: Partial<Record<SchemeCategory, React.ReactNode>> = {
    EDUCATION: <FileText className="h-3 w-3 mr-1" />,
    AGRICULTURE: <Target className="h-3 w-3 mr-1" />,
    HEALTHCARE: <Info className="h-3 w-3 mr-1" />,
};

export const SchemeCard = React.memo(({ scheme }: SchemeCardProps) => {
    const getMatchColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-gray-400';
    };

    const getMatchLabel = (score: number) => {
        if (score >= 80) return 'Excellent Match';
        if (score >= 60) return 'Good Match';
        if (score >= 40) return 'Moderate Match';
        return 'Low Match';
    };

    const hasDeadline = scheme.deadline && !scheme.isRolling;
    const daysLeft = hasDeadline ? Math.ceil((new Date(scheme.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden hover:scale-[1.01] flex flex-col h-full">
            <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={cn("font-semibold uppercase text-[10px]", TYPE_COLORS[scheme.schemeType])}>
                            {scheme.schemeType}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-slate-100">
                            {CATEGORY_ICONS[scheme.category] || <Info className="h-3 w-3 mr-1" />}
                            {scheme.category.replace('_', ' ')}
                        </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-primary">
                        <Bookmark className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Link href={`/schemes/${scheme.id}`} className="block">
                        <h3 className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {scheme.name}
                        </h3>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 flex-grow">
                {scheme.matchScore !== null && scheme.matchScore !== undefined && (
                    <div className="mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-slate-600">
                                {getMatchLabel(scheme.matchScore)}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{scheme.matchScore}%</span>
                        </div>
                        <Progress value={scheme.matchScore} className={cn("h-1.5", getMatchColor(scheme.matchScore))} />
                    </div>
                )}

                <div className="flex flex-col space-y-3">
                    <div className="flex items-center text-primary font-bold">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        <span className="text-lg">
                            {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString()}` : "Variable"}
                        </span>
                        <span className="text-xs font-normal text-slate-500 ml-1">
                            {scheme.benefitType === 'MONETARY' ? "one-time grant" : scheme.benefitType.toLowerCase()}
                        </span>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-3 min-h-[3rem]">
                        {scheme.description}
                    </p>

                    <div className="flex flex-wrap gap-y-2 gap-x-4 pt-2 border-t border-slate-50">
                        {hasDeadline ? (
                            <div className={cn("flex items-center text-xs", daysLeft !== null && daysLeft < 7 ? "text-red-600 font-bold" : "text-slate-500")}>
                                <Calendar className="h-3 w-3 mr-1" />
                                {daysLeft !== null && daysLeft > 0 ? `${daysLeft} days left` : `Deadline: ${new Date(scheme.deadline!).toLocaleDateString()}`}
                            </div>
                        ) : (
                            <div className="flex items-center text-xs text-slate-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                Apply Anytime
                            </div>
                        )}
                        <div className="flex items-center text-xs text-slate-500">
                            <FileText className="h-3 w-3 mr-1" />
                            {scheme.requiredDocuments.length} Docs
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 bg-slate-50/50 flex gap-2">
                <Button asChild className="w-full shadow-sm">
                    <Link href={`/schemes/${scheme.id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
});

SchemeCard.displayName = 'SchemeCard';

