const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkColumns() {
    const env = fs.readFileSync('d:\\e transfer\\1PROJECTS\\SaralSahayta\\.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
    const supabase = createClient(url, key);

    const { data, error } = await supabase.from('scheme_document_requirements').select('*').limit(1);
    
    if (error) {
        console.error("Error:", error.message);
    } else if (data && data.length > 0) {
        console.log("Columns in scheme_document_requirements:", Object.keys(data[0]));
    } else {
        console.log("No data in table to inspect columns.");
    }
}

checkColumns();
