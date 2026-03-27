import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateMatchScore } from '@/lib/matching-algorithm';

export async function recalculateSchemeMatches(userId: string, reason: string) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    try {
        // 1. Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError || !profile) {
            console.error("No profile found for recalculation", profileError);
            return { newMatchesFound: 0 };
        }

        // 2. Get all active schemes
        const { data: schemes } = await supabase
            .from('Scheme')
            .select('*')
            .eq('isActive', true);

        if (!schemes) return { newMatchesFound: 0 };

        const matchesToUpsert = [];
        const newlyEligible = [];

        // 3. Evaluate each scheme
        for (const scheme of schemes) {
            // we use our AI/Rule-based confidence calculator
            const matchResult = calculateMatchScore(scheme, profile);
            if (!matchResult) continue; // Skip if matching fails fundamentally
            const score = matchResult.score;

            // Check previous match score to see if it's "newly" eligible
            const { data: previousMatch } = await supabase
                .from('user_scheme_matches')
                .select('match_score')
                .eq('user_id', userId)
                .eq('scheme_id', scheme.id)
                .single();

            if (!previousMatch && score >= 70) {
                newlyEligible.push(scheme);
            } else if (previousMatch && previousMatch.match_score < 70 && score >= 70) {
                newlyEligible.push(scheme);
            }

            matchesToUpsert.push({
                user_id: userId,
                scheme_id: scheme.id,
                match_score: score,
                created_at: new Date().toISOString()
            });

            // Log history if the score changed or it's a new entry
            if (!previousMatch || previousMatch.match_score !== score) {
                await supabase.from('scheme_match_history').insert({
                    user_id: userId,
                    scheme_id: scheme.id,
                    match_score: score,
                    changed_reason: reason
                });
            }
        }

        // 4. Batch upsert the new scores
        if (matchesToUpsert.length > 0) {
            await supabase
                .from('user_scheme_matches')
                .upsert(matchesToUpsert, { onConflict: 'user_id,scheme_id' });
        }

        // 5. Create notification if there are new matches
        if (newlyEligible.length > 0) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'NEW_SCHEME_MATCH',
                title: `✨ ${newlyEligible.length} New Schemes Available!`,
                message: `Your recent profile update unlocked ${newlyEligible.length} new schemes. Check them out!`,
                priority: 'HIGH',
                action_url: '/schemes?filter=newly_eligible'
            });
        }

        return { newMatchesFound: newlyEligible.length };
    } catch (e) {
        console.error("Error recalculating scheme matches", e);
        return { newMatchesFound: 0 };
    }
}
