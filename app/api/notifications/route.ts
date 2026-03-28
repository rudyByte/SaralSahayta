import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const supabase = createClient();
        const adminSupabase = createAdminClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: rawNotifications, error: fetchError } = await adminSupabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (fetchError) throw fetchError;

        // Map snake_case to camelCase for frontend
        const notifications = (rawNotifications || []).map((n: any) => ({
            ...n,
            userId: n.user_id,
            isRead: n.is_read,
            createdAt: n.created_at
        }));

        return NextResponse.json({ notifications });
    } catch (error: any) {
        console.error('[Notifications API] Error:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            message: error.message 
        }, { status: 500 });
    }
}
