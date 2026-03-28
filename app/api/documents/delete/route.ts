export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient();
        const supabaseAdmin = createAdminClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const documentId = searchParams.get('id');

        if (!documentId) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
        }

        // 2. Fetch Document to verify ownership and get file path
        const { data: userDoc, error: fetchError } = await supabase
            .from('user_documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (fetchError || !userDoc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        if (userDoc.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Delete from Storage
        // Extract path from URL or if you stored the path, use that. 
        // Based on upload logic: path is `userId/documents/timestamp-filename`
        // We can extract it from file_url if needed, or if we start saving file_path in DB it would be easier.
        // For now, let's extract from URL or reconstruct carefully.
        // Actually, the previous upload implementation returns `publicUrl`.
        // Let's try to parse the path from the public URL.

        const fileUrl = userDoc.file_url;
        // Expected format: .../documents/userId/documents/filename
        // Let's rely on the regex we used in download route or similar method
        const urlMatch = fileUrl.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);

        if (urlMatch && urlMatch[1]) {
            const filePath = urlMatch[1];
            const { error: storageError } = await supabaseAdmin.storage
                .from('documents')
                .remove([filePath]);

            if (storageError) {
                console.error('[Delete API] Storage delete error:', storageError);
                // We might still want to delete the DB record even if storage fails, 
                // or return error. Let's return error for now to be safe.
                return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
            }
        } else {
            console.warn('[Delete API] Could not extract file path from URL:', fileUrl);
            // Proceed to delete DB record anyway? Maybe yes, to clean up "broken" records.
        }

        // 4. Delete from Database
        const { error: dbError } = await supabase
            .from('user_documents')
            .delete()
            .eq('id', documentId);

        if (dbError) {
            return NextResponse.json({ error: 'Failed to delete database record' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Delete API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
