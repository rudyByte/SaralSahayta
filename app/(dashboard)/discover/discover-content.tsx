"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import {
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    LayoutGrid,
    List,
    Loader2,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchemeCard } from '@/components/scheme/scheme-card';
import { SchemeFilter, FilterState } from '@/components/scheme/scheme-filter';
import { Scheme, SchemeType, SchemeCategory } from '@prisma/client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

type SortOption = 'relevance' | 'matchScore' | 'deadline' | 'benefit' | 'recent';

export default function DiscoverPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // -- State --
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('relevance');

    // -- Filters --
    const [filters, setFilters] = useState<FilterState>({
        search: searchParams.get('search') || '',
        category: (searchParams.getAll('category') as SchemeCategory[]) || [],
        schemeType: (searchParams.get('schemeType') as SchemeType | 'ALL') || 'ALL',
        state: searchParams.get('state') || 'All States',
        minBenefit: searchParams.get('minBenefit') ? parseInt(searchParams.get('minBenefit')!) : 0,
        maxBenefit: searchParams.get('maxBenefit') ? parseInt(searchParams.get('maxBenefit')!) : 500000,
        deadline: (searchParams.get('deadline') as any) || 'all',
    });

    // -- Search Input State (Local to prevent full-page re-renders) --
    const [searchInput, setSearchInput] = useState(filters.search);

    // -- Debounced Search (Sync local input to filter state) --
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // -- API URL --
    const getQueryUrl = useMemo(() => {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.set('search', filters.search);
        filters.category.forEach(cat => queryParams.append('category', cat));
        if (filters.schemeType !== 'ALL') queryParams.set('schemeType', filters.schemeType);
        if (filters.state !== 'All States') queryParams.set('state', filters.state);
        queryParams.set('minBenefit', filters.minBenefit.toString());
        queryParams.set('maxBenefit', filters.maxBenefit.toString());
        if (filters.deadline !== 'all') queryParams.set('deadline', filters.deadline);
        queryParams.set('sortBy', sortBy);
        queryParams.set('page', page.toString());
        return `/api/schemes?${queryParams.toString()}`;
    }, [filters, sortBy, page]);

    const { data, error: swrError, isLoading: swrLoading, mutate } = useSWR(getQueryUrl);

    const schemes = data?.schemes || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;
    const loading = swrLoading;
    const error = swrError?.message || null;


    // -- Counter for active filters --
    const activeFilterCount = useMemo(() => [
        filters.category.length > 0,
        filters.schemeType !== 'ALL',
        filters.state !== 'All States',
        filters.maxBenefit < 500000,
        filters.deadline !== 'all'
    ].filter(Boolean).length, [filters]);

    const handleReset = () => {
        setSearchInput('');
        setFilters({
            search: '',
            category: [],
            schemeType: 'ALL',
            state: 'All States',
            minBenefit: 0,
            maxBenefit: 500000,
            deadline: 'all'
        });
        setSortBy('relevance');
    };

    if (authLoading) return <div className="p-8 text-center text-slate-500">Authenticating...</div>;

    return (
        <div className="container mx-auto px-4 pt-2">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Discover Schemes
                        </h1>
                        <p className="text-slate-500 mt-1 max-w-2xl">
                            Browse and find government programs, scholarships, and grants tailored to your profile.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Sort by:</span>
                        <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="Sort order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="relevance">Relevance</SelectItem>
                                <SelectItem value="matchScore">Highest Match</SelectItem>
                                <SelectItem value="benefit">Benefit Amount</SelectItem>
                                <SelectItem value="deadline">Soonest Deadline</SelectItem>
                                <SelectItem value="recent">Recently Added</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar: Filters (30%) */}
                    <aside className="lg:w-1/4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                            <SchemeFilter
                                filters={filters}
                                onChange={setFilters}
                                onReset={handleReset}
                                activeCount={activeFilterCount}
                            />
                        </div>
                    </aside>

                    {/* Main Content: Results (70%) */}
                    <section className="lg:w-3/4 space-y-6">
                        {/* Top Bar: Search */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search schemes by name, keyword, or beneficiary..."
                                className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm text-lg focus-visible:ring-primary focus-visible:border-primary transition-all"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>

                        {/* Results Info */}
                        <div className="flex items-center justify-between text-sm text-slate-500 font-medium px-2">
                            <p>
                                Showing <span className="text-slate-900 font-bold">{schemes.length}</span> of <span className="text-slate-900 font-bold">{total}</span> schemes
                            </p>
                        </div>

                        {/* Grid of Cards */}
                        {loading ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                {[1, 2, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white rounded-2xl h-[300px] animate-pulse border border-slate-100 shadow-sm" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-red-900 mb-1">Failed to load schemes</h3>
                                <p className="text-red-600 mb-4">{error}</p>
                                <Button variant="outline" onClick={() => mutate()}>Try Again</Button>
                            </div>
                        ) : schemes.length === 0 ? (
                            <div className="bg-white py-16 px-8 rounded-2xl border border-slate-200 text-center">
                                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No schemes found</h3>
                                <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                                    We couldn&apos;t find any schemes matching your current filters. Try adjusting them or resetting.
                                </p>
                                <Button onClick={handleReset} variant="secondary">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset All Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {schemes.map((scheme: any) => (
                                    <SchemeCard key={scheme.id} scheme={scheme} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-8">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium px-4">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </section>
                </div>
        </div>
    );
}

