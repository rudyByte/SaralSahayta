'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface NewlyEligibleBadgeProps {
  schemeId: string;
  userId: string;
}

export default function NewlyEligibleBadge({ schemeId, userId }: NewlyEligibleBadgeProps) {
  const [isNewlyEligible, setIsNewlyEligible] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkIfNewlyEligible() {
      if (!userId || !schemeId) return;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('scheme_match_history')
        .select('match_score, changed_at')
        .eq('user_id', userId)
        .eq('scheme_id', schemeId)
        .gte('changed_at', sevenDaysAgo)
        .order('changed_at', { ascending: false })
        .limit(2);
      
      if (data && data.length >= 2) {
        const [latest, previous] = data;
        if (previous.match_score < 70 && latest.match_score >= 70) {
          setIsNewlyEligible(true);
        }
      } else if (data && data.length === 1) {
        if (data[0].match_score >= 70) {
          setIsNewlyEligible(true);
        }
      }
    }

    checkIfNewlyEligible();
  }, [schemeId, userId, supabase]);
  
  if (!isNewlyEligible) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] sm:text-xs font-black rounded-full shadow-md shadow-orange-500/20 uppercase tracking-widest shrink-0"
    >
      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      Newly Eligible
    </motion.div>
  );
}
