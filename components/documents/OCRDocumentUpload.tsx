'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { extractTextFromImage, estimateImageQuality, preprocessImage, type OCRResult, type OCRProgress } from '@/lib/ocr/tesseract-ocr';
import {
    parseAadhaarData,
    parsePANData,
    parseIncomeCertificateData,
    parseEducationDocumentData,
    detectDocumentType,
} from '@/lib/ocr/document-parsers';
import useSWR from 'swr';
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
    const [error, setError] = useState<string | null>(null);
    const [detectedType, setDetectedType] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { data: userProfile, mutate: mutateProfile } = useSWR('/api/profile');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setError(null);
        setFile(selectedFile);
        setOcrStatus('idle');
        setExtractedData(null);
        setDetectedType(null);

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);

        // Check quality
        const quality = await estimateImageQuality(selectedFile);
        setQualityCheck(quality);

    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp']
        },
        maxSize,
        multiple: false
    });

    const handleOCR = async () => {
        if (!file) return;

        setOcrStatus('processing');
        setError(null);

        try {
            // Preprocess image for better accuracy
            const processedFile = await preprocessImage(file);

            // Run OCR
            const result = await extractTextFromImage(
                processedFile,
                'eng+hin', // Support English + Hindi
                (progress) => setOcrProgress(progress)
            );

            setOcrResult(result);

            // Auto-detect document type if not specified
            const docType = detectDocumentType(result.text);
            setDetectedType(docType);

            // Parse structured data based on document type
            let parsed: any = null;

            if (docType === 'AADHAAR' || documentCode === 'AADHAAR') {
                parsed = parseAadhaarData(result.text);
            } else if (docType === 'PAN' || documentCode === 'PAN') {
                parsed = parsePANData(result.text);
            } else if (docType === 'INCOME_CERT' || documentCode === 'INCOME_CERT') {
                parsed = parseIncomeCertificateData(result.text);
            } else if (docType === 'EDUCATION' || documentCode.includes('EDUCATION')) {
                parsed = parseEducationDocumentData(result.text);
            }

            setExtractedData(parsed);
            setOcrStatus('success');

            // Notify parent component
            if (parsed) {
                onDataExtracted({
                    ...parsed,
                    ocrConfidence: result.confidence,
                    ocrText: result.text,
                    detectedType: docType
                });
            }

        } catch (err: any) {
            console.error('OCR Error:', err);
            setError(err.message || 'OCR processing failed');
            setOcrStatus('error');
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
            const changes = detectProfileChanges(userProfile, extractedData, detectedType || documentCode);
            if (changes.length > 0) {
                const updatePayload: any = {};
                if (extractedData.annualIncome) updatePayload.annual_income = parseInt(extractedData.annualIncome.toString().replace(/,/g, ''));
                if (extractedData.dateOfBirth) updatePayload.date_of_birth = extractedData.dateOfBirth;
                if (extractedData.address) updatePayload.full_address = extractedData.address;
                if (extractedData.gender) updatePayload.gender = extractedData.gender;
                if (extractedData.name) updatePayload.name = extractedData.name;
                if (extractedData.course) updatePayload.education = extractedData.course;

                if (Object.keys(updatePayload).length > 0) {
                    const res = await fetch('/api/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatePayload)
                    });
                    if (!res.ok) throw new Error('Failed to update profile');
                    await mutateProfile(); // refresh cache
                }
            }
            
            const success = await handleUpload();
            if (success) onUploadComplete();
        } catch(err: any) {
             setError(err.message);
             setIsUploading(false);
        }
    };

    const handleUploadWithoutProfileUpdate = async () => {
        const success = await handleUpload();
        if (success) onUploadComplete();
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
                            <div className="relative aspect-[4/3] rounded-lg border border-slate-200 bg-white overflow-hidden shadow-inner flex items-center justify-center">
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
                                {ocrStatus === 'idle' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                            <FileText className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Ready for processing</p>
                                        <p className="mt-1 text-xs text-slate-400 max-w-[200px]">Click below to automatically extract data from this document</p>
                                        <button
                                            onClick={handleOCR}
                                            disabled={qualityCheck && qualityCheck.score < 40}
                                            className="mt-6 px-8 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                        >
                                            Process Document
                                        </button>
                                    </div>
                                )}

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
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 mb-6 flex items-center gap-3">
                                            <div className="bg-emerald-500 p-1.5 rounded-full">
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-800">Extraction Complete</p>
                                                <p className="text-[10px] text-emerald-600 font-medium">Confidence Score: {Math.round(ocrResult?.confidence || 0)}%</p>
                                            </div>
                                        </div>

                                        {detectedType && detectedType !== 'UNKNOWN' && (
                                            <div className="mb-4 inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                                                Detected: {detectedType}
                                            </div>
                                        )}

                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {Object.entries(extractedData || {}).map(([key, value]) => (
                                                value ? (
                                                    <div key={key} className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-800 break-words">{value as string}</span>
                                                    </div>
                                                ) : null
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
                                            <button
                                                onClick={handleUploadWithoutProfileUpdate}
                                                disabled={isUploading}
                                                className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 font-bold text-sm transition-all text-center"
                                            >
                                                Save Only
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
                                        <p className="mt-2 text-xs text-rose-600 px-6 font-medium">{error}</p>
                                        <button
                                            onClick={handleOCR}
                                            className="mt-6 px-8 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-semibold text-sm shadow-lg"
                                        >
                                            Try Again
                                        </button>
                                        <button
                                            onClick={() => setOcrStatus('idle')}
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

            {error && ocrStatus !== 'error' && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold animate-in fade-in zoom-in duration-300 flex items-center gap-3">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
