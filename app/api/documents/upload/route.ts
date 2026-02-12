export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { uploadFileToSupabase } from '@/lib/supabase-storage';
import { validateFile } from '@/lib/file-validation';
// import { optimizeImage } from '@/lib/optimize-image'; // Temporarily disabled

/**
 * API Route for handling secure document uploads
 */
export async function POST(request: NextRequest) {
    console.log('[Upload API] Request received');
    try {
        const supabase = createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('[Upload API] Unauthorized:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;
        console.log('[Upload API] Authenticated User:', userId);

        // 2. Form Parsing
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentCode = formData.get('documentCode') as string;
        const expiryDate = formData.get('expiryDate') as string | null;

        if (!file || !documentCode) {
            return NextResponse.json({ error: 'File and documentCode required' }, { status: 400 });
        }

        // 3. Validation
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // 4. Document Type Lookup
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('id')
            .eq('document_code', documentCode)
            .single();

        if (docError || !document) {
            console.error('[Upload API] Invalid Document Code:', documentCode);
            return NextResponse.json({ error: 'Invalid document code' }, { status: 400 });
        }
        const documentId = document.id;

        // 5. Existing Document Check
        const { data: existing } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', userId)
            .eq('document_id', documentId)
            .single();

        if (existing && existing.verification_status === 'VERIFIED') {
            return NextResponse.json({ error: 'Cannot replace verified document' }, { status: 400 });
        }

        // 6. STORAGE DEBUG & AUTO-FIX
        console.log('[Upload API] Checking Storage Configuration...');
        const bucketName = 'documents';

        // Check if bucket exists using Admin Client
        const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
        if (bucketError) {
            console.error('[Upload API] Failed to list buckets:', bucketError);
            throw new Error('Storage configuration failure: Could not list buckets');
        }

        const bucketExists = buckets?.find(b => b.name === bucketName);
        console.log(`[Upload API] Bucket '${bucketName}' exists?`, !!bucketExists);

        if (!bucketExists) {
            console.log(`[Upload API] Attempting to create bucket '${bucketName}'...`);
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: 10485760
            });
            if (createError) {
                console.error('[Upload API] Failed to create bucket:', createError);
                throw new Error('Failed to auto-create storage bucket');
            }
            console.log(`[Upload API] Bucket '${bucketName}' created.`);
        }

        // 7. Upload
        const fileToUpload: File | Buffer = file;
        const contentType = file.type;
        // Optimization disabled for now

        console.log('[Upload API] Starting Upload to Supabase Storage...');
        const fileUrl = await uploadFileToSupabase({
            supabase: supabaseAdmin, // USE ADMIN CLIENT
            file: fileToUpload,
            fileName: file.name,
            contentType,
            userId,
            folder: 'documents',
        });
        console.log('[Upload API] Upload Successful. URL:', fileUrl);

        // 8. DB Update
        const payload = {
            user_id: userId,
            document_id: documentId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrl,
            verification_status: 'PENDING',
            uploaded_at: new Date().toISOString(),
            expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        };

        let resultData;

        if (existing) {
            const { data, error } = await supabase
                .from('user_documents')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        } else {
            const { data, error } = await supabase
                .from('user_documents')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            resultData = data;
        }

        return NextResponse.json({
            success: true,
            document: resultData,
            message: existing ? 'Document replaced' : 'Document uploaded',
        });

    } catch (error: any) {
        console.error('[Upload API] CRITICAL ERROR:', error);
        // Return 500 with JSON to avoid "Unexpected token <"
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', details: error },
            { status: 500 }
        );
    }
}
