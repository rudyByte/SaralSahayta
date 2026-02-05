'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Trash2, HelpCircle } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/document-upload'
import { ProcurementGuideModal } from '@/components/documents/procurement-guide-modal'
import { formatFileSize } from '@/lib/file-validation'

interface UserDocument {
    id: string
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    uploadedAt: string
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'
    expiryDate: string | null
    signedUrl: string | null
    document: {
        id: string
        documentName: string
        documentCode: string
        category: string
        description: string | null
    }
}

type TabType = 'all' | 'uploaded' | 'pending' | 'verified' | 'missing'

export default function DocumentsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('all')
    const [documents, setDocuments] = useState<UserDocument[]>([])
    const [masterDocuments, setMasterDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDocument, setSelectedDocument] = useState<{ code: string; name: string } | null>(null)
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)

    useEffect(() => {
        fetchDocuments()
        fetchMasterDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            const response = await fetch('/api/documents')
            const data = await response.json()
            setDocuments(data.documents || [])
        } catch (error) {
            console.error('Failed to fetch documents:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMasterDocuments = async () => {
        try {
            const response = await fetch('/api/documents/master?common=true')
            const data = await response.json()
            setMasterDocuments(data.documents || [])
        } catch (error) {
            console.error('Failed to fetch master documents:', error)
        }
    }

    const handleDelete = async (documentId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        try {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchDocuments()
            }
        } catch (error) {
            console.error('Failed to delete document:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            VERIFIED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Verified' },
            REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
            EXPIRED: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', label: 'Expired' }
        }
        const badge = badges[status as keyof typeof badges]
        const Icon = badge.icon

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        )
    }

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            IDENTITY: 'bg-blue-100 text-blue-800',
            INCOME: 'bg-green-100 text-green-800',
            EDUCATION: 'bg-purple-100 text-purple-800',
            RESIDENCE: 'bg-indigo-100 text-indigo-800',
            CASTE: 'bg-pink-100 text-pink-800',
            PROPERTY: 'bg-orange-100 text-orange-800',
            FINANCIAL: 'bg-teal-100 text-teal-800',
            OTHER: 'bg-gray-100 text-gray-800'
        }

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category] || colors.OTHER}`}>
                {category}
            </span>
        )
    }

    const isExpiringSoon = (expiryDate: string | null) => {
        if (!expiryDate) return false
        const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days <= 30 && days > 0
    }

    const filteredDocuments = documents.filter(doc => {
        if (activeTab === 'all') return true
        if (activeTab === 'uploaded') return true
        if (activeTab === 'pending') return doc.verificationStatus === 'PENDING'
        if (activeTab === 'verified') return doc.verificationStatus === 'VERIFIED'
        return false
    })

    const missingDocuments = masterDocuments.filter(
        master => !documents.some(doc => doc.document.documentCode === master.documentCode)
    )

    const tabCounts = {
        all: documents.length,
        uploaded: documents.length,
        pending: documents.filter(d => d.verificationStatus === 'PENDING').length,
        verified: documents.filter(d => d.verificationStatus === 'VERIFIED').length,
        missing: missingDocuments.length
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
                <p className="text-gray-600 mt-2">
                    Upload and manage your documents for scheme applications
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-4">
                    {[
                        { key: 'all', label: 'All Documents' },
                        { key: 'uploaded', label: 'Uploaded' },
                        { key: 'pending', label: 'Pending Verification' },
                        { key: 'verified', label: 'Verified' },
                        { key: 'missing', label: 'Missing' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabType)}
                            className={`py-3 px-4 border-b-2 font-medium transition-colors ${activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.label}
                            {tabCounts[tab.key as keyof typeof tabCounts] > 0 && (
                                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                    {tabCounts[tab.key as keyof typeof tabCounts]}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            )}

            {/* Document Grid */}
            {!loading && activeTab !== 'missing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map(doc => (
                        <div key={doc.id} className="border rounded-lg p-5 bg-white hover:shadow-lg transition-shadow">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {doc.document.documentName}
                                    </h3>
                                    {getCategoryBadge(doc.document.category)}
                                </div>
                                <FileText className="h-5 w-5 text-gray-400" />
                            </div>

                            {/* Status */}
                            <div className="mb-3">
                                {getStatusBadge(doc.verificationStatus)}
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div>
                                    <span className="font-medium">Uploaded:</span>{' '}
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                </div>
                                <div>
                                    <span className="font-medium">Size:</span> {formatFileSize(doc.fileSize)}
                                </div>
                                {doc.expiryDate && (
                                    <div className={isExpiringSoon(doc.expiryDate) ? 'text-orange-600' : ''}>
                                        <span className="font-medium">Expires:</span>{' '}
                                        {new Date(doc.expiryDate).toLocaleDateString()}
                                        {isExpiringSoon(doc.expiryDate) && ' ⚠️'}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {doc.signedUrl && (
                                    <a
                                        href={doc.signedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View
                                    </a>
                                )}
                                {doc.verificationStatus !== 'VERIFIED' && (
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Missing Documents Tab */}
            {!loading && activeTab === 'missing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {missingDocuments.map(doc => (
                        <div key={doc.id} className="border rounded-lg p-5 bg-white hover:shadow-lg transition-shadow">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {doc.documentName}
                                    </h3>
                                    {getCategoryBadge(doc.category)}
                                </div>
                                <Upload className="h-5 w-5 text-gray-400" />
                            </div>

                            {/* Description */}
                            {doc.description && (
                                <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedDocument({ code: doc.documentCode, name: doc.documentName })}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                    How to get this?
                                </button>
                                <button
                                    onClick={() => setUploadingDoc(doc.documentCode)}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload
                                </button>
                            </div>

                            {/* Upload Component */}
                            {uploadingDoc === doc.documentCode && (
                                <div className="mt-4 pt-4 border-t">
                                    <DocumentUpload
                                        documentCode={doc.documentCode}
                                        documentName={doc.documentName}
                                        onUploadSuccess={() => {
                                            setUploadingDoc(null)
                                            fetchDocuments()
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredDocuments.length === 0 && activeTab !== 'missing' && (
                <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-600">
                        {activeTab === 'all'
                            ? 'Upload your first document to get started'
                            : `No ${activeTab} documents`}
                    </p>
                </div>
            )}

            {/* Procurement Guide Modal */}
            {selectedDocument && (
                <ProcurementGuideModal
                    documentCode={selectedDocument.code}
                    documentName={selectedDocument.name}
                    isOpen={true}
                    onClose={() => setSelectedDocument(null)}
                    onUploadSuccess={() => {
                        setSelectedDocument(null)
                        fetchDocuments()
                    }}
                />
            )}
        </div>
    )
}
