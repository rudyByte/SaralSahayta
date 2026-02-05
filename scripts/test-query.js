const { createClient } = require('@supabase/supabase-js');

// These will be read from the environment when running with --env-file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables! Please run with node --env-file=.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('📡 Testing Supabase Query...');

    // Test both casings
    const casings = ['Scheme', 'scheme'];

    for (const table of casings) {
        console.log(`\n🔍 Trying table: "${table}"`);
        const { data, count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error(`❌ Error with "${table}":`, error.message, error.code);
        } else {
            console.log(`✅ Success with "${table}"! Found ${data.length} records. Total: ${count}`);
            if (data.length > 0) {
                console.log('Sample Data (keys):', Object.keys(data[0]));
            }
        }
    }
}

main().catch(console.error);
