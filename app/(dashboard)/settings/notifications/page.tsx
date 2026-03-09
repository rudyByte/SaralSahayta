"use client";

import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Mail, Smartphone, Shield, Zap, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function NotificationSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [prefs, setPrefs] = useState({
        smsEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false,
        pushEnabled: true,
    });

    useEffect(() => {
        fetch('/api/notifications/preferences')
            .then(res => res.json())
            .then(data => {
                if (data.prefs) {
                    setPrefs({
                        smsEnabled: data.prefs.smsEnabled,
                        emailEnabled: data.prefs.emailEnabled,
                        whatsappEnabled: data.prefs.whatsappEnabled,
                        pushEnabled: data.prefs.pushEnabled,
                    });
                }
            })
            .finally(() => setFetching(false));
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Preferences updated successfully");
        } catch (error) {
            toast.error("Failed to update preferences");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-4xl py-10 px-6">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Notification Settings</h1>
                <p className="text-slate-500 font-medium">Manage how and when you receive alerts about schemes and applications.</p>
            </div>

            <div className="grid gap-8">
                {fetching ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Core Channels */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                    <Bell className="h-5 w-5 text-primary" />
                                    Delivery Channels
                                </CardTitle>
                                <CardDescription>Choose your preferred ways to be contacted.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-slate-100">
                                <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl">
                                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">SMS Notifications</h4>
                                            <p className="text-sm text-slate-500">Alerts for application status and critical scheme deadlines.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.smsEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, smsEnabled: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-emerald-50 rounded-2xl">
                                            <Mail className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Email Updates</h4>
                                            <p className="text-sm text-slate-500">Weekly newsletters and detailed application summaries.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.emailEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, emailEnabled: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-rose-50 rounded-2xl relative">
                                            <Smartphone className="h-5 w-5 text-rose-600" />
                                            <Badge className="absolute -top-2 -right-2 text-[8px] px-1 py-0 h-4 bg-primary border-none">PREMIUM</Badge>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                WhatsApp Alerts
                                            </h4>
                                            <p className="text-sm text-slate-500 font-medium text-primary">Get direct alerts on your primary mobile number.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.whatsappEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, whatsappEnabled: v }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Categories */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Alert Categories</CardTitle>
                                <CardDescription>Select what kind of information you want to receive.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-slate-900">Application Tracking</div>
                                        <div className="text-xs text-slate-500">Real-time alerts when your application status changes.</div>
                                    </div>
                                    <Switch checked={true} disabled />
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-slate-900">Scheme Matching</div>
                                        <div className="text-xs text-slate-500">AI-powered alerts when new schemes match your profile.</div>
                                    </div>
                                    <Switch checked={prefs.pushEnabled} onCheckedChange={(v) => setPrefs(prev => ({ ...prev, pushEnabled: v }))} />
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-slate-900">Document Security</div>
                                        <div className="text-xs text-slate-500">Warnings when your uploaded documents are nearing expiry.</div>
                                    </div>
                                    <Switch checked={true} disabled />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-6 flex justify-between items-center border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                    <Shield className="h-4 w-4" />
                                    Privacy Guaranteed
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
                                >
                                    {loading ? "Saving..." : "Save Preferences"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </>
                )}

                {/* Help box */}
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex gap-4 items-start">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-primary/10">
                        <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-bold text-slate-900">Need help with notifications?</h5>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            If you aren't receiving SMS alerts, please check if your number is registered on DND or contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
