'use client';

import React from 'react';
import { detectProfileChanges } from '@/lib/profile/change-detector';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ProfileChangePreviewProps {
    currentProfile: any;
    extractedData: any;
    documentType: string;
}

export default function ProfileChangePreview({
    currentProfile,
    extractedData,
    documentType
}: ProfileChangePreviewProps) {
    const changes = detectProfileChanges(currentProfile, extractedData, documentType);
    
    if (changes.length === 0) {
        return (
            <div className="text-sm font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
                No automatic profile updates detected. Your document will simply be saved.
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
                {changes.map((change, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-white hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0 sm:w-1/3">
                            {change.field}
                        </span>
                        <div className="flex items-center sm:justify-end gap-2 sm:gap-4 flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-400 line-through decoration-slate-300 truncate text-right max-w-[50%]" title={typeof change.oldValue === 'object' ? JSON.stringify(change.oldValue) : change.oldValue}>
                                {typeof change.oldValue === 'object' ? (change.oldValue.english || change.oldValue.hindi || JSON.stringify(change.oldValue)) : change.oldValue}
                            </span>
                            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-black text-emerald-600 break-words text-right flex-1 sm:flex-none" title={typeof change.newValue === 'object' ? JSON.stringify(change.newValue) : change.newValue}>
                                {typeof change.newValue === 'object' ? (change.newValue.english || change.newValue.hindi || JSON.stringify(change.newValue)) : change.newValue}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            
            {changes.some(c => c.impactsEligibility) && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-indigo-100 p-2 rounded-lg shrink-0">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-xs font-bold text-indigo-800 leading-relaxed">
                        These updates will instantly recalculate your scheme matches. You may become uniquely eligible for new benefits!
                    </p>
                </div>
            )}
        </div>
    );
}
