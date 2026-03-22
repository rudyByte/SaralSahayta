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
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{change.field}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 line-through decoration-slate-300 max-w-[120px] truncate" title={change.oldValue}>
                                {change.oldValue}
                            </span>
                            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-black text-emerald-600 max-w-[160px] truncate" title={change.newValue}>
                                {change.newValue}
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
