import { supabaseAdmin } from './lib/supabase-admin';

async function inspectSchema() {
  const { data, error } = await supabaseAdmin
    .from('Scheme')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error fetching Scheme:", error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log("Scheme Columns:", Object.keys(data[0]));
  } else {
    console.log("No data in Scheme table.");
  }
}

inspectSchema();
