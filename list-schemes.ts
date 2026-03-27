import { supabaseAdmin } from './lib/supabase-admin';

async function listSchemes() {
  const { data, error } = await supabaseAdmin
    .from('Scheme')
    .select('id, schemeId, name, isActive, created_at')
    .limit(100);
    
  if (error) {
    console.error("Error fetching Schemes:", error);
    return;
  }
  
  if (data) {
    console.log(`Found ${data.length} schemes.`);
    console.table(data);
  } else {
    console.log("No data in Scheme table.");
  }
}

listSchemes();
