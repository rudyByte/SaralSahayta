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

        // Fetch application using the correct 'Application' table and relation 'Scheme'
        const { data: application, error } = await supabase
            .from('Application')
            .select(`
                *,
                scheme:Scheme (
                    *
                )
            `)
            .eq('id', applicationId)
            .eq('userId', session.user.id)
            .single();

        if (error || !application) {
            // Try matching by trackingId if standard ID lookup fails
            const { data: altApp, error: altError } = await supabase
                .from('Application')
                .select(`
                    *,
                    scheme:Scheme (*)
                `)
                .eq('trackingId', applicationId)
                .eq('userId', session.user.id)
                .single();

            if (altError || !altApp) {
                return NextResponse.json(
                    { error: 'Application not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({ application: altApp });
        }

        return NextResponse.json({ application });

    } catch (error: any) {
        console.error('Fetch Application Detail Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
