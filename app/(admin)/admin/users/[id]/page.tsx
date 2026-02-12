'use client';
export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;

    const { data, error, isLoading } = useSWR(
        `/api/admin/users/${userId}`,
        fetcher
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-600 font-semibold">Failed to load user details</p>
                </div>
            </div>
        );
    }

    const { profile, applications, documents } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {profile.full_name || 'Unknown User'}
                        </h1>
                        <p className="text-gray-600 mt-1">User Details</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">Edit Profile</Button>
                    <Button>Promote to Admin</Button>
                </div>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <Card className="p-6 lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Full Name</label>
                            <p className="mt-1 text-gray-900">{profile.full_name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Mobile</label>
                            <p className="mt-1 text-gray-900 flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {profile.mobile || '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="mt-1 text-gray-900 flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {profile.email || '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                            <p className="mt-1 text-gray-900 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Gender</label>
                            <p className="mt-1 text-gray-900">{profile.gender || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Category</label>
                            <p className="mt-1">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    {profile.category || '-'}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">State</label>
                            <p className="mt-1 text-gray-900 flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                {profile.state || '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">District</label>
                            <p className="mt-1 text-gray-900">{profile.district || '-'}</p>
                        </div>
                    </div>
                </Card>

                {/* Stats */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Applications</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {applications.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Documents</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {documents.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Profile Completion</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {profile.profile_completion_percentage || 0}%
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Applications */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Application History
                </h2>
                {applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No applications yet</p>
                ) : (
                    <div className="space-y-3">
                        {applications.map((app: any) => (
                            <div
                                key={app.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-4">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {app.schemes?.schemeName || 'Unknown Scheme'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Applied on {new Date(app.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
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
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Documents */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                {documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No documents uploaded</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc: any) => (
                            <div
                                key={doc.id}
                                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'VERIFIED'
                                                ? 'bg-green-100 text-green-800'
                                                : doc.status === 'REJECTED'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {doc.status}
                                    </span>
                                </div>
                                <p className="font-medium text-gray-900 text-sm">
                                    {doc.document_code}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
