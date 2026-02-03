'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Search, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverPage() {
    const { user, signOut, loading } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <Link href="/discover" className="text-2xl font-bold text-primary">
                                SahayoG
                            </Link>
                            <nav className="hidden md:flex space-x-6">
                                <Link href="/discover" className="text-primary font-semibold">
                                    Discover
                                </Link>
                                <Link href="/profile" className="text-gray-600 hover:text-primary">
                                    Profile
                                </Link>
                                <Link href="/applications" className="text-gray-600 hover:text-primary">
                                    Applications
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{user?.user_metadata?.name || user?.email}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSignOut}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.user_metadata?.name || 'User'}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Discover government schemes and scholarships you're eligible for
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Matched Schemes
                            </CardTitle>
                            <Search className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <p className="text-xs text-gray-500 mt-1">Complete your profile to discover schemes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Applications
                            </CardTitle>
                            <FileText className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <p className="text-xs text-gray-500 mt-1">No applications yet</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Success Rate
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-success" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">--</div>
                            <p className="text-xs text-gray-500 mt-1">Apply to see your success rate</p>
                        </CardContent>
                    </Card>
                </div>

                {/* User Profile Info */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Your Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Mobile:</span>{' '}
                                <span className="font-medium">{user?.user_metadata?.mobile || 'Not provided'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Gender:</span>{' '}
                                <span className="font-medium">{user?.user_metadata?.gender || 'Not provided'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Category:</span>{' '}
                                <span className="font-medium">{user?.user_metadata?.category || 'Not provided'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">State:</span>{' '}
                                <span className="font-medium">{user?.user_metadata?.state || 'Not provided'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Date of Birth:</span>{' '}
                                <span className="font-medium">{user?.user_metadata?.date_of_birth || 'Not provided'}</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link href="/profile">
                                <Button variant="outline">
                                    <User className="h-4 w-4 mr-2" />
                                    Complete Profile
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Coming Soon */}
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Scheme Discovery Coming Soon
                        </h3>
                        <p className="text-gray-600">
                            We're building an AI-powered matching engine to find schemes you're eligible for.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
