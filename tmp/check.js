const { createClient } = require('@supabase/supabase-js');
const url = 'https://lfwzsjgjjozsiocbalcz.supabase.co';
const key = 'sb_secret_bApkpSi2G6bJOElYxzBZsw_uwSk24UE';

const supabase = createClient(url, key);

async function check() {
  console.log('--- DB DIAGNOSTIC ---');
  
  const { count: countCap, error: errCap } = await supabase.from('Application').select('*', { count: 'exact', head: true });
  console.log('Table "Application" (Capital):', countCap, errCap?.message || 'OK');

  const { count: countLow, error: errLow } = await supabase.from('applications').select('*', { count: 'exact', head: true });
  console.log('Table "applications" (Lowercase):', countLow, errLow?.message || 'OK');

  const { data: tables, error: tErr } = await supabase.rpc('get_tables');
  console.log('RPC get_tables:', tables, tErr?.message);
}

check();
