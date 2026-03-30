'use client';

import { useState } from 'react';
import { Settings, Lock, User, Shield, Bell, Database, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const settingsSections = [
        {
            icon: Lock,
            title: 'Security & Authentication',
            description: 'Manage admin login credentials and session settings',
            color: 'text-red-600',
            bg: 'bg-red-50',
        },
        {
            icon: Bell,
            title: 'Notification Preferences',
            description: 'Configure email and in-app alert triggers',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            icon: Database,
            title: 'Data & Storage',
            description: 'Manage document storage limits and retention policies',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            icon: Shield,
            title: 'Access Control',
            description: 'Manage roles, permissions and audit logging',
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 font-medium mt-1">Manage admin account and platform configuration</p>
            </div>

            {/* Change Password */}
            <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Change Admin Password</h2>
                        <p className="text-sm text-gray-500 font-medium">Update your secure admin credentials</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">New Password</label>
                        <Input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-12 rounded-2xl border-gray-200 focus:ring-primary-500 font-medium"
                            required
                            minLength={8}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                        <Input
                            type="password"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 rounded-2xl border-gray-200 focus:ring-primary-500 font-medium"
                            required
                            minLength={8}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isChangingPassword || !newPassword || !confirmPassword}
                        className="h-12 px-8 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </Card>

            {/* Admin Profile Info */}
            <Card className="p-8 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Admin Profile</h2>
                        <p className="text-sm text-gray-500 font-medium">Your admin account information</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                        { label: 'Login URL', value: '/admin-login' },
                        { label: 'Dashboard URL', value: '/admin/applications' },
                        { label: 'Role', value: 'Super Admin' },
                        { label: 'Platform', value: 'Saral Sahayta' },
                    ].map(({ label, value }) => (
                        <div key={label} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
                            <p className="text-sm font-bold text-gray-900 mt-1 font-mono">{value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Other Settings (coming soon) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {settingsSections.map(({ icon: Icon, title, description, color, bg }) => (
                    <Card
                        key={title}
                        className="p-6 rounded-3xl border-gray-100 shadow-xl shadow-gray-100/30 bg-white cursor-pointer group hover:shadow-2xl hover:border-primary-100 transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`h-11 w-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900">{title}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-1">{description}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
