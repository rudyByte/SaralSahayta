import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * API Route to generate signed URLs for viewing/downloading documents
 * This allows secure access to files in private buckets
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get document ID from query params
        const searchParams = request.nextUrl.searchParams;
        const documentId = searchParams.get('id');

        if (!documentId) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
        }

        // Fetch the user document to verify ownership
        const { data: userDoc, error: docError } = await supabase
            .from('user_documents')
            .select('file_url, user_id')
            .eq('id', documentId)
            .single();

        if (docError || !userDoc) {
            console.error('[Download API] Document not found:', documentId);
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Verify ownership
        if (userDoc.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Extract the file path from the public URL
        // URL format: https://.../storage/v1/object/public/documents/path/to/file
        console.log('[Download API] Full file URL:', userDoc.file_url);

        const urlMatch = userDoc.file_url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);

        if (!urlMatch || !urlMatch[1]) {
            console.error('[Download API] Failed to extract file path from URL');
            return NextResponse.json({ error: 'Invalid file URL format' }, { status: 400 });
        }

        const filePath = urlMatch[1];
        console.log('[Download API] Extracted file path:', filePath);

        // Generate a signed URL (valid for 1 hour)
        const { data, error: signError } = await supabaseAdmin.storage
            .from('documents')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signError || !data) {
            console.error('[Download API] Error creating signed URL:', signError);
            console.error('[Download API] Attempted path:', filePath);
            return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
        }

        console.log('[Download API] ✅ Signed URL created successfully');
        return NextResponse.json({
            signedUrl: data.signedUrl,
            expiresIn: 3600
        });

    } catch (error: any) {
        console.error('[Download API] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
