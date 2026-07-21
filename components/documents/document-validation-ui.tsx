import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, X, RefreshCw, ChevronRight } from 'lucide-react';
import { analyzeDocumentQuality, DocumentValidationResult } from '@/lib/validation/document-validation';

interface DocumentValidationUIProps {
  document: any;
  onReplace: () => void;
  onContinue: () => void;
}

const analyzingMessages = [
  "Checking Readability...",
  "Checking OCR...",
  "Checking Expiry...",
  "Checking Quality..."
];

export function DocumentValidationUI({ document, onReplace, onContinue }: DocumentValidationUIProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);
  const [result, setResult] = useState<DocumentValidationResult | null>(null);

  useEffect(() => {
    let msgInterval: NodeJS.Timeout;
    if (isAnalyzing) {
      msgInterval = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % analyzingMessages.length);
      }, 600);
      
      analyzeDocumentQuality(document).then(res => {
        setResult(res);
        setIsAnalyzing(false);
        clearInterval(msgInterval);
      });
    }
    
    return () => clearInterval(msgInterval);
  }, [document, isAnalyzing]);

  if (isAnalyzing) {
    return (
      <motion.div
        key="analyzing"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="flex flex-col items-center justify-center min-h-[400px] py-10 w-full max-w-md mx-auto space-y-6"
      >
        <div className="w-full text-center space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">Analyzing Document...</h3>
          <p className="text-indigo-600 font-medium h-6 transition-all">
            {analyzingMessages[msgIndex]}
          </p>
          <Progress value={((msgIndex + 1) / analyzingMessages.length) * 100} className="h-2 bg-indigo-100" />
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  let colorClass = 'text-emerald-500';
  let bgClass = 'text-emerald-100';
  if (result.score < 80 && result.score >= 50) {
    colorClass = 'text-yellow-500';
    bgClass = 'text-yellow-100';
  } else if (result.score < 50) {
    colorClass = 'text-rose-500';
    bgClass = 'text-rose-100';
  }

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] py-6 w-full max-w-md mx-auto"
    >
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Overall Score</h3>
      
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className={bgClass} />
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (251.2 * result.score) / 100}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${colorClass.replace('text-', 'text-')}`}>{result.score}%</span>
        </div>
      </div>

      <div className="w-full space-y-3 mb-8">
        {result.checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
            {check.passed ? (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4" />
              </div>
            )}
            <span className={`font-semibold text-sm ${check.passed ? 'text-slate-700' : 'text-slate-700'}`}>
              {check.title}
            </span>
          </div>
        ))}
      </div>

      <div className="flex w-full gap-4">
        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={onReplace}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Replace Document
        </Button>
        <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" onClick={onContinue}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
