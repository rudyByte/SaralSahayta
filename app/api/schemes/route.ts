export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
    fetchScoringInputs,
    normalizeRequiredDocumentRows,
    scoreSchemeForUser,
} from '@/lib/scoring/scheme-score';

const LIFE_EVENT_CATEGORY_HINTS: Record<string, string[]> = {
    TENTH_PASS: ['EDUCATION', 'SKILL_DEVELOPMENT'],
    TWELFTH_PASS: ['EDUCATION', 'SKILL_DEVELOPMENT'],
    DIPLOMA: ['EDUCATION', 'SKILL_DEVELOPMENT', 'EMPLOYMENT'],
    COLLEGE_ADMISSION: ['EDUCATION'],
    GRADUATION: ['EDUCATION', 'EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    POST_GRADUATION: ['EDUCATION'],
    MASTERS: ['EDUCATION'],
    PHD: ['EDUCATION'],
    UNMARRIED: ['EDUCATION', 'EMPLOYMENT'],
    MARRIAGE: ['WOMEN_CHILD', 'HOUSING'],
    CHILDBIRTH: ['WOMEN_CHILD', 'HEALTHCARE'],
    SINGLE_CHILD: ['EDUCATION', 'WOMEN_CHILD'],
    GIRL_CHILD: ['EDUCATION', 'WOMEN_CHILD'],
    SINGLE_PARENT: ['WOMEN_CHILD', 'EDUCATION', 'HOUSING'],
    WIDOWHOOD: ['WOMEN_CHILD', 'HEALTHCARE'],
    DIVORCE: ['WOMEN_CHILD', 'HOUSING'],
    SEPARATION: ['WOMEN_CHILD', 'HOUSING'],
    ORPHAN: ['EDUCATION', 'HEALTHCARE'],
    DISABILITY: ['DISABILITY', 'HEALTHCARE', 'EDUCATION'],
    SERIOUS_ILLNESS: ['HEALTHCARE'],
    TURNED_60: ['SENIOR_CITIZEN', 'HEALTHCARE'],
    TURNED_70: ['SENIOR_CITIZEN', 'HEALTHCARE'],
    STARTING_BUSINESS: ['ENTREPRENEURSHIP'],
    FARMING_INITIATED: ['AGRICULTURE'],
    LOW_INCOME: ['HOUSING', 'EDUCATION', 'HEALTHCARE'],
    CROP_LOSS: ['AGRICULTURE'],
    FIRST_JOB: ['EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    JOB_LOSS: ['EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    UNEMPLOYED: ['EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    SKILL_UPGRADE: ['SKILL_DEVELOPMENT', 'EMPLOYMENT'],
    RETIREMENT: ['SENIOR_CITIZEN'],
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const supabaseAdmin = createAdminClient();

        // 1. Get user and profile
        let user: any = null;
        try {
            const supabase = createClient();
            const { data: authData } = await supabase.auth.getUser();
            user = authData?.user;
        } catch (authErr) {
            console.warn("⚠️ Auth Check Failed:", authErr);
        }

        // ... (rest of filtering logic)
        const search = searchParams.get('search');
        const categories = searchParams.getAll('category');
        const schemeType = searchParams.get('schemeType');
        const eventType = searchParams.get('event');
        const state = searchParams.get('state');
        const minBenefit = parseInt(searchParams.get('minBenefit') || '0');
        const maxBenefit = parseInt(searchParams.get('maxBenefit') || '500000');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'relevance';

        let eventSchemeIds: string[] = [];
        if (eventType) {
            const { data: mappedRows, error: mappingError } = await supabaseAdmin
                .from('life_event_scheme_mapping')
                .select('scheme_id')
                .eq('event_type', eventType);
            if (!mappingError) {
                eventSchemeIds = (mappedRows || []).map((row: any) => row.scheme_id).filter(Boolean);
            }
        }

        // Helper to construct query for any Supabase client
        const buildSchemesQuery = (client: any) => {
            let q = client
                .from('schemes')
                .select('*', { count: 'exact' })
                .eq('isActive', true);

            if (eventType) {
                if (eventSchemeIds.length > 0) {
                    q = q.in('id', eventSchemeIds);
                } else {
                    const categoryHints = LIFE_EVENT_CATEGORY_HINTS[eventType] || [];
                    if (categoryHints.length > 0) q = q.in('category', categoryHints);
                }
            }

            if (search) {
                q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%,benefitDescription.ilike.%${search}%,ministry.ilike.%${search}%`);
            }
            if (categories.length > 0) {
                q = q.in('category', categories);
            }
            if (schemeType && schemeType !== 'ALL') {
                q = q.eq('schemeType', schemeType);
            }
            if (state && state !== 'All States') {
                q = q.or(`schemeType.eq.CENTRAL,stateEligible.cs.{"${state}"}`);
            }
            q = q.gte('benefitAmount', minBenefit).lte('benefitAmount', maxBenefit);
            if (sortBy === 'benefit') {
                q = q.order('benefitAmount', { ascending: false });
            } else if (sortBy === 'deadline') {
                q = q.order('deadline', { ascending: true, nullsFirst: false });
            } else {
                q = q.order('created_at', { ascending: false });
            }
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            return q.range(from, to);
        };

        let { data: schemes, count: total, error: fetchError } = await buildSchemesQuery(supabaseAdmin);

        if (fetchError) {
            console.warn("⚠️ Admin client fetch error, falling back to standard client:", fetchError.message || fetchError);
            try {
                const standardSupabase = createClient();
                const fallbackRes = await buildSchemesQuery(standardSupabase);
                schemes = fallbackRes.data;
                total = fallbackRes.count;
                fetchError = fallbackRes.error;
            } catch (err: any) {
                console.error("⚠️ Fallback query error:", err);
            }
        }

        if (fetchError) {
            console.error("❌ Supabase Fetch Error:", fetchError);
            return NextResponse.json({
                schemes: [],
                total: 0,
                page,
                totalPages: 0,
            });
        }


        // Final results mapping for matching
        let results = (schemes || []).map((scheme: any) => ({
            ...scheme,
            createdAt: scheme.created_at,
            updatedAt: scheme.updated_at,
            matchScore: null as any
        }));

        if (user && schemes && schemes.length > 0) {
            const { profile, userDocuments, requirementsByScheme, historicalByScheme } = await fetchScoringInputs(
                supabaseAdmin,
                user.id,
                schemes.map((scheme: any) => scheme.id)
            );

            const now = new Date().toISOString();
            const matchesToUpsert: Array<{ user_id: string; scheme_id: string; match_score: number; created_at: string; updated_at: string }> = [];

            results = schemes.map((scheme: any) => {
                try {
                    const scoreResult = scoreSchemeForUser({
                        scheme,
                        profile,
                        requiredDocuments: requirementsByScheme[scheme.id] || normalizeRequiredDocumentRows([], scheme),
                        userDocuments,
                        historicalRate: historicalByScheme[scheme.id],
                    });

                    matchesToUpsert.push({
                        user_id: user.id,
                        scheme_id: scheme.id,
                        match_score: scoreResult.score,
                        created_at: now,
                        updated_at: now,
                    });

                    return {
                        ...scheme,
                        matchScore: scoreResult.score,
                        matchDetails: scoreResult.matchDetails,
                        documentScore: scoreResult.documentScore,
                        historicalRate: scoreResult.historicalRate,
                        requiredDocumentsCount: scoreResult.requiredDocuments.length,
                    };
                } catch (err) {
                    console.error(`Error scoring scheme ${scheme.id}:`, err);
                    return { ...scheme, matchScore: null, matchDetails: null };
                }
            });

            if (matchesToUpsert.length > 0) {
                let { error: syncError } = await supabaseAdmin
                    .from('user_scheme_matches')
                    .upsert(matchesToUpsert, { onConflict: 'user_id,scheme_id' });
                if (syncError && String(syncError.message || '').includes('updated_at')) {
                    const retryRows = matchesToUpsert.map(({ updated_at, ...row }) => row);
                    const retry = await supabaseAdmin
                        .from('user_scheme_matches')
                        .upsert(retryRows, { onConflict: 'user_id,scheme_id' });
                    syncError = retry.error;
                }
                if (syncError) console.warn('Could not sync live scheme scores:', syncError.message || syncError);
            }

            if (sortBy === 'matchScore' || sortBy === 'relevance') {
                results.sort((a: any, b: any) => ((b as any).matchScore || 0) - ((a as any).matchScore || 0));
            }
        }


        // Fetch document requirement counts from the normalized relational table
        // This is what the detail page uses, so the card count will now match
        let docCountMap: Record<string, number> = {};
        if (results.length > 0) {
            try {
                const schemeIds = results.map((s: any) => s.id);
                const { data: docCounts } = await supabaseAdmin
                    .from('scheme_document_requirements')
                    .select('scheme_id')
                    .in('scheme_id', schemeIds);

                if (docCounts) {
                    docCounts.forEach((row: any) => {
                        docCountMap[row.scheme_id] = (docCountMap[row.scheme_id] || 0) + 1;
                    });
                }
            } catch (docErr) {
                console.warn('Could not fetch document requirement counts:', docErr);
            }
        }

        // Merge normalized doc count into results
        results = results.map((s: any) => {
            const relationalCount = s.requiredDocumentsCount ?? docCountMap[s.id];
            let rawDocs: string[] = [];
            const raw = s.requiredDocuments || s.required_documents;
            if (Array.isArray(raw)) {
                rawDocs = raw;
            } else if (typeof raw === 'string') {
                try { rawDocs = JSON.parse(raw); } catch { if (raw.trim()) rawDocs = [raw]; }
            }

            const docCount = (relationalCount !== undefined && relationalCount > 0)
                ? relationalCount
                : rawDocs.length;

            return {
                ...s,
                requiredDocumentsCount: docCount,
            };
        });


        const responsePayload = {

            schemes: results,
            total: total || 0,
            page,
            totalPages: Math.ceil((total || 0) / limit),
        };

        const response = NextResponse.json(responsePayload);

        // Add caching for non-personalized responses (guest users)
        if (!user) {
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        } else {
            response.headers.set('Cache-Control', 'no-store');
        }

        return response;

    } catch (error: any) {
        console.error("❌ Final API Error:", error);
        return NextResponse.json({
            error: error.message,
            hint: "Check terminal logs for details."
        }, { status: 500 });
    }
}
