export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { calculateMatchScore } from '@/lib/matching-algorithm';
import { Gender, Category, Education } from '@prisma/client';

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
        const state = searchParams.get('state');
        const minBenefit = parseInt(searchParams.get('minBenefit') || '0');
        const maxBenefit = parseInt(searchParams.get('maxBenefit') || '500000');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'relevance';

        // Helper to construct query for any Supabase client
        const buildSchemesQuery = (client: any) => {
            let q = client
                .from('schemes')
                .select('*', { count: 'exact' })
                .eq('isActive', true);

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
            const clientSupabase = createClient();

            // Fetch stored scheme match scores (includes document readiness bonus)
            const { data: storedMatches } = await supabaseAdmin
                .from('user_scheme_matches')
                .select('scheme_id, match_score')
                .eq('user_id', user.id);

            const storedScoreMap: Record<string, number> = {};
            if (storedMatches) {
                storedMatches.forEach((sm: any) => {
                    if (sm.scheme_id) storedScoreMap[sm.scheme_id] = sm.match_score;
                });
            }

            const { data: profile } = await clientSupabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                const userProfileForMatching = {
                    gender: profile.gender as Gender,
                    category: profile.category as Category,
                    annualIncome: profile.annual_income,
                    state: profile.state,
                    education: profile.education as Education,
                    occupation: profile.occupation,
                    profileCompletionPercentage: profile.profile_completion_percentage || 0,
                    age: profile.date_of_birth ?
                        new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() :
                        undefined
                };

                results = schemes.map((scheme: any) => {
                    try {
                        const matchResult = calculateMatchScore(scheme as any, userProfileForMatching);
                        const storedScore = storedScoreMap[scheme.id];
                        const finalScore = typeof storedScore === 'number' ? storedScore : (matchResult?.score ?? null);

                        return {
                            ...scheme,
                            matchScore: finalScore,
                            matchDetails: matchResult
                        };
                    } catch (err) {
                        console.error(`Error matching scheme ${scheme.id}:`, err);
                        return {
                            ...scheme,
                            matchScore: storedScoreMap[scheme.id] ?? null,
                            matchDetails: null
                        };
                    }
                });

                if (sortBy === 'matchScore' || sortBy === 'relevance') {
                    results.sort((a: any, b: any) => ((b as any).matchScore || 0) - ((a as any).matchScore || 0));
                }
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
            const relationalCount = docCountMap[s.id];
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
