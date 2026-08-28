'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, FileText, ArrowRight, Home, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ApplicationSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                {/* Success Icon */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-1000 scale-150 opacity-20"></div>
                    <div className="relative h-24 w-24 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40">
                        <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                </div>

                {/* Main Message */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Application Submitted!</h1>
                    <p className="text-xl text-gray-500 max-w-2xl">
                        Your application for the government scheme has been successfully received and is currently under review.
                    </p>
                </div>

                {/* Application Snapshot Card */}
                <Card className="w-full max-w-lg p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/50 bg-white group hover:shadow-2xl transition-all duration-500">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Tracking Reference</span>
                            <span className="font-mono text-lg font-black text-primary-600 bg-primary/5 px-3 py-1 rounded-lg">
                                {applicationId?.slice(0, 12).toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <p className="font-bold text-blue-600 flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                                    Submitted
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Response Time</p>
                                <p className="font-bold text-gray-900">7-10 Days</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 text-left">
                            <div className="h-5 w-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[10px] font-black text-amber-700">!</span>
                            </div>
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                Always keep your tracking ID handy. You'll receive real-time updates via SMS and notifications on your dashboard as your review progresses.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                    <Link href="/applications" className="contents">
                        <Button className="h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all shadow-xl shadow-gray-200 group/btn">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                    <Link href="/discover" className="contents">
                        <Button variant="outline" className="h-14 rounded-2xl border-gray-200 font-bold hover:bg-gray-50 transition-all">
                            <Home className="mr-2 h-5 w-5" />
                            Explore Schemes
                        </Button>
                    </Link>
                </div>

                <div className="pt-8 border-t border-gray-100 w-full flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-sm cursor-pointer hover:underline">
                        <FileText className="h-4 w-4" />
                        Download Acknowledgment
                    </div>
                </div>
            </div>
        </div>
    );
}

// Inline Link component wrapper for convenience
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    const router = useRouter();
    return (
        <div onClick={() => router.push(href)} className={className + " cursor-pointer"}>
            {children}
        </div>
    );
}
