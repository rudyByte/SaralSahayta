import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildSchemeQuery } from '@/lib/scheme-filters';
import { calculateMatchScore } from '@/lib/matching-algorithm';
import { SchemeType, SchemeCategory, Gender, Category, Education } from '@prisma/client';

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

        // 1. Get user and profile (from Supabase/Auth)
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Parse filters
        const filters = {
            search: searchParams.get('search') || undefined,
            category: (searchParams.getAll('category').length > 0 ? searchParams.getAll('category') : undefined) as SchemeCategory[] | undefined,
            schemeType: searchParams.get('schemeType') as SchemeType || undefined,
            state: searchParams.get('state') || undefined,
            minBenefit: searchParams.get('minBenefit') ? parseInt(searchParams.get('minBenefit')!) : undefined,
            maxBenefit: searchParams.get('maxBenefit') ? parseInt(searchParams.get('maxBenefit')!) : undefined,
            deadline: searchParams.get('deadline') as any || undefined,
        };

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'relevance';

        // 3. Build Prisma Query
        const where = buildSchemeQuery(filters);

        // 4. Fetch Schemes
        const schemes = await prisma.scheme.findMany({
            where,
            orderBy: sortBy === 'benefit' ? { benefitAmount: 'desc' } :
                sortBy === 'deadline' ? { deadline: 'asc' } :
                    { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.scheme.count({ where });

        // 5. Calculate Match Scores (if user is logged in)
        let results = schemes.map(scheme => ({
            ...scheme,
            matchScore: null as number | null
        }));

        if (user) {
            const { data: profile } = await supabase
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
                    matchScore: calculateMatchScore(scheme, userProfileForMatching)
                }));

                if (sortBy === 'matchScore' || sortBy === 'relevance') {
                    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                }
            }
        }

        return NextResponse.json({
            schemes: results,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error: any) {
        console.error("Scheme Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
