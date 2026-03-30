'use client';

import { useState } from 'react';
import { Search, UserPlus, MoreVertical, ShieldCheck, Ban, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { INDIAN_STATES } from '@/types';
import useSWR from 'swr';
import Link from 'next/link';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [state, setState] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);

    const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(state && state !== 'ALL_STATES' && { state }),
        ...(category && category !== 'ALL_CATEGORIES' && { category }),
    });

    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/users?${queryParams}`,
        fetcher
    );

    const handleUpdateUser = async (userId: string, updates: any) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, updates }),
            });

            if (!res.ok) throw new Error('Failed to update user');
            mutate();
        } catch (err) {
            console.error(err);
        }
    };

    const users = data?.users || [];
    const pagination = data?.pagination || {};

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 py-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">User Directory</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage and monitor all platform participants</p>
                </div>
                <Button className="h-12 px-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-200 transition-all active:scale-95">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Onboard New User
                </Button>
            </div>

            {/* Premium Filter Section */}
            <Card className="p-6 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/50 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-6 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <Input
                            type="search"
                            placeholder="Find by name, mobile, or identity..."
                            className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-primary-500 focus:border-transparent transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <Select value={state} onValueChange={setState}>
                            <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-medium">
                                <SelectValue placeholder="All States" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100">
                                <SelectItem value="ALL_STATES">All States</SelectItem>
                                {INDIAN_STATES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="lg:col-span-3">
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-medium">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100">
                                <SelectItem value="ALL_CATEGORIES">All Categories</SelectItem>
                                <SelectItem value="GENERAL">General</SelectItem>
                                <SelectItem value="SC">SC</SelectItem>
                                <SelectItem value="ST">ST</SelectItem>
                                <SelectItem value="OBC">OBC</SelectItem>
                                <SelectItem value="EWS">EWS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* User List Table */}
            <Card className="rounded-3xl border-gray-100 shadow-2xl shadow-gray-100/30 overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Identity</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Connect</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Region</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Progress</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Official Status</th>
                                <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-8"><div className="h-8 bg-gray-100 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Search className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">No users matched</h3>
                                            <p className="text-gray-500 mt-1">Try adjusting your filters or search terms</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-primary-50/10 transition-colors group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-100 text-white font-black text-lg group-hover:scale-110 transition-transform">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-gray-900">{user.name || 'Anonymous User'}</span>
                                                        {user.profile?.isAdmin && <ShieldCheck className="h-4 w-4 text-primary-600 fill-primary-50" />}
                                                    </div>
                                                    <div className="flex items-center text-xs font-black text-gray-400 tracking-widest uppercase mt-0.5">
                                                        Since {format(new Date(user.createdAt), 'MMM yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-sm font-semibold text-gray-700">
                                                    <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {user.mobile}
                                                </div>
                                                {user.email && (
                                                    <div className="flex items-center text-sm text-gray-500 font-medium">
                                                        <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-bold text-gray-700">
                                                <MapPin className="h-4 w-4 mr-2 text-primary-500 opacity-60" />
                                                {user.state || 'N/A'}
                                            </div>
                                            <p className="text-xs text-gray-400 font-black tracking-widest uppercase mt-1">{user.category}</p>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-primary-500 h-full rounded-full" 
                                                    style={{ width: `${user.profile?.profile_completion_percentage || 0}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                                                {user.profile?.profile_completion_percentage || 0}% Complete
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                                user.profile?.isSuspended ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full bg-current mr-2 ${!user.profile?.isSuspended ? 'animate-pulse' : ''}`} />
                                                {user.profile?.isSuspended ? 'Suspended' : 'Verified & Active'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100">
                                                        <MoreVertical className="h-5 w-5 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl border-gray-100 shadow-xl p-2 min-w-[180px]">
                                                    <DropdownMenuItem asChild className="rounded-xl py-3 cursor-pointer">
                                                        <Link href={`/admin/users/${user.id}`} className="font-bold text-gray-700 flex items-center">
                                                            View Full Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="rounded-xl py-3 cursor-pointer font-bold text-gray-700" 
                                                        onClick={() => handleUpdateUser(user.id, { isAdmin: !user.profile?.isAdmin })}
                                                    >
                                                        {user.profile?.isAdmin ? 'Remove Primary Access' : 'Grant Admin Status'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className={`rounded-xl py-3 cursor-pointer font-bold ${user.profile?.isSuspended ? 'text-green-600' : 'text-red-600'}`}
                                                        onClick={() => handleUpdateUser(user.id, { isSuspended: !user.profile?.isSuspended })}
                                                    >
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        {user.profile?.isSuspended ? 'Uplift Suspension' : 'Deactivate Identity'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pagination.totalPages > 1 && (
                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-bold text-gray-500">
                            Viewing <span className="text-gray-900">{(page - 1) * pagination.limit + 1}—{Math.min(page * pagination.limit, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> users
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl border-gray-200" 
                                onClick={() => setPage(page - 1)} 
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="px-4 text-sm font-black text-primary-600 uppercase tracking-widest">Page {page} of {pagination.totalPages}</div>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl border-gray-200" 
                                onClick={() => setPage(page + 1)} 
                                disabled={page >= pagination.totalPages}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
