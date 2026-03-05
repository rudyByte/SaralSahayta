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

async function inspectColumns() {
    console.log('--- Inspecting User Table ---');
    const { data: userData, error: userError } = await supabase.from('User').select('*').limit(1);
    if (userError) console.log('User Error:', userError.message);
    else console.log('User Columns:', Object.keys(userData[0] || {}).join(', '));

    console.log('\n--- Inspecting user_profiles Table ---');
    const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*').limit(1);
    if (profileError) console.log('user_profiles Error:', profileError.message);
    else console.log('user_profiles Columns:', Object.keys(profileData[0] || {}).join(', '));
}

inspectColumns();
