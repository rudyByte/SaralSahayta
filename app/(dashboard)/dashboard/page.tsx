'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    TrendingUp, 
    ShieldCheck, 
    Clock, 
    ArrowRight, 
    Plus,
    History,
    FileCheck,
    AlertCircle,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { LIFE_EVENT_CONFIGS, LifeEvent, LifeEventType } from '@/types/life-events';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        matchingSchemes: 12,
        documentsVerified: 4,
        pendingActions: 2,
        milestones: 0
    });
    const [recentEvents, setRecentEvents] = useState<LifeEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/life-events');
                if (res.ok) {
                    const data = await res.json();
                    setRecentEvents(data.slice(0, 3));
                    setStats(prev => ({ ...prev, milestones: data.length }));
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
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12 space-y-8 mt-2">
            {/* Hero Greeting */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Namaste, <span className="text-primary">{user?.user_metadata?.full_name || 'Citizen'}</span>! 👋
                    </h1>
                    <p className="text-slate-500 text-base md:text-lg mt-1 font-medium">
                        Your profile is <span className="text-slate-900 font-black">85% complete</span>. <span className="hidden sm:inline">We found </span><span className="text-primary font-black underline decoration-2 underline-offset-4 cursor-pointer">{stats.matchingSchemes} new schemes</span> for you.
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

            {/* Stats Grid */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <StatCard 
                    icon={<Zap className="h-6 w-6 text-amber-500" />}
                    label="Matching Schemes"
                    value={stats.matchingSchemes.toString()}
                    trend="+3 new"
                    color="amber"
                />
                <StatCard 
                    icon={<FileCheck className="h-6 w-6 text-emerald-500" />}
                    label="Verified Docs"
                    value={stats.documentsVerified.toString()}
                    trend="Secure"
                    color="emerald"
                />
                <StatCard 
                    icon={<History className="h-6 w-6 text-indigo-500" />}
                    label="Life Milestones"
                    value={stats.milestones.toString()}
                    trend="Updated"
                    color="indigo"
                />
                <StatCard 
                    icon={<AlertCircle className="h-6 w-6 text-rose-500" />}
                    label="Action Required"
                    value={stats.pendingActions.toString()}
                    trend="2 Expiring"
                    color="rose"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main: Recommended Schemes */}
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
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-6 rounded-[32px] border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer bg-white">
                                <div className="flex gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                                        <ShieldCheck className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                                Education • Scholarship
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Ends in 12 days
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors truncate">
                                            Post-Matric Scholarship for SC Students
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mt-1 font-medium">
                                            Financial assistance to students belonging to Scheduled Castes for pursuing post-matriculation courses.
                                        </p>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-black text-primary">₹12,000</span>
                                                <span className="text-xs font-bold text-slate-400">per annum</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wide">
                                                    98% Match
                                                </div>
                                                <Button size="sm" className="rounded-xl h-8 px-4 font-bold">Apply</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Life Journey Summary */}
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
                                                <motion.div 
                                                    key={event.id} 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="relative flex items-start gap-4"
                                                >
                                                    {i < recentEvents.length - 1 && (
                                                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100" />
                                                    )}
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 z-10">
                                                        {config ? (
                                                            <config.icon className="h-5 w-5 text-slate-400" />
                                                        ) : (
                                                            <History className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-900 truncate">
                                                            {config?.label || event.event_type}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            {format(new Date(event.event_date), 'MMM yyyy')}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-6"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold px-4 leading-relaxed">
                                            Your journey is just beginning. Add milestones to track your life story.
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
                                    Unlock 5 more schemes by verifying your 10th marksheet.
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
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide",
                    bgColorClass
                )}>
                    {trend}
                </div>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-3xl font-black text-slate-900">{value}</h3>
        </Card>
    );
}
