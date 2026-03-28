import { createAdminClient } from './lib/supabase-admin';

async function checkDocs() {
    const supabaseAdmin = createAdminClient();
    const res1 = await supabaseAdmin.from('documents').select('document_name').limit(5);
    const res2 = await supabaseAdmin.from('Document').select('document_name').limit(5);
    const res3 = await supabaseAdmin.from('document_master').select('document_name').limit(5);
    console.log("documents:", res1.data, res1.error);
    console.log("Document:", res2.data, res2.error);
    console.log("document_master:", res3.data, res3.error);
}
checkDocs();
