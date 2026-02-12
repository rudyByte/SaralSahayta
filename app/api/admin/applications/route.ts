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

        const offset = (page - 1) * limit;

        let query = supabase
            .from('applications')
            .select(`
                *,
                user_profiles!applications_user_id_fkey (
                    full_name,
                    mobile,
                    state
                ),
                schemes (
                    schemeName,
                    category
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

        // Apply pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: applications, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            applications: applications || [],
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
