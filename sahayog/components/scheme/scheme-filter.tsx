"use client";

import { INDIAN_STATES } from "@/lib/india-data";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Will create
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Will create
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface SchemeFilterProps {
    filters: any;
    setFilters: (filters: any) => void;
    resetFilters: () => void;
    userState?: string;
}

const CATEGORIES = ["Education", "Agriculture", "Healthcare", "Housing", "Entrepreneurship", "Women", "Disability", "Senior Citizen", "Other"];
const TYPES = ["ALL", "CENTRAL", "STATE", "PRIVATE", "NGO"];
const MODES = ["ONLINE", "OFFLINE", "BOTH"];

export function SchemeFilter({ filters, setFilters, resetFilters, userState }: SchemeFilterProps) {
    const toggleCategory = (cat: string) => {
        const next = filters.category.includes(cat)
            ? filters.category.filter((c: string) => c !== cat)
            : [...filters.category, cat];
        setFilters({ ...filters, category: next });
    };

    const toggleMode = (mode: string) => {
        const next = filters.applicationMode.includes(mode)
            ? filters.applicationMode.filter((m: string) => m !== mode)
            : [...filters.applicationMode, mode];
        setFilters({ ...filters, applicationMode: next });
    };

    const activeCount =
        filters.category.length +
        (filters.schemeType !== "ALL" ? 1 : 0) +
        (filters.state !== "ALL" ? 1 : 0) +
        filters.applicationMode.length +
        (filters.deadline ? 1 : 0);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Filters</h2>
                {activeCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-auto p-0 text-primary hover:bg-transparent">
                        Reset All
                    </Button>
                )}
            </div>

            {/* Category */}
            <div className="space-y-4">
                <Label className="text-sm font-bold">Category</Label>
                <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                        <div key={cat} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`cat-${cat}`}
                                checked={filters.category.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">{cat}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scheme Type */}
            <div className="space-y-4">
                <Label className="text-sm font-bold">Scheme Type</Label>
                <div className="space-y-2">
                    {TYPES.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="schemeType"
                                id={`type-${type}`}
                                checked={filters.schemeType === type}
                                onChange={() => setFilters({ ...filters, schemeType: type })}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`type-${type}`} className="text-sm cursor-pointer capitalize">
                                {type === "ALL" ? "All Types" : type.toLowerCase()}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* State */}
            <div className="space-y-4">
                <Label className="text-sm font-bold">State / UT</Label>
                <select
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="ALL">All India</option>
                    {userState && <option value={userState}>{userState} (Your State)</option>}
                    {INDIAN_STATES.filter(s => s !== userState).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Application Mode */}
            <div className="space-y-4">
                <Label className="text-sm font-bold">Application Mode</Label>
                <div className="space-y-2">
                    {MODES.map(mode => (
                        <div key={mode} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`mode-${mode}`}
                                checked={filters.applicationMode.includes(mode)}
                                onChange={() => toggleMode(mode)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`mode-${mode}`} className="text-sm cursor-pointer capitalize">{mode.toLowerCase()}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Deadline */}
            <div className="space-y-4">
                <Label className="text-sm font-bold">Deadline</Label>
                <div className="space-y-2">
                    {[
                        { label: "Apply Anytime", value: "anytime" },
                        { label: "Within 1 Month", value: "1month" },
                        { label: "Within 3 Months", value: "3months" },
                    ].map(d => (
                        <div key={d.value} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="deadline"
                                id={`deadline-${d.value}`}
                                checked={filters.deadline === d.value}
                                onChange={() => setFilters({ ...filters, deadline: d.value })}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`deadline-${d.value}`} className="text-sm cursor-pointer">{d.label}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
