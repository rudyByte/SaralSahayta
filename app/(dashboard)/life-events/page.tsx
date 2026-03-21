'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    History, 
    Calendar, 
    ChevronRight, 
    Filter,
    ArrowRight,
    Sparkles,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
    LifeEvent, 
    LIFE_EVENT_CONFIGS, 
    LifeEventCategory, 
    LifeEventType,
    CATEGORY_LABELS 
} from '@/types/life-events';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FirstLoginPopup } from '@/components/life-events/FirstLoginPopup';
import Link from 'next/link';

export default function LifeEventsPage() {
    const [events, setEvents] = useState<LifeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<LifeEventCategory | 'ALL'>('ALL');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/life-events');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            toast.error('Could not load your life events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this milestone?')) return;
        
        try {
            const res = await fetch(`/api/life-events/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setEvents(events.filter(e => e.id !== id));
            toast.success('Milestone removed');
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const filteredEvents = activeFilter === 'ALL' 
        ? events 
        : events.filter(e => e.event_category === activeFilter);

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
                        <History className="h-10 w-10 text-primary" />
                        My Life Journey
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Track your milestones and discover government benefits tailored to your stage of life.
                    </p>
                </motion.div>
                <Button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-14 px-8 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Milestone
                </Button>
            </header>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                <Button
                    variant={activeFilter === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setActiveFilter('ALL')}
                    className="rounded-full px-6 whitespace-nowrap"
                >
                    All Events
                </Button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <Button
                        key={key}
                        variant={activeFilter === key ? 'default' : 'outline'}
                        onClick={() => setActiveFilter(key as LifeEventCategory)}
                        className="rounded-full px-6 whitespace-nowrap"
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="grid gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[40px]">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Sparkles className="h-10 w-10 text-primary/40" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No milestones added yet</h2>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8">
                        Add milestones like graduation, marriage, or starting a business to see matching schemes.
                    </p>
                    <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        variant="outline"
                        className="rounded-2xl h-12"
                    >
                        Record first milestone
                    </Button>
                </Card>
            ) : (
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-100 hidden md:block" />

                    <div className="space-y-12">
                        <AnimatePresence>
                            {filteredEvents.map((event, index) => {
                                const config = LIFE_EVENT_CONFIGS[event.event_type as LifeEventType];
                                if (!config) return null;
                                const Icon = config.icon;

                                return (
                                    <motion.div 
                                        key={event.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative flex flex-col md:flex-row gap-8 pl-12 md:pl-0"
                                    >
                                        {/* Timeline Marker */}
                                        <div className="absolute left-[-4px] md:left-[24px] top-4 z-10">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center bg-primary text-white"
                                            )}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                        </div>

                                        {/* Content Card */}
                                        <div className="flex-1">
                                            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                    <div>
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">
                                                            {CATEGORY_LABELS[event.event_category]}
                                                        </span>
                                                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                                            {config.label}
                                                        </h3>
                                                        <p className="text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                                                            <Calendar className="h-4 w-4" />
                                                            {format(new Date(event.event_date), 'MMMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleDelete(event.id)}
                                                            className="p-3 rounded-2xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                        <Link href={`/discover?event=${event.event_type}`}>
                                                            <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/10">
                                                                View Schemes
                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>

                                                {event.event_details?.message && (
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed mb-4">
                                                        {event.event_details.message}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-sm font-bold">
                                                    <div className="flex items-center gap-1.5 text-primary">
                                                        <Sparkles className="h-4 w-4" />
                                                        Potential Benefits Optimized
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <FirstLoginPopup 
                isOpen={isAddModalOpen} 
                onClose={() => {
                    setIsAddModalOpen(false);
                    fetchEvents(); // Refresh
                }} 
            />
        </div>
    );
}
