import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { uploadFileToSupabase } from '@/lib/supabase-storage';
import { validateFile } from '@/lib/file-validation';
import { optimizeImage } from '@/lib/optimize-image';

/**
 * API Route for handling secure document uploads
 * Optimized with server-side image processing and multi-tier validation
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // Check authentication using project's SSR pattern
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentCode = formData.get('documentCode') as string;
        const expiryDate = formData.get('expiryDate') as string | null;

        if (!file || !documentCode) {
            return NextResponse.json(
                { error: 'File and documentCode are required' },
                { status: 400 }
            );
        }

        // Validate file (size, type)
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Get document ID from code (Requires 'documents' master table)
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('id')
            .eq('document_code', documentCode)
            .single();

        if (docError || !document) {
            return NextResponse.json(
                { error: 'Invalid document code. Ensure you have run the alignment script.' },
                { status: 400 }
            );
        }

        const documentId = document.id;

        // Check for existing document for this user to handle replacement
        const { data: existing } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', userId)
            .eq('document_id', documentId)
            .single();

        // Business Logic: If already verified, don't allow replacement via generic upload
        if (existing && existing.verification_status === 'VERIFIED') {
            return NextResponse.json(
                { error: 'Cannot replace verified document. Contact support if you need to update.' },
                { status: 400 }
            );
        }

        // Optimize image if applicable (Convert to WebP, Resize)
        let fileToUpload: File | Buffer = file;
        let contentType = file.type;
        if (file.type.startsWith('image/')) {
            fileToUpload = await optimizeImage(file);
            contentType = 'image/webp';
        }

        // Upload to Supabase Storage Bucket ('documents')
        const fileUrl = await uploadFileToSupabase({
            supabase,
            file: fileToUpload,
            fileName: file.name,
            contentType,
            userId,
            folder: 'documents',
        });

        // Update or Insert database record
        if (existing) {
            const { data: updated, error: updateError } = await supabase
                .from('user_documents')
                .update({
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    file_url: fileUrl,
                    uploaded_at: new Date().toISOString(),
                    verification_status: 'PENDING',
                    verified_by: null,
                    verified_at: null,
                    expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (updateError) {
                console.error('Record update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update document record' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                document: updated,
                message: 'Document replaced successfully',
            });
        }

        // Create new document record
        const { data: newDoc, error: insertError } = await supabase
            .from('user_documents')
            .insert({
                user_id: userId,
                document_id: documentId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                file_url: fileUrl,
                verification_status: 'PENDING',
                expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to save document record' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            document: newDoc,
            message: 'Document uploaded successfully',
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
