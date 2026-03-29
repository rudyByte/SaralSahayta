const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://lfwzsjgjjozsiocbalcz.supabase.co",
  "sb_publishable_Y5otEG9Q2TTdVPdB8ReNZA_QsbBxWLJ"
);

const fs = require('fs');
async function testQuery() {
  const { data, error } = await supabase.from('Application').select('*, "Scheme"(*)').limit(1);
  if (error) console.error("Error with quotes:", error.message);
  else console.log("Success with quotes:", data);
}
testQuery();

async function fixSchema() {
  // Let's add form_data column to applications table
  const query = `
    ALTER TABLE IF EXISTS public.applications 
    ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}';
  `;

  // Actually, Supabase REST cannot execute arbitrary SQL.
  // We can use Prisma to execute raw SQL.
  const { execSync } = require('child_process');
  require('fs').writeFileSync('add_col.sql', query);
  
  try {
    const url = "postgresql://postgres:saralsahaytaisgreat@db.lfwzsjgjjozsiocbalcz.supabase.co:5432/postgres?pgbouncer=true";
    const out = execSync(`npx prisma db execute --file add_col.sql --url "${url}"`);
    console.log('Added column successfully!', out.toString());
  } catch(e) {
    console.error('Failed to add column using Prisma:', e.message);
  }
}
fixSchema();
