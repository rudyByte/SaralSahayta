'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { Card } from '@/components/ui/card';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
    const { data, error, isLoading } = useSWR('/api/admin/stats', fetcher, {
        refreshInterval: 30000, // Refresh every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-600 font-semibold">Failed to load dashboard</p>
                    <p className="text-gray-500 text-sm mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    const stats = data?.stats || {
        totalUsers: 0,
        totalApplications: 0,
        pendingApplications: 0,
        verifiedDocuments: 0
    };
    const recentApplications = data?.recentApplications || [];
    const statusDistribution = data?.statusDistribution || {};

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome to the admin portal</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                />
                <StatCard
                    title="Total Applications"
                    value={stats.totalApplications}
                    icon={FileText}
                />
                <StatCard
                    title="Pending Review"
                    value={stats.pendingApplications}
                    icon={Clock}
                />
                <StatCard
                    title="Verified Documents"
                    value={stats.verifiedDocuments}
                    icon={CheckCircle}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Applications */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Applications
                    </h2>
                    <div className="space-y-4">
                        {recentApplications.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No recent applications</p>
                        ) : (
                            recentApplications.map((app: any) => (
                                <Link 
                                    key={app.id}
                                    href={`/admin/applications/${app.id}`}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {app.user_profiles?.full_name || 'Unknown User'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {app.schemes?.schemeName || 'Unknown Scheme'}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'APPROVED'
                                            ? 'bg-green-100 text-green-800'
                                            : app.status === 'REJECTED'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {app.status}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </Card>

                {/* Application Status Distribution */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Application Status
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(statusDistribution).length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No data available</p>
                        ) : (
                            Object.entries(statusDistribution).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="text-gray-700">{status}</span>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, ((count as number) / (stats.totalApplications || 1)) * 100)}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                                            {count as number}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/admin/applications" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left block">
                        <FileText className="h-6 w-6 text-primary-600 mb-2" />
                        <p className="font-medium text-gray-900">Review Applications</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {stats.pendingApplications} pending review
                        </p>
                    </Link>
                    <Link href="/admin/users" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left block">
                        <Users className="h-6 w-6 text-primary-600 mb-2" />
                        <p className="font-medium text-gray-900">Manage Users</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {stats.totalUsers} total users
                        </p>
                    </Link>
                    <Link href="/admin/schemes" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left block">
                        <CheckCircle className="h-6 w-6 text-primary-600 mb-2" />
                        <p className="font-medium text-gray-900">Manage Schemes</p>
                        <p className="text-sm text-gray-600 mt-1">View/Edit all schemes</p>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
