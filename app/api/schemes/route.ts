export const dynamic = 'force-dynamic';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calculateMatchScore } from '@/lib/matching-algorithm';
import { Gender, Category, Education } from '@prisma/client';

const getSupabase = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { } },
            },
        }
    );
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // 1. Get user and profile
        let user = null;
        try {
            const supabase = getSupabase();
            const { data: authData } = await supabase.auth.getUser();
            user = authData?.user;
        } catch (authErr) {
            console.warn("âš ï¸ Auth Check Failed:", authErr);
        }

        // 2. Parse filters
        const search = searchParams.get('search');
        const categories = searchParams.getAll('category');
        const schemeType = searchParams.get('schemeType');
        const state = searchParams.get('state');
        const minBenefit = parseInt(searchParams.get('minBenefit') || '0');
        const maxBenefit = parseInt(searchParams.get('maxBenefit') || '1000000');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'relevance';

        // 3. Build Supabase Query
        let query = supabaseAdmin
            .from('Scheme')
            .select('*', { count: 'exact' })
            .eq('isActive', true);

        // Apply Search
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,benefitDescription.ilike.%${search}%`);
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
            console.error("âŒ Supabase Fetch Error:", fetchError);
            throw fetchError;
        }

        // 4. Calculate Match Scores
        let results = (schemes || []).map(scheme => ({
            ...scheme,
            matchScore: null as number | null
        }));

        if (user && schemes && schemes.length > 0) {
            const clientSupabase = getSupabase();
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

                results = schemes.map(scheme => ({
                    ...scheme,
                    matchScore: calculateMatchScore(scheme as any, userProfileForMatching)
                }));

                if (sortBy === 'matchScore' || sortBy === 'relevance') {
                    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
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
        console.error("âŒ Final API Error:", error);
        return NextResponse.json({
            error: error.message,
            hint: "Check terminal logs for details."
        }, { status: 500 });
    }
}
