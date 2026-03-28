export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        const supabase = createClient();

        // 1. Get Summary Stats (Align with Prisma schema)
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: totalApplications } = await supabase.from('Application').select('*', { count: 'exact', head: true });
        const { count: pendingApplications } = await supabase.from('Application').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED');
        
        // 2. Get Document Stats (Verification)
        const { count: verifiedDocuments } = await supabase.from('user_documents').select('*', { count: 'exact', head: true }).eq('verification_status', 'VERIFIED');

        // 3. Get Recent Applications
        const { data: recentApplications, error: recentError } = await supabase
            .from('Application')
            .select(`
                id,
                status,
                createdAt,
                user:users (name),
                scheme:Scheme (name)
            `)
            .order('createdAt', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('Recent applications fetch error:', recentError);
        }

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
            recentApplications: recentApplications || [],
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
