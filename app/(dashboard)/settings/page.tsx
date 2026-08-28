"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProfileForm from '@/components/profile/profile-form';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Bell, Shield, Zap, Lock, Mail, Smartphone, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['profile', 'notifications', 'security', 'subscription'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        router.push(`/settings?tab=${val}`, { scroll: false });
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Settings & Preferences</h1>
                <p className="text-slate-500 font-medium mt-1">
                    Manage your citizen profile, notification preferences, security, and subscription status.
                </p>
            </div>

            {/* Main Tabs Hub */}
            <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 bg-slate-100 p-1.5 rounded-2xl h-auto gap-1">
                    <TabsTrigger 
                        value="profile" 
                        className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <User className="h-4 w-4" />
                        <span>Profile & Eligibility</span>
                    </TabsTrigger>

                    <TabsTrigger 
                        value="notifications" 
                        className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <Bell className="h-4 w-4" />
                        <span>Notifications</span>
                    </TabsTrigger>

                    <TabsTrigger 
                        value="security" 
                        className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <Shield className="h-4 w-4" />
                        <span>Security</span>
                    </TabsTrigger>

                    <TabsTrigger 
                        value="subscription" 
                        className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Membership</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: Profile & Eligibility */}
                <TabsContent value="profile" className="mt-0">
                    <ProfileForm />
                </TabsContent>

                {/* TAB 2: Notifications */}
                <TabsContent value="notifications" className="mt-0">
                    <NotificationSettings />
                </TabsContent>

                {/* TAB 3: Security & Account */}
                <TabsContent value="security" className="mt-0 space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                <Lock className="h-5 w-5 text-primary" />
                                Account & Login Security
                            </CardTitle>
                            <CardDescription>View and manage your login credentials and data privacy options.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-400">Registered Email</p>
                                        <p className="text-sm font-bold text-slate-900">{user?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold self-start sm:self-center">
                                    âœ“ Verified Account
                                </Badge>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-400">Registered Mobile</p>
                                        <p className="text-sm font-bold text-slate-900">{user?.user_metadata?.mobile || 'Aadhaar-linked Mobile'}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold self-start sm:self-center">
                                    âœ“ Linked
                                </Badge>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-2">Data Protection & Privacy Policy</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    SaralSahayta encrypts sensitive personal identification data (Aadhaar, Bank Account, Income Details) using AES-256 GCM encryption. Your eligibility data is exclusively evaluated for matching government benefits.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: Membership */}
                <TabsContent value="subscription" className="mt-0 space-y-6">
                    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-transparent shadow-sm rounded-3xl overflow-hidden p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <Badge className="bg-primary text-white font-bold text-xs px-3 py-1 rounded-full">
                                    Standard Plan
                                </Badge>
                                <h3 className="text-2xl font-black text-slate-900">SaralSahayta Citizen Direct</h3>
                                <p className="text-slate-600 text-sm max-w-md">
                                    Access scheme discovery, automated document readiness checking, and application guidance.
                                </p>
                            </div>
                            <Button 
                                onClick={() => router.push('/premium')}
                                className="h-12 px-6 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Zap className="h-4 w-4" />
                                Upgrade to Pro
                                <ExternalLink className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-12 bg-slate-100 rounded-2xl w-full" />
                </div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
