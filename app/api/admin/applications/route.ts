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
            .from('Application')
            .select(`
                *,
                user:users (
                    name,
                    mobile,
                    state
                ),
                scheme:Scheme (
                    name,
                    category
                )
            `, { count: 'exact' });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            // Search by user name or ID
            query = query.or(`trackingId.ilike.%${search}%,id.ilike.%${search}%`);
        }

        // Apply pagination and order
        query = query.order('createdAt', { ascending: false });
        query = query.range(offset, offset + limit - 1);

        const { data: applications, error, count } = await query;

        if (error) throw error;

        let processedApplications = applications || [];

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
