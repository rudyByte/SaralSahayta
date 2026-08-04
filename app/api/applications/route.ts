export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch from Application table natively
        const { data: applications, error } = await supabase
            .from('Application')
            .select('*')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Supabase GET Application error:", error);
            throw error;
        }

        // 2. Extract uniquely referenced Scheme IDs
        const appList = applications || [];
        const schemeIds = Array.from(new Set(appList.map((app: any) => app.schemeId || app.scheme_id))).filter(Boolean);

        // 3. Fetch related Schemes separately
        let schemesDict: any = {};
        if (schemeIds.length > 0) {
            const { data: schemes } = await supabase
                .from('Scheme')
                .select('id, name, category, ministry')
                .in('id', schemeIds);
                
            if (schemes) {
                schemes.forEach((s: any) => {
                    schemesDict[s.id] = s;
                });
            }
        }

        // Supabase returns exact table columns. If Prisma created them, they are camelCase.
        const mappedApplications = appList.map((app: any) => {
            const schemeId = app.schemeId || app.scheme_id;
            return {
                ...app,
                userId: app.userId || app.user_id,
                trackingId: app.trackingId || app.tracking_id,
                createdAt: app.createdAt || app.created_at,
                updatedAt: app.updatedAt || app.updated_at,
                schemeId,
                scheme: schemesDict[schemeId] || null
            };
        });

        return NextResponse.json({ applications: mappedApplications });

    } catch (error: any) {
        console.error('Fetch user applications error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
