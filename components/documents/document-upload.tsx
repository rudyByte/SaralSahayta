'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, XCircle, AlertCircle } from 'lucide-react';
import { validateFile, checkImageQualityClient } from '@/lib/file-validation';

interface DocumentUploadProps {
    documentCode: string;
    documentName: string;
    onUploadSuccess: (document: any) => void;
    maxSize?: number;
}

export function DocumentUpload({
    documentCode,
    documentName,
    onUploadSuccess,
    maxSize = 10 * 1024 * 1024,
}: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [qualityCheck, setQualityCheck] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        // Validate
        const validation = validateFile(selectedFile);
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Generate preview
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(selectedFile);

            // Run quality check
            const quality = await checkImageQualityClient(selectedFile);
            setQualityCheck(quality);
        } else {
            setPreview(null); // PDF
            setQualityCheck({ passed: true, score: 100, issues: [], warnings: [] });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'application/pdf': ['.pdf'],
        },
        maxSize,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) return;

        // Check quality score
        if (qualityCheck && !qualityCheck.passed) {
            if (!confirm('Image quality is low. Upload anyway?')) {
                return;
            }
        }

        setUploading(true);
        setError(null);

        try {
            console.log('[Frontend] Starting upload for:', documentCode);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentCode', documentCode);

            console.log('[Frontend] Sending request to /api/documents/upload');
            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            console.log('[Frontend] Response status:', response.status);
            console.log('[Frontend] Response headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('[Frontend] Response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('[Frontend] Parsed response:', data);
            } catch (parseError) {
                console.error('[Frontend] Failed to parse response as JSON:', parseError);
                throw new Error('Server returned invalid response: ' + responseText.substring(0, 100));
            }

            if (!response.ok) {
                console.error('[Frontend] Upload failed with status:', response.status);
                throw new Error(data.error || 'Upload failed');
            }

            console.log('[Frontend] ✅ Upload successful!');
            onUploadSuccess(data.document);
            setFile(null);
            setPreview(null);
            setQualityCheck(null);

        } catch (err: any) {
            console.error('[Frontend] Upload error:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col">
                <h3 className="text-sm font-medium text-slate-900">{documentName}</h3>
                <p className="text-xs text-slate-500">Code: {documentCode}</p>
            </div>

            {/* Dropzone */}
            {!file && (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive
                            ? 'border-primary-500 bg-primary-50/50 scale-[0.99] shadow-inner'
                            : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                        }
          `}
                >
                    <input {...getInputProps()} />
                    <div className="bg-slate-100 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-6 w-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                        {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        PDF, JPG, PNG up to 10MB
                    </p>
                </div>
            )}

            {/* File Preview */}
            {file && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                >
                    <div className="flex items-start gap-4">
                        {/* Preview Image */}
                        <div className="h-24 w-24 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {file.type.split('/')[1] || 'FILE'}
                                </div>
                            )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            {/* Quality Check Results */}
                            {qualityCheck && (
                                <div className="mt-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${qualityCheck.score}%` }}
                                                className={`h-full ${qualityCheck.score >= 80
                                                    ? 'bg-emerald-500'
                                                    : qualityCheck.score >= 60
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                                    }`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                                            Quality: {qualityCheck.score}%
                                        </span>
                                    </div>

                                    {/* Issues */}
                                    {qualityCheck.issues.length > 0 && (
                                        <div className="space-y-1">
                                            {qualityCheck.issues.map((issue: string, i: number) => (
                                                <div key={i} className="flex items-start gap-1.5 text-xs text-rose-600">
                                                    <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <span>{issue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {qualityCheck.warnings.length > 0 && (
                                        <div className="mt-1 space-y-1">
                                            {qualityCheck.warnings.map((warning: string, i: number) => (
                                                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <span>{warning}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                        >
                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                        <button
                            onClick={() => {
                                setFile(null);
                                setPreview(null);
                                setQualityCheck(null);
                            }}
                            disabled={uploading}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded text-xs text-rose-600 flex items-center gap-2">
                            <XCircle className="h-3 w-3" />
                            {error}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
