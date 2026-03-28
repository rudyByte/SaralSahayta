export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
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
                user:users (
                    name,
                    mobile,
                    state
                ),
                scheme:schemes (
                    name,
                    category
                )
            `, { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            // Search by user name or ID (fallback tracking_id)
            query = query.or(`tracking_id.ilike.%${search}%,id.ilike.%${search}%`);
        }

        // Apply pagination and order
        query = query.order('created_at', { ascending: false });
        query = query.range(offset, offset + limit - 1);

        const { data: applications, error, count } = await query;

        if (error) throw error;

        let processedApplications = (applications || []).map((app: any) => ({
            ...app,
            userId: app.user_id,
            trackingId: app.tracking_id,
            createdAt: app.created_at,
            updatedAt: app.updated_at,
            schemeId: app.scheme_id
        }));

        // Apply Priority Sorting in memory if requested (e.g. check for isPremium if column exists)
        if (priorityOnly) {
            processedApplications.sort((a, b) => {
                const aIsPremium = a.is_premium || false; 
                const bIsPremium = b.is_premium || false;
                if (aIsPremium && !bIsPremium) return -1;
                if (!aIsPremium && bIsPremium) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
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
