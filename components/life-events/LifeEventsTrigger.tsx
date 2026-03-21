'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FirstLoginPopup } from './FirstLoginPopup';

export const LifeEventsTrigger = () => {
    const [shouldShow, setShouldShow] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('life_events_completed')
                .eq('user_id', user.id)
                .single();

            if (profile && !profile.life_events_completed) {
                // Show after a short delay for better UX
                setTimeout(() => {
                    setIsOpen(true);
                    setShouldShow(true);
                }, 2000);
            }
        };

        checkStatus();
    }, []);

    if (!shouldShow) return null;

    return (
        <FirstLoginPopup 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)} 
        />
    );
};
