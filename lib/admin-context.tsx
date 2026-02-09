'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AdminContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    profile: any | null;
}

const AdminContext = createContext<AdminContextType>({
    user: null,
    isAdmin: false,
    loading: true,
    profile: null,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminStatus(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminStatus(session.user.id);
            } else {
                setIsAdmin(false);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdminStatus = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    user_roles (
                        roles (
                            name,
                            description,
                            permissions
                        )
                    )
                `)
                .eq('user_id', userId)
                .single();

            setProfile(data);
            setIsAdmin(data?.is_admin === true);
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminContext.Provider value={{ user, isAdmin, loading, profile }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => useContext(AdminContext);
