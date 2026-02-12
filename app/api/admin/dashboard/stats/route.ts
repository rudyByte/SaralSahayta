export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAdminPermission } from '@/lib/admin-auth';

/**
 * GET - Fetch aggregated statistics for the Admin Dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminPermission('analytics.view');
        const supabase = createClient();

        // 1. Fetch High-Level Aggregates (from materialized view if possible, or live counts)
        // For real-time accuracy, we'll do live counts on indexed columns for now.
        // Materialized view 'analytics_daily_snapshot' is great for historical trends.

        const { count: totalUsers } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });

        const { count: totalApplications } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true });

        const { count: pendingReviews } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'SUBMITTED');

        const { count: totalSchemes } = await supabase
            .from('schemes')
            .select('*', { count: 'exact', head: true });


        // 2. Fetch Application Status Distribution
        // Note: Supabase doesn't support 'GROUP BY' via JS client easily without RPC.
        // We will stick to simple counts for known statuses for MVP.
        const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
        const statusCounts: Record<string, number> = {};

        await Promise.all(statuses.map(async (status) => {
            const { count } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', status);
            statusCounts[status] = count || 0;
        }));


        // 3. Fetch Recent Activity (from admin_activity_logs)
        const { data: recentActivity } = await supabase
            .from('admin_activity_logs')
            .select('action, target_table, created_at, admin_id')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({
            overview: {
                totalUsers: totalUsers || 0,
                totalApplications: totalApplications || 0,
                pendingReviews: pendingReviews || 0,
                totalSchemes: totalSchemes || 0,
            },
            applicationsByStatus: statusCounts,
            recentActivity: recentActivity || []
        });

    } catch (error: any) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch admin statistics' },
            { status: 401 } // Default to unauthorized if error bubbles up from auth check
        );
    }
}
