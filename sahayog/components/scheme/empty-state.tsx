"use client";

import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No schemes found</h3>
            <p className="text-gray-500 max-w-xs mt-2 mb-6">
                Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <Button onClick={onReset} variant="outline" className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Filters
            </Button>
        </div>
    );
}
