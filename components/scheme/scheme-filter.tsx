"use client";

import React from 'react';
import {
    X,
    ChevronDown,
    ChevronUp,
    Filter,
    RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStates } from '@/lib/india-data';
import { SchemeType, SchemeCategory } from '@prisma/client';
import { cn } from '@/lib/utils';

export interface FilterState {
    search: string;
    category: SchemeCategory[];
    schemeType: SchemeType | 'ALL';
    state: string;
    minBenefit: number;
    maxBenefit: number;
    deadline: 'anytime' | '1month' | '3months' | 'all';
}

interface SchemeFilterProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    onReset: () => void;
    activeCount: number;
}

const CATEGORIES: { label: string; value: SchemeCategory }[] = [
    { label: 'Education', value: 'EDUCATION' },
    { label: 'Agriculture', value: 'AGRICULTURE' },
    { label: 'Healthcare', value: 'HEALTHCARE' },
    { label: 'Housing', value: 'HOUSING' },
    { label: 'Entrepreneurship', value: 'ENTREPRENEURSHIP' },
    { label: 'Women & Child', value: 'WOMEN_CHILD' },
    { label: 'Disability', value: 'DISABILITY' },
    { label: 'Senior Citizen', value: 'SENIOR_CITIZEN' },
    { label: 'Employment', value: 'EMPLOYMENT' },
    { label: 'Skill Development', value: 'SKILL_DEVELOPMENT' },
];

const SCHEME_TYPES: { label: string; value: SchemeType | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Central', value: 'CENTRAL' },
    { label: 'State', value: 'STATE' },
    { label: 'Private', value: 'PRIVATE' },
    { label: 'NGO', value: 'NGO' },
];

export function SchemeFilter({ filters, onChange, onReset, activeCount }: SchemeFilterProps) {
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
        category: true,
        type: true,
        state: true,
        benefit: true,
        deadline: true
    });

    const toggleSection = (section: string) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCategoryChange = (val: SchemeCategory) => {
        const newCats = filters.category.includes(val)
            ? filters.category.filter(c => c !== val)
            : [...filters.category, val];
        onChange({ ...filters, category: newCats });
    };

    const states = getStates();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <h2 className="font-semibold text-lg">Filters</h2>
                    {activeCount > 0 && (
                        <Badge variant="default" className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                            {activeCount}
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-muted-foreground h-8 px-2 text-xs hover:text-primary"
                >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                </Button>
            </div>

            <div className="space-y-4">
                {/* Category Section */}
                <div className="border-b border-slate-100 pb-4">
                    <button
                        onClick={() => toggleSection('category')}
                        className="flex items-center justify-between w-full font-medium text-sm mb-2"
                    >
                        Categories
                        {expanded.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expanded.category && (
                        <div className="space-y-2 mt-3">
                            {CATEGORIES.map((cat) => (
                                <label key={cat.value} className="flex items-center gap-3 group cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                        checked={filters.category.includes(cat.value)}
                                        onChange={() => handleCategoryChange(cat.value)}
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                                        {cat.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scheme Type Section */}
                <div className="border-b border-slate-100 pb-4">
                    <button
                        onClick={() => toggleSection('type')}
                        className="flex items-center justify-between w-full font-medium text-sm mb-2"
                    >
                        Scheme Type
                        {expanded.type ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expanded.type && (
                        <div className="space-y-2 mt-3">
                            {SCHEME_TYPES.map((type) => (
                                <label key={type.value} className="flex items-center gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="schemeType"
                                        className="h-4 w-4 border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                        checked={filters.schemeType === type.value}
                                        onChange={() => onChange({ ...filters, schemeType: type.value })}
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                                        {type.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* State Section */}
                <div className="border-b border-slate-100 pb-4">
                    <button
                        onClick={() => toggleSection('state')}
                        className="flex items-center justify-between w-full font-medium text-sm mb-2"
                    >
                        State
                        {expanded.state ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expanded.state && (
                        <div className="mt-3">
                            <Select
                                value={filters.state}
                                onValueChange={(val) => onChange({ ...filters, state: val })}
                            >
                                <SelectTrigger className="w-full text-sm">
                                    <SelectValue placeholder="All States" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All States">All States</SelectItem>
                                    {states.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Benefit Amount Section */}
                <div className="border-b border-slate-100 pb-4">
                    <button
                        onClick={() => toggleSection('benefit')}
                        className="flex items-center justify-between w-full font-medium text-sm mb-2"
                    >
                        Benefit Amount (Up to)
                        {expanded.benefit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expanded.benefit && (
                        <div className="mt-4 px-2 space-y-4">
                            <input
                                type="range"
                                min="0"
                                max="500000"
                                step="10000"
                                value={filters.maxBenefit}
                                onChange={(e) => onChange({ ...filters, maxBenefit: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>₹0</span>
                                <span className="text-primary font-bold">₹{filters.maxBenefit.toLocaleString()}</span>
                                <span>₹5L+</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Deadline Section */}
                <div className="pb-4">
                    <button
                        onClick={() => toggleSection('deadline')}
                        className="flex items-center justify-between w-full font-medium text-sm mb-2"
                    >
                        Deadline
                        {expanded.deadline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expanded.deadline && (
                        <div className="space-y-2 mt-3">
                            {[
                                { label: 'All', value: 'all' },
                                { label: 'Apply Anytime', value: 'anytime' },
                                { label: 'Within 1 Month', value: '1month' },
                                { label: 'Within 3 Months', value: '3months' },
                            ].map((opt) => (
                                <label key={opt.value} className="flex items-center gap-3 group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deadline"
                                        className="h-4 w-4 border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                        checked={filters.deadline === opt.value}
                                        onChange={() => onChange({ ...filters, deadline: opt.value as any })}
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">
                                        {opt.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
