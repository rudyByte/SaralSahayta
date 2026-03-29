'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Search, Filter, FileText, MoreVertical, Star, ShieldCheck, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statusColors: Record<string, string> = {
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    WITHDRAWN: 'bg-gray-100 text-gray-800',
};

export default function ApplicationsPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState(false);
    const [page, setPage] = useState(1);

    const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(priority && { priority: 'true' }),
    });

    const { data, error, isLoading } = useSWR(
        `/api/admin/applications?${queryParams}`,
        fetcher,
        {
            refreshInterval: 5000,
            revalidateOnFocus: true
        }
    );

    const applications = data?.applications || [];
    const pagination = data?.pagination || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
                    <p className="text-gray-600 mt-1">Review and manage scheme applications</p>
                </div>
                <Button 
                    variant="outline" 
                    className="flex items-center bg-white"
                    onClick={() => window.open('/api/admin/applications/export' + (status ? `?status=${status}` : ''))}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search by applicant name or ID..."
                            className="pl-10 h-10 bg-slate-50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[180px] h-10 bg-slate-50 border-slate-200">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Statuses</SelectItem>
                                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant={priority ? 'default' : 'outline'}
                            className={`h-10 transition-colors ${priority ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-200' : 'text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50'}`}
                            onClick={() => {
                                setPriority(!priority);
                                setPage(1);
                            }}
                        >
                            <Star className={`w-4 h-4 mr-2 ${priority ? 'fill-white' : ''}`} />
                            Priority First
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Applications Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-left">Application ID</th>
                                <th className="px-6 py-4 text-left">Applicant</th>
                                <th className="px-6 py-4 text-left">Scheme</th>
                                <th className="px-6 py-4 text-left">Applied Date</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : applications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No applications found
                                    </td>
                                </tr>
                            ) : (
                                 applications.map((app: any) => {
                                    const isPriority = app.is_premium; // Assuming is_premium is passed at top level or in user

                                    return (
                                        <tr key={app.id} className={`hover:bg-slate-50 transition-colors ${isPriority ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-2 border-l-amber-400' : 'border-l-2 border-l-transparent'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-mono text-slate-900 font-semibold">
                                                        {app.trackingId || app.id.slice(0, 8)}
                                                    </div>
                                                    {isPriority && (
                                                        <div title="Premium Application">
                                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {app.user?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {app.user?.mobile}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-sm font-medium ${isPriority ? 'text-amber-900' : 'text-slate-900'}`}>
                                                    {app.scheme?.name || 'Unknown Scheme'}
                                                </div>
                                                <div className="text-sm text-slate-500 text-xs truncate max-w-[200px]">
                                                    {app.scheme?.category}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-full border ${statusColors[app.status] ? `${statusColors[app.status]} border-opacity-20` : 'bg-slate-100 text-slate-800 border-slate-200'
                                                        }`}
                                                >
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <Link href={`/admin/applications/${app.id}`}>
                                                    <Button variant={isPriority ? "default" : "ghost"} size="sm" className={isPriority ? 'bg-slate-900 text-white hover:bg-slate-800 h-8 rounded-lg' : 'font-semibold text-slate-600 h-8 rounded-lg'}>
                                                        Review
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing <span className="font-semibold text-slate-900">{(page - 1) * pagination.limit + 1}</span> to{' '}
                            <span className="font-semibold text-slate-900">
                                {Math.min(page * pagination.limit, pagination.total)}
                            </span>{' '}
                            of <span className="font-semibold text-slate-900">{pagination.total}</span>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-300 text-slate-700 bg-white"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-300 text-slate-700 bg-white"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
