export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        const offset = (page - 1) * limit;

        let query = supabase
            .from('Scheme')
            .select('*, applications(count)');

        if (search) {
            query = query.or(`name.ilike.%${search}%,ministry.ilike.%${search}%`);
        }

        if (category) {
            query = query.eq('category', category);
        }

        query = query
            .order('createdAt', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: schemes, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            schemes: schemes || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Fetch schemes error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch schemes' },
            { status: 500 }
        );
    }
}
