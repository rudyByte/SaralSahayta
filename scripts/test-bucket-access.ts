import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                value = value.replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🔍 Testing Supabase Storage Access...\n');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBucketAccess() {
    try {
        // Test 1: List all buckets
        console.log('Test 1: Listing all buckets...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Failed to list buckets:', listError);
            return;
        }

        console.log('✅ Found buckets:', buckets?.map(b => b.name).join(', '));

        // Test 2: Get specific bucket
        console.log('\nTest 2: Getting "documents" bucket...');
        const { data: bucket, error: getError } = await supabase.storage.getBucket('documents');

        if (getError) {
            console.error('❌ Failed to get bucket:', getError);
        } else {
            console.log('✅ Bucket details:', bucket);
        }

        // Test 3: Try to upload a test file
        console.log('\nTest 3: Attempting test upload...');
        const testContent = Buffer.from('test file content');
        const testPath = 'test-user-id/documents/test-file.txt';

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(testPath, testContent, {
                contentType: 'text/plain',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload failed:', uploadError);
            console.error('Error details:', JSON.stringify(uploadError, null, 2));
        } else {
            console.log('✅ Upload successful:', uploadData);

            // Clean up
            await supabase.storage.from('documents').remove([testPath]);
            console.log('✅ Test file cleaned up');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testBucketAccess();
