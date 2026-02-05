'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
    Upload,
    X,
    FileText,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle,
    Loader2,
    Camera,
    Zap,
    Info,
    RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { validateFile, formatFileSize, isImage, isPDF } from '@/lib/file-validation'

interface QualityResult {
    passed: boolean;
    score: number;
    issues: string[];
    warnings: string[];
}

interface DocumentUploadProps {
    documentCode: string
    documentName: string
    onUploadSuccess?: (document: any) => void
    onUploadError?: (error: string) => void
    maxSize?: number
    expiryDate?: string | null
}

export function DocumentUpload({
    documentCode,
    documentName,
    onUploadSuccess,
    onUploadError,
    maxSize = 10 * 1024 * 1024, // 10MB
    expiryDate
}: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [quality, setQuality] = useState<QualityResult | null>(null)
    const [showGuidance, setShowGuidance] = useState(false)

    // Real-time quality check using Canvas API
    const performClientSideCheck = async (imgFile: File): Promise<QualityResult> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) return resolve({ passed: true, score: 70, issues: [], warnings: [] })

                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data
                let brightness = 0
                for (let i = 0; i < data.length; i += 4) {
                    brightness += (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
                }
                brightness = brightness / (data.length / 4)

                const issues: string[] = []
                const warnings: string[] = []
                let score = 100

                if (img.width < 1000 || img.height < 800) {
                    issues.push('Low resolution. May be hard to read.')
                    score -= 30
                }

                if (brightness < 40) {
                    warnings.push('Image is very dark. Ensure better lighting.')
                    score -= 15
                } else if (brightness > 220) {
                    warnings.push('Image is too bright/overexposed.')
                    score -= 15
                }

                // Simple contrast check as proxy for blur
                let contrast = 0
                for (let i = 0; i < data.length - 4; i += 4) {
                    contrast += Math.abs(data[i] - data[i + 4])
                }
                contrast = contrast / (data.length / 4)
                if (contrast < 10) {
                    warnings.push('Image appears blurry or low contrast.')
                    score -= 20
                }

                resolve({
                    passed: score >= 60,
                    score: Math.max(0, score),
                    issues,
                    warnings
                })
            }
            img.src = URL.createObjectURL(imgFile)
        })
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        if (!selectedFile) return

        const validation = validateFile(selectedFile)
        if (!validation.valid) {
            setError(validation.error || 'Invalid file')
            return
        }

        setFile(selectedFile)
        setError(null)
        setSuccess(false)
        setChecking(true)

        if (isImage(selectedFile.type)) {
            setPreview(URL.createObjectURL(selectedFile))
            const result = await performClientSideCheck(selectedFile)
            setQuality(result)
        } else {
            setPreview(null)
            setQuality(null)
        }
        setChecking(false)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize,
        multiple: false
    })

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setError(null)
        setUploadProgress(0)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('documentCode', documentCode)
            if (expiryDate) formData.append('expiryDate', expiryDate)

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 95))
            }, 500)

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Upload failed')

            setSuccess(true)
            onUploadSuccess?.(data.document)

            setTimeout(() => {
                setFile(null)
                setPreview(null)
                setSuccess(false)
                setUploadProgress(0)
                setQuality(null)
            }, 2000)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            onUploadError?.(errorMessage)
        } finally {
            setUploading(false)
        }
    }

    const handleClear = () => {
        setFile(null)
        setPreview(null)
        setError(null)
        setSuccess(false)
        setQuality(null)
        setUploadProgress(0)
    }

    return (
        <div className="w-full space-y-4">
            {/* Guidance Toggle */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{documentName}</span>
                <button
                    onClick={() => setShowGuidance(!showGuidance)}
                    className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                >
                    <Info className="h-3 w-3" />
                    {showGuidance ? 'Hide Tips' : 'Upload Tips'}
                </button>
            </div>

            <AnimatePresence>
                {showGuidance && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 grid grid-cols-2 gap-3">
                            <div className="flex items-start gap-2">
                                <div className="bg-blue-200 p-1 rounded">1</div>
                                <p>Ensure lighting is even and avoids shadows on the document.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-blue-200 p-1 rounded">2</div>
                                <p>Hold the camera parallel to the document for a flat scan.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-blue-200 p-1 rounded">3</div>
                                <p>Include all four corners of the document in the frame.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-blue-200 p-1 rounded">4</div>
                                <p>Maximum file size is 10MB (PDF/JPG/PNG).</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dropzone */}
            {!file && (
                <div
                    {...getRootProps()}
                    className={`
            relative group border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-300
            ${isDragActive
                            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                            : 'border-gray-200 hover:border-blue-400 bg-gray-50/30'
                        }
          `}
                >
                    <input {...getInputProps()} capture="environment" />
                    <div className="bg-white p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                        <Camera className="h-10 w-10 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-900 font-bold mb-2">
                        {isDragActive ? 'Release to Scan' : 'Scan or Upload Document'}
                    </p>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
                        Tap to open camera or drag files here. Supports PDF, JPG, PNG.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> Instant Check</span>
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 fill-current" /> Secure Storage</span>
                    </div>
                </div>
            )}

            {/* File Preview & Intelligence */}
            {file && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm"
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: Preview */}
                        <div className="relative w-full md:w-48 h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <FileText className="h-12 w-12 text-blue-500 mb-2" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF Document</span>
                                </div>
                            )}
                            {checking && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Checking...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Quality & Actions */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 truncate">{file.name}</h4>
                                    <p className="text-xs text-gray-400 font-medium tracking-tight">
                                        {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                                    </p>
                                </div>
                                {!uploading && !success && (
                                    <button onClick={handleClear} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="h-5 w-5 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {/* Intelligence Box */}
                            {!success && quality && (
                                <div className={`mb-6 p-4 rounded-xl border ${quality.score >= 80 ? 'bg-green-50/30 border-green-100' :
                                    quality.score >= 60 ? 'bg-yellow-50/30 border-yellow-100' :
                                        'bg-red-50/30 border-red-100'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quality Score</span>
                                        <span className={`text-sm font-bold ${quality.score >= 80 ? 'text-green-600' :
                                            quality.score >= 60 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                            {quality.score}/100
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200/50 rounded-full h-1.5 mb-3">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${quality.score}%` }}
                                            className={`h-1.5 rounded-full ${quality.score >= 80 ? 'bg-green-500' :
                                                quality.score >= 60 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                        />
                                    </div>

                                    {quality.issues.length > 0 && (
                                        <div className="space-y-1">
                                            {quality.issues.map(issue => (
                                                <div key={issue} className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold">
                                                    <X className="h-3 w-3" /> {issue}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {quality.warnings.length > 0 && (
                                        <div className="space-y-1">
                                            {quality.warnings.map(warning => (
                                                <div key={warning} className="flex items-center gap-1.5 text-[10px] text-yellow-700 font-bold">
                                                    <AlertCircle className="h-3 w-3" /> {warning}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Progress & Status */}
                            <div className="mt-auto">
                                <AnimatePresence>
                                    {uploading && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 uppercase mb-2">
                                                <span>Uploading to Secure Vault</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {success && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-100 text-green-700 mb-4"
                                        >
                                            <CheckCircle className="h-6 w-6" />
                                            <div>
                                                <p className="text-sm font-bold">Vault Security Lock Confirmed</p>
                                                <p className="text-[10px] uppercase font-bold opacity-80">Document Encrypted & Stored</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-xs font-bold mb-4"
                                        >
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!success && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading || checking || !!(quality && !quality.passed && quality.issues.length > 0)}
                                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                        >
                                            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                            {uploading ? 'Processing...' : `Upload Document`}
                                        </button>
                                        {quality && !quality.passed && (
                                            <button
                                                onClick={handleClear}
                                                className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                                title="Retake Scan"
                                            >
                                                <RefreshCw className="h-5 w-5 text-gray-500" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
