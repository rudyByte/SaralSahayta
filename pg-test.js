const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:saralsahaytaisgreat@db.jozsiocbalcz.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  let res = await client.query('SELECT COUNT(*) FROM documents');
  console.log('Count of documents:', res.rows[0].count);
  res = await client.query('SELECT * FROM documents LIMIT 2');
  console.log('First 2 docs:', res.rows);
  await client.end();
}
run().catch(console.error);
