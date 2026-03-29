export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // 1. Get Summary Stats
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: totalApplications } = await supabase.from('Application').select('*', { count: 'exact', head: true });
        const { count: pendingApplications } = await supabase.from('Application').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED');
        
        // 2. Get Document Stats (Verification)
        const { count: verifiedDocuments } = await supabase.from('user_documents').select('*', { count: 'exact', head: true }).eq('verification_status', 'VERIFIED');

        // 3. Get Recent Applications 
        const { data: recentAppList, error: recentError } = await supabase
            .from('Application')
            .select('*')
            .order('createdAt', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('Recent applications fetch error:', recentError);
        }

        const recentApps = recentAppList || [];
        const userIds = Array.from(new Set(recentApps.map((a: any) => a.userId || a.user_id))).filter(Boolean);
        const schemeIds = Array.from(new Set(recentApps.map((a: any) => a.schemeId || a.scheme_id))).filter(Boolean);

        let usersDict: any = {};
        if (userIds.length > 0) {
            const { data: usersData } = await supabase.from('users').select('id, name').in('id', userIds);
            (usersData || []).forEach((u: any) => usersDict[u.id] = u);
        }

        let schemesDict: any = {};
        if (schemeIds.length > 0) {
            const { data: schemesData } = await supabase.from('Scheme').select('id, name').in('id', schemeIds);
            (schemesData || []).forEach((s: any) => schemesDict[s.id] = s);
        }

        const recentApplications = recentApps.map((app: any) => ({
            id: app.id,
            status: app.status,
            createdAt: app.createdAt || app.created_at,
            user: usersDict[app.userId || app.user_id] || null,
            scheme: schemesDict[app.schemeId || app.scheme_id] || null
        }));

        // 4. Get Status Distribution
        const { data: statusData } = await supabase.from('Application').select('status');
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
            recentApplications,
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
