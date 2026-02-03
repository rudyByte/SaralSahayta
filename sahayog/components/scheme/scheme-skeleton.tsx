"use client";

import { Card } from "@/components/ui/card";

export function SchemeSkeleton() {
    return (
        <Card className="h-[380px] animate-pulse overflow-hidden bg-white border-gray-200">
            <div className="p-5 space-y-4">
                <div className="flex justify-between">
                    <div className="h-5 w-20 bg-gray-200 rounded" />
                    <div className="h-5 w-5 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-full bg-gray-200 rounded" />
                    <div className="h-6 w-2/3 bg-gray-200 rounded" />
                </div>
                <div className="h-16 w-full bg-gray-100 rounded-lg" />
                <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-4/5 bg-gray-200 rounded" />
                </div>
                <div className="flex gap-4 pt-2">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50/50 mt-auto">
                <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
        </Card>
    );
}
