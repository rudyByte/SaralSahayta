import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { format } from 'date-fns';
import { analyzeDocumentReadiness } from '@/lib/documents/analyze-requirements';
import { predictFutureOpportunities } from '@/lib/intelligence/opportunity-predictor';
import { 
    FileCheck, 
    FileWarning, 
    UploadCloud, 
    CalendarClock,
    ArrowRight,
    Sparkles,
    ShieldAlert,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import nextDynamic from 'next/dynamic';

const ReadinessChart = nextDynamic(() => import('@/components/documents/ReadinessChart'), {
    ssr: false,
    loading: () => <div className="h-64 w-full flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-slate-300 text-xs uppercase tracking-widest">Preparing Chart...</div>
});

export const dynamic = 'force-dynamic';

export default async function DocumentReadinessDashboard() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const [readinessData, predictions] = await Promise.all([
        analyzeDocumentReadiness(user.id),
        predictFutureOpportunities(user.id)
    ]);

    const { schemeReadiness, missingAnalysis, overallReadiness } = readinessData;
    const readySchemes = schemeReadiness.filter(r => r.isReady).length;
    const notReadySchemes = schemeReadiness.length - readySchemes;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Document Readiness Tracker</h1>
                <p className="text-slate-500 max-w-3xl">Analyze which schemes you are ready to apply for instantly, and pinpoint exact documents blocking your progress.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-10">
                {/* Chart Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-emerald-500" />
                        Application Readiness
                    </h3>
                    <ReadinessChart readyCount={readySchemes} missingCount={notReadySchemes} />
                    <div className="mt-6 text-center">
                        <div className="text-3xl font-black text-slate-800 mb-1">{overallReadiness}%</div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Overall Vault Health</p>
                    </div>
                </div>

                {/* Missing Docs Priorities Section */}
                <div className="lg:col-span-2 bg-gradient-to-br from-rose-50 to-orange-50/30 p-6 md:p-8 rounded-3xl border border-rose-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2 mb-1">
                                <ShieldAlert className="h-6 w-6 text-rose-500" />
                                High Impact Documents Missing
                            </h3>
                            <p className="text-sm text-rose-700/80 font-medium">Uploading these files unlocks multiple blocked applications.</p>
                        </div>
                        <Button asChild size="sm" className="hidden sm:flex bg-white hover:bg-white text-slate-900 border border-slate-200 hover:border-slate-300 shadow-sm h-10 px-4 rounded-xl">
                            <Link href="/documents">
                                <UploadCloud className="h-4 w-4 mr-2 text-rose-500" />
                                Upload Now
                            </Link>
                        </Button>
                    </div>

                    {missingAnalysis.length === 0 ? (
                        <div className="bg-white/60 rounded-2xl p-8 border border-white text-center">
                            <Sparkles className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800">Your Vault is Perfect!</h4>
                            <p className="text-sm text-slate-500">You have all necessary documents for your matched schemes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {missingAnalysis.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="bg-white rounded-2xl p-4 border border-rose-100 flex items-center justify-between gap-4 group transition-all hover:shadow-md hover:border-rose-200">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 capitalize">{item.documentType.replace(/_/g, ' ')}</h4>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                Blocks <span className="text-rose-600 font-bold">{item.blockingCount}</span> applications
                                            </p>
                                        </div>
                                    </div>
                                    <Button asChild variant="ghost" className="shrink-0 text-slate-400 hover:text-primary h-8 px-3 rounded-lg md:hidden group-hover:flex transition-all">
                                        <Link href={`/documents?upload=${item.documentType}`}>Upload</Link>
                                    </Button>
                                    <div className="hidden md:flex text-xs text-slate-400 font-medium truncate max-w-[200px] w-full text-right justify-end">
                                        e.g. {item.blockingSchemes[0]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Scheme Level Breakdown */}
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <h3 className="font-bold text-slate-800 mb-6 text-xl">Scheme Requirements Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {schemeReadiness.map((sc, scIdx) => (
                        <div key={scIdx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-slate-900 line-clamp-1 flex-1 pr-4">{sc.schemeName}</h4>
                                    {sc.isReady ? (
                                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Ready</span>
                                    ) : (
                                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">{sc.missingCount} Missing</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Progress
                                        value={sc.totalRequired === 0 ? 100 : ((sc.totalRequired - sc.missingCount) / sc.totalRequired) * 100}
                                        className="h-1.5"
                                    />
                                </div>
                            </div>
                            <Button asChild variant="outline" className="w-full justify-between h-10 rounded-xl group hover:bg-primary hover:text-white transition-colors border-slate-200">
                                <Link href={`/schemes/${sc.schemeId}`}>
                                    {sc.isReady ? "Apply Now" : "View Details"}
                                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Future Predictions Module */}
            <div className="bg-slate-900 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 relative z-10 flex items-center gap-3">
                    <CalendarClock className="h-8 w-8 text-indigo-400" />
                    Future Opportunity Predictor
                </h2>
                <p className="text-indigo-200 font-medium mb-8 max-w-2xl relative z-10">
                    We've scanned your profile against upcoming age guidelines to map out schemes you will become eligible for in the next 5 years.
                </p>

                {predictions.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center relative z-10">
                        <Sparkles className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                        <h4 className="font-bold text-white text-lg">No Immediate Thresholds</h4>
                        <p className="text-slate-400 font-medium">You don't have any major age-based eligibility changes coming up in the next 5 years. Simply keep your life events and income updated!</p>
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10">
                        {predictions.map((pred, i) => (
                            <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 group hover:border-indigo-500/50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-indigo-500/30 mb-2 inline-block">
                                            {format(new Date(pred.triggerDate), 'MMMM yyyy')}
                                        </span>
                                        <h3 className="text-xl font-bold text-white">{pred.triggerEvent}</h3>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Unlocks</p>
                                        <p className="font-bold text-emerald-400">{pred.schemes.length} Target Schemes</p>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {pred.schemes.map((ps: any, pIdx: number) => (
                                        <div key={pIdx} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                                <Target className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-200 text-sm line-clamp-1">{ps.name}</h5>
                                                <p className="text-xs text-slate-500 font-medium truncate">Estimated ₹{ps.benefitAmount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
