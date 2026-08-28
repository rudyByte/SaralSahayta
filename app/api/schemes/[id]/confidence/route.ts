export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient as getServerClient } from '@/lib/supabase-server';
import {
    fetchScoringInputs,
    normalizeRequiredDocumentRows,
    scoreSchemeForUser,
} from '@/lib/scoring/scheme-score';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const schemeId = params.id;
        const supabase = getServerClient();
        const adminSupabase = createAdminClient();

        let userId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            userId = authData?.user?.id || null;
        } catch (authErr) {
            console.warn('Auth check skipped in confidence route:', authErr);
        }

        const { data: scheme, error: schemeError } = await adminSupabase
            .from('schemes')
            .select('*')
            .eq('id', schemeId)
            .single();

        if (schemeError || !scheme) {
            return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
        }

        const { data: statsData } = await adminSupabase.rpc('get_scheme_stats', { target_scheme_id: schemeId });
        const historicalRate = statsData && statsData.length > 0 ? statsData[0].historical_rate : null;

        const scoringInputs = userId
            ? await fetchScoringInputs(adminSupabase, userId, [schemeId])
            : { profile: null, userDocuments: [], requirementsByScheme: {}, historicalByScheme: {} };

        const scoreResult = scoreSchemeForUser({
            scheme,
            profile: scoringInputs.profile,
            requiredDocuments: scoringInputs.requirementsByScheme[schemeId] || normalizeRequiredDocumentRows([], scheme),
            userDocuments: scoringInputs.userDocuments,
            historicalRate: scoringInputs.historicalByScheme[schemeId] ?? historicalRate,
        });

        if (userId) {
            const now = new Date().toISOString();
            const matchRow = {
                user_id: userId,
                scheme_id: schemeId,
                match_score: scoreResult.score,
                created_at: now,
                updated_at: now,
            };
            let { error: matchSyncError } = await adminSupabase
                .from('user_scheme_matches')
                .upsert(matchRow, { onConflict: 'user_id,scheme_id' });
            if (matchSyncError && String(matchSyncError.message || '').includes('updated_at')) {
                const { updated_at, ...retryRow } = matchRow;
                const retry = await adminSupabase
                    .from('user_scheme_matches')
                    .upsert(retryRow, { onConflict: 'user_id,scheme_id' });
                matchSyncError = retry.error;
            }
            if (matchSyncError) console.warn('Could not sync confidence score:', matchSyncError.message || matchSyncError);
        }

        const response = NextResponse.json({
            score: scoreResult.score,
            probability: scoreResult.score,
            confidence: scoreResult.score,
            breakdown: scoreResult.breakdown,
            suggestions: scoreResult.suggestions,
            _debug: {
                requiredDocCodes: scoreResult.requiredDocuments.map((doc) => doc.code),
                userUploadedCodes: scoreResult.uploadedDocumentCodes,
                documentScore: scoreResult.documentScore,
                historicalRate: scoreResult.historicalRate,
            },
        });

        response.headers.set(
            'Cache-Control',
            userId ? 'no-store' : 'public, s-maxage=30, stale-while-revalidate=30'
        );
        return response;
    } catch (error: any) {
        console.error('[Confidence API] Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
        }, { status: 500 });
    }
}
