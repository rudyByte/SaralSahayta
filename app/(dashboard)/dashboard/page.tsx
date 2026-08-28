'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    Clock,
    FileCheck,
    FileWarning,
    History,
    Plus,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { LIFE_EVENT_CONFIGS, LifeEvent, LifeEventType } from '@/types/life-events';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        matchingSchemes: 0,
        documentsVerified: 0,
        pendingActions: 0,
        milestones: 0,
    });
    const [recentEvents, setRecentEvents] = useState<LifeEvent[]>([]);
    const [topSchemes, setTopSchemes] = useState<any[]>([]);
    const [expiringDocuments, setExpiringDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [lifeRes, schemesRes, docsRes] = await Promise.all([
                    fetch('/api/life-events', { cache: 'no-store' }),
                    fetch('/api/schemes?sortBy=matchScore&limit=8', { cache: 'no-store' }),
                    fetch('/api/documents', { cache: 'no-store' }),
                ]);

                if (lifeRes.ok) {
                    const data = await lifeRes.json();
                    setRecentEvents((data || []).slice(0, 3));
                    setStats((prev) => ({ ...prev, milestones: data.length || 0 }));
                }

                if (schemesRes.ok) {
                    const data = await schemesRes.json();
                    const uniqueSchemes = Array.from(
                        new Map((data.schemes || []).map((scheme: any) => [scheme.id || scheme.name, scheme])).values()
                    ).slice(0, 3);
                    setTopSchemes(uniqueSchemes);
                    setStats((prev) => ({ ...prev, matchingSchemes: data.total || uniqueSchemes.length }));
                }

                if (docsRes.ok) {
                    const data = await docsRes.json();
                    const docs = data.documents || [];
                    const now = Date.now();
                    const upcoming = docs
                        .filter((doc: any) => doc.expiry_date)
                        .map((doc: any) => ({
                            ...doc,
                            daysLeft: Math.ceil((new Date(doc.expiry_date).getTime() - now) / 86400000),
                        }))
                        .filter((doc: any) => doc.daysLeft >= 0 && doc.daysLeft <= 60)
                        .sort((a: any, b: any) => a.daysLeft - b.daysLeft)
                        .slice(0, 3);

                    setExpiringDocuments(upcoming);
                    setStats((prev) => ({
                        ...prev,
                        documentsVerified: docs.filter((doc: any) => doc.verification_status === 'VERIFIED').length,
                        pendingActions: upcoming.length,
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12 space-y-8 mt-2">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Namaste, <span className="text-primary">{user?.user_metadata?.full_name || 'Citizen'}</span>
                    </h1>
                    <p className="text-slate-500 text-base md:text-lg mt-1 font-medium">
                        <span className="hidden sm:inline">We found </span>
                        <span className="text-primary font-black underline decoration-2 underline-offset-4">
                            {stats.matchingSchemes} matching schemes
                        </span>{' '}
                        and {stats.pendingActions} document alerts for you.
                    </p>
                </motion.div>
                <div className="flex items-center gap-3 shrink-0">
                    <Link href="/life-events">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold border-slate-200">
                            <History className="mr-2 h-4 w-4" />
                            My History
                        </Button>
                    </Link>
                    <Link href="/discover">
                        <Button className="h-12 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Discover All
                        </Button>
                    </Link>
                </div>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <StatCard icon={<Zap className="h-6 w-6 text-amber-500" />} label="Matching Schemes" value={stats.matchingSchemes.toString()} trend="Live" color="amber" />
                <StatCard icon={<FileCheck className="h-6 w-6 text-emerald-500" />} label="Verified Docs" value={stats.documentsVerified.toString()} trend="Vault" color="emerald" />
                <StatCard icon={<History className="h-6 w-6 text-indigo-500" />} label="Life Milestones" value={stats.milestones.toString()} trend="Updated" color="indigo" />
                <StatCard icon={<AlertCircle className="h-6 w-6 text-rose-500" />} label="Action Required" value={stats.pendingActions.toString()} trend={stats.pendingActions > 0 ? 'Expiring' : 'Clear'} color="rose" />
            </motion.div>

            {expiringDocuments.length > 0 && (
                <Card className="p-5 rounded-[28px] border-amber-200 bg-amber-50/70">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-3 rounded-2xl bg-white text-amber-600 shadow-sm">
                                <FileWarning className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Document Expiry Alerts</h2>
                                <div className="mt-2 space-y-1">
                                    {expiringDocuments.map((doc: any) => {
                                        const name = doc.document?.document_name || doc.documents?.document_name || doc.file_name || 'Document';
                                        return (
                                            <p key={doc.id} className="text-sm font-semibold text-amber-800">
                                                {name} expires in {doc.daysLeft} day{doc.daysLeft === 1 ? '' : 's'}.
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <Link href="/documents">
                            <Button variant="outline" className="rounded-2xl bg-white border-amber-200 text-amber-700 font-bold">
                                Renew Documents
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            Top Matches for You
                        </h2>
                        <Link href="/discover" className="text-sm font-bold text-primary hover:underline underline-offset-4">
                            See all {stats.matchingSchemes} matches
                        </Link>
                    </div>

                    <div className="grid gap-4">
                        {topSchemes.length > 0 ? topSchemes.map((scheme: any) => (
                            <Card key={scheme.id} className="p-6 rounded-[32px] border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group bg-white">
                                <div className="flex gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                                        <ShieldCheck className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1 gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                                {String(scheme.category || 'Scheme').replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {scheme.isRolling ? 'Rolling' : scheme.deadline ? `Ends ${new Date(scheme.deadline).toLocaleDateString('en-IN')}` : 'Open'}
                                            </span>
                                        </div>
                                        <Link href={`/schemes/${scheme.id}`}>
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors truncate">
                                                {scheme.name}
                                            </h3>
                                        </Link>
                                        <p className="text-slate-500 text-sm line-clamp-2 mt-1 font-medium">
                                            {scheme.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-4 gap-3">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className="text-xl font-black text-primary truncate">
                                                    {scheme.benefitAmount ? `INR ${scheme.benefitAmount.toLocaleString('en-IN')}` : 'Variable'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">{scheme.benefitType?.toLowerCase?.() || 'benefit'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wide">
                                                    {scheme.matchScore ?? 0}% Chance
                                                </div>
                                                <Link href={`/schemes/${scheme.id}/apply`}>
                                                    <Button size="sm" className="rounded-xl h-8 px-4 font-bold">Apply</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <Card className="p-8 rounded-[32px] border-dashed border-slate-200 text-center bg-white">
                                <p className="text-sm font-bold text-slate-500">
                                    {loading ? 'Loading live recommendations...' : 'No live recommendations yet.'}
                                </p>
                                <Link href="/discover">
                                    <Button className="mt-4 rounded-2xl font-bold">Browse Schemes</Button>
                                </Link>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900">My Journey</h2>
                        <Link href="/life-events">
                            <Button size="sm" variant="ghost" className="rounded-xl font-black text-primary">Edit</Button>
                        </Link>
                    </div>

                    <Card className="rounded-[40px] border-slate-100 overflow-hidden shadow-sm bg-white">
                        <div className="p-8 space-y-8">
                            <AnimatePresence mode="popLayout">
                                {recentEvents.length > 0 ? (
                                    <div className="space-y-6">
                                        {recentEvents.map((event, i) => {
                                            const config = LIFE_EVENT_CONFIGS[event.event_type as LifeEventType];
                                            return (
                                                <motion.div key={event.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative flex items-start gap-4">
                                                    {i < recentEvents.length - 1 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100" />}
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 z-10">
                                                        {config ? <config.icon className="h-5 w-5 text-slate-400" /> : <History className="h-5 w-5 text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-900 truncate">{config?.label || event.event_type}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            {format(new Date(event.event_date), 'MMM yyyy')}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold px-4 leading-relaxed">
                                            Add education, family, health, and income milestones to unlock better recommendations.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Link href="/life-events?add=true">
                                <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black font-black mt-4 shadow-xl shadow-slate-200">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Milestone
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-primary/5 p-6 border-t border-primary/10">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-slate-700 leading-normal">
                                    Keep documents current; any matching scheme score updates as soon as a required document changes.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, trend, color }: any) {
    const bgColorClass = color === 'amber' ? 'bg-amber-50 text-amber-600' :
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                'bg-rose-50 text-rose-600';

    return (
        <Card className="p-6 rounded-[32px] border-slate-100 shadow-sm hover:shadow-md transition-all group bg-white">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide', bgColorClass)}>
                    {trend}
                </div>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-3xl font-black text-slate-900">{value}</h3>
        </Card>
    );
}
