import { createAdminClient } from '@/lib/supabase-admin';
import {
    fetchScoringInputs,
    normalizeRequiredDocumentRows,
    scoreSchemeForUser,
} from '@/lib/scoring/scheme-score';

export async function recalculateSchemeMatches(userId: string, reason: string) {
    const supabase = createAdminClient();

    try {
        const { data: schemes } = await supabase
            .from('schemes')
            .select('*')
            .eq('isActive', true);

        if (!schemes || schemes.length === 0) return { newMatchesFound: 0, updatedMatches: 0 };

        const schemeIds = schemes.map((scheme: any) => scheme.id);
        const [{ profile, userDocuments, requirementsByScheme, historicalByScheme }, { data: previousMatches }] = await Promise.all([
            fetchScoringInputs(supabase, userId, schemeIds),
            supabase
                .from('user_scheme_matches')
                .select('scheme_id, match_score')
                .eq('user_id', userId),
        ]);

        const prevMatchMap = new Map<string, number>();
        (previousMatches || []).forEach((pm: any) => {
            if (pm.scheme_id) prevMatchMap.set(pm.scheme_id, Number(pm.match_score) || 0);
        });

        const matchesToUpsert: any[] = [];
        const historyToInsert: any[] = [];
        const newlyEligible: any[] = [];
        const now = new Date().toISOString();

        for (const scheme of schemes) {
            const scoreResult = scoreSchemeForUser({
                scheme: { ...scheme, createdAt: scheme.created_at, updatedAt: scheme.updated_at },
                profile,
                requiredDocuments: requirementsByScheme[scheme.id] || normalizeRequiredDocumentRows([], scheme),
                userDocuments,
                historicalRate: historicalByScheme[scheme.id],
            });

            const hasPrev = prevMatchMap.has(scheme.id);
            const prevScore = prevMatchMap.get(scheme.id);

            if ((!hasPrev && scoreResult.score >= 70) || (hasPrev && (prevScore || 0) < 70 && scoreResult.score >= 70)) {
                newlyEligible.push(scheme);
            }

            matchesToUpsert.push({
                user_id: userId,
                scheme_id: scheme.id,
                match_score: scoreResult.score,
                created_at: now,
                updated_at: now,
            });

            if (!hasPrev || prevScore !== scoreResult.score) {
                historyToInsert.push({
                    user_id: userId,
                    scheme_id: scheme.id,
                    match_score: scoreResult.score,
                    changed_reason: reason,
                });
            }
        }

        if (matchesToUpsert.length > 0) {
            let { error } = await supabase
                .from('user_scheme_matches')
                .upsert(matchesToUpsert, { onConflict: 'user_id,scheme_id' });
            if (error && String(error.message || '').includes('updated_at')) {
                const retryRows = matchesToUpsert.map(({ updated_at, ...row }) => row);
                const retry = await supabase
                    .from('user_scheme_matches')
                    .upsert(retryRows, { onConflict: 'user_id,scheme_id' });
                error = retry.error;
            }
            if (error) throw error;
        }

        if (historyToInsert.length > 0) {
            const { error } = await supabase
                .from('scheme_match_history')
                .insert(historyToInsert);
            if (error) console.warn('Could not write scheme match history:', error.message || error);
        }

        if (newlyEligible.length > 0) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'NEW_SCHEME_MATCH',
                title: `${newlyEligible.length} New Schemes Available!`,
                message: `Your recent update unlocked ${newlyEligible.length} new scheme${newlyEligible.length > 1 ? 's' : ''}. Check them out!`,
                is_read: false,
                created_at: now,
            });
        }

        return {
            newMatchesFound: newlyEligible.length,
            updatedMatches: matchesToUpsert.length,
        };
    } catch (e) {
        console.error('Error recalculating scheme matches', e);
        return { newMatchesFound: 0, updatedMatches: 0 };
    }
}
