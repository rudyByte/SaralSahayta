import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const state = searchParams.get('state') || '';
        const category = searchParams.get('category') || '';

        const offset = (page - 1) * limit;

        let query = supabase
            .from('user_profiles')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (state) {
            query = query.eq('state', state);
        }

        if (category) {
            query = query.eq('category', category);
        }

        // Apply pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: users, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            users: users || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Fetch users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { userId, updates } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ user: data });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}
