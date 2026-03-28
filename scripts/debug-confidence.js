const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugConfidence() {
    // 1. Get raw env content
    const env = fs.readFileSync('d:\\e transfer\\1PROJECTS\\SaralSahayta\\.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

    const supabase = createClient(url, key);

    // Get current user (John Loyal) id from users profiles
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
        .single();
    
    if (!profile) return console.log("No profile found");
    const userId = profile.user_id;

    // Get a random scheme
    const { data: scheme } = await supabase
        .from('schemes')
        .select('*')
        .limit(1)
        .single();

    if (!scheme) return console.log("No schemes found");
    const schemeId = scheme.id;

    console.log(`--- DEBUGGING CONFIDENCE DATA (User: ${userId}, Scheme: ${scheme.name}) ---`);
    
    // 2. Get required docs for scheme
    const { data: reqs } = await supabase
        .from('scheme_document_requirements')
        .select(`*, documents(*)`)
        .eq('scheme_id', schemeId);

    console.log("\nRequired Docs for Scheme:");
    reqs?.forEach(r => {
        console.log(`- ${r.documents.document_code} (${r.documents.document_name}) - Mandatory: ${r.is_mandatory}`);
    });

    // 3. Get user uploaded docs
    const { data: userDocs } = await supabase
        .from('user_documents')
        .select(`*, documents(*)`)
        .eq('user_id', userId);

    console.log("\nUser Uploaded Docs:");
    userDocs?.forEach(d => {
        console.log(`- ${d.documents.document_code} (${d.documents.document_name}) - Status: ${d.verification_status}`);
    });

    // 4. Check for direct match
    const reqCodes = reqs?.map(r => r.documents.document_code) || [];
    const userCodes = userDocs?.map(d => d.documents.document_code) || [];
    
    console.log("\nComparison:");
    console.log(`- Required Codes: ${reqCodes.join(', ')}`);
    console.log(`- User Uploaded: ${userCodes.join(', ')}`);
}

debugConfidence();
