'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { estimateImageQuality, extractTextFromImage, type OCRProgress, type OCRResult } from '@/lib/ocr/tesseract-ocr';
import useSWR, { useSWRConfig } from 'swr';
import ProfileChangePreview from './ProfileChangePreview';
import { detectProfileChanges } from '@/lib/profile/change-detector';

interface OCRDocumentUploadProps {
    documentCode: string;
    documentName: string;
    onDataExtracted: (data: any) => void;
    onUploadComplete: () => void;
    maxSize?: number;
}

export default function OCRDocumentUpload({
    documentCode,
    documentName,
    onDataExtracted,
    onUploadComplete,
    maxSize = 10 * 1024 * 1024 // 10MB
}: OCRDocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [ocrProgress, setOcrProgress] = useState<OCRProgress>({ status: '', progress: 0 });
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [qualityCheck, setQualityCheck] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    const [detectedType, setDetectedType] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { data: userProfile, mutate: mutateProfile } = useSWR('/api/profile');
    const { mutate: globalMutate } = useSWRConfig();

    const onDrop = async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setError(null);
        setFile(selectedFile);
        setExtractedData(null);
        setDetectedType(null);

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);

        // Check quality
        const quality = await estimateImageQuality(selectedFile);
        setQualityCheck(quality);
        
        // Auto-trigger OCR processing
        processOCR(selectedFile);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp']
        },
        maxSize,
        multiple: false
    });

    const processOCR = async (targetFile: File) => {
        if (!targetFile) return;

        setOcrStatus('processing');
        setError(null);
        setOcrProgress({ status: 'Reading document text...', progress: 0.1 });

        try {
            const ocrRes = await extractTextFromImage(targetFile, 'eng+hin', (prog) => {
                setOcrProgress({ status: prog.status, progress: 0.1 + (prog.progress * 0.4) });
            });

            setOcrProgress({ status: 'AI is analyzing text...', progress: 0.6 });

            const response = await fetch('/api/documents/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ocrText: ocrRes.text,
                    documentType: documentCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.expected && errorData.detected) {
                    throw {
                        isValidationError: true,
                        expected: errorData.expected,
                        detected: errorData.detected,
                        message: errorData.message
                    };
                }
                throw new Error(errorData.message || 'AI Extraction failed');
            }

            const result = await response.json();
            console.log('🚀 [AI-OCR] Result Received:', result.extractedData);
            
            setOcrProgress({ status: 'Finalizing...', progress: 0.9 });
            setOcrResult({
                text: result.text || '',
                confidence: result.confidence || 90,
                words: [],
                language: 'eng+hin',
                processingTime: 0
            });

            setDetectedType(result.extractedData?.documentType || documentCode);
            setExtractedData(result.extractedData);
            setOcrStatus('success');

            // Notify parent component
            if (result.extractedData) {
                onDataExtracted({
                    ...result.extractedData,
                    ocrConfidence: result.confidence,
                    ocrText: result.text,
                    detectedType: result.extractedData?.documentType || documentCode
                });
            }

        } catch (err: any) {
            console.error('OCR Error:', err);
            if (err.isValidationError) {
                setError(err);
                // Reject and delete uploaded file from state
                setFile(null);
                setPreview(null);
                setOcrStatus('idle');
            } else {
                setError(err.message || 'AI extraction failed. Please try again or fill manually.');
                setOcrStatus('error');
            }
        }
    };

    const handleUpload = async () => {
        if (!file || !extractedData) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentCode', documentCode);
            formData.append('ocrData', JSON.stringify({
                text: ocrResult?.text,
                confidence: ocrResult?.confidence,
                extractedData,
                detectedType
            }));

            const response = await fetch('/api/documents/upload-with-ocr', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProfileAndUpload = async () => {
        if (!userProfile || !extractedData) return;
        
        setIsUploading(true);
        try {
            // STRICT VALIDATION FIX: 
            // Execute the document upload first. The backend performs strict OCR validation.
            // If the document is a mismatch, it returns a 400 error which handleUpload catches.
            // This guarantees the upload stops immediately, no duplicate is saved, 
            // and the profile is NEVER updated with wrong data.
            const success = await handleUpload();
            if (!success) {
                return; // Stop processing. The error is already set by handleUpload.
            }

            // Profile update only happens if document validation succeeded
            const changes = detectProfileChanges(userProfile, extractedData, detectedType || documentCode);
            
            // Helper to safely extract string from potential multilingual object
            const getString = (val: any): string => {
                if (!val) return '';
                if (typeof val === 'object') return String(val.english || val.hindi || Object.values(val)[0] || '');
                return String(val);
            };

            if (changes.length > 0) {
                const updatePayload: any = {};
                
                // Map extracted data to profile schema fields (camelCase)
                if (extractedData.annualIncome) {
                    const str = getString(extractedData.annualIncome);
                    updatePayload.annualIncome = parseInt(str.replace(/[^0-9]/g, '')) || 0;
                }
                
                if (extractedData.dateOfBirth) {
                    // Try to convert DD/MM/YYYY to ISO YYYY-MM-DD
                    const dateStr = getString(extractedData.dateOfBirth);
                    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
                    if (parts.length === 3) {
                        if (parts[2].length === 4) {
                            updatePayload.dateOfBirth = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        } else if (parts[0].length === 4) {
                            updatePayload.dateOfBirth = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                        }
                    } else {
                        updatePayload.dateOfBirth = dateStr;
                    }
                }
                
                if (extractedData.gender) {
                    const gender = getString(extractedData.gender).toUpperCase();
                    if (['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
                        updatePayload.gender = gender;
                    } else {
                        updatePayload.gender = 'OTHER';
                    }
                }
                
                if (extractedData.name) {
                    updatePayload.name = getString(extractedData.name);
                }
                
                // Map Course/Education
                if (extractedData.course) {
                    const course = getString(extractedData.course).toUpperCase();
                    if (course.includes('DEGREE') || course.includes('B.A') || course.includes('B.SC') || course.includes('B.COM') || course.includes('GRADUATE')) {
                        updatePayload.education = 'GRADUATE';
                    } else if (course.includes('MASTER') || course.includes('M.A') || course.includes('M.SC') || course.includes('M.COM') || course.includes('POSTGRADUATE')) {
                        updatePayload.education = 'POSTGRADUATE';
                    } else if (course.includes('12TH') || course.includes('HSC')) {
                        updatePayload.education = 'CLASS_12TH';
                    } else if (course.includes('10TH') || course.includes('SSC')) {
                        updatePayload.education = 'CLASS_10TH';
                    }
                }

                if (Object.keys(updatePayload).length > 0) {
                    const res = await fetch('/api/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatePayload)
                    });
                    
                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.error || 'Failed to update profile');
                    }
                    await mutateProfile(); // refresh profile cache
                }
            }
            
            // Globally revalidate all confidence/scheme/document SWR caches
            await globalMutate(
                (key: any) => typeof key === 'string' && (
                    key.includes('/api/schemes') ||
                    key.includes('/confidence') ||
                    key.includes('/api/documents') ||
                    key.includes('scheme_matches')
                ),
                undefined,
                { revalidate: true }
            );
            onUploadComplete();
        } catch(err: any) {
             console.error('Profile/Upload Error:', err);
             setError(err.message || 'Operation failed');
             setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            {!file && (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">
                        {isDragActive ? 'Drop file here' : 'Fast Upload with AI OCR'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                        Drag & drop or click to upload your {documentName}. We'll automatically extract your details.
                    </p>
                    <p className="mt-4 text-xs font-medium text-slate-400">
                        JPG, PNG, WEBP up to 10MB
                    </p>
                </div>
            )}

            {/* File Preview & OCR */}
            {file && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Preview */}
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Document Preview
                            </h3>
                            <div className="relative aspect-[3/4] sm:aspect-[4/3] rounded-lg border border-slate-200 bg-white overflow-hidden shadow-inner flex items-center justify-center">
                                {preview ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
                                )}
                            </div>
                            <div className="mt-4 p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]">{file.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            {/* Quality Check */}
                            {qualityCheck && (
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-600 uppercase">Image Quality</span>
                                        <span className={`text-xs font-bold ${qualityCheck.score >= 80 ? 'text-emerald-600' :
                                            qualityCheck.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                                            }`}>
                                            {qualityCheck.score}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${qualityCheck.score >= 80 ? 'bg-emerald-500' :
                                                qualityCheck.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}
                                            style={{ width: `${qualityCheck.score}%` }}
                                        />
                                    </div>

                                    {qualityCheck.issues.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {(qualityCheck.issues as string[]).map((issue: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-[11px] text-rose-600 font-medium">
                                                    <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <span>{issue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {qualityCheck.warnings.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {(qualityCheck.warnings as string[]).map((warning: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-[11px] text-amber-600 font-medium">
                                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <span>{warning}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* OCR Results */}
                        <div className="p-6 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CheckCircle className={`h-4 w-4 ${ocrStatus === 'success' ? 'text-emerald-500' : 'text-slate-300'}`} />
                                AI Extraction Results
                            </h3>

                            <div className="flex-1">
                                {ocrStatus === 'processing' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                        <div className="relative mb-6">
                                            <div className="h-20 w-20 rounded-full border-4 border-slate-100" />
                                            <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                            <div className="absolute top-0 left-0 h-20 w-20 flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">{Math.round((ocrProgress.progress || 0) * 100)}%</span>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">{ocrProgress.status || 'Initializing...'}</h4>
                                        <p className="mt-2 text-xs text-slate-500">AI is reading your document text</p>
                                        <div className="mt-6 w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-300"
                                                style={{ width: `${(ocrProgress.progress || 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {ocrStatus === 'success' && extractedData && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 mb-6 flex items-center gap-3">
                                            <div className="bg-indigo-500 p-1.5 rounded-full">
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-indigo-800 tracking-tight">AI ADVANCED EXTRACTION</p>
                                                <p className="text-[10px] text-indigo-600 font-medium tracking-tight">Smart Accuracy: {Math.round(ocrResult?.confidence || 0)}%</p>
                                            </div>
                                        </div>

                                        {detectedType && detectedType !== 'UNKNOWN' && (
                                            <div className="mb-4 inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                                                Detected: {detectedType}
                                            </div>
                                        )}

                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {Object.entries(extractedData || {}).map(([key, value]) => (
                                                <div key={key} className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <span className={`text-xs font-bold break-words ${value ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                        {value ? (typeof value === 'object' ? ((value as any).english || (value as any).hindi || JSON.stringify(value)) : (value as string)) : 'Not found'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {userProfile && extractedData && (
                                            <div className="mt-6 border-t border-slate-100 pt-6">
                                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    Profile Update Preview
                                                </h4>
                                                <ProfileChangePreview 
                                                    currentProfile={userProfile}
                                                    extractedData={extractedData}
                                                    documentType={detectedType || documentCode}
                                                />
                                            </div>
                                        )}

                                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={handleUpdateProfileAndUpload}
                                                disabled={isUploading}
                                                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold text-sm shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4" />
                                                        Update Profile & Save
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <button
                                                onClick={() => setOcrStatus('idle')}
                                                disabled={isUploading}
                                                className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase transition-all"
                                            >
                                                Cancel & Scan Again
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {ocrStatus === 'error' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                        <div className="bg-rose-50 p-4 rounded-full mb-4">
                                            <XCircle className="h-10 w-10 text-rose-500" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 uppercase">Extraction Failed</h4>
                                        <p className="mt-2 text-xs text-rose-600 px-6 font-medium">{typeof error === 'string' ? error : 'An unexpected error occurred'}</p>
                                        <button
                                            onClick={() => file && processOCR(file)}
                                            className="mt-6 px-8 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-semibold text-sm shadow-lg"
                                        >
                                            Try Again
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setPreview(null);
                                                setOcrStatus('idle');
                                            }}
                                            className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase"
                                        >
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 font-medium">
                            OCR is performed locally in your browser for privacy. No document data is stored until you confirm.
                        </p>
                        <button
                            onClick={() => {
                                setFile(null);
                                setPreview(null);
                                setOcrStatus('idle');
                                setExtractedData(null);
                                setError(null);
                                setDetectedType(null);
                            }}
                            disabled={isUploading || ocrStatus === 'processing'}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase px-3 py-1"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && (
                error.isValidationError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in zoom-in duration-300 shadow-sm mt-4">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-rose-200/50">
                            <XCircle className="h-5 w-5 text-rose-600" />
                            <h4 className="text-sm font-bold text-rose-700 uppercase tracking-wide">Wrong Document Uploaded</h4>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-3">
                            <div className="flex-1 bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected</p>
                                <p className="text-sm font-bold text-emerald-600">{error.expected}</p>
                            </div>
                            <div className="flex-1 bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detected</p>
                                <p className="text-sm font-bold text-rose-600">{error.detected}</p>
                            </div>
                        </div>
                        
                        <p className="text-xs text-rose-700 font-medium bg-rose-100/50 p-2.5 rounded-lg border border-rose-100">
                            {error.message || `Expected ${error.expected} but detected ${error.detected}.`}
                        </p>
                    </div>
                ) : (
                    typeof error === 'string' && ocrStatus !== 'error' && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold animate-in fade-in zoom-in duration-300 flex items-center gap-3 mt-4">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )
                )
            )}
        </div>
    );
}
