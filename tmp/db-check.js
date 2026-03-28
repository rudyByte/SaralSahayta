const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase Environment Variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log('--- Supabase Diagnostic ---');
  
  // 1. Try to fetch from 'Application'
  const { data: appData, error: appError, count: appCount } = await supabase
    .from('Application')
    .select('*', { count: 'exact', head: true });
  
  console.log('Table "Application" (Capital):', { count: appCount, error: appError?.message });

  // 2. Try to fetch from 'applications'
  const { data: lowAppData, error: lowAppError, count: lowCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true });

  console.log('Table "applications" (Lowercase):', { count: lowCount, error: lowAppError?.message });

  // 3. Try to fetch from 'Scheme'
  const { data: schemeData, error: schemeError, count: schemeCount } = await supabase
    .from('Scheme')
    .select('*', { count: 'exact', head: true });

  console.log('Table "Scheme":', { count: schemeCount, error: schemeError?.message });

  // 4. List all rows in 'Application' if any
  if (appCount > 0) {
      const { data: rows } = await supabase.from('Application').select('id, userId, status').limit(5);
      console.log('\nRecent Rows found:', rows);
  }
}

run();
