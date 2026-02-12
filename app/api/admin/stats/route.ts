export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        // Get total users
        const { count: totalUsers } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });

        // Get total applications
        const { count: totalApplications } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true });

        // Get pending applications
        const { count: pendingApplications } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'SUBMITTED');

        // Get verified documents
        const { count: verifiedDocuments } = await supabase
            .from('UserDocument')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'VERIFIED');

        // Get recent applications
        const { data: recentApplications } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                created_at,
                user_id,
                scheme_id,
                user_profiles!applications_user_id_fkey (
                    full_name,
                    mobile
                ),
                schemes (
                    schemeName
                )
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        // Get application status distribution
        const { data: statusDistribution } = await supabase
            .from('applications')
            .select('status')
            .then(({ data }) => {
                const distribution = data?.reduce((acc: any, app: any) => {
                    acc[app.status] = (acc[app.status] || 0) + 1;
                    return acc;
                }, {});
                return { data: distribution };
            });

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalApplications: totalApplications || 0,
                pendingApplications: pendingApplications || 0,
                verifiedDocuments: verifiedDocuments || 0,
            },
            recentApplications: recentApplications || [],
            statusDistribution: statusDistribution || {},
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin statistics' },
            { status: 500 }
        );
    }
}
