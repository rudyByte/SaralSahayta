'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useRealtimeSchemeUpdates(userId: string | undefined) {
  const [newSchemes, setNewSchemes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('scheme-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scheme_match_history',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newMatch = payload.new;
          if (newMatch.match_score >= 70) {
            setNewSchemes(prev => [...prev, newMatch.scheme_id]);
            
            toast.success('New scheme unlocked! 🎉', {
              description: 'Your recent profile update unlocked a new opportunity.',
              action: {
                label: 'View',
                onClick: () => router.push('/schemes?filter=newly_eligible')
              }
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [userId, router]);
  
  return { newSchemes };
}
