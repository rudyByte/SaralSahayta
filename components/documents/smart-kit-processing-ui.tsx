import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

const messages = [
  "Preparing documents...",
  "Checking filenames...",
  "Compressing files...",
  "Removing blank pages...",
  "Optimizing PDFs...",
  "Arranging required documents...",
  "Generating application package...",
  "Encrypting package...",
  "Finalizing Smart Document Kit..."
];

interface SmartKitProcessingUIProps {
  onComplete: () => void;
}

export function SmartKitProcessingUI({ onComplete }: SmartKitProcessingUIProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Total duration: 8 seconds
    const totalDuration = 8000;
    const intervalTime = 50; // Update progress every 50ms for smoothness
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const currentProgress = (currentStep / steps) * 100;
      setProgress(Math.min(currentProgress, 100));

      if (currentStep >= steps) {
        clearInterval(progressInterval);
        setTimeout(() => onComplete(), 500); // slight delay after reaching 100%
      }
    }, intervalTime);

    const messageInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1200); // Change message every 1.2 seconds

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete]);

  return (
    <motion.div
      key="smart-kit-processing"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center justify-center min-h-[400px] py-10 w-full max-w-md mx-auto space-y-8"
    >
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-32 h-32 border-4 border-indigo-100 rounded-full absolute inset-0 m-auto" />
        <div className="w-32 h-32 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0 m-auto" />
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center z-10 animate-pulse">
          <Zap className="w-10 h-10 text-indigo-600" />
        </div>
      </div>
      
      <div className="text-center w-full space-y-4">
        <h3 className="text-2xl font-bold text-slate-900">Generating Kit</h3>
        <div className="h-6 overflow-hidden relative w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-indigo-600 font-medium absolute"
            >
              {messages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        
        <div className="pt-4">
          <Progress value={progress} className="h-3 bg-indigo-100 w-full rounded-full" />
          <p className="text-sm font-semibold text-slate-500 mt-2 text-right">{Math.round(progress)}%</p>
        </div>
      </div>
    </motion.div>
  );
}
