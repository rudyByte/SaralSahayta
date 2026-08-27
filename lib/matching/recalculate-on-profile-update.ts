import { createAdminClient } from '@/lib/supabase-admin';
import { calculateMatchScore } from '@/lib/matching-algorithm';

export async function recalculateSchemeMatches(userId: string, reason: string) {
    const supabase = createAdminClient();

    try {
        // 1. Get user profile (with fallback for new users)
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        const userProfile = profile || {
            gender: 'ALL',
            category: 'GENERAL',
            annual_income: undefined,
            state: 'All States',
            education: undefined,
            occupation: undefined,
            profile_completion_percentage: 50,
            date_of_birth: undefined
        };


        // 2. Get user's uploaded document codes (any verification status)
        const { data: userDocRows } = await supabase
            .from('user_documents')
            .select('documents (document_code)')
            .eq('user_id', userId);

        const userUploadedDocCodes: string[] = (userDocRows || [])
            .map((d: any) => d.documents?.document_code)
            .filter(Boolean);

        // 3. Get all active schemes
        const { data: schemes } = await supabase
            .from('schemes')
            .select('*')
            .eq('isActive', true);

        if (!schemes || schemes.length === 0) return { newMatchesFound: 0 };

        // 4. Get scheme document requirements in bulk
        const { data: allDocReqs } = await supabase
            .from('scheme_document_requirements')
            .select(`scheme_id, is_mandatory, documents (document_code)`)
            .in('scheme_id', schemes.map(s => s.id));

        const schemeDocMap: Record<string, string[]> = {};
        (allDocReqs || []).forEach((req: any) => {
            if (!req.is_mandatory || !req.documents?.document_code) return;
            const sId = req.scheme_id;
            if (!schemeDocMap[sId]) schemeDocMap[sId] = [];
            schemeDocMap[sId].push(req.documents.document_code);
        });

        // 5. Bulk fetch all previous match scores for this user
        const { data: previousMatches } = await supabase
            .from('user_scheme_matches')
            .select('scheme_id, match_score')
            .eq('user_id', userId);

        const prevMatchMap = new Map<string, number>();
        (previousMatches || []).forEach((pm: any) => {
            if (pm.scheme_id) prevMatchMap.set(pm.scheme_id, pm.match_score);
        });

        const matchesToUpsert = [];
        const historyToInsert = [];
        const newlyEligible = [];

        // 6. Evaluate each scheme in memory
        for (const scheme of schemes) {
            const schemeForMatching = {
                ...scheme,
                createdAt: scheme.created_at,
                updatedAt: scheme.updated_at
            };

            const matchResult = calculateMatchScore(schemeForMatching as any, {
                age: userProfile.date_of_birth ? new Date().getFullYear() - new Date(userProfile.date_of_birth).getFullYear() : undefined,
                gender: userProfile.gender,
                category: userProfile.category,
                annualIncome: userProfile.annual_income,
                state: userProfile.state,
                education: userProfile.education,
                occupation: userProfile.occupation,
                profileCompletionPercentage: userProfile.profile_completion_percentage || 50
            });


            if (!matchResult) continue;

            const profileScore = matchResult.score;
            const requiredDocCodes = schemeDocMap[scheme.id] || [];

            const docsComplete = requiredDocCodes.length > 0
                ? requiredDocCodes.filter(code => userUploadedDocCodes.includes(code)).length / requiredDocCodes.length
                : 1.0;

            const docBonus = Math.round(docsComplete * 15);
            const blendedScore = Math.min(100, profileScore + docBonus);

            const hasPrev = prevMatchMap.has(scheme.id);
            const prevScore = prevMatchMap.get(scheme.id);

            if (!hasPrev && blendedScore >= 70) {
                newlyEligible.push(scheme);
            } else if (hasPrev && (prevScore || 0) < 70 && blendedScore >= 70) {
                newlyEligible.push(scheme);
            }

            matchesToUpsert.push({
                user_id: userId,
                scheme_id: scheme.id,
                match_score: blendedScore,
                created_at: new Date().toISOString()
            });

            if (!hasPrev || prevScore !== blendedScore) {
                historyToInsert.push({
                    user_id: userId,
                    scheme_id: scheme.id,
                    match_score: blendedScore,
                    changed_reason: reason
                });
            }
        }

        // 7. Batch upsert match scores
        if (matchesToUpsert.length > 0) {
            await supabase
                .from('user_scheme_matches')
                .upsert(matchesToUpsert, { onConflict: 'user_id,scheme_id' });
        }

        // 8. Batch insert match history
        if (historyToInsert.length > 0) {
            await supabase
                .from('scheme_match_history')
                .insert(historyToInsert);
        }

        // 9. Send notification for new matches
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

