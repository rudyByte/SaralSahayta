'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, FileText, LayoutDashboard, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    const { data, error, isLoading } = useSWR(`/api/applications/${applicationId}`, fetcher);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="h-10 w-64 bg-gray-200 animate-pulse rounded-lg mb-8" />
                <div className="space-y-6">
                    <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                    <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                </div>
            </div>
        );
    }

    const application = data?.application;

    if (error || !application) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center">
                <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">Application Not Found</h3>
                <p className="text-gray-500 mt-2">The application you are looking for does not exist or was removed.</p>
                <Button variant="outline" className="mt-8 rounded-2xl" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <div className="flex flex-col gap-8">
                {/* Back button and breadcrumb */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="px-0 hover:bg-transparent -ml-2 text-gray-400 font-bold" onClick={() => router.push('/applications')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <div className="text-xs font-black text-gray-300 uppercase tracking-widest">Tracking Status</div>
                </div>

                {/* Main Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <h1 className="text-4xl font-black text-gray-900 tracking-tight">{application.scheme?.name || 'Scheme Application'}</h1>
                             <div className="px-3 py-1 bg-primary/10 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                {application.status}
                             </div>
                        </div>
                        <p className="text-lg text-gray-500 font-medium leading-relaxed">Reference: <span className="font-mono text-gray-900">{application.trackingId || application.id.slice(0, 12).toUpperCase()}</span></p>
                    </div>
                </div>

                {/* Progress bar visual */}
                <div className="grid grid-cols-4 gap-4 py-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-gray-100 z-0"></div>
                    <div 
                        className="absolute top-1/2 left-0 h-1 bg-primary z-0 transition-all duration-1000" 
                        style={{ width: application.status === 'APPROVED' ? '100%' : application.status === 'UNDER_REVIEW' ? '75%' : '25%' }}
                    ></div>
                    
                    {[
                        { icon: FileText, label: 'Submitted', active: true },
                        { icon: Clock, label: 'In Review', active: application.status !== 'SUBMITTED' },
                        { icon: CheckCircle2, label: 'Verified', active: application.status === 'APPROVED' || application.status === 'REJECTED' },
                        { icon: CheckCircle2, label: 'Final Decision', active: application.status === 'APPROVED' || application.status === 'REJECTED' },
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center border-4 shadow-sm transition-colors duration-500 ${step.active ? 'bg-white border-primary text-primary' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                <step.icon className="h-5 w-5" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>

                {/* Sub-Details */}
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3">Submission Info</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Applied Date</span>
                                <span className="text-sm font-bold text-gray-900">{format(new Date(application.createdAt), 'MMMM dd, yyyy')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Ministry</span>
                                <span className="text-sm font-bold text-gray-900">{application.scheme?.ministry || 'State Government'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Response Target</span>
                                <span className="text-sm font-bold text-primary-600">Within 10 Days</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3">Next Action</h3>
                        <div className="flex flex-col items-center text-center space-y-4 pt-4">
                            <div className="h-14 w-14 bg-amber-50 rounded-full flex items-center justify-center shadow-inner">
                                <Clock className="h-7 w-7 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900">Admin Review Pending</h4>
                                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed px-4">Our officers are currently verifying your attached documents against the scheme requirements.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Inline Link wrapper to avoid routing errors
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    const router = useRouter();
    return (
        <div onClick={() => router.push(href)} className={className + " cursor-pointer"}>
            {children}
        </div>
    );
}
