import { supabaseAdmin } from './lib/supabase-admin';

async function checkJJM() {
    const { data, error } = await supabaseAdmin
        .from('Scheme')
        .select('id, schemeId, name')
        .ilike('name', '%jal jeevan%');
    console.log(error ? error : data);
}
checkJJM();
