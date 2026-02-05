'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, XCircle, AlertTriangle, Upload, Eye, HelpCircle } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/document-upload'
import { ProcurementGuideModal } from '@/components/documents/procurement-guide-modal'

interface DocumentChecklistProps {
    requiredDocumentCodes: string[]
    applicationId: string
    onDocumentsChange?: (uploadedCodes: string[]) => void
}

interface DocumentStatus {
    code: string
    name: string
    status: 'not_uploaded' | 'uploaded_pending' | 'uploaded_verified' | 'rejected'
    fileUrl?: string
    uploadedAt?: string
    rejectionReason?: string
    userDocumentId?: string
}

export function DocumentChecklist({
    requiredDocumentCodes,
    applicationId,
    onDocumentsChange
}: DocumentChecklistProps) {
    const [documents, setDocuments] = useState<DocumentStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
    const [selectedGuide, setSelectedGuide] = useState<{ code: string; name: string } | null>(null)

    useEffect(() => {
        fetchDocumentStatus()
    }, [requiredDocumentCodes])

    const fetchDocumentStatus = async () => {
        try {
            setLoading(true)

            // Fetch master documents
            const masterResponse = await fetch('/api/documents/master')
            const masterData = await masterResponse.json()

            // Fetch user's uploaded documents
            const userResponse = await fetch('/api/documents')
            const userData = await userResponse.json()

            // Map required documents to their status
            const documentStatuses: DocumentStatus[] = requiredDocumentCodes.map(code => {
                const masterDoc = masterData.documents.find((d: any) => d.documentCode === code)
                const userDoc = userData.documents.find((d: any) => d.document.documentCode === code)

                let status: DocumentStatus['status'] = 'not_uploaded'
                if (userDoc) {
                    if (userDoc.verificationStatus === 'VERIFIED') {
                        status = 'uploaded_verified'
                    } else if (userDoc.verificationStatus === 'REJECTED') {
                        status = 'rejected'
                    } else {
                        status = 'uploaded_pending'
                    }
                }

                return {
                    code,
                    name: masterDoc?.documentName || code,
                    status,
                    fileUrl: userDoc?.signedUrl,
                    uploadedAt: userDoc?.uploadedAt,
                    rejectionReason: userDoc?.rejectionReason,
                    userDocumentId: userDoc?.id
                }
            })

            setDocuments(documentStatuses)

            // Notify parent of uploaded documents
            const uploadedCodes = documentStatuses
                .filter(d => d.status === 'uploaded_verified' || d.status === 'uploaded_pending')
                .map(d => d.code)
            onDocumentsChange?.(uploadedCodes)

        } catch (error) {
            console.error('Failed to fetch document status:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUploadSuccess = async (doc: any) => {
        // Link document to application
        try {
            await fetch(`/api/applications/${applicationId}/documents/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDocumentId: doc.id })
            })

            // Refresh document status
            await fetchDocumentStatus()
            setUploadingDoc(null)
        } catch (error) {
            console.error('Failed to link document:', error)
        }
    }

    const getStatusBadge = (status: DocumentStatus['status']) => {
        const badges = {
            not_uploaded: {
                icon: XCircle,
                color: 'bg-red-100 text-red-800 border-red-200',
                label: 'Not Uploaded'
            },
            uploaded_pending: {
                icon: Clock,
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                label: 'Pending Verification'
            },
            uploaded_verified: {
                icon: CheckCircle,
                color: 'bg-green-100 text-green-800 border-green-200',
                label: 'Verified'
            },
            rejected: {
                icon: AlertTriangle,
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                label: 'Rejected'
            }
        }

        const badge = badges[status]
        const Icon = badge.icon

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        )
    }

    const uploadedCount = documents.filter(d =>
        d.status === 'uploaded_verified' || d.status === 'uploaded_pending'
    ).length
    const totalCount = documents.length
    const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Upload Required Documents
                </h2>
                <p className="text-gray-600">
                    Please upload all required documents to proceed with your application
                </p>
            </div>

            {/* Progress Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                        {uploadedCount} of {totalCount} documents uploaded
                    </span>
                    <span className="text-sm text-blue-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {uploadedCount < totalCount && (
                    <p className="text-sm text-blue-800 mt-2">
                        ⚠️ Please upload all required documents before submitting
                    </p>
                )}
            </div>

            {/* Document Cards */}
            <div className="space-y-4">
                {documents.map((doc) => (
                    <div key={doc.code} className="border rounded-lg p-5 bg-white">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-2">{doc.name}</h3>
                                {getStatusBadge(doc.status)}
                            </div>
                        </div>

                        {/* Rejection Reason */}
                        {doc.status === 'rejected' && doc.rejectionReason && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                                <p className="text-sm text-orange-800">
                                    <strong>Rejection Reason:</strong> {doc.rejectionReason}
                                </p>
                            </div>
                        )}

                        {/* Upload Date */}
                        {doc.uploadedAt && (
                            <p className="text-sm text-gray-600 mb-3">
                                Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            {doc.status === 'not_uploaded' || doc.status === 'rejected' ? (
                                <>
                                    <button
                                        onClick={() => setUploadingDoc(doc.code)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {doc.status === 'rejected' ? 'Re-upload' : 'Upload Now'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedGuide({ code: doc.code, name: doc.name })}
                                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                        How to get this?
                                    </button>
                                </>
                            ) : (
                                <>
                                    {doc.fileUrl && (
                                        <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Document
                                        </a>
                                    )}
                                    {doc.status === 'uploaded_pending' && (
                                        <button
                                            onClick={() => setUploadingDoc(doc.code)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Replace
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Upload Component */}
                        {uploadingDoc === doc.code && (
                            <div className="mt-4 pt-4 border-t">
                                <DocumentUpload
                                    documentCode={doc.code}
                                    documentName={doc.name}
                                    onUploadSuccess={handleUploadSuccess}
                                    onUploadError={() => setUploadingDoc(null)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Procurement Guide Modal */}
            {selectedGuide && (
                <ProcurementGuideModal
                    documentCode={selectedGuide.code}
                    documentName={selectedGuide.name}
                    isOpen={true}
                    onClose={() => setSelectedGuide(null)}
                    onUploadSuccess={() => {
                        setSelectedGuide(null)
                        fetchDocumentStatus()
                    }}
                />
            )}
        </div>
    )
}
