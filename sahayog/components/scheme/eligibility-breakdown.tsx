"use client";

import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EligibilityBreakdownProps {
    breakdown: any;
    isProfileComplete: boolean;
}

export function EligibilityBreakdown({ breakdown, isProfileComplete }: EligibilityBreakdownProps) {
    if (!breakdown) return null;

    const items = Object.values(breakdown);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b text-sm font-semibold text-gray-500">
                        <th className="py-3 px-4">Criterion</th>
                        <th className="py-3 px-4">Requirement</th>
                        <th className="py-3 px-4">Your Info</th>
                        <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4 font-medium text-gray-900">{item.label}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{item.requirement}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{item.value}</td>
                            <td className="py-4 px-4 text-center">
                                {item.match ? (
                                    <div className="flex justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {!isProfileComplete && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-start space-x-2 border border-dashed border-gray-300">
                    <HelpCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-xs text-gray-500">
                        Your profile is incomplete. Some requirements may be marked as mismatched because your data is missing.
                        <a href="/profile" className="text-primary hover:underline ml-1 font-semibold">Complete your profile</a>
                    </p>
                </div>
            )}
        </div>
    );
}
