"use client";

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import DiscoverPageContent from './discover-content';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function DiscoverPageFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
}

export default function DiscoverPage() {
    return (
        <Suspense fallback={<DiscoverPageFallback />}>
            <DiscoverPageContent />
        </Suspense>
    );
}
