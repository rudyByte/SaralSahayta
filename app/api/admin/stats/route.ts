export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // 1. Get Summary Stats (Align with Actual DB Schema)
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: totalApplications } = await supabase.from('applications').select('*', { count: 'exact', head: true });
        const { count: pendingApplications } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED');
        
        // 2. Get Document Stats (Verification)
        const { count: verifiedDocuments } = await supabase.from('user_documents').select('*', { count: 'exact', head: true }).eq('verification_status', 'VERIFIED');

        // 3. Get Recent Applications (Use snake_case paths)
        const { data: recentApplications, error: recentError } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                created_at,
                user:users (name),
                scheme:schemes (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('Recent applications fetch error:', recentError);
        }

        const mappedRecent = (recentApplications || []).map((app: any) => ({
            ...app,
            createdAt: app.created_at
        }));

        // 4. Get Status Distribution
        const { data: statusData } = await supabase.from('applications').select('status');
        const statusDistribution = statusData?.reduce((acc: any, curr: any) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {}) || {};

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalApplications: totalApplications || 0,
                pendingApplications: pendingApplications || 0,
                verifiedDocuments: verifiedDocuments || 0,
            },
            recentApplications: mappedRecent,
            statusDistribution
        });
    } catch (error: any) {
        console.error('Fetch admin stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
