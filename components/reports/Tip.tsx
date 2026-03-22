'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface TipProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}

export function Tip({ icon, title, description, action, onAction }: TipProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-colors gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100 text-primary shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm mb-0.5">{title}</h4>
          <p className="text-xs text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="shrink-0 rounded-lg text-primary border-primary/20 hover:bg-primary/5 font-semibold text-xs"
        onClick={onAction}
      >
        {action}
      </Button>
    </div>
  );
}
