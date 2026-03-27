const https = require('https');

const url = 'https://lfwzsjgjjozsiocbalcz.supabase.co';
const key = 'sb_secret_bApkpSi2G6bJJOElYxzBZsw_uwSk24UE';

function get(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lfwzsjgjjozsiocbalcz.supabase.co',
      path: path,
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'count=exact'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({status: res.statusCode, body: data, headers: res.headers}));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  let r;
  r = await get('/rest/v1/documents?select=id,document_name,document_code&limit=3');
  console.log('documents status:', r.status, 'count:', r.headers['content-range']);
  console.log('body:', r.body.substring(0, 400));
  
  r = await get('/rest/v1/user_documents?select=id&limit=1');
  console.log('\nuser_documents status:', r.status, 'count:', r.headers['content-range']);
}

main().catch(console.error);
