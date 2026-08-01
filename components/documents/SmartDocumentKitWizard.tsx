'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, UploadCloud,
  FileText, ShieldCheck, Loader2, Download, Printer, Share2, Save,
  Sparkles, Eye, CheckCircle2, Check,
  AlertTriangle, Shield, RefreshCw, Zap, Award
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentValidationUI } from './document-validation-ui';
import { SmartKitProcessingUI } from './smart-kit-processing-ui';
import { SmartKitSuccessUI } from './smart-kit-success-ui';
import { SmartKitPreviewModal } from './smart-kit-preview-modal';
import { KitGeneratorService } from '@/lib/smart-document-kit/KitGeneratorService';
import { SmartKitDocument } from '@/lib/smart-document-kit/types';
import { supabase } from '@/lib/supabase';
import { downloadDocumentKit } from '@/lib/download-service';
import { toast } from 'sonner';

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
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [currentDocForValidation, setCurrentDocForValidation] = useState<{ req: RequiredDocument, doc: any } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [localFiles, setLocalFiles] = useState<Record<string, File>>({});
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [genTaskName, setGenTaskName] = useState('Initializing...');
  const [genProgress, setGenProgress] = useState(0);

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

  const processingTasks = [
    "Checking Required Documents",
    "Organizing Uploaded Files",
    "Auto Rotating Pages",
    "Removing Blank Pages",
    "Standardizing A4 Size",
    "Renaming Documents",
    "Compressing Files",
    "OCR Optimization",
    "Generating Cover Page",
    "Creating Table of Contents",
    "Arranging Documents in Government Order",
    "Preparing Final Application Kit"
  ];

  const generateMessages = [
    "Analyzing uploaded documents...",
    "Improving document quality...",
    "Optimizing page layout...",
    "Creating searchable PDF...",
    "Preparing professional application kit...",
    "Almost finished..."
  ];

  useEffect(() => {
    if (open) {
      setStep(1);
      setDocumentStatus(initialDocumentStatus);
      setValidating({});
      setGenerating(false);
      setCompletedTaskCount(0);
      setGeneratingMsgIndex(0);
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

  const handleUploadSuccess = (req: RequiredDocument, uploadedDoc: any, file?: File) => {
    if (file) {
      setLocalFiles(prev => ({ ...prev, [req.documentId]: file }));
    }
    setCurrentDocForValidation({ req, doc: uploadedDoc });
    setStep(3);
  };

  const handleValidationContinue = () => {
    if (!currentDocForValidation) return;
    const { req } = currentDocForValidation;

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
  };

  const handleValidationReplace = () => {
    setStep(2);
  };

  const handleGenerateClick = async () => {
    setGenerating(true);
    setGenTaskName('Checking files...');
    setGenProgress(5);

    try {
      const docsToProcess = requiredDocuments.filter(r => documentStatus[r.documentId]);

      const { data: userDocs } = await supabase
        .from('user_documents')
        .select('document_id, file_url, file_name')
        .in('document_id', docsToProcess.map(d => d.documentId));

      const kitDocs: SmartKitDocument[] = docsToProcess.map(req => {
        const localFile = localFiles[req.documentId];
        const remoteDoc = userDocs?.find(d => d.document_id === req.documentId);

        return {
          id: req.id,
          documentId: req.documentId,
          name: req.documents?.name || 'Document',
          isMandatory: req.isMandatory,
          status: 'Validated',
          file: localFile,
          url: remoteDoc?.file_url
        };
      });

      const requiredIds = requiredDocuments.filter(r => r.isMandatory).map(r => r.id);

      const stats = {
        required: requiredDocuments.length,
        uploaded: docsToProcess.length,
        validated: docsToProcess.length,
        readiness: 100
      };
      console.log("Documents sent to generator:", kitDocs);
      const pdfBlob = await KitGeneratorService.generateKit(
        schemeName,
        'John Doe (Mock)', // Usually fetched from profile
        kitDocs,
        stats,
        requiredIds,
        (taskName, progress) => {
          setGenTaskName(taskName);
          setGenProgress(progress);
        }
      );

      setGeneratedPdfBlob(pdfBlob);
      setGeneratedPdfUrl(URL.createObjectURL(pdfBlob));
      setStep(6);
      setGenerating(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate Kit');
      setGenerating(false);
    }
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
                className={`h-2 rounded-full transition-all duration-300 ${step === s || (step >= 5 && s === 5) ? 'w-8 bg-indigo-600' : step > s ? 'w-4 bg-indigo-200' : 'w-4 bg-slate-200'}`}
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
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Already Uploaded</span>
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
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle className="w-4 h-4 mr-1" /> Uploaded</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"><XCircle className="w-4 h-4 mr-1" /> Missing</Badge>
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
            {step === 3 && currentDocForValidation && (
              <AnimatePresence mode="wait">
                <DocumentValidationUI
                  document={currentDocForValidation.doc}
                  onReplace={handleValidationReplace}
                  onContinue={handleValidationContinue}
                />
              </AnimatePresence>
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
                            <span className="flex items-center text-sm font-bold text-emerald-600"><CheckCircle className="w-4 h-4 mr-1" /> Ready</span>
                          ) : (
                            <span className="flex items-center text-sm font-bold text-amber-500"><Clock className="w-4 h-4 mr-1" /> Needs Upload</span>
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
                      onClick={() => {
                        setStep(5);
                        handleGenerateClick();
                      }}
                    >
                      Generate Smart Document Kit
                    </Button>
                  </div>
                </motion.div>
              );
            })()}

            {/* STEP 5: AI Processing Screen */}
            {step === 5 && (
              <SmartKitProcessingUI
                onComplete={() => setStep(6)}
                currentTaskName={genTaskName}
                progress={genProgress}
              />
            )}

            {/* STEP 6: Final Success Screen */}
            {step === 6 && (() => {
              const uploadedCount = requiredDocuments.filter(r => documentStatus[r.documentId]).length;
              return (
                <>
                  <SmartKitSuccessUI
                    stats={{
                      required: requiredDocuments.length,
                      uploaded: uploadedCount,
                      validated: uploadedCount,
                      readiness: 100,
                    }}
                    onPreview={() => setPreviewOpen(true)}
                    onDownload={() => {
                      if (!generatedPdfBlob) return;
                      setIsDownloading(true);
                      try {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(generatedPdfBlob);
                        link.download = `Smart_Kit_${schemeName.replace(/\s+/g, '_')}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success('Document Kit Downloaded', {
                          description: 'Your Smart Document Kit has been downloaded successfully.'
                        });
                      } catch (error) {
                        toast.error('Failed to download document kit');
                      } finally {
                        setIsDownloading(false);
                      }
                    }}
                    onPrint={() => {
                      if (generatedPdfUrl) {
                        window.open(generatedPdfUrl);
                      }
                    }}
                    onShare={async () => {
                      if (!generatedPdfBlob) return;
                      try {
                        const file = new File([generatedPdfBlob], `Smart_Kit_${schemeName.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            title: 'Smart Document Kit',
                            text: `Application kit for ${schemeName}`,
                          });
                        } else {
                          toast.error('Sharing not supported on this browser');
                        }
                      } catch (e) {
                        console.error('Share failed', e);
                      }
                    }}
                    onBack={() => setOpen(false)}
                    onSaveToVault={() => setStep(7)}
                    isDownloading={isDownloading}
                  />

                  <SmartKitPreviewModal
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    schemeName={schemeName}
                    stats={{
                      required: requiredDocuments.length,
                      uploaded: uploadedCount,
                      validated: uploadedCount,
                      readiness: 100,
                    }}
                    documents={requiredDocuments.map(r => ({
                      name: r.documents?.name || 'Document',
                      status: documentStatus[r.documentId] ? 'Validated' : 'Missing',
                      isMandatory: r.isMandatory
                    }))}
                    pdfBlobUrl={generatedPdfUrl}
                  />
                </>
              );
            })()}

            {/* STEP 7: AI Universal Document Vault */}
            {step === 7 && (() => {
              const uploadedDocs = requiredDocuments.filter(r => documentStatus[r.documentId]);
              return (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="py-4 w-full"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Shield className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-extrabold text-slate-900">My AI Document Vault</h3>
                        <p className="text-slate-500 font-medium mt-1">Your secure, intelligent, and reusable document system</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => setStep(6)}>Back to Kit</Button>
                  </div>

                  {/* Dashboard Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Total Documents', value: uploadedDocs.length, color: 'text-indigo-600' },
                      { label: 'Verified', value: uploadedDocs.length, color: 'text-emerald-600' },
                      { label: 'Overall Health', value: '98%', color: 'text-emerald-600' },
                      { label: 'Reusable Schemes', value: '38', color: 'text-purple-600' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border rounded-2xl p-5 shadow-sm text-center transform transition-transform hover:scale-105"
                      >
                        <p className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* AI Suggestions */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Zap className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                        <h4 className="text-lg font-bold text-indigo-900">AI Insights & Suggestions</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { text: "Income Certificate expires in 12 days.", type: 'warning' },
                          { text: "Aadhaar is reusable for 42 schemes.", type: 'success' },
                          { text: "Your documents are ready for government submission.", type: 'success' },
                          { text: "Upload a higher quality scan for PAN Card.", type: 'info' }
                        ].map((sug, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className="flex items-start gap-3 bg-white/80 backdrop-blur p-4 rounded-xl shadow-sm border border-indigo-50/50 hover:bg-white transition-colors"
                          >
                            {sug.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" /> :
                              sug.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /> :
                                <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                            <p className="text-sm font-semibold text-slate-700">{sug.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-2 pb-10">
                    {uploadedDocs.map((doc, idx) => {
                      const healthScore = idx === 0 ? 85 : 98;
                      const expiryText = idx === 0 ? "Expires in 12 days" : "Expires in 2 years";
                      const expiryColor = idx === 0 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200";

                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + (idx * 0.1) }}
                          className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <ShieldCheck className="w-32 h-32" />
                          </div>
                          <div className="relative z-10 flex flex-col md:flex-row gap-6">

                            <div className="flex-1 space-y-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-xl font-bold text-slate-900">{doc.documents?.name}</h4>
                                <Badge className={expiryColor}>{expiryText}</Badge>
                                <Badge variant="outline" className="text-slate-500 border-slate-200">Issue Date: 12 Jan 2024</Badge>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {[
                                  { label: 'Government Verified', icon: <Award className="w-3 h-3 mr-1" /> },
                                  { label: 'AI Validated', icon: <Sparkles className="w-3 h-3 mr-1" /> },
                                  { label: 'OCR Ready', icon: <Eye className="w-3 h-3 mr-1" /> },
                                  { label: 'Cloud Ready', icon: <UploadCloud className="w-3 h-3 mr-1" /> },
                                  { label: 'Reusable', icon: <RefreshCw className="w-3 h-3 mr-1" /> }
                                ].map(badge => (
                                  <Badge key={badge.label} variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50">
                                    {badge.icon} {badge.label}
                                  </Badge>
                                ))}
                              </div>

                              <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <p className="text-xs font-bold text-slate-500 uppercase flex-shrink-0">Reusable In:</p>
                                <div className="flex flex-wrap gap-2">
                                  {['Scholarships', 'Education', 'Healthcare', 'Farmer Welfare'].map(r => (
                                    <span key={r} className="text-xs font-semibold bg-white border px-2.5 py-1 rounded-md text-slate-600 shadow-sm">{r}</span>
                                  ))}
                                  <span className="text-xs font-bold bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md text-purple-700">
                                    +34 Schemes
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="w-full md:w-56 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6">
                              <div className="text-center mb-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Health Score</p>
                              </div>
                              <div className="relative w-28 h-28 mb-3">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className={idx === 0 ? "text-amber-100" : "text-emerald-100"} />
                                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                                    strokeLinecap="round"
                                    className={`${idx === 0 ? "text-amber-500" : "text-emerald-500"} transition-all duration-1000 ease-out`}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-2xl font-extrabold text-slate-800">{healthScore}%</span>
                                </div>
                              </div>

                              {idx === 0 ? (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Signature slightly blurred
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
                                  <CheckCircle className="w-3.5 h-3.5" /> High Resolution
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })()}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
