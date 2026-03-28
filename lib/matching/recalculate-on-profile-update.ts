import { createAdminClient } from '@/lib/supabase-admin';
import { calculateMatchScore } from '@/lib/matching-algorithm';

export async function recalculateSchemeMatches(userId: string, reason: string) {
    const supabase = createAdminClient();

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
            .map((d: any) => d.documents?.document_code)
            .filter(Boolean);

        // 3. Get all active schemes (Table: 'schemes', Column: 'isActive' - Confirmed)
        const { data: schemes } = await supabase
            .from('schemes')
            .select('*')
            .eq('isActive', true);

        if (!schemes) return { newMatchesFound: 0 };

        // 4. Get scheme document requirements in bulk
        const { data: allDocReqs } = await supabase
            .from('scheme_document_requirements')
            .select(`scheme_id, is_mandatory, documents (document_code)`)
            .in('scheme_id', schemes.map(s => s.id));

        // Build a map: scheme_id -> required doc codes
        const schemeDocMap: Record<string, string[]> = {};
        (allDocReqs || []).forEach((req: any) => {
            if (!req.is_mandatory || !req.documents?.document_code) return;
            const sId = req.scheme_id;
            if (!schemeDocMap[sId]) schemeDocMap[sId] = [];
            schemeDocMap[sId].push(req.documents.document_code);
        });

        const matchesToUpsert = [];
        const newlyEligible = [];

        // 5. Evaluate each scheme
        for (const scheme of schemes) {
            // Mapping for compatibility with matching algorithm (ensure createdAt/updatedAt are available)
            const schemeForMatching = {
                ...scheme,
                createdAt: scheme.created_at,
                updatedAt: scheme.updated_at
            };

            const matchResult = calculateMatchScore(schemeForMatching as any, {
                age: profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : undefined,
                gender: profile.gender,
                category: profile.category,
                annualIncome: profile.annual_income,
                state: profile.state,
                education: profile.education,
                occupation: profile.occupation,
                profileCompletionPercentage: profile.profile_completion_percentage || 0
            });

            if (!matchResult) continue;

            const profileScore = matchResult.score;
            const requiredDocCodes = schemeDocMap[scheme.id] || [];

            // Document readiness score (0.0 - 1.0)
            const docsComplete = requiredDocCodes.length > 0
                ? requiredDocCodes.filter(code => userUploadedDocCodes.includes(code)).length / requiredDocCodes.length
                : 1.0;

            // Blend the two: profile + docs bonus
            const docBonus = Math.round(docsComplete * 15);
            const blendedScore = Math.min(100, profileScore + docBonus);

            // Check previous match score (Using snake_case table)
            const { data: previousMatch } = await supabase
                .from('user_scheme_matches')
                .select('match_score')
                .eq('user_id', userId)
                .eq('scheme_id', scheme.id)
                .maybeSingle();

            if (!previousMatch && blendedScore >= 70) {
                newlyEligible.push(scheme);
            } else if (previousMatch && (previousMatch.match_score || 0) < 70 && blendedScore >= 70) {
                newlyEligible.push(scheme);
            }

            matchesToUpsert.push({
                user_id: userId,
                scheme_id: scheme.id,
                match_score: blendedScore,
                created_at: new Date().toISOString()
            });

            // Log history if score changed (Using snake_case table)
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

        // 7. Send notification for new matches (Snake case table 'notifications')
        if (newlyEligible.length > 0) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'NEW_SCHEME_MATCH',
                title: `✨ ${newlyEligible.length} New Schemes Available!`,
                message: `Your recent update unlocked ${newlyEligible.length} new scheme${newlyEligible.length > 1 ? 's' : ''}. Check them out!`,
                is_read: false,
                created_at: new Date().toISOString()
            });
        }

        return { newMatchesFound: newlyEligible.length };
    } catch (e) {
        console.error('Error recalculating scheme matches', e);
        return { newMatchesFound: 0 };
    }
}
