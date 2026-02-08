import { createClient } from '@supabase/supabase-js';

console.log('[supabase-admin] Module loading...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[supabase-admin] URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('[supabase-admin] Service Key:', supabaseAdminKey ? 'SET (' + supabaseAdminKey.substring(0, 20) + '...)' : 'MISSING');

if (!supabaseUrl || !supabaseAdminKey) {
    console.error('❌ [supabase-admin] Missing Supabase Environment Variables');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL is missing');
    if (!supabaseAdminKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY is missing');
    throw new Error('Missing required Supabase environment variables');
}

console.log('[supabase-admin] Creating admin client...');

// Export a safe instance
export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('[supabase-admin] ✅ Admin client created successfully');
