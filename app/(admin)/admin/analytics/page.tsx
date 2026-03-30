'use client';

import { BarChart3, TrendingUp, Users, FileText, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: 'bg-blue-500',
    UNDER_REVIEW: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
    WITHDRAWN: 'bg-gray-400',
};

const STATUS_BG: Record<string, string> = {
    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    WITHDRAWN: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AnalyticsPage() {
    const { data, isLoading } = useSWR('/api/admin/stats', fetcher, {
        refreshInterval: 30000,
    });

    const stats = data?.stats || {
        totalUsers: 0,
        totalApplications: 0,
        pendingApplications: 0,
        verifiedDocuments: 0,
    };
    const statusDistribution = data?.statusDistribution || {};
    const recentApplications = data?.recentApplications || [];

    const total = stats.totalApplications || 1;
    const approvalRate = statusDistribution['APPROVED']
        ? Math.round((statusDistribution['APPROVED'] / total) * 100)
        : 0;
    const rejectionRate = statusDistribution['REJECTED']
        ? Math.round((statusDistribution['REJECTED'] / total) * 100)
        : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 font-medium mt-1">Platform performance at a glance</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black text-green-700 uppercase tracking-widest">Live Data</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Pending Review', value: stats.pendingApplications, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Verified Documents', value: stats.verifiedDocuments, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className="p-6 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
                                <p className="text-4xl font-black text-gray-900 mt-2">
                                    {isLoading ? (
                                        <span className="inline-block h-9 w-16 bg-gray-100 animate-pulse rounded-xl" />
                                    ) : (
                                        value?.toLocaleString() ?? 0
                                    )}
                                </p>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
                                <Icon className={`h-6 w-6 ${color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution Bar Chart */}
                <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-primary-600" />
                        Application Status Breakdown
                    </h2>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : Object.keys(statusDistribution).length === 0 ? (
                        <div className="text-center py-12 text-gray-400 font-medium">No application data yet</div>
                    ) : (
                        <div className="space-y-5">
                            {Object.entries(statusDistribution).map(([status, count]) => {
                                const pct = Math.round(((count as number) / total) * 100);
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${STATUS_BG[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                {status}
                                            </span>
                                            <span className="text-sm font-black text-gray-900">{count as number} <span className="text-gray-400 font-medium">({pct}%)</span></span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${STATUS_COLORS[status] || 'bg-gray-400'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Outcome Metrics */}
                <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-primary-600" />
                        Outcome Metrics
                    </h2>
                    <div className="space-y-6">
                        {/* Approval Rate */}
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                    <span className="font-black text-green-900">Approval Rate</span>
                                </div>
                                <span className="text-3xl font-black text-green-700">{isLoading ? '--' : `${approvalRate}%`}</span>
                            </div>
                            <div className="h-2 bg-green-200 rounded-full">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${approvalRate}%` }} />
                            </div>
                        </div>

                        {/* Rejection Rate */}
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                    <span className="font-black text-red-900">Rejection Rate</span>
                                </div>
                                <span className="text-3xl font-black text-red-700">{isLoading ? '--' : `${rejectionRate}%`}</span>
                            </div>
                            <div className="h-2 bg-red-200 rounded-full">
                                <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${rejectionRate}%` }} />
                            </div>
                        </div>

                        {/* Pending */}
                        <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-6 w-6 text-yellow-600" />
                                    <span className="font-black text-yellow-900">Awaiting Review</span>
                                </div>
                                <span className="text-3xl font-black text-yellow-700">{isLoading ? '--' : stats.pendingApplications}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity Feed */}
            <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary-600" />
                    Recent Application Activity
                </h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                ) : recentApplications.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 font-medium">No recent activity</p>
                ) : (
                    <div className="space-y-3">
                        {recentApplications.map((app: any) => (
                            <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-sm">
                                        {app.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{app.user?.name || 'Unknown User'}</p>
                                        <p className="text-xs text-gray-400 font-medium">{app.scheme?.name || 'Unknown Scheme'}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${STATUS_BG[app.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {app.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
