import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateMatchScore } from '@/lib/matching-algorithm';
import { calculateConfidence } from '@/lib/ai/confidence-calculator';

export async function recalculateSchemeMatches(userId: string, reason: string) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }); } catch (_) {}
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }); } catch (_) {}
                },
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
            console.error('No profile found for recalculation', profileError);
            return { newMatchesFound: 0 };
        }

        // 2. Get user's uploaded document codes (any verification status)
        const { data: userDocRows } = await supabase
            .from('user_documents')
            .select('documents (document_code)')
            .eq('user_id', userId);

        const userUploadedDocCodes: string[] = (userDocRows || [])
            .filter((d: any) => d.documents?.document_code)
            .map((d: any) => d.documents.document_code as string);

        // 3. Get all active schemes with their document requirements
        const { data: schemes } = await supabase
            .from('Scheme')
            .select('*')
            .eq('isActive', true);

        if (!schemes) return { newMatchesFound: 0 };

        // 4. Get scheme document requirements in bulk
        const { data: allDocReqs } = await supabase
            .from('SchemeDocumentRequirement')
            .select(`schemeId, isMandatory, documents (document_code)`)
            .in('schemeId', schemes.map(s => s.id));

        // Build a map: schemeId -> required doc codes
        const schemeDocMap: Record<string, string[]> = {};
        (allDocReqs || []).forEach((req: any) => {
            if (!req.isMandatory || !req.documents?.document_code) return;
            if (!schemeDocMap[req.schemeId]) schemeDocMap[req.schemeId] = [];
            schemeDocMap[req.schemeId].push(req.documents.document_code);
        });

        const matchesToUpsert = [];
        const newlyEligible = [];

        // 5. Evaluate each scheme
        for (const scheme of schemes) {
            // Profile-based match score (0-100)
            const matchResult = calculateMatchScore(scheme, profile);
            if (!matchResult) continue;

            const profileScore = matchResult.score;
            const requiredDocCodes = schemeDocMap[scheme.id] || [];

            // Document readiness score (0.0 - 1.0)
            const docsComplete = requiredDocCodes.length > 0
                ? requiredDocCodes.filter(code => userUploadedDocCodes.includes(code)).length / requiredDocCodes.length
                : 1.0;

            // Blend the two: profile 70% + docs 30% bonus (max +15 points)
            const docBonus = Math.round(docsComplete * 15);
            const blendedScore = Math.min(100, profileScore + docBonus);

            // Check previous match score
            const { data: previousMatch } = await supabase
                .from('user_scheme_matches')
                .select('match_score')
                .eq('user_id', userId)
                .eq('scheme_id', scheme.id)
                .single();

            if (!previousMatch && blendedScore >= 70) {
                newlyEligible.push(scheme);
            } else if (previousMatch && previousMatch.match_score < 70 && blendedScore >= 70) {
                newlyEligible.push(scheme);
            }

            matchesToUpsert.push({
                user_id: userId,
                scheme_id: scheme.id,
                match_score: blendedScore,
                created_at: new Date().toISOString()
            });

            // Log history if score changed
            if (!previousMatch || previousMatch.match_score !== blendedScore) {
                await supabase.from('scheme_match_history').insert({
                    user_id: userId,
                    scheme_id: scheme.id,
                    match_score: blendedScore,
                    changed_reason: reason
                });
            }
        }

        // 6. Batch upsert scores
        if (matchesToUpsert.length > 0) {
            await supabase
                .from('user_scheme_matches')
                .upsert(matchesToUpsert, { onConflict: 'user_id,scheme_id' });
        }

        // 7. Send notification for new matches
        if (newlyEligible.length > 0) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'NEW_SCHEME_MATCH',
                title: `✨ ${newlyEligible.length} New Schemes Available!`,
                message: `Your recent update unlocked ${newlyEligible.length} new scheme${newlyEligible.length > 1 ? 's' : ''}. Check them out!`,
                priority: 'HIGH',
                action_url: '/schemes?filter=newly_eligible'
            });
        }

        return { newMatchesFound: newlyEligible.length };
    } catch (e) {
        console.error('Error recalculating scheme matches', e);
        return { newMatchesFound: 0 };
    }
}
