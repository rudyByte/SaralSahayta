'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { INDIAN_STATES } from '@/types';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        mobile: '',
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        gender: '',
        category: '',
        state: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            setLoading(false);
            return;
        }

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        mobile: formData.mobile,
                        name: formData.name,
                        date_of_birth: formData.dateOfBirth,
                        gender: formData.gender,
                        category: formData.category,
                        state: formData.state,
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // Redirect to login or dashboard
                router.push('/discover');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white p-8 sm:p-12 max-w-2xl w-full relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0" />

            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6 shadow-inner border border-primary/20">
                    <UserPlus className="h-10 w-10 text-primary drop-shadow-md" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Create Account</h1>
                <p className="text-slate-600 font-medium text-balance">Join thousands discovering their eligible schemes</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                            Full Name *
                        </label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                            Email Address *
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="mobile" className="block text-sm font-bold text-slate-700 mb-2">
                            Mobile Number *
                        </label>
                        <Input
                            id="mobile"
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={formData.mobile}
                            onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required
                            maxLength={10}
                            pattern="[6-9][0-9]{9}"
                            disabled={loading}
                        />
                    </div>
                </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-bold text-slate-700 mb-2">
                            Date of Birth *
                        </label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                            required
                            max={new Date().toISOString().split('T')[0]}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="gender" className="block text-sm font-bold text-slate-700 mb-2">
                            Gender *
                        </label>
                        <Select
                            value={formData.gender}
                            onValueChange={(value) => handleChange('gender', value)}
                            disabled={loading}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-bold text-slate-700 mb-2">
                            Category *
                        </label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => handleChange('category', value)}
                            disabled={loading}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GENERAL">General</SelectItem>
                                <SelectItem value="SC">SC (Scheduled Caste)</SelectItem>
                                <SelectItem value="ST">ST (Scheduled Tribe)</SelectItem>
                                <SelectItem value="OBC">OBC (Other Backward Class)</SelectItem>
                                <SelectItem value="EWS">EWS (Economically Weaker Section)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label htmlFor="state" className="block text-sm font-bold text-slate-700 mb-2">
                            State *
                        </label>
                        <Select
                            value={formData.state}
                            onValueChange={(value) => handleChange('state', value)}
                            disabled={loading}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {INDIAN_STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                            Password *
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            minLength={8}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
                            Confirm Password *
                        </label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            required
                            minLength={8}
                            disabled={loading}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl font-black text-base shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 text-white transition-all active:scale-[0.98]" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Account
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
