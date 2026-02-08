
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Function to manually load .env.local to avoid 'dotenv' dependency issues
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            console.log(`Loading environment from ${envPath}`);
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split('\n').forEach(line => {
                // Simple parser for KEY=VALUE
                const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    // Remove quotes if present
                    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                        value = value.replace(/^"|"$/g, '');
                    }
                    if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
                        value = value.replace(/^'|'$/g, '');
                    }
                    process.env[key] = value;
                }
            });
        } else {
            console.warn('⚠️ .env.local file not found');
        }
    } catch (e) {
        console.error('Error loading .env.local:', e);
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables.');
    console.error('   Please ensure .env.local contains:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initStorage() {
    console.log('🚀 Initializing Supabase Storage...');

    const buckets = [
        { id: 'documents', public: false },
        { id: 'profile-pictures', public: true }
    ];

    for (const bucket of buckets) {
        console.log(`\nChecking bucket: ${bucket.id}...`);

        // Attempt to get bucket
        const { data: existing, error: checkError } = await supabase
            .storage
            .getBucket(bucket.id);

        // If bucket doesn't exist (error or null data)
        if (checkError && (checkError.message.includes('not found') || checkError.message.includes('does not exist'))) {
            console.log(`   Bucket '${bucket.id}' not found. Creating...`);
            const { data, error: createError } = await supabase
                .storage
                .createBucket(bucket.id, {
                    public: bucket.public,
                    fileSizeLimit: 10485760, // 10MB
                });

            if (createError) {
                console.error(`❌ Failed to create bucket '${bucket.id}':`, createError.message);
            } else {
                console.log(`✅ Bucket '${bucket.id}' created successfully.`);
            }
        } else if (existing) {
            console.log(`✅ Bucket '${bucket.id}' already exists.`);

            // Update public status if needed
            if (existing.public !== bucket.public) {
                console.log(`   Updating public status for '${bucket.id}' to ${bucket.public}...`);
                const { error: updateError } = await supabase.storage.updateBucket(bucket.id, { public: bucket.public });
                if (updateError) console.error(`   Failed to update bucket: ${updateError.message}`);
                else console.log(`   Updated public status.`);
            }
        } else {
            // Fallback for unexpected errors
            console.error(`❌ Error checking bucket '${bucket.id}':`, checkError);
        }
    }

    console.log('\n✨ Storage initialization complete.');
}

initStorage().catch(console.error);
