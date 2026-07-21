import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const tasks = [
  "Checking document quality",
  "Detecting blurry images",
  "Reading uploaded documents",
  "Auto rotating pages",
  "Removing blank pages",
  "Compressing files",
  "Converting images into PDF",
  "Generating final Smart Document Kit"
];

interface AIProcessingProps {
  onComplete: () => void;
}

export function AIProcessing({ onComplete }: AIProcessingProps) {
  const [completedTaskCount, setCompletedTaskCount] = useState(0);

  useEffect(() => {
    let taskInterval: NodeJS.Timeout;
    taskInterval = setInterval(() => {
      setCompletedTaskCount((prev) => {
        if (prev < tasks.length) return prev + 1;
        clearInterval(taskInterval);
        setTimeout(() => {
          onComplete();
        }, 1000);
        return prev;
      });
    }, 1200); // 1.2s per task for a better viewing experience

    return () => clearInterval(taskInterval);
  }, [onComplete]);

  const percentage = Math.min(100, Math.round((completedTaskCount / tasks.length) * 100));

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto py-8 space-y-8">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-[pulse_2s_ease-in-out_infinite] absolute inset-0 m-auto" />
        <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin relative z-10" />
        <Sparkles className="w-10 h-10 text-indigo-600 absolute inset-0 m-auto z-20 animate-pulse" />
      </div>

      <div className="text-center w-full space-y-4">
        <h3 className="text-2xl font-bold text-slate-900 transition-all">
          Preparing Your Smart Document Kit
        </h3>
        <Progress value={percentage} className="h-3 bg-indigo-100 w-full rounded-full transition-all duration-500" />
      </div>

      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-[350px] overflow-hidden relative">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none" />
        
        <div className="space-y-3 relative z-0 flex flex-col justify-end">
          <AnimatePresence initial={false}>
            {tasks.map((task, idx) => {
              if (idx > completedTaskCount) return null;
              
              const isCompleted = idx < completedTaskCount;
              const isCurrent = idx === completedTaskCount;

              return (
                <motion.div
                  key={task}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: isCurrent ? 1 : 0.6, x: 0, height: 'auto' }}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100"
                >
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  )}
                  <span className={`font-semibold text-sm ${isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>
                    {task}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
