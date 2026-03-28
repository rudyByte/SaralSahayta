'use client';

import { FileText, Clock, CheckCircle2, XCircle, ChevronRight, Search, FileQuestion } from 'lucide-react';
import { Card } from '@/components/ui/card';
import useSWR from 'swr';
import Link from 'next/link';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; progress: string }> = {
    'SUBMITTED': { label: 'Submitted', icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50', progress: 'w-1/4 bg-blue-500' },
    'UNDER_REVIEW': { label: 'In Review', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50', progress: 'w-2/4 bg-yellow-500' },
    'APPROVED': { label: 'Approved', icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50', progress: 'w-full bg-green-500' },
    'REJECTED': { label: 'Rejected', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50', progress: 'w-full bg-red-500' },
    'DRAFT': { label: 'Draft', icon: FileText, color: 'text-gray-700', bg: 'bg-gray-50', progress: 'w-0' },
};

export default function ApplicationsPage() {
    const { data, error, isLoading } = useSWR('/api/applications', fetcher);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 px-4 py-8">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-4 w-96 bg-gray-100 animate-pulse rounded"></div>
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl border border-gray-100"></div>
                    ))}
                </div>
            </div>
        );
    }

    const applications = data?.applications || [];

    return (
        <div className="max-w-6xl mx-auto space-y-10 px-4 py-8 sm:px-6 lg:px-8">
            {/* Header section with Stats snapshot */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Applications</h1>
                    <p className="text-lg text-gray-600">Track your journey through various government schemes</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 pr-6">
                        <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</p>
                            <p className="text-xl font-bold text-gray-900">{applications.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Applications Feed */}
            <div className="grid gap-6">
                {applications.length === 0 ? (
                    <Card className="p-16 text-center border-2 border-dashed border-gray-200 bg-white shadow-xl shadow-gray-100/50 rounded-3xl">
                        <div className="flex flex-col items-center">
                            <div className="h-24 w-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary-50/50">
                                <FileQuestion className="h-12 w-12 text-primary-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">No applications found</h3>
                            <p className="text-gray-500 max-w-md mt-2 text-lg">
                                You haven't applied for any schemes yet. Our AI matched ones are waiting for you!
                            </p>
                            <Link 
                                href="/schemes" 
                                className="mt-8 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 hover:scale-105 active:scale-95"
                            >
                                Explore Schemes
                            </Link>
                        </div>
                    </Card>
                ) : (
                    applications.map((app: any) => {
                        const status = STATUS_CONFIG[app.status] || STATUS_CONFIG['SUBMITTED'];
                        const StatusIcon = status.icon;

                        return (
                            <Card key={app.id} className="group overflow-hidden border-gray-100 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-100/50 transition-all duration-500 rounded-3xl bg-white">
                                <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-start gap-6">
                                        <div className={`h-16 w-16 rounded-2xl ${status.bg} flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform duration-500`}>
                                            <StatusIcon className={`h-8 w-8 ${status.color}`} />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-2xl font-black text-gray-900 leading-tight">
                                                    {app.scheme?.name || 'Government Scheme'}
                                                </h3>
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${status.bg} ${status.color} border border-current/10 shadow-sm`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current mr-2 animate-pulse" />
                                                    {status.label}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                                                <div className="flex items-center">
                                                    <span className="text-gray-300 mr-2">#</span>
                                                    <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded leading-none">
                                                        {app.trackingId || app.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-2 opacity-50" />
                                                    {format(new Date(app.createdAt), 'MMMM dd, yyyy')}
                                                </div>
                                                <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full">
                                                    <span className="h-2 w-2 rounded-full bg-primary-400 mr-2" />
                                                    {app.scheme?.ministry || 'State Dept'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-0 border-gray-50">
                                        <Link 
                                            href={`/applications/${app.id}`}
                                            className="flex-1 lg:flex-none inline-flex items-center justify-center px-8 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all hover:shadow-xl active:scale-95 group/btn"
                                        >
                                            Track Order
                                            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </div>
                                </div>
                                
                                {/* Status Progress Bar */}
                                <div className="h-2 w-full bg-gray-50 flex">
                                    <div className={`h-full transition-all duration-1000 ease-out shadow-sm rounded-r-full ${status.progress}`} />
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
            
            {/* Context Info Footer */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary-200">
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold">Need Help with an Application?</h3>
                    <p className="text-primary-100 opacity-90 max-w-md">Our support team is available 24/7 to help you track and complete your government scheme submissions.</p>
                </div>
                <button className="px-8 py-4 bg-white text-primary-700 font-black rounded-2xl shadow-xl hover:bg-primary-50 transition-all hover:-translate-y-1 active:translate-y-0">
                    Get Support Now
                </button>
            </div>
        </div>
    );
}
