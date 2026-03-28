'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useRealtimeSchemeUpdates(userId: string | undefined, onUpdate?: () => void) {
  const [newSchemes, setNewSchemes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('scheme-matches-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_scheme_matches',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate?.();
          const data = payload.new as any;
          if (data && data.match_score >= 80 && payload.eventType === 'INSERT') {
            setNewSchemes(prev => [...prev, data.scheme_id]);
            toast.success('Better Match Found! 🎉', {
              description: 'Your profile updates have significantly improved your approval chance.',
              action: { label: 'View', onClick: () => router.push('/discover?filter=newly_eligible') }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_documents',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Trigger update when documents change
          onUpdate?.();
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [userId, router, onUpdate]);
  
  return { newSchemes };
}
