"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SchemeCard } from "@/components/scheme/scheme-card";
import { SchemeFilter } from "@/components/scheme/scheme-filter";
import { EmptyState } from "@/components/scheme/empty-state";
import { SchemeSkeleton } from "@/components/scheme/scheme-skeleton";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";

export default function DiscoverPage() {
    // Filter States
    const [filters, setFilters] = useState<any>({
        search: "",
        category: [],
        schemeType: "ALL",
        state: "ALL",
        applicationMode: [],
        deadline: "",
        sortBy: "relevance",
        page: 1,
    });

    const [schemes, setSchemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initial Data Fetch (User Profile for State/Completion info)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/profile");
                const data = await res.json();
                if (data.success) {
                    setUserProfile(data);
                    // Auto-set state to user's state initially
                    if (data.profile?.state) {
                        setFilters(prev => ({ ...prev, state: data.profile.state }));
                    }
                }
            } catch (e) { }
        };
        fetchUser();
    }, []);

    // Fetch Schemes (Debounced search inside useEffect)
    const fetchSchemes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.set("search", filters.search);
            filters.category.forEach(c => params.append("category", c));
            params.set("schemeType", filters.schemeType);
            params.set("state", filters.state);
            filters.applicationMode.forEach(m => params.append("applicationMode", m));
            if (filters.deadline) params.set("deadline", filters.deadline);
            params.set("sortBy", filters.sortBy);
            params.set("page", filters.page.toString());

            const res = await fetch(`/api/schemes?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setSchemes(data.schemes);
                setTotal(data.total);
            }
        } catch (e) {
            toast.error("Failed to load schemes");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSchemes();
        }, 400); // 400ms debounce
        return () => clearTimeout(timer);
    }, [fetchSchemes]);

    const resetFilters = () => {
        setFilters({
            search: "",
            category: [],
            schemeType: "ALL",
            state: userProfile?.profile?.state || "ALL",
            applicationMode: [],
            deadline: "",
            sortBy: "relevance",
            page: 1,
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            {/* Search and Header Section */}
            <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-2xl relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search schemes by name or keywords..."
                            className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all shadow-sm"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-md px-3 h-11">
                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                            <select
                                className="bg-transparent text-sm focus:outline-none"
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            >
                                <option value="relevance">Sort by Relevance</option>
                                <option value="matchScore">Highest Match</option>
                                <option value="benefit">Highest Benefit</option>
                                <option value="deadline">Soonest Deadline</option>
                                <option value="recent">Recently Added</option>
                            </select>
                        </div>
                        <Button
                            variant="outline"
                            className="md:hidden h-11"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 py-8 md:px-8 flex gap-8">
                {/* Sidebar Filters */}
                <aside className={cn(
                    "fixed inset-0 z-20 bg-white p-6 md:relative md:inset-auto md:bg-transparent md:p-0 md:block transition-transform duration-300 w-64 flex-shrink-0 border-r md:border-none",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    <div className="md:sticky md:top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                        <div className="flex items-center justify-between md:hidden mb-6">
                            <h3 className="font-bold">Filters</h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <SchemeFilter
                            filters={filters}
                            setFilters={(f) => setFilters({ ...f, page: 1 })}
                            resetFilters={resetFilters}
                            userState={userProfile?.profile?.state}
                        />
                    </div>
                </aside>

                {/* Main Content: Results */}
                <main className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {loading ? "Searching..." : `Showing ${total} schemes`}
                        </p>
                        {userProfile?.completionPercentage < 80 && (
                            <div className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 flex items-center">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Complete profile (80%+) for AI Matching
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <SchemeSkeleton key={i} />)}
                        </div>
                    ) : schemes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {schemes.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)}
                        </div>
                    ) : (
                        <EmptyState onReset={resetFilters} />
                    )}

                    {/* Pagination (Simplified for now) */}
                    {total > filters.limit && !loading && (
                        <div className="flex justify-center pt-8 pb-12">
                            <Button
                                variant="outline"
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={schemes.length >= total}
                            >
                                Load More Results
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function X(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
