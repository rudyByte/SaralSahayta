'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PositiveStatsProps {
  appliedCount: number;
  approvedCount: number;
  totalBenefits: number;
  missedCount: number;
}

export function PositiveStats({
  appliedCount,
  approvedCount,
  totalBenefits,
  missedCount
}: PositiveStatsProps) {
  const successRate = appliedCount > 0 ? (approvedCount / appliedCount) * 100 : 0;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="p-5 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-colors shadow-sm flex flex-col justify-between group">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Applications</span>
          <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{appliedCount}</span>
              <span className="text-xs font-semibold text-slate-400 mb-1">Submitted</span>
          </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors shadow-sm flex flex-col justify-between group">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Successes</span>
          <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-slate-800 group-hover:text-blue-700 transition-colors">{approvedCount}</span>
              <span className="text-xs font-semibold text-slate-400 mb-1">Approved</span>
          </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-purple-100 hover:border-purple-200 transition-colors shadow-sm flex flex-col justify-between group">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Win Rate</span>
          <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-slate-800 group-hover:text-purple-700 transition-colors">{Math.round(successRate)}%</span>
              <span className="text-xs font-semibold text-slate-400 mb-1">Average</span>
          </div>
      </div>

      <div className="p-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl border-none shadow-md shadow-orange-500/20 flex flex-col justify-between group text-white">
          <span className="text-xs font-bold text-orange-50 uppercase tracking-wider mb-2 drop-shadow-sm">Total Benefits</span>
          <div className="flex items-baseline gap-1 break-words">
              <span className="text-2xl sm:text-3xl font-black drop-shadow-md">₹{totalBenefits.toLocaleString()}</span>
          </div>
      </div>
    </div>
  );
}
