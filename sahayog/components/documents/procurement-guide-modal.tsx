'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Copy, MapPin, Phone, Clock, CheckCircle } from 'lucide-react'
import { DocumentUpload } from './document-upload'

interface ProcurementGuideModalProps {
    documentCode: string
    documentName: string
    isOpen: boolean
    onClose: () => void
    onUploadSuccess?: () => void
}

interface OfficeAddress {
    id: string
    officeName: string
    officeType: string
    address: string
    district: string | null
    contactNumber: string | null
    officeHours: string | null
}

interface GuideData {
    document: {
        documentName: string
        description: string | null
        category: string
    }
    procurementGuideOnline: any
    procurementGuideOffline: any
    officeAddresses: OfficeAddress[]
    userState: string | null
}

export function ProcurementGuideModal({
    documentCode,
    documentName,
    isOpen,
    onClose,
    onUploadSuccess
}: ProcurementGuideModalProps) {
    const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online')
    const [showUpload, setShowUpload] = useState(false)
    const [guideData, setGuideData] = useState<GuideData | null>(null)
    const [loading, setLoading] = useState(false)
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && documentCode) {
            fetchGuideData()
        }
    }, [isOpen, documentCode])

    const fetchGuideData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/documents/${documentCode}/guide`)
            const data = await response.json()
            setGuideData(data)
        } catch (error) {
            console.error('Failed to fetch guide:', error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedUrl(text)
            setTimeout(() => setCopiedUrl(null), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const getDirectionsUrl = (address: string) => {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            How to Get: {documentName}
                        </h2>
                        {guideData?.document.description && (
                            <p className="text-sm text-gray-600 mt-1">
                                {guideData.document.description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : showUpload ? (
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">Upload {documentName}</h3>
                            <DocumentUpload
                                documentCode={documentCode}
                                documentName={documentName}
                                onUploadSuccess={() => {
                                    setShowUpload(false)
                                    onUploadSuccess?.()
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="border-b px-6 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('online')}
                                        className={`py-3 px-4 border-b-2 font-medium transition-colors ${activeTab === 'online'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Online Process
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('offline')}
                                        className={`py-3 px-4 border-b-2 font-medium transition-colors ${activeTab === 'offline'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Offline Process
                                    </button>
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                    Category: {guideData?.document.category}
                                </div>
                            </div>

                            {/* Sample Document Section */}
                            {(guideData as any)?.document.sampleImageUrl && (
                                <div className="px-6 pt-4">
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row gap-6">
                                        <div className="flex-shrink-0 w-full md:w-48">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sample Document</p>
                                            <img
                                                src={(guideData as any).document.sampleImageUrl}
                                                alt="Sample"
                                                className="w-full h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Key Highlights </p>
                                            <ul className="grid grid-cols-2 gap-2">
                                                {['Clear Seal & Signature', 'Official Issuing Authority', 'Valid Date of Issue', 'Clear Name & Address'].map((point, i) => (
                                                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                        <CheckCircle className="h-3 w-3 text-green-500" /> {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'online' && guideData?.procurementGuideOnline && (
                                    <div className="space-y-6">
                                        {/* Steps */}
                                        {guideData.procurementGuideOnline.steps?.map((step: any, index: number) => (
                                            <div key={index} className="flex gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-900 mb-2">{step.description}</p>
                                                    {step.portalUrl && (
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={step.portalUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                                                            >
                                                                Visit Portal
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                            <button
                                                                onClick={() => copyToClipboard(step.portalUrl)}
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >
                                                                {copiedUrl === step.portalUrl ? (
                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <Copy className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Tips */}
                                        {guideData.procurementGuideOnline.tips && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                                                    {guideData.procurementGuideOnline.tips.map((tip: string, index: number) => (
                                                        <li key={index}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'offline' && guideData?.procurementGuideOffline && (
                                    <div className="space-y-6">
                                        {/* Steps */}
                                        {guideData.procurementGuideOffline.steps?.map((step: any, index: number) => (
                                            <div key={index} className="flex gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-900">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Office Addresses */}
                                        {guideData.officeAddresses && guideData.officeAddresses.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-3">
                                                    Nearby Offices {guideData.userState && `in ${guideData.userState}`}
                                                </h4>
                                                <div className="space-y-3">
                                                    {guideData.officeAddresses.map((office) => (
                                                        <div key={office.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900">{office.officeName}</h5>
                                                                    <p className="text-sm text-gray-600">{office.officeType}</p>
                                                                </div>
                                                                {office.district && (
                                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {office.district}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex items-start gap-2 text-gray-600">
                                                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <span>{office.address}</span>
                                                                </div>
                                                                {office.contactNumber && (
                                                                    <div className="flex items-center gap-2 text-gray-600">
                                                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                                                        <span>{office.contactNumber}</span>
                                                                    </div>
                                                                )}
                                                                {office.officeHours && (
                                                                    <div className="flex items-center gap-2 text-gray-600">
                                                                        <Clock className="h-4 w-4 flex-shrink-0" />
                                                                        <span>{office.officeHours}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <a
                                                                href={getDirectionsUrl(office.address)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                                            >
                                                                Get Directions
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Required Documents */}
                                        {guideData.procurementGuideOffline.requiredDocuments && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <h4 className="font-medium text-yellow-900 mb-2">📋 Documents to Carry</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                                    {guideData.procurementGuideOffline.requiredDocuments.map((doc: string, index: number) => (
                                                        <li key={index}>{doc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Tips */}
                                        {guideData.procurementGuideOffline.tips && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-medium text-green-900 mb-2">💡 Tips</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                                                    {guideData.procurementGuideOffline.tips.map((tip: string, index: number) => (
                                                        <li key={index}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!showUpload && (
                    <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Start Upload
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
