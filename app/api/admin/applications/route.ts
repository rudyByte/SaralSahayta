export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || '';
        const search = searchParams.get('search') || '';
        const priorityOnly = searchParams.get('priority') === 'true';

        const offset = (page - 1) * limit;

        const supabase = createAdminClient();

        let query = supabase
            .from('applications')
            .select('*', { count: 'exact' });

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`tracking_id.ilike.%${search}%,id.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });
        query = query.range(offset, offset + limit - 1);

        const { data: applications, error, count } = await query;

        if (error) {
            console.error("Supabase Admin App error:", error);
            throw error;
        }

        const appList = applications || [];
        const userIds = Array.from(new Set(appList.map((a: any) => a.userId || a.user_id))).filter(Boolean);
        const schemeIds = Array.from(new Set(appList.map((a: any) => a.schemeId || a.scheme_id))).filter(Boolean);

        let usersDict: any = {};
        if (userIds.length > 0) {
            const { data: usersData } = await supabase.from('users').select('id, name, mobile, state').in('id', userIds);
            const { data: profilesData } = await supabase.from('user_profiles').select('user_id, isPremium').in('user_id', userIds);
            
            (usersData || []).forEach((u: any) => {
                const profile = (profilesData || []).find((p: any) => p.user_id === u.id);
                usersDict[u.id] = { ...u, profile };
            });
        }

        let schemesDict: any = {};
        if (schemeIds.length > 0) {
            const { data: schemesData } = await supabase.from('schemes').select('id, name, category').in('id', schemeIds);
            (schemesData || []).forEach((s: any) => {
                schemesDict[s.id] = s;
            });
        }

        let processedApplications = appList.map((app: any) => {
            const uid = app.userId || app.user_id;
            const sid = app.schemeId || app.scheme_id;
            const userObj = usersDict[uid] || null;
            
            return {
                ...app,
                userId: uid,
                trackingId: app.trackingId || app.tracking_id,
                createdAt: app.createdAt || app.created_at,
                updatedAt: app.updatedAt || app.updated_at,
                schemeId: sid,
                user: userObj,
                scheme: schemesDict[sid] || null,
                is_premium: userObj?.profile?.isPremium || false
            };
        });

        if (priorityOnly) {
            processedApplications.sort((a: any, b: any) => {
                const aIsPremium = a.is_premium || false; 
                const bIsPremium = b.is_premium || false;
                if (aIsPremium && !bIsPremium) return -1;
                if (!aIsPremium && bIsPremium) return 1;
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
        }

        return NextResponse.json({
            applications: processedApplications,
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
