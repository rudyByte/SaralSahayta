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

        // 3. Build Supabase Query (Table: 'schemes', Columns: camelCase except timestamps)
        let query = supabaseAdmin
            .from('schemes')
            .select('*', { count: 'exact' })
            .eq('isActive', true);

        // Apply Search
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,benefitDescription.ilike.%${search}%,ministry.ilike.%${search}%`);
        }

        // Apply Category
        if (categories.length > 0) {
            query = query.in('category', categories);
        }

        // Apply Scheme Type
        if (schemeType && schemeType !== 'ALL') {
            query = query.eq('schemeType', schemeType);
        }

        // Apply State
        if (state && state !== 'All States') {
            query = query.or(`schemeType.eq.CENTRAL,stateEligible.cs.{"${state}"}`);
        }

        // Apply Benefit Range
        query = query.gte('benefitAmount', minBenefit).lte('benefitAmount', maxBenefit);

        // Apply Sorting
        if (sortBy === 'benefit') {
            query = query.order('benefitAmount', { ascending: false });
        } else if (sortBy === 'deadline') {
            query = query.order('deadline', { ascending: true, nullsFirst: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: schemes, count: total, error: fetchError } = await query;

        if (fetchError) {
            console.error("❌ Supabase Fetch Error:", fetchError);
            throw fetchError;
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
                        return {
                            ...scheme,
                            matchScore: matchResult?.score ?? null,
                            matchDetails: matchResult
                        };
                    } catch (err) {
                        console.error(`Error matching scheme ${scheme.id}:`, err);
                        return {
                            ...scheme,
                            matchScore: null,
                            matchDetails: null
                        };
                    }
                });

                if (sortBy === 'matchScore' || sortBy === 'relevance') {
                    results.sort((a: any, b: any) => ((b as any).matchScore || 0) - ((a as any).matchScore || 0));
                }
            }
        }

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
