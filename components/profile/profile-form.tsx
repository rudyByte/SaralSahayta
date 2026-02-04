'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fullProfileUpdateSchema, type FullProfileUpdateInput } from '@/lib/validations';
import { INDIA_DATA, getStates, getDistricts } from '@/lib/india-data';
import { validateIFSC } from '@/lib/ifsc';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types for form select options
const CATEGORIES = ['GENERAL', 'SC', 'ST', 'OBC', 'EWS'];
const EDUCATION_LEVELS = [
    { value: 'BELOW_10TH', label: 'Below 10th' },
    { value: 'CLASS_10TH', label: 'Class 10th' },
    { value: 'CLASS_12TH', label: 'Class 12th' },
    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
    { value: 'GRADUATE', label: 'Graduate' },
    { value: 'POSTGRADUATE', label: 'Postgraduate' },
    { value: 'DOCTORATE', label: 'Doctorate' }
];
const OCCUPATIONS = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'FARMER', label: 'Farmer' },
    { value: 'ENTREPRENEUR', label: 'Entrepreneur' },
    { value: 'SALARIED', label: 'Salaried' },
    { value: 'UNEMPLOYED', label: 'Unemployed' },
    { value: 'OTHER', label: 'Other' }
];

export default function ProfileForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [completion, setCompletion] = useState(0);
    const [districts, setDistricts] = useState<string[]>([]);

    // Form Setup
    const form = useForm<FullProfileUpdateInput>({
        resolver: zodResolver(fullProfileUpdateSchema),
        mode: 'onChange',
        defaultValues: {
            disability: false,
            disabilityType: '',
            state: '',
            district: '',
            annualIncome: 0
        }
    });

    const { control, handleSubmit, watch, setValue, reset, formState: { errors, isDirty, isValid } } = form;

    // Watch for dependent fields
    const watchedState = watch('state');
    const watchedIfsc = watch('ifscCode');
    const watchedDisability = watch('disability');

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    const { user, profile } = data;

                    // Merge Data
                    // Priorities: Profile Table > User Metadata > Defaults
                    const formData: any = {
                        name: profile?.full_name || user.user_metadata.name || '',
                        email: profile?.email || user.email || '',
                        dateOfBirth: profile?.date_of_birth?.split('T')[0] || user.user_metadata.date_of_birth || '',
                        gender: profile?.gender || user.user_metadata.gender || 'MALE',

                        category: profile?.category || user.user_metadata.category || 'GENERAL',
                        annualIncome: profile?.annual_income || 0,
                        state: profile?.state || user.user_metadata.state || '',
                        district: profile?.district || '',
                        education: profile?.education || 'BELOW_10TH',
                        occupation: profile?.occupation || 'STUDENT',
                        disability: profile?.disability || false,
                        disabilityType: profile?.disability_type || '',

                        bankAccount: profile?.bank_account || '',
                        ifscCode: profile?.ifsc_code || '',
                        bankName: profile?.bank_name || '',
                        branch: profile?.bank_branch || '',
                    };

                    reset(formData);

                    // Set initial completion if available, or calculate (handled by API return usually but we can use local for now)
                    setCompletion(profile?.profile_completion_percentage || 0);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    // Update Districts when State changes
    useEffect(() => {
        if (watchedState) {
            setDistricts(getDistricts(watchedState));
        } else {
            setDistricts([]);
        }
    }, [watchedState]);

    // Validate IFSC and auto-fill bank details
    useEffect(() => {
        const checkIFSC = async () => {
            if (watchedIfsc && watchedIfsc.length === 11) {
                const result = await validateIFSC(watchedIfsc);
                if (result.valid) {
                    setValue('bankName', result.bankName || '');
                    setValue('branch', result.branch || '');
                    form.clearErrors('ifscCode');
                } else {
                    form.setError('ifscCode', { type: 'manual', message: result.error });
                }
            }
        };
        // Debounce slightly
        const timer = setTimeout(checkIFSC, 500);
        return () => clearTimeout(timer);
    }, [watchedIfsc, setValue, form]);

    // Auto-Save Logic (Simple implementation: Trigger save on submit, dirty check handled by user manual save first for V1 reliability)
    const onSubmit = async (data: FullProfileUpdateInput) => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const result = await res.json();
                setCompletion(result.completion);
                setLastSaved(new Date());
                // Reset dirty state with current data
                reset(data);
            } else {
                const result = await res.json();
                console.error("Save failed:", result);
                alert(`Failed to save profile: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error saving profile (Network or Client error).');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Progress */}
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Profile Completion</CardTitle>
                            <CardDescription>Complete your profile to discover eligible schemes</CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{completion}%</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={completion} className="h-2" />
                    {completion < 80 && (
                        <p className="mt-2 text-sm text-amber-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Complete your profile to unlock more schemes.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Main Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">My Information</h2>
                    <div className="flex items-center space-x-4">
                        {lastSaved && (
                            <span className="text-xs text-muted-foreground flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <Button type="submit" disabled={saving || !isDirty}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="basic">Basic Information</TabsTrigger>
                        <TabsTrigger value="eligibility">Eligibility Details</TabsTrigger>
                        <TabsTrigger value="bank">Bank Details</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: BASIC INFO */}
                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Details</CardTitle>
                                <CardDescription>Your personal identification information</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input {...form.register('name')} placeholder="Enter your full name" />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input {...form.register('email')} placeholder="email@example.com" type="email" />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date of Birth</label>
                                    <Input {...form.register('dateOfBirth')} type="date" />
                                    {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Gender</label>
                                    <Controller
                                        control={control}
                                        name="gender"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2 opacity-70">
                                    <label className="text-sm font-medium">Phone Number (Verified)</label>
                                    <Input disabled value={(form.getValues() as any).mobile || 'Not loaded'} className="bg-muted" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: ELIGIBILITY */}
                    <TabsContent value="eligibility" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Eligibility Criteria</CardTitle>
                                <CardDescription>This information helps us match you with schemes</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category / Caste</label>
                                    <Controller
                                        control={control}
                                        name="category"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Annual Family Income (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                        <Input {...form.register('annualIncome')} type="number" className="pl-7" />
                                    </div>
                                    {errors.annualIncome && <p className="text-xs text-red-500">{errors.annualIncome.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">State</label>
                                    <Controller
                                        control={control}
                                        name="state"
                                        render={({ field }) => (
                                            <Select onValueChange={(val) => {
                                                field.onChange(val);
                                                setValue('district', ''); // Reset district
                                            }} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select State" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {getStates().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">District</label>
                                    <Controller
                                        control={control}
                                        name="district"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedState}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={watchedState ? "Select District" : "Select State First"} />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Education Level</label>
                                    <Controller
                                        control={control}
                                        name="education"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select Education" /></SelectTrigger>
                                                <SelectContent>
                                                    {EDUCATION_LEVELS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Occupation</label>
                                    <Controller
                                        control={control}
                                        name="occupation"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select Occupation" /></SelectTrigger>
                                                <SelectContent>
                                                    {OCCUPATIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex items-center space-x-2 border p-4 rounded-md">
                                        <Controller
                                            control={control}
                                            name="disability"
                                            render={({ field }) => (
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 bg-primary"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                        <label className="text-sm font-medium">I have a disability</label>
                                    </div>
                                </div>

                                {watchedDisability && (
                                    <div className="space-y-2 md:col-span-2 animation-fade-in">
                                        <label className="text-sm font-medium">Disability Type / Percentage</label>
                                        <Input {...form.register('disabilityType')} placeholder="e.g. Visual Impairment, 40%" />
                                        {errors.disabilityType && <p className="text-xs text-red-500">{errors.disabilityType.message}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: BANK */}
                    <TabsContent value="bank" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bank Account Details</CardTitle>
                                <CardDescription>Required for Direct Benefit Transfer (DBT) schemes</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Account Number</label>
                                    <Input {...form.register('bankAccount')} placeholder="Enter Account Number" type="password" />
                                    <p className="text-xs text-muted-foreground">We mask this for security.</p>
                                    {errors.bankAccount && <p className="text-xs text-red-500">{errors.bankAccount.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Confirm Account Number</label>
                                    {/* Using same field for simplicity in MVP, ideally separate confirm field */}
                                    <Input placeholder="Re-enter Account Number" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IFSC Code</label>
                                    <Input {...form.register('ifscCode')} placeholder="e.g. SBIN0001234" className="uppercase" maxLength={11} />
                                    {errors.ifscCode && <p className="text-xs text-red-500">{errors.ifscCode.message}</p>}
                                </div>
                                <div className="space-y-2 md:col-span-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium opacity-70">Bank Name</label>
                                        <Input {...form.register('bankName')} disabled className="bg-muted" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium opacity-70">Branch</label>
                                        <Input {...form.register('branch')} disabled className="bg-muted" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </div>
    );
}
