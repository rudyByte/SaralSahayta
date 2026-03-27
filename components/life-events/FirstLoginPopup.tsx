'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    Sparkles, 
    Calendar as CalendarIcon,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
    LifeEventType, 
    LifeEventCategory, 
    LIFE_EVENT_CONFIGS, 
    CATEGORY_LABELS, 
    CATEGORY_EVENTS 
} from '@/types/life-events';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface FirstLoginPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'WELCOME' | 'SELECT_EVENTS' | 'EVENT_DETAILS' | 'SUCCESS';

export const FirstLoginPopup = ({ isOpen, onClose }: FirstLoginPopupProps) => {
    const router = useRouter();
    const [step, setStep] = useState<Step>('WELCOME');
    const [selectedEvents, setSelectedEvents] = useState<LifeEventType[]>([]);
    const [eventDates, setEventDates] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // -- Helpers --
    const toggleEvent = (type: LifeEventType) => {
        setSelectedEvents(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleDateChange = (type: LifeEventType, date: string) => {
        setEventDates(prev => ({ ...prev, [type]: date }));
    };

    const handleSkip = async () => {
        try {
            await fetch('/api/life-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skip: true })
            });
            onClose();
        } catch (error) {
            console.error('Error skipping popup:', error);
            onClose(); // Close anyway
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const eventsToSave = selectedEvents.map(type => ({
                type,
                date: eventDates[type] || new Date().toISOString().split('T')[0],
                category: Object.keys(CATEGORY_EVENTS).find(cat => 
                    CATEGORY_EVENTS[cat as LifeEventCategory].includes(type)
                ) as LifeEventCategory
            }));

            const res = await fetch('/api/life-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: eventsToSave })
            });

            if (!res.ok) throw new Error('Failed to save events');

            const data = await res.json();
            setStep('SUCCESS');
            toast.success(`We found ${data.schemesFound || 0} schemes matching your life events!`);
            
            // Auto-redirect after success
            setTimeout(() => {
                onClose();
                router.push('/discover?life_events=true');
            }, 3000);

        } catch (error) {
            console.error('Error saving life events:', error);
            toast.error('Failed to save your preferences. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden relative"
            >
                {/* Close Button */}
                <button 
                    onClick={handleSkip}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col h-[600px]">
                    {/* Header Progress */}
                    {step !== 'SUCCESS' && (
                        <div className="px-8 pt-8 flex items-center gap-2">
                             {[ 'WELCOME', 'SELECT_EVENTS', 'EVENT_DETAILS' ].map((s, i) => (
                                <div 
                                    key={s}
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-all duration-500",
                                        step === s ? "bg-primary w-full" : 
                                        (i < ['WELCOME', 'SELECT_EVENTS', 'EVENT_DETAILS'].indexOf(step) ? "bg-primary/30" : "bg-slate-100")
                                    )}
                                />
                             ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {step === 'WELCOME' && (
                                <motion.div 
                                    key="welcome"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-4">
                                        Personalize Your Experience
                                    </h2>
                                    <p className="text-slate-500 text-lg max-w-md mx-auto mb-10 leading-relaxed">
                                        Saral Sahayta works best when we know what's happening in your life. 
                                        Tell us about your recent milestones to find matching schemes instantly.
                                    </p>
                                    <Button 
                                        onClick={() => setStep('SELECT_EVENTS')}
                                        className="h-14 px-10 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                                    >
                                        Let's Start
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                    <button 
                                        onClick={handleSkip}
                                        className="block w-full mt-6 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Skip for now
                                    </button>
                                </motion.div>
                            )}

                            {step === 'SELECT_EVENTS' && (
                                <motion.div 
                                    key="select"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                        Any recent milestones?
                                    </h3>
                                    <p className="text-slate-500 mb-8">Select all that apply to you in the last 12 months.</p>
                                    
                                    <div className="space-y-8 pb-4">
                                        {Object.entries(CATEGORY_EVENTS).map(([category, events]) => (
                                            <div key={category}>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">
                                                    {CATEGORY_LABELS[category as LifeEventCategory]}
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {events.map(type => {
                                                        const config = LIFE_EVENT_CONFIGS[type];
                                                        const isSelected = selectedEvents.includes(type);
                                                        const Icon = config.icon;
                                                        
                                                        return (
                                                            <button
                                                                key={type}
                                                                onClick={() => toggleEvent(type)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                                                                    isSelected 
                                                                        ? "bg-primary/5 border-primary shadow-sm" 
                                                                        : "bg-white border-slate-100 hover:border-slate-200"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "p-2 rounded-xl mb-3 transition-colors",
                                                                    isSelected ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                                                )}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <span className={cn(
                                                                    "text-xs font-bold text-center",
                                                                    isSelected ? "text-primary" : "text-slate-600"
                                                                )}>
                                                                    {config.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'EVENT_DETAILS' && (
                                <motion.div 
                                    key="details"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                        When did these happen?
                                    </h3>
                                    <p className="text-slate-500 mb-8">Accuracy helps us find precise deadlines for your benefits.</p>
                                    
                                    <div className="space-y-4">
                                        {selectedEvents.map(type => {
                                            const config = LIFE_EVENT_CONFIGS[type];
                                            const Icon = config.icon;
                                            
                                            return (
                                                <div key={type} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <div className="p-2 rounded-xl bg-white text-primary shadow-sm">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{config.label}</p>
                                                    </div>
                                                    <input 
                                                        type="date"
                                                        value={eventDates[type] || ''}
                                                        onChange={(e) => handleDateChange(type, e.target.value)}
                                                        className="bg-white border-slate-200 rounded-lg text-sm px-3 py-2 focus:ring-primary outline-none"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'SUCCESS' && (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-20"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-4">
                                        All Set!
                                    </h2>
                                    <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
                                        We're personalizing your recommendations now. Redirecting you to your potential benefits...
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    {step !== 'SUCCESS' && step !== 'WELCOME' && (
                        <div className="p-8 pt-0 flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    if (step === 'SELECT_EVENTS') setStep('WELCOME');
                                    if (step === 'EVENT_DETAILS') setStep('SELECT_EVENTS');
                                }}
                                className="rounded-xl font-bold"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            
                            <Button 
                                onClick={() => {
                                    if (step === 'SELECT_EVENTS') {
                                        if (selectedEvents.length === 0) {
                                            toast.error('Please select at least one milestone or skip.');
                                            return;
                                        }
                                        setStep('EVENT_DETAILS');
                                    }
                                    if (step === 'EVENT_DETAILS') handleSubmit();
                                }}
                                disabled={loading}
                                className="rounded-xl font-bold h-12 px-8 min-w-[140px]"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        {step === 'EVENT_DETAILS' ? 'Find Schemes' : 'Next'}
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={cn("animate-spin h-5 w-5", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
