import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
);

async function checkDB() {
  console.log('--- Checking Tables ---');
  const { data: tables, error: tableError } = await supabase.rpc('get_tables'); // Custom RPC if it exists, otherwise use query
  
  if (tableError) {
      // Fallback: try raw query via some other means or just check Application directly
      console.log('RPC failed, checking Application directly...');
  }

  const { data: appData, error: appError, count } = await supabase
    .from('Application')
    .select('*', { count: 'exact', head: true });

  console.log('Application (Capital) Table Status:');
  console.log('Error:', appError);
  console.log('Count:', count);

  const { data: lowAppData, error: lowAppError, count: lowCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true });

  console.log('\napplications (Lowercase) Table Status:');
  console.log('Error:', lowAppError);
  console.log('Count:', lowCount);

  // Check unique Application entries
  const { data: sampleRow } = await supabase.from('Application').select('*').limit(1);
  console.log('\nSample Row from "Application":', sampleRow);
}

checkDB();
