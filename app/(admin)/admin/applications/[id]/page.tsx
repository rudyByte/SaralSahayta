'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, User, FileText, Calendar, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

    const handleReview = async (newStatus: string) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/applications/${applicationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    remarks,
                    reviewedBy: 'admin',
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
                    <p className="text-red-600 font-semibold text-lg">Failed to load application</p>
                    <Link href="/admin/applications" className="text-primary-600 hover:underline mt-4 block font-medium">
                        Return to List
                    </Link>
                </div>
            </div>
        );
    }

    const { application, history } = data;
    const { user, scheme } = application;

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 py-8">
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center space-x-5">
                    <Link href="/admin/applications">
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shadow-sm border-gray-100 hover:border-gray-300">
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Application</h1>
                            <div className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200">
                                {application.trackingId || application.id.slice(0, 8)}
                            </div>
                        </div>
                        <p className="text-gray-500 font-medium">Review and process the submitted scheme submission</p>
                    </div>
                </div>
                
                <div className={`px-5 py-2.5 rounded-2xl text-sm font-black tracking-widest uppercase border-2 flex items-center gap-3 shadow-lg ${
                    application.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200 shadow-green-100' :
                    application.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 shadow-red-100' :
                    'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100'
                }`}>
                    <span className={`h-2.5 w-2.5 rounded-full bg-current ${application.status === 'UNDER_REVIEW' ? 'animate-pulse' : ''}`} />
                    {application.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Pane */}
                <div className="lg:col-span-2 space-y-8">
                    {/* User Info */}
                    <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <User className="h-24 w-24" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center border-b border-gray-100 pb-4">
                            <User className="h-6 w-6 mr-3 text-primary-600" />
                            Applicant Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                                <p className="text-lg font-bold text-gray-900">{user?.name || '-'} {user?.isPremium && <ShieldCheck className="inline h-5 w-5 text-amber-500 ml-1" />}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                                <p className="text-lg font-bold text-gray-900">{user?.mobile || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Location</label>
                                <p className="text-lg font-bold text-gray-900">{user?.district || '-'}, {user?.state || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Primary Category</label>
                                <p className="text-lg font-bold text-gray-900">{user?.category || '-'}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Scheme Info */}
                    <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30">
                        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center border-b border-gray-100 pb-4">
                            <FileText className="h-6 w-6 mr-3 text-primary-600" />
                            Scheme Targeted
                        </h2>
                        <div className="space-y-6">
                            <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100/50">
                                <h3 className="text-2xl font-black text-primary-900 leading-tight">
                                    {scheme?.name}
                                </h3>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-primary-700 border border-primary-100 uppercase tracking-widest">{scheme?.ministry}</span>
                                    <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-primary-700 border border-primary-100 uppercase tracking-widest">{scheme?.category}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Benefit</label>
                                    <p className="text-xl font-black text-green-700 mt-1">
                                        ₹{scheme?.benefitAmount?.toLocaleString() || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Type</label>
                                    <p className="text-xl font-black text-gray-900 mt-1">{scheme?.schemeType || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Documents */}
                    <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30">
                        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center border-b border-gray-100 pb-4">
                            <FileText className="h-6 w-6 mr-3 text-primary-600" />
                            Submitted Documents
                        </h2>
                        {!application.application_documents || application.application_documents.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No documents retrieved from system</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {application.application_documents.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-primary-200 hover:bg-primary-50/20 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-primary-100 transition-colors">
                                                <FileText className="h-6 w-6 text-gray-400 group-hover:text-primary-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{doc.documentName || doc.documentType || 'Personal Document'}</p>
                                                <p className="text-xs text-gray-400 font-medium font-mono uppercase tracking-widest">{(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType?.split('/')[1]}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${doc.isVerified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                {doc.isVerified ? 'VERIFIED' : 'PENDING'}
                                            </span>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar Pane */}
                <div className="space-y-8">
                    {/* Execution Action Form */}
                    {application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW' ? (
                        <Card className="p-8 rounded-3xl border-gray-100 shadow-2xl shadow-primary-900/10 bg-gradient-to-b from-white to-gray-50/50 flex flex-col gap-6 sticky top-8">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">System Decision</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium italic">Your decision will notify the user instantly.</p>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Official Remarks</label>
                                <Textarea
                                    placeholder="Enter your professional review evaluation..."
                                    className="min-h-[160px] rounded-2xl border-gray-200 focus:ring-primary-500 p-4 text-sm font-medium"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-3 pt-2">
                                <Button
                                    onClick={() => handleReview('APPROVED')}
                                    disabled={isSubmitting}
                                    className="h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-200"
                                >
                                    <CheckCircle className="mr-3 h-5 w-5" />
                                    Confirm Approval
                                </Button>
                                <Button
                                    onClick={() => handleReview('REJECTED')}
                                    disabled={isSubmitting}
                                    variant="outline"
                                    className="h-14 rounded-2xl border-red-200 text-red-600 font-bold hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                                >
                                    <XCircle className="mr-2 h-5 w-5" />
                                    Reject Application
                                </Button>
                            </div>
                        </Card>
                    ) : (
                         <Card className="p-8 rounded-3xl border-gray-100 shadow-xl bg-gray-50/50 flex flex-col items-center text-center space-y-4">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${application.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {application.status === 'APPROVED' ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Review Finalized</h3>
                                <p className="text-sm text-gray-500 font-medium">This application was processed on {application.approvedAt || application.rejectedAt ? format(new Date(application.approvedAt || application.rejectedAt), 'MMM dd, yyyy') : 'N/A'}</p>
                            </div>
                            {application.rejectionReason && (
                                <div className="mt-4 p-4 bg-white border border-red-100 rounded-2xl w-full text-left">
                                    <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Reason</p>
                                    <p className="text-sm font-medium text-red-700">{application.rejectionReason}</p>
                                </div>
                            )}
                         </Card>
                    )}

                    {/* Simple Audit Timeline */}
                    <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30">
                        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                            Audit History
                        </h2>
                        <div className="space-y-6">
                            {history.length === 0 ? (
                                <p className="text-gray-400 text-xs font-bold text-center italic">No audit trail recorded</p>
                            ) : (
                                history.map((item: any, index: number) => (
                                    <div key={index} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                                            {index < history.length - 1 && <div className="w-0.5 grow bg-gray-100 mt-2 group-hover:bg-primary-100 transition-colors" />}
                                        </div>
                                        <div className="pb-6">
                                            <p className="text-sm font-black text-gray-900 leading-none">{item.newStatus || item.status}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{format(new Date(item.createdAt || item.changed_at), 'MMM dd, HH:mm')}</p>
                                            {item.remarks && <p className="text-xs text-gray-600 mt-3 p-3 bg-gray-50 rounded-xl italic font-medium">"{item.remarks}"</p>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
