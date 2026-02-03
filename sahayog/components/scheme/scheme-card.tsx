"use client";

import { Scheme } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, ChevronRight, Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SchemeCardProps {
    scheme: any; // Using any for matchScore inclusion
}

export function SchemeCard({ scheme }: SchemeCardProps) {
    const score = scheme.matchScore;

    const getScoreColor = (s: number) => {
        if (s >= 80) return "bg-green-500";
        if (s >= 60) return "bg-yellow-500";
        if (s >= 40) return "bg-orange-500";
        return "bg-gray-400";
    };

    const getScoreLabel = (s: number) => {
        if (s >= 80) return "Excellent Match";
        if (s >= 60) return "Good Match";
        if (s >= 40) return "Moderate Match";
        return "Low Match";
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "CENTRAL": return "bg-blue-100 text-blue-800 border-blue-200";
            case "STATE": return "bg-green-100 text-green-800 border-green-200";
            case "PRIVATE": return "bg-amber-100 text-amber-800 border-amber-200";
            case "NGO": return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "";
        }
    };

    return (
        <Card className="group relative h-full flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-gray-200">
            <div className="p-5 flex-1 space-y-4">
                {/* Header: Type and Bookmark */}
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className={cn("font-semibold uppercase text-[10px]", getTypeColor(scheme.schemeType))}>
                        {scheme.schemeType}
                    </Badge>
                    <button className="text-gray-400 hover:text-primary transition-colors">
                        <Bookmark className="h-5 w-5" />
                    </button>
                </div>

                {/* Title and Category */}
                <div className="space-y-1">
                    <Badge variant="secondary" className="text-[10px] font-medium mb-1">
                        {scheme.category}
                    </Badge>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {scheme.schemeName}
                    </h3>
                </div>

                {/* Match Score (if available) */}
                {score !== null && (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                            <span className={cn(s >= 0 ? "text-gray-900" : "")}>{getScoreLabel(score)}</span>
                            <span>{score}%</span>
                        </div>
                        <Progress value={score} className="h-1.5" indicatorClassName={getScoreColor(score)} />
                    </div>
                )}

                {/* Financial Benefit */}
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">Financial Benefit</p>
                    <p className="text-xl font-bold text-primary">
                        {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString('en-IN')}` : scheme.financialBenefit}
                    </p>
                </div>

                {/* Details Snippet */}
                <p className="text-sm text-gray-600 line-clamp-2">
                    {scheme.targetBeneficiary}
                </p>

                {/* Meta info: Documents and Deadline */}
                <div className="flex flex-wrap gap-y-2 gap-x-4 pt-2 text-[12px] text-gray-500">
                    <div className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {scheme.requiredDocuments.length} Documents
                    </div>
                    {scheme.applicationDeadline && (
                        <div className="flex items-center text-amber-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(scheme.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: Action */}
            <div className="px-5 py-4 border-t bg-gray-50/50 group-hover:bg-white transition-colors">
                <Link href={`/schemes/${scheme.id}`}>
                    <Button variant="outline" className="w-full justify-between hover:bg-primary hover:text-white group/btn">
                        View Details
                        <ChevronRight className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
