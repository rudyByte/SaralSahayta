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
  const [valMsgIndex, setValMsgIndex] = useState(0);

  const missingMandatoryDocs = requiredDocuments.filter(
    req => req.isMandatory && !documentStatus[req.documentId]
  );
  
  const hasMissingDocs = missingMandatoryDocs.length > 0;

  const validationMessages = [
    "Checking document quality...",
    "Preparing OCR...",
    "Optimizing pages...",
    "Validating readability...",
    "Almost done..."
  ];

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
    if (Object.values(validating).some(v => v)) {
      interval = setInterval(() => {
        setValMsgIndex(prev => (prev + 1) % validationMessages.length);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [validating, validationMessages.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setGeneratingMsgIndex((prev) => {
          if (prev < generateMessages.length - 1) return prev + 1;
          clearInterval(interval);
          setGenerating(false);
          setStep(6); // Go to final success screen
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [generating, generateMessages.length]);

  const handleUploadSuccess = (req: RequiredDocument, uploadedDoc: any) => {
    // Show validation step
    setStep(3);
    setValidating({ ...validating, [req.documentId]: true });
    setValMsgIndex(0);
    
    // Mock validation process
    setTimeout(() => {
      setValidating(prev => ({ ...prev, [req.documentId]: false }));
      const newStatus = { ...documentStatus, [req.documentId]: true };
      setDocumentStatus(newStatus);
      
      const remainingMissing = requiredDocuments.filter(
        r => r.isMandatory && !newStatus[r.documentId]
      );
      
      if (remainingMissing.length === 0) {
        setStep(4);
      } else {
        setStep(2);
      }
    }, 3000);
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
                className={`h-2 rounded-full transition-all duration-300 ${step === s || (step === 6 && s === 5) ? 'w-8 bg-indigo-600' : step > s ? 'w-4 bg-indigo-200' : 'w-4 bg-slate-200'}`} 
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
                <div className="space-y-2 mb-6 text-center">
                  <h3 className="text-2xl font-bold text-slate-900">Upload Documents</h3>
                  <p className="text-slate-500">Provide the required documents to complete your application.</p>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 pb-10">
                  {requiredDocuments.filter(r => r.isMandatory).map((req) => {
                    const isUploaded = documentStatus[req.documentId];
                    return (
                      <div key={req.id} className="p-5 bg-white border rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <div>
                            <h4 className="font-semibold text-slate-800">{req.documents?.name || 'Required Document'}</h4>
                            <p className="text-sm text-slate-500">Mandatory for {schemeName}</p>
                          </div>
                          {isUploaded ? (
                             <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle className="w-4 h-4 mr-1"/> Uploaded</Badge>
                          ) : (
                             <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"><XCircle className="w-4 h-4 mr-1"/> Missing</Badge>
                          )}
                        </div>
                        
                        {!isUploaded ? (
                          <DocumentUpload 
                            documentCode={req.documents?.code || 'DOC'}
                            documentName={req.documents?.name || 'Required Document'}
                            onUploadSuccess={(doc) => handleUploadSuccess(req, doc)}
                          />
                        ) : (
                          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-700">{req.documents?.name}.pdf</p>
                                <p className="text-xs text-slate-400">Ready for processing</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                setDocumentStatus(prev => ({ ...prev, [req.documentId]: false }));
                            }}>
                              Replace File
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setStep(4)}
                  >
                    View Readiness Summary
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: AI Validation Screen */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center min-h-[400px] py-10"
              >
                <div className="relative mb-8">
                  <div className="w-28 h-28 border-4 border-indigo-100 rounded-full animate-[pulse_2s_ease-in-out_infinite] absolute inset-0 m-auto" />
                  <div className="w-28 h-28 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin relative z-10" />
                  <ShieldCheck className="w-12 h-12 text-indigo-600 absolute inset-0 m-auto z-20" />
                </div>
                
                <div className="text-center space-y-2 mb-10">
                  <h3 className="text-2xl font-bold text-slate-900">AI Validation in Progress</h3>
                  <p className="text-indigo-600 font-medium h-6 transition-all">
                    {validationMessages[valMsgIndex]}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-lg mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  {[
                    'Correct File Type', 
                    'Size OK',
                    'Readable', 
                    'Not Blurry', 
                    'Proper Orientation', 
                    'OCR Ready'
                  ].map((check, i) => (
                    <div key={check} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm text-sm font-semibold text-slate-700 animate-pulse" style={{ animationDelay: `${i * 200}ms`}}>
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      {check}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Document Readiness Summary */}
            {step === 4 && (() => {
              const totalRequired = requiredDocuments.filter(r => r.isMandatory).length;
              const uploadedCount = requiredDocuments.filter(r => r.isMandatory && documentStatus[r.documentId]).length;
              const missingCount = totalRequired - uploadedCount;
              const percentage = totalRequired === 0 ? 100 : Math.round((uploadedCount / totalRequired) * 100);
              
              let progressColor = 'text-rose-500';
              let progressBg = 'text-rose-100';
              if (percentage >= 80) {
                progressColor = 'text-emerald-500';
                progressBg = 'text-emerald-100';
              } else if (percentage >= 40) {
                progressColor = 'text-amber-500';
                progressBg = 'text-amber-100';
              }

              return (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 py-4"
                >
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Document Readiness Summary</h3>
                    <p className="text-slate-500">Overview of your application documents.</p>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                    {/* Circular Progress */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className={progressBg} />
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                          strokeLinecap="round"
                          className={`${progressColor} transition-all duration-1000 ease-out`}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-800">{percentage}%</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Ready</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                        <p className="text-3xl font-bold text-slate-800">{totalRequired}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase mt-1">Total Required</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                        <p className="text-3xl font-bold text-indigo-600">{uploadedCount}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase mt-1">Uploaded</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border text-center col-span-2 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold text-rose-500">{missingCount}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase mt-1">Missing Documents</p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="max-h-[30vh] overflow-y-auto space-y-2 border rounded-xl p-4 bg-white">
                    {requiredDocuments.filter(r => r.isMandatory).map(req => {
                      const isUp = documentStatus[req.documentId];
                      return (
                        <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
                          <span className="font-medium text-slate-700">{req.documents?.name}</span>
                          {isUp ? (
                            <span className="flex items-center text-sm font-bold text-emerald-600"><CheckCircle className="w-4 h-4 mr-1"/> Ready</span>
                          ) : (
                            <span className="flex items-center text-sm font-bold text-amber-500"><Clock className="w-4 h-4 mr-1"/> Needs Upload</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="ghost" onClick={() => setStep(2)}>Back to Upload</Button>
                    <Button 
                      disabled={missingCount > 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-8 disabled:opacity-50"
                      onClick={() => setStep(5)}
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              );
            })()}

            {/* STEP 5: Generate Smart Document Kit */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 py-6"
              >
                {!generating ? (
                  <>
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl rotate-3 flex items-center justify-center mb-2 border border-indigo-100 shadow-sm">
                      <FileText className="w-10 h-10 -rotate-3" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Smart Document Kit</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        Ready to process your documents with AI to create a flawless application kit.
                      </p>
                    </div>

                    <div className="bg-white border rounded-2xl p-6 shadow-sm w-full max-w-md text-left space-y-4 my-6">
                      <h4 className="font-bold text-slate-800 border-b pb-2">Included Features:</h4>
                      <ul className="space-y-3">
                        {[
                          'Merge documents into one PDF',
                          'Auto rotate pages',
                          'Remove blank pages',
                          'OCR Optimization',
                          'Ready for Government Portal'
                        ].map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center w-full max-w-md pt-2">
                      <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
                      <Button 
                        size="lg"
                        className="rounded-xl h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                        onClick={handleGenerateClick}
                      >
                        <Save className="mr-2 w-5 h-5" />
                        Generate Smart Kit Now
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto py-12">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-pulse absolute inset-0 m-auto" />
                      <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin relative z-10" />
                      <FileText className="w-10 h-10 text-indigo-600 absolute inset-0 m-auto z-20 animate-bounce" />
                    </div>
                    
                    <div className="text-center w-full space-y-4">
                      <h3 className="text-2xl font-bold text-slate-900 transition-all">
                        {generateMessages[generatingMsgIndex]}
                      </h3>
                      <Progress value={((generatingMsgIndex + 1) / generateMessages.length) * 100} className="h-3 bg-indigo-100 w-full rounded-full" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 w-full opacity-60 mt-4">
                       <div className="h-2 bg-slate-200 rounded-full animate-pulse"></div>
                       <div className="h-2 bg-slate-200 rounded-full animate-pulse delay-75"></div>
                       <div className="h-2 bg-slate-200 rounded-full animate-pulse delay-150"></div>
                       <div className="h-2 bg-slate-200 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 6: Final Success Screen */}
            {step === 6 && (
              <motion.div
                key="step6"
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
                    Ready for Portal Upload
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
