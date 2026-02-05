'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
    Upload,
    X,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    Layers,
    ChevronRight,
    Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentUpload } from './document-upload'
import { formatFileSize } from '@/lib/file-validation'

interface BulkFile {
    file: File;
    id: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    detectedType?: string;
}

export function BulkDocumentUpload() {
    const [files, setFiles] = useState<BulkFile[]>([])
    const [activeUploadId, setActiveUploadId] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending' as const
        }))
        setFiles(prev => [...prev, ...newFiles])
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        }
    })

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
        if (activeUploadId === id) setActiveUploadId(null)
    }

    const handleUploadSuccess = (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'success' } : f))
        // Trigger next pending upload
        const nextPending = files.find(f => f.status === 'pending' && f.id !== id)
        if (nextPending) setActiveUploadId(nextPending.id)
        else setActiveUploadId(null)
    }

    const startBulkUpload = () => {
        const firstPending = files.find(f => f.status === 'pending')
        if (firstPending) setActiveUploadId(firstPending.id)
    }

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
          ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/20'}
        `}
            >
                <input {...getInputProps()} />
                <div className="bg-white p-5 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                    <Layers className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Bulk Document Upload</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Drop all your documents at once. We'll extract data and organize them for you.
                </p>
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Queue ({files.length} Files)</span>
                            <button
                                onClick={() => setFiles([])}
                                className="text-xs text-red-600 font-bold hover:underline"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="grid gap-3">
                            {files.map((fileObj, index) => (
                                <div key={fileObj.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                    {activeUploadId === fileObj.id ? (
                                        <DocumentUpload
                                            documentCode="AUTO" // Handle auto-assignment in API
                                            documentName={fileObj.file.name}
                                            onUploadSuccess={() => handleUploadSuccess(fileObj.id)}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <FileText className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{fileObj.file.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                    {formatFileSize(fileObj.file.size)} • {fileObj.status}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {fileObj.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                                {fileObj.status === 'pending' && (
                                                    <button
                                                        onClick={() => removeFile(fileObj.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={startBulkUpload}
                                disabled={activeUploadId !== null || !files.some(f => f.status === 'pending')}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                {activeUploadId ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing Queue...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        Process {files.filter(f => f.status === 'pending').length} Documents
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
