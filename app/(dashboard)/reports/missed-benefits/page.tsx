import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PositiveStats } from '@/components/reports/PositiveStats';
import { Tip } from '@/components/reports/Tip';
import { findSimilarActiveSchemes } from '@/lib/recommendations/find-similar-schemes';
import { format } from 'date-fns';
import { 
    Bell, 
    Calendar, 
    FileText, 
    Crown, 
    Target, 
    Rocket,
    ArrowRight,
    TrendingUp,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function MissedBenefitsReportPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // 1. Get Application Stats
    const { data: applications } = await supabase
        .from('Application')
        .select(`
            status, 
            schemeId, 
            scheme:Scheme(benefitAmount)
        `)
        .eq('userId', user.id);

    const appliedCount = applications?.length || 0;
    const approved = applications?.filter(a => a.status === 'APPROVED') || [];
    const approvedCount = approved.length;
    const totalBenefits = approved.reduce((sum, app) => sum + (Number((app.scheme as any)?.benefitAmount) || 0), 0);

    // 2. Get Missed Benefits (Match score >= 70 but missed deadline and never applied)
    const { data: missedData } = await supabase
        .from('user_scheme_matches')
        .select('scheme_id, match_score, schemes(*)')
        .eq('user_id', user.id)
        .gte('match_score', 70)
        .order('match_score', { ascending: false });

    // Filter logic: deadline passed, and user didn't apply
    const appliedSchemeIds = new Set(applications?.map(a => a.schemeId));
    
    // We mock the "missed" aspect securely here without complicated SQL
    const missedSchemes = missedData?.filter(match => {
        const s = match.schemes as any;
        if (!s) return false;
        if (appliedSchemeIds.has(s.id)) return false;
        if (s.isRolling) return false;
        if (!s.deadline) return false;
        
        // Is deadline in the past?
        return new Date(s.deadline) < new Date();
    }).map(m => m.schemes) || [];

    // Find alternatives for up to 3 missed schemes
    const alternativesMap: Record<string, any[]> = {};
    for (const scheme of missedSchemes.slice(0, 3)) {
        const alts = await findSimilarActiveSchemes(scheme);
        if (alts.length > 0) {
            alternativesMap[(scheme as any).id] = alts;
        }
    }

    const motivationalMessages = [
        "You're doing great! Let's find even more opportunities together.",
        "Every journey starts with one step. You've already made fantastic progress!",
        "Saral Sahayta is here to ensure you never miss an opportunity again.",
        "The best time to apply was yesterday. The second best time is today!"
    ];
    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header */}
            <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4 shadow-sm border border-indigo-200">
                    <Target className="h-10 w-10 text-indigo-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
                    Your Opportunity Report
                </h1>
                <p className="text-lg text-indigo-700 font-medium max-w-2xl mx-auto italic">
                    "{message}"
                </p>
            </div>

            {/* Positive Stats */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
                <PositiveStats 
                    appliedCount={appliedCount}
                    approvedCount={approvedCount}
                    totalBenefits={totalBenefits}
                    missedCount={missedSchemes.length}
                />
            </div>

            {/* Similar Opportunities (The "Missed" Section Pivot) */}
            {Object.keys(alternativesMap).length > 0 && (
                <div className="mb-10 p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-3xl border border-indigo-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-indigo-500" />
                                Similar Opportunities Open Now
                            </h2>
                            <p className="text-slate-600 font-medium">
                                While some scheme deadlines have passed, we found even better alternatives currently accepting applications!
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {missedSchemes.slice(0, 3).map((missed: any) => {
                            const alternatives = alternativesMap[missed.id];
                            if (!alternatives || alternatives.length === 0) return null;
                            const alt = alternatives[0];

                            return (
                                <div key={missed.id} className="p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
                                    
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                                Alternative to {missed.name} (Closed {format(new Date(missed.deadline), 'MMM d, yyyy')})
                                            </p>
                                            <h3 className="text-xl font-bold text-emerald-600 mb-2">
                                                ✨ {alt.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-medium">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <span className="text-slate-400">Benefit:</span>
                                                    <span className="text-slate-900 font-bold">₹{alt.benefitAmount?.toLocaleString() || '0'}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <span className="text-slate-400">Deadline:</span>
                                                    <span className="text-slate-900 font-bold">
                                                        {alt.isRolling ? "Rolling" : (alt.deadline ? format(new Date(alt.deadline), 'MMM d, yyyy') : "N/A")}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <Button asChild className="w-full md:w-auto px-6 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 font-bold text-base transition-all active:scale-95">
                                                <Link href={`/schemes/${alt.id}`}>
                                                    Apply Now
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tips Section */}
            <div className="mb-10 p-6 md:p-8 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <h3 className="font-extrabold text-2xl text-slate-900">
                        How to Stay on Top of Opportunities
                    </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <Tip
                        icon={<Bell />}
                        title="Enable Notifications"
                        description="Get instant alerts when new schemes launch or deadlines approach."
                        action="Settings View"
                        onAction={() => {/* Handled by router link or alert */}}
                    />
                    <Tip
                        icon={<Calendar />}
                        title="Add Life Events"
                        description="Tell us about major life changes to get personalized recommendations."
                        action="Update Profile"
                        onAction={() => {}}
                    />
                    <Tip
                        icon={<FileText />}
                        title="Keep Documents Ready"
                        description="Upload documents in advance for faster applications."
                        action="Go to Vault"
                        onAction={() => {}}
                    />
                    <Tip
                        icon={<Crown />}
                        title="Go Premium for Priority"
                        description="Get 24-48hr processing and never miss important deadlines."
                        action="Upgrade Plan"
                        onAction={() => {}}
                    />
                </div>
            </div>

            {/* Motivational Closing */}
            <div className="p-8 md:p-12 bg-slate-900 rounded-3xl text-center shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />
                
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4 relative z-10 flex items-center justify-center gap-3">
                    <Rocket className="h-8 w-8 text-indigo-400" />
                    Your Next Step
                </h3>
                <p className="text-slate-300 mb-8 max-w-lg mx-auto text-lg relative z-10">
                    {appliedCount === 0 
                        ? "Ready to start your journey? Browse schemes and apply for your first opportunity!"
                        : `You've already secured ₹${totalBenefits.toLocaleString()} in benefits. Let's find more!`
                    }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <Button asChild size="lg" className="h-14 px-8 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold text-lg shadow-lg shadow-indigo-500/20">
                        <Link href="/schemes">
                            Discover Schemes
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white font-bold text-lg">
                        <Link href="/life-events">
                            Update Life Events
                        </Link>
                    </Button>
                </div>
                
                <p className="mt-8 text-sm text-slate-500 font-medium italic relative z-10">
                    "With Saral Sahayta, you'll never miss an opportunity again. We're with you at every step! 🤝"
                </p>
            </div>
        </div>
    );
}
