import { supabaseAdmin } from './lib/supabase-admin';

async function listTables() {
    // We can list tables via querying pg_class through a raw query or checking information_schema if accessible, 
    // but easier to just try querying Application and applications.
    const promises = [
        supabaseAdmin.from('Scheme').select('id').limit(1),
        supabaseAdmin.from('schemes').select('id').limit(1),
        supabaseAdmin.from('Application').select('id').limit(1),
        supabaseAdmin.from('applications').select('id').limit(1),
    ];
    const results = await Promise.all(promises);
    
    console.log("Scheme:", results[0].error ? results[0].error.message : "OK");
    console.log("schemes:", results[1].error ? results[1].error.message : "OK");
    console.log("Application:", results[2].error ? results[2].error.message : "OK");
    console.log("applications:", results[3].error ? results[3].error.message : "OK");
}

listTables();
