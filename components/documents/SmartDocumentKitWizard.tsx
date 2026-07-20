'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, UploadCloud, 
  FileText, ShieldCheck, Loader2, Download, Printer, Share2, Save
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DocumentUpload } from '@/components/documents/document-upload';

interface RequiredDocument {
  id: string;
  documentId: string;
  isMandatory: boolean;
  documents?: {
    name: string;
    code: string;
  };
}

interface SmartDocumentKitWizardProps {
  schemeName: string;
  requiredDocuments: RequiredDocument[];
  initialDocumentStatus: Record<string, boolean>;
}

export function SmartDocumentKitWizard({ 
  schemeName, 
  requiredDocuments, 
  initialDocumentStatus 
}: SmartDocumentKitWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [documentStatus, setDocumentStatus] = useState(initialDocumentStatus);
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingMsgIndex, setGeneratingMsgIndex] = useState(0);

  const missingMandatoryDocs = requiredDocuments.filter(
    req => req.isMandatory && !documentStatus[req.documentId]
  );
  
  const hasMissingDocs = missingMandatoryDocs.length > 0;

  const generateMessages = [
    "Checking Documents...",
    "Preparing Files...",
    "Optimizing PDFs...",
    "Generating Smart Kit...",
    "Almost Ready..."
  ];

  useEffect(() => {
    if (open) {
      setStep(1);
      setDocumentStatus(initialDocumentStatus);
      setValidating({});
      setGenerating(false);
    }
  }, [open, initialDocumentStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setGeneratingMsgIndex((prev) => {
          if (prev < generateMessages.length - 1) return prev + 1;
          clearInterval(interval);
          setGenerating(false);
          setStep(5);
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const handleUploadSuccess = (req: RequiredDocument, uploadedDoc: any) => {
    // Show validation step
    setStep(3);
    setValidating({ ...validating, [req.documentId]: true });
    
    // Mock validation process
    setTimeout(() => {
      setValidating(prev => ({ ...prev, [req.documentId]: false }));
      setDocumentStatus(prev => ({ ...prev, [req.documentId]: true }));
      
      // Check if all mandatory documents are now uploaded
      const remainingMissing = requiredDocuments.filter(
        r => r.isMandatory && r.documentId !== req.documentId && !documentStatus[r.documentId]
      );
      
      if (remainingMissing.length === 0) {
        setStep(4);
      } else {
        setStep(2);
      }
    }, 2500);
  };

  const handleGenerateClick = () => {
    setGenerating(true);
    setGeneratingMsgIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 text-white transition-all active:scale-95 group">
          <FileText className="mr-2 w-5 h-5 group-hover:-rotate-12 transition-transform" />
          Generate Smart Document Kit
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-50">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Smart Document Kit
          </DialogTitle>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-indigo-600' : step > s ? 'w-4 bg-indigo-200' : 'w-4 bg-slate-200'}`} 
              />
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[400px] relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Document Checklist */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900">Required Documents for {schemeName}</h3>
                  <p className="text-slate-500">Let's check if you have everything needed to apply.</p>
                </div>

                <div className="space-y-3">
                  {requiredDocuments.map((req) => {
                    const isUploaded = documentStatus[req.documentId];
                    return (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3">
                          {isUploaded ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : req.isMandatory ? (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{req.documents?.name || 'Document'}</p>
                            <Badge variant="outline" className={req.isMandatory ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-500 bg-slate-50 border-slate-200'}>
                              {req.isMandatory ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {isUploaded ? (
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Already Uploaded</span>
                          ) : (
                            <span className={req.isMandatory ? 'text-rose-600 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                              {req.isMandatory ? <><XCircle className="w-4 h-4" /> Missing</> : <><Clock className="w-4 h-4" /> Pending Upload</>}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 flex justify-end">
                  <Button 
                    size="lg" 
                    className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => hasMissingDocs ? setStep(2) : setStep(4)}
                  >
                    {hasMissingDocs ? 'Upload Missing Documents' : 'Continue to Finalize'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Upload Documents */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2 mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Upload Missing Documents</h3>
                  <p className="text-slate-500">Please provide the remaining required documents.</p>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 pb-10">
                  {missingMandatoryDocs.map((req) => (
                    <div key={req.id} className="p-5 bg-white border rounded-2xl shadow-sm space-y-4">
                      <DocumentUpload 
                        documentCode={req.documents?.code || 'DOC'}
                        documentName={req.documents?.name || 'Required Document'}
                        onUploadSuccess={(doc) => handleUploadSuccess(req, doc)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: AI Validation (UI Only) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-8 py-10"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-pulse absolute inset-0 m-auto" />
                  <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin relative z-10" />
                  <UploadCloud className="w-10 h-10 text-indigo-600 absolute inset-0 m-auto z-20" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Waiting for AI Validation</h3>
                  <p className="text-slate-500">Analyzing your document for quality and completeness...</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md text-left mt-8">
                  {['Correct Document', 'Readable', 'Not Blurry', 'Complete', 'Not Expired'].map((check, i) => (
                    <div key={check} className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm text-sm font-medium text-slate-700 opacity-50 animate-pulse" style={{ animationDelay: `${i * 150}ms`}}>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      {check}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Completion / Generate */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center min-h-[350px] text-center space-y-6"
              >
                {!generating ? (
                  <>
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-slate-900">🎉 All Required Documents Ready</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        You have successfully provided all documents. We are ready to compile your Smart Document Kit.
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="mt-8 rounded-2xl h-14 px-8 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                      onClick={handleGenerateClick}
                    >
                      <FileText className="mr-2 w-5 h-5" />
                      Generate Smart Document Kit
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900 transition-all duration-300">
                      {generateMessages[generatingMsgIndex]}
                    </h3>
                    <div className="w-full max-w-sm mt-8">
                      <Progress value={(generatingMsgIndex / (generateMessages.length - 1)) * 100} className="h-2 bg-indigo-100" />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 5: Final Screen */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                  <FileText className="w-12 h-12 -rotate-12" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-slate-900">Application Kit Ready</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Your documents have been perfectly aligned, compressed, and organized according to government standards.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                  <Button disabled variant="outline" className="h-14 rounded-xl border-slate-200">
                    <Download className="mr-2 w-4 h-4" /> Download PDF
                  </Button>
                  <Button disabled variant="outline" className="h-14 rounded-xl border-slate-200">
                    <Printer className="mr-2 w-4 h-4" /> Print
                  </Button>
                  <Button disabled variant="outline" className="h-14 rounded-xl border-slate-200">
                    <Share2 className="mr-2 w-4 h-4" /> Share
                  </Button>
                  <Button disabled variant="outline" className="h-14 rounded-xl border-slate-200">
                    <Save className="mr-2 w-4 h-4" /> Save for Future
                  </Button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-200 inline-block w-full">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-bold px-4 py-1.5 text-sm border border-indigo-100">
                    Coming in Phase 2
                  </Badge>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
