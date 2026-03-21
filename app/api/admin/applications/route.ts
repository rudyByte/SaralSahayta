export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || '';
        const search = searchParams.get('search') || '';
        const priorityOnly = searchParams.get('priority') === 'true';

        const offset = (page - 1) * limit;

        let query = supabase
            .from('applications')
            .select(`
                *,
                user_profiles!applications_user_id_fkey (
                    full_name,
                    mobile,
                    state,
                    is_premium
                ),
                schemes (
                    schemeName,
                    category
                ),
                "ApplicationPremium" (
                    status,
                    serviceType
                )
            `, { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            // Search by user name or scheme name
            query = query.or(`user_profiles.full_name.ilike.%${search}%`);
        }

        // Apply pagination limit (avoid created_at order to allow custom mem sort if priority mode active, else use it)
        if (!priorityOnly) {
            query = query.order('created_at', { ascending: false });
        }

        query = query.range(offset, offset + limit - 1);

        const { data: applications, error, count } = await query;

        if (error) throw error;

        let processedApplications = applications || [];

        // Apply Priority Sorting in memory for the current page if requested
        if (priorityOnly) {
            processedApplications.sort((a, b) => {
                const aIsPremium = a.user_profiles?.is_premium || a.ApplicationPremium?.some((ap: any) => ap.status === 'ACTIVE');
                const bIsPremium = b.user_profiles?.is_premium || b.ApplicationPremium?.some((ap: any) => ap.status === 'ACTIVE');

                if (aIsPremium && !bIsPremium) return -1;
                if (!aIsPremium && bIsPremium) return 1;

                // Fallback to created_at
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            // Filter out non-premium if you only want priority
            // processedApplications = processedApplications.filter(a => ...);
        }

        return NextResponse.json({
            applications: processedApplications,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Fetch applications error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
