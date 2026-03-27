'use client';
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, User, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/applications/${applicationId}`,
        fetcher
    );

    const handleUpdateDocumentStatus = async (docId: string, status: string) => {
        try {
            const doc = data?.application?.application_documents?.find((d: any) => d.id === docId);
            if (!doc) return;

            const response = await fetch(`/api/admin/applications/verify-doc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    documentId: doc.document_id,
                    status,
                }),
            });

            if (!response.ok) throw new Error('Failed to update document status');

            toast.success(`Document ${status.toLowerCase()}ed`);
            mutate();
        } catch (error) {
            toast.error('Failed to update document status');
        }
    };

    const handleReview = async (newStatus: string) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/applications/${applicationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    remarks,
                    reviewedBy: 'admin', // TODO: Get from auth context
                }),
            });

            if (!response.ok) throw new Error('Failed to update application');

            toast.success(`Application ${newStatus.toLowerCase()} successfully`);
            mutate();
            setRemarks('');
        } catch (error) {
            toast.error('Failed to update application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !data || !data.application) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-600 font-semibold">Failed to load application</p>
                </div>
            </div>
        );
    }

    const { application, history } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/applications">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
                        <p className="text-gray-600 mt-1">ID: {application.id}</p>
                    </div>
                </div>
                <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${application.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : application.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                >
                    {application.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Applicant Info */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Applicant Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Name</label>
                                <p className="mt-1 text-gray-900">
                                    {application.user_profiles?.full_name || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Mobile</label>
                                <p className="mt-1 text-gray-900">
                                    {application.user_profiles?.mobile || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">State</label>
                                <p className="mt-1 text-gray-900">
                                    {application.user_profiles?.state || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Category</label>
                                <p className="mt-1 text-gray-900">
                                    {application.user_profiles?.category || '-'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Scheme Info */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Scheme Details
                        </h2>
                        <div>
                            <h3 className="font-medium text-gray-900">
                                {application.schemes?.schemeName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {application.schemes?.description}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Category</label>
                                    <p className="mt-1 text-gray-900">
                                        {application.schemes?.category}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Benefit Amount</label>
                                    <p className="mt-1 text-gray-900">
                                        ₹{application.schemes?.benefitAmount?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Documents */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Submitted Documents
                        </h2>
                        {!application.application_documents || application.application_documents.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No documents submitted</p>
                        ) : (
                            <div className="space-y-4">
                                {application.application_documents.map((doc: any) => (
                                    <div
                                        key={doc.id}
                                        className="border rounded-lg p-4 bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {doc.UserDocument?.document_code || doc.UserDocument?.documentType || 'Document'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {doc.UserDocument?.file_name || 'Attached File'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    doc.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                                    doc.verification_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {doc.verification_status || 'PENDING'}
                                                </span>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => window.open(doc.UserDocument?.fileUrl, '_blank')}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {application.status === 'SUBMITTED' && (
                                            <div className="flex items-center space-x-2 border-t pt-3">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-2"
                                                    disabled={doc.verification_status === 'VERIFIED'}
                                                    onClick={() => handleUpdateDocumentStatus(doc.id, 'VERIFIED')}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Verify
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                                    disabled={doc.verification_status === 'REJECTED'}
                                                    onClick={() => handleUpdateDocumentStatus(doc.id, 'REJECTED')}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Review Form */}
                    {application.status === 'SUBMITTED' && (
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Review Decision
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks
                                    </label>
                                    <Textarea
                                        placeholder="Enter your review comments..."
                                        rows={4}
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <Button
                                        onClick={() => handleReview('APPROVED')}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleReview('REJECTED')}
                                        disabled={isSubmitting}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Timeline */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Timeline
                        </h2>
                        <div className="space-y-4">
                            {history.map((item: any, index: number) => (
                                <div key={item.id} className="flex">
                                    <div className="flex flex-col items-center mr-4">
                                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                                        {index < history.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm font-medium text-gray-900">
                                            {item.old_status} → {item.new_status}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {new Date(item.changed_at).toLocaleString()}
                                        </p>
                                        {item.remarks && (
                                            <p className="text-sm text-gray-700 mt-2">{item.remarks}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
