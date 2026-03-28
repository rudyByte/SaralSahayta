import { createAdminClient } from './lib/supabase-admin';

async function checkJJM() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('Scheme')
        .select('id, schemeId, name')
        .ilike('name', '%jal jeevan%');
    console.log(error ? error : data);
}
checkJJM();
