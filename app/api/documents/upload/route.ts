export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { uploadFileToSupabase } from '@/lib/supabase-storage';
import { validateFile } from '@/lib/file-validation';
import { getDocumentExpiryStatus } from '@/lib/documents/expiry-calculator';
import { recalculateSchemeMatches } from '@/lib/matching/recalculate-on-profile-update';
// import { optimizeImage } from '@/lib/optimize-image'; // Temporarily disabled

/**
 * API Route for handling secure document uploads
 */
export async function POST(request: NextRequest) {
    console.log('[Upload API] Request received');
    try {
        const supabase = createClient();
        const supabaseAdmin = createAdminClient();

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
            .select('id, document_name')
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

        try {
            const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
            if (!bucketError && buckets) {
                const bucketExists = buckets.find(b => b.name === bucketName);
                if (!bucketExists) {
                    await supabaseAdmin.storage.createBucket(bucketName, {
                        public: false,
                        fileSizeLimit: 10485760
                    });
                }
            }
        } catch (storageCheckErr: any) {
            console.warn('[Upload API] Bucket listing check skipped due to storage auth error:', storageCheckErr.message || storageCheckErr);
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

        const status = getDocumentExpiryStatus(expiryDate ? new Date(expiryDate) : null);

        // 8. DB Update
        const payload = {
            user_id: userId,
            document_id: documentId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrl,
            verification_status: 'VERIFIED',
            status: status,
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

        const recalculation = await recalculateSchemeMatches(userId, `Document Uploaded: ${documentCode}`);

        return NextResponse.json({
            success: true,
            document: resultData,
            message: existing ? 'Document replaced' : 'Document uploaded',
            recalculation,
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
