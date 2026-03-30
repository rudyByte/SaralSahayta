'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
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
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminSchemesPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);

    const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(category && category !== 'ALL_CATEGORIES' && { category }),
    });

    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/schemes?${queryParams}`,
        fetcher
    );

    const schemes = data?.schemes || [];
    const pagination = data?.pagination || {};

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this scheme?')) return;
        try {
            const res = await fetch(`/api/admin/schemes/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            mutate();
        } catch (err) {
            alert('Error deleting scheme');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Scheme Management</h1>
                    <p className="text-gray-600 mt-1">Add, edit, and manage all government schemes</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Scheme
                </Button>
            </div>

            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search schemes by name or ministry..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL_CATEGORIES">All Categories</SelectItem>
                            <SelectItem value="EDUCATION">Education</SelectItem>
                            <SelectItem value="AGRICULTURE">Agriculture</SelectItem>
                            <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                            <SelectItem value="HOUSING">Housing</SelectItem>
                            <SelectItem value="ENTREPRENEURSHIP">Entrepreneurship</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ministry</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-500">Loading...</td></tr>
                            ) : schemes.length === 0 ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-500">No schemes found</td></tr>
                            ) : (
                                schemes.map((scheme: any) => (
                                    <tr key={scheme.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{scheme.name}</div>
                                            <div className="text-xs text-gray-500">{scheme.schemeId}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{scheme.ministry}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${scheme.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {scheme.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{scheme._count?.applications || 0}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button variant="ghost" size="icon" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-600" title="Delete" onClick={() => handleDelete(scheme.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
