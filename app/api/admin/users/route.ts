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
        const state = searchParams.get('state') || '';
        const category = searchParams.get('category') || '';

        const offset = (page - 1) * limit;

        // Query the main 'users' table joined with 'user_profiles'
        let query = supabase
            .from('users')
            .select(`
                *,
                profile:user_profiles (
                    isAdmin,
                    isPremium,
                    isSuspended,
                    profile_completion_percentage
                )
            `, { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (state) {
            query = query.eq('state', state);
        }

        if (category) {
            query = query.eq('category', category);
        }

        // Apply pagination
        query = query
            .order('createdAt', { ascending: false })
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

        // Determine if updating 'users' or 'user_profiles'
        // For simplicity, we'll assume updates are for user_profiles (isAdmin, isSuspended)
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('userId', userId)
            .select()
            .single();

        if (error) throw error;

        // Create Admin Audit Log if table exists
        try {
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            if (adminUser) {
                await supabase.from('admin_audit_logs').insert({
                    admin_id: adminUser.id,
                    target_user_id: userId,
                    action: 'UPDATE_PROFILE',
                    entity_type: 'USER',
                    entity_id: userId,
                    details: updates
                });
            }
        } catch (auditError) {
             console.warn('Could not log admin audit:', auditError);
        }

        return NextResponse.json({ user: data });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}
