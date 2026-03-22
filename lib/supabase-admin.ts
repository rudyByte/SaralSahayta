import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a lazy getter to avoid throwing at module initialization time during Next.js build.
// This prevents the build from crashing when env vars are not available in the build environment.
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (_client) return _client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAdminKey) {
        throw new Error(
            'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
        );
    }

    _client = createClient(supabaseUrl, supabaseAdminKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return _client;
}

// Keep the named export for backward compatibility. 
// This uses a Proxy so property access is deferred until runtime.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return getSupabaseAdmin()[prop as keyof SupabaseClient];
    }
});
