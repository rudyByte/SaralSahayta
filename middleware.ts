import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next();
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    // Check for suspension
    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_suspended, is_admin')
            .eq('user_id', user.id)
            .single();

        if (profile?.is_suspended) {
            // Allow access to suspension page only
            if (!request.nextUrl.pathname.startsWith('/suspended')) {
                return NextResponse.redirect(new URL('/suspended', request.url));
            }
        }
    }

    // Protected routes - redirect to login if not authenticated
    const protectedPaths = ['/dashboard', '/life-events', '/discover', '/profile', '/applications', '/premium', '/settings', '/documents'];
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect admins from standard dashboard to admin panel
    if (request.nextUrl.pathname === '/dashboard' && user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

        if (profile?.is_admin) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    // Redirect authenticated users away from auth pages
    const authPaths = ['/login', '/register'];
    const isAuthPath = authPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isAuthPath && user) {
        // Check if admin to determine redirect path
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

        const redirectPath = profile?.is_admin ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Admin routes - check if user is admin
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

    if (isAdminPath) {
        if (!user) {
            // Not logged in, redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // We already fetched the profile for the suspension check
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

        if (!profile?.is_admin) {
            // Not an admin, redirect to dashboard page
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
