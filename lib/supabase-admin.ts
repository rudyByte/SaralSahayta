import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Custom fetch with retry logic to handle flaky network
const fetchWithRetry = async (url: string, options: any, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetch(url, options);
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`⚠️ Fetch failed, retrying (${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        fetch: fetchWithRetry as any
    }
});
