'use client';

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

interface ReadinessChartProps {
  readyCount: number;
  missingCount: number;
}

const COLORS = ['#10b981', '#f43f5e'];

export default function ReadinessChart({ readyCount, missingCount }: ReadinessChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = [
    { name: 'Ready to Apply', value: readyCount },
    { name: 'Missing Docs', value: missingCount },
  ];

  if (!isMounted) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse">
        <div className="text-slate-300 text-xs font-medium uppercase tracking-widest">Loading Visualization...</div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} Schemes`, '']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
