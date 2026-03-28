export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

/**
 * GET - Fetch detailed application information for the current user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const applicationId = params.id;

        // Fetch application using the actual schema: 'applications' table and relation 'schemes'
        const { data: application, error } = await supabase
            .from('applications')
            .select(`
                *,
                scheme:schemes (
                    *
                )
            `)
            .eq('id', applicationId)
            .eq('user_id', session.user.id)
            .single();

        if (error || !application) {
            // Try matching by tracking_id if standard ID lookup fails
            const { data: altApp, error: altError } = await supabase
                .from('applications')
                .select(`
                    *,
                    scheme:schemes (*)
                `)
                .eq('tracking_id', applicationId)
                .eq('user_id', session.user.id)
                .single();

            if (altError || !altApp) {
                return NextResponse.json(
                    { error: 'Application not found' },
                    { status: 404 }
                );
            }
            
            const mappedAlt = {
                ...altApp,
                userId: altApp.user_id,
                trackingId: altApp.tracking_id,
                createdAt: altApp.created_at,
                schemeId: altApp.scheme_id
            };
            return NextResponse.json({ application: mappedAlt });
        }

        const mappedApp = {
            ...application,
            userId: application.user_id,
            trackingId: application.tracking_id,
            createdAt: application.created_at,
            schemeId: application.scheme_id
        };
        return NextResponse.json({ application: mappedApp });

    } catch (error: any) {
        console.error('Fetch Application Detail Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
