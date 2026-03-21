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

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');
        console.log("🚀 Starting Demo Login Process...");

        try {
            const randomId = Math.floor(Math.random() * 100000);
            const demoEmail = `visitor.${randomId}@sahayog.app`;
            const demoPassword = 'DemoUser123!';

            console.log(`👤 Attempting to create demo user: ${demoEmail}`);

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: demoEmail,
                password: demoPassword,
                options: {
                    data: {
                        mobile: '9876543210',
                        name: `Visitor ${randomId}`,
                        date_of_birth: '1995-01-01',
                        gender: 'NB',
                        category: 'GENERAL',
                        state: 'Delhi',
                    },
                },
            });

            if (signUpError) {
                console.error("❌ SignUp Error:", signUpError);
                if (signUpError.message.includes('rate limit')) {
                    throw new Error('System busy (Rate Limit). Please wait 60 seconds.');
                }
                throw signUpError;
            }

            console.log("✅ SignUp Successful. User Data:", signUpData);

            if (signUpData.user) {
                if (!signUpData.session) {
                    console.error("❌ No Session Created. Email Confirm is likely ON.");
                    const msg = 'Demo User Created but NOT LOGGED IN. Reason: "Confirm Email" is ENABLED in Supabase. Please disable it in Supabase -> Auth -> Providers -> Email.';
                    setError(msg);
                    alert(msg); // Force alert so user sees it
                    return;
                }

                console.log("🎉 Session Active! Redirecting to /discover...");
                window.location.href = '/discover';
            } else {
                console.error("❌ No user returned from SignUp");
            }

        } catch (err: any) {
            console.error('❌ Demo login exception:', err);
            const msg = err.message || 'Failed to initialize demo mode.';
            setError(msg);
            alert(msg); // Force alert
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white p-8 sm:p-12 w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
            
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/5 rounded-3xl mb-6 shadow-inner border border-primary/10">
                    <LogIn className="h-10 w-10 text-primary drop-shadow-md" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-slate-500 font-medium">Sign in to access your dashboard</p>
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
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors font-medium text-slate-900"
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
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors font-medium text-slate-900"
                    />
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl font-black text-base shadow-xl shadow-primary/20" disabled={loading}>
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

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400">Testing Access</span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-dashed border-2 hover:bg-slate-50 text-slate-600 font-bold"
                    onClick={handleDemoLogin}
                    disabled={loading}
                >
                    Login as Demo User
                </Button>

            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-primary font-semibold hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}
