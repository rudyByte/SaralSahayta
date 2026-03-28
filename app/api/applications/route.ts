export const dynamic = 'force-dynamic';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const getSupabase = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { } },
            },
        }
    );
};

export async function GET() {
    try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: applications, error } = await supabase
            .from('applications')
            .select(`
                *,
                scheme:schemes (
                    name,
                    category,
                    ministry
                )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map snake_case to camelCase for frontend (schemes)
        // Diagnostic confirms created_at is snake_case even if core is camelCase
        const mappedApplications = (applications || []).map((app: any) => ({
            ...app,
            userId: app.user_id,
            trackingId: app.tracking_id,
            createdAt: app.created_at,
            updatedAt: app.updated_at,
            schemeId: app.scheme_id,
            scheme: app.scheme ? {
                ...app.scheme,
                name: app.scheme.name,
                category: app.scheme.category,
                ministry: app.scheme.ministry
            } : null
        }));

        return NextResponse.json({ applications: mappedApplications });

    } catch (error: any) {
        console.error('Fetch user applications error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
