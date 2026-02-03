'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // For now, using email/password auth
            // Mobile format: mobile@sahayog.app
            const email = `${mobile}@sahayog.app`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                router.push('/discover');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <LogIn className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">Welcome Back</h1>
                <p className="text-gray-600">Sign in to access your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                    </label>
                    <Input
                        id="mobile"
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-primary font-semibold hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}
