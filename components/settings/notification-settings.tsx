"use client";

import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Mail, Smartphone, Shield, Zap, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function NotificationSettings() {
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
            .catch(() => {})
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
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Notification Channels</h2>
                <p className="text-slate-500 font-medium text-sm">Manage how and when you receive alerts about schemes and applications.</p>
            </div>

            <div className="grid gap-6">
                {fetching ? (
                    <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-100">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                    <Bell className="h-5 w-5 text-primary" />
                                    Delivery Channels
                                </CardTitle>
                                <CardDescription>Choose your preferred ways to be contacted.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-slate-100">
                                <div className="flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-indigo-50 rounded-2xl shrink-0">
                                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">SMS Notifications</h4>
                                            <p className="text-xs sm:text-sm text-slate-500">Alerts for application status and critical scheme deadlines.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.smsEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, smsEnabled: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
                                            <Mail className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Email Updates</h4>
                                            <p className="text-xs sm:text-sm text-slate-500">Weekly summaries of newly matched schemes and status reports.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.emailEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, emailEnabled: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-amber-50 rounded-2xl shrink-0">
                                            <Smartphone className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">WhatsApp Alerts</h4>
                                                <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">Beta</Badge>
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-500">Instant document validation reminders directly on WhatsApp.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.whatsappEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, whatsappEnabled: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-rose-50 rounded-2xl shrink-0">
                                            <Zap className="h-5 w-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">In-App Push Alerts</h4>
                                            <p className="text-xs sm:text-sm text-slate-500">Real-time alerts when new schemes matching your profile are launched.</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs.pushEnabled}
                                        onCheckedChange={(v) => setPrefs(prev => ({ ...prev, pushEnabled: v }))}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/80 p-4 sm:p-6 border-t border-slate-100 flex justify-end">
                                <Button 
                                    onClick={handleSave} 
                                    disabled={loading}
                                    className="font-bold rounded-xl px-6 h-11"
                                >
                                    {loading ? "Saving..." : "Save Preferences"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}