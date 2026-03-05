const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) {
        // If direct query fails, try a simple query on suspected tables
        console.log('Error querying info_schema, trying direct queries...');
        const suspected = ['User', 'UserProfile', 'user_profiles', 'Scheme', 'schemes'];
        for (const t of suspected) {
            const { error: te } = await supabase.from(t).select('count', { count: 'exact', head: true });
            console.log(`Table "${t}": ${te ? '❌ ' + te.message : '✅ exists'}`);
        }
    } else {
        console.log('Tables:', tables.map(t => t.table_name).join(', '));
    }
}

checkTables();
