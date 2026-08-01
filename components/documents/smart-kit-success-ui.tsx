import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, Download, ArrowLeft, FileText, CheckCircle, Percent, HardDrive, Save } from 'lucide-react';

interface SmartKitSuccessUIProps {
  stats: {
    required: number;
    uploaded: number;
    validated: number;
    readiness: number;
  };
  onPreview: () => void;
  onDownload: () => void;
  onBack: () => void;
  onSaveToVault: () => void;
  isDownloading?: boolean;
}

export function SmartKitSuccessUI({ stats, onPreview, onDownload, onBack, onSaveToVault, isDownloading = false }: SmartKitSuccessUIProps) {
  return (
    <motion.div
      key="smart-kit-success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] py-8 w-full max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-slate-900">Smart Document Kit Ready</h2>
        <p className="text-lg text-slate-500">Your documents have been prepared successfully.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <FileText className="w-5 h-5 text-indigo-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.required}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 text-center">Required</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <CheckCircle className="w-5 h-5 text-blue-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.uploaded}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 text-center">Uploaded</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.validated}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 text-center">Validated</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <Percent className="w-5 h-5 text-amber-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.readiness}%</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 text-center">Readiness</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 col-span-2 md:col-span-1">
          <HardDrive className="w-5 h-5 text-purple-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">4.2 MB</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 text-center">Size</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row w-full gap-4 pt-4">
        <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onBack} disabled={isDownloading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scheme
        </Button>
        <Button variant="outline" className="flex-1 h-12 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={onPreview} disabled={isDownloading}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Kit
        </Button>
        <Button className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" onClick={onDownload} disabled={isDownloading}>
          {isDownloading ? (
            <div className="flex items-center">
               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
               Downloading...
            </div>
          ) : (
            <>
               <Download className="w-4 h-4 mr-2" />
               Download Kit
            </>
          )}
        </Button>
      </div>

      <Button className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white" onClick={onSaveToVault} disabled={isDownloading}>
        <Save className="w-4 h-4 mr-2" />
        Save to AI Document Vault
      </Button>
    </motion.div>
  );
}
