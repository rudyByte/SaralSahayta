'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Download,
    XCircle,
    RefreshCw,
    MessageSquare,
    FileText,
    CheckCircle,
    Clock,
    ExternalLink,
    ShieldCheck
} from 'lucide-react'
import { StatusTimeline } from '@/components/application/status-timeline'
import { format } from 'date-fns'

interface TrackingPageProps {
    params: { id: string }
}

export default function ApplicationTrackingPage({ params }: TrackingPageProps) {
    const router = useRouter()
    const applicationId = params.id

    const [loading, setLoading] = useState(true)
    const [application, setApplication] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [isWithdrawing, setIsWithdrawing] = useState(false)
    const [isReapplying, setIsReapplying] = useState(false)

    useEffect(() => {
        fetchApplicationData()
    }, [applicationId])

    const fetchApplicationData = async () => {
        try {
            setLoading(true)

            // Fetch application details
            const appRes = await fetch(`/api/applications/${applicationId}`)
            if (!appRes.ok) throw new Error('Failed to fetch application')
            const appData = await appRes.json()
            setApplication(appData)

            // Fetch history
            const historyRes = await fetch(`/api/applications/${applicationId}/history`)
            if (!historyRes.ok) throw new Error('Failed to fetch history')
            const historyData = await historyRes.json()
            setHistory(historyData.history)

        } catch (error) {
            console.error('Error fetching tracking data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleWithdraw = async () => {
        if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return

        try {
            setIsWithdrawing(true)
            const res = await fetch(`/api/applications/${applicationId}/withdraw`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to withdraw')

            alert('Application withdrawn successfully')
            fetchApplicationData()
        } catch (error) {
            console.error('Withdrawal error:', error)
            alert('Failed to withdraw application')
        } finally {
            setIsWithdrawing(false)
        }
    }

    const handleReapply = async () => {
        try {
            setIsReapplying(true)
            const res = await fetch(`/api/applications/${applicationId}/reapply`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to reapply')

            const data = await res.json()
            router.push(`/applications/${data.newApplicationId}`)
        } catch (error) {
            console.error('Reapply error:', error)
            alert('Failed to initiate reapplication')
        } finally {
            setIsReapplying(false)
        }
    }

    const handleDownloadPDF = () => {
        window.open(`/api/applications/${applicationId}/pdf`, '_blank')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        )
    }

    if (!application) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Application Not Found</h2>
                <button
                    onClick={() => router.push('/applications')}
                    className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to My Applications
                </button>
            </div>
        )
    }

    const { status, scheme, linkedDocuments } = application
    const canWithdraw = ['SUBMITTED', 'UNDER_REVIEW'].includes(status)
    const canReapply = ['REJECTED', 'WITHDRAWN'].includes(status)

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/applications')}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to My Applications
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{scheme.schemeName}</h1>
                        <div className="mt-2 flex items-center gap-3">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                ID: {applicationId.slice(0, 12)}...
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                }`}>
                                {status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>Submitted on: {format(new Date(application.application.createdAt), 'PPP')}</p>
                        <p>Last updated: {format(new Date(application.application.updatedAt), 'PPP')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Timeline & History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Timeline Card */}
                    <div className="bg-white border rounded-xl shadow-sm p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">Application Status</h2>
                        <StatusTimeline
                            history={history}
                            currentStatus={status}
                            estimatedCompletionDays={15}
                        />
                    </div>

                    {/* Documents Card */}
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Submitted Documents
                            </h2>
                        </div>
                        <div className="divide-y">
                            {linkedDocuments.map((doc: any) => (
                                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{doc.document.documentName}</p>
                                            <p className="text-xs text-gray-500">
                                                {doc.fileName} • {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`flex items-center gap-1 text-xs font-medium ${doc.verificationStatus === 'VERIFIED' ? 'text-green-600' :
                                                doc.verificationStatus === 'REJECTED' ? 'text-red-600' :
                                                    'text-yellow-600'
                                            }`}>
                                            {doc.verificationStatus === 'VERIFIED' && <CheckCircle className="h-3 w-3" />}
                                            {doc.verificationStatus === 'REJECTED' && <XCircle className="h-3 w-3" />}
                                            {doc.verificationStatus === 'PENDING' && <Clock className="h-3 w-3" />}
                                            {doc.verificationStatus}
                                        </span>
                                        <a
                                            href={doc.signedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                        >
                                            View <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Actions */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white border rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Application Details</h2>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs text-gray-500 uppercase font-semibold">Applicant Name</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                    {application.application.formData?.personal?.applicantName || 'Not available'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500 uppercase font-semibold">Scheme Category</dt>
                                <dd className="text-sm font-medium text-gray-900">{scheme.department}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500 uppercase font-semibold">Submission Mode</dt>
                                <dd className="text-sm font-medium text-gray-900">Online Portals</dd>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 text-green-600 mb-1">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase">Security Verified</span>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    This application is protected by Sahayog security protocols. Your data is encrypted and secure.
                                </p>
                            </div>
                        </dl>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white border rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={handleDownloadPDF}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Download Receipt
                            </button>

                            {canWithdraw && (
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawing}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    {isWithdrawing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Withdraw Application
                                </button>
                            )}

                            {canReapply && (
                                <button
                                    onClick={handleReapply}
                                    disabled={isReapplying}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {isReapplying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Reapply Now
                                </button>
                            )}

                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <MessageSquare className="h-4 w-4" />
                                Contact Support
                            </button>
                        </div>
                    </div>

                    {/* Help Tip */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-blue-900 mb-1">Need help?</h3>
                        <p className="text-xs text-blue-700 line-height-relaxed">
                            If you have any questions about your application status or required documents, please contact our 24/7 helpline at 1800-SAHAYOG.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
