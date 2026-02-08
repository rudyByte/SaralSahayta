import { SupabaseClient } from '@supabase/supabase-js';

export interface StorageUploadParams {
    supabase: SupabaseClient;
    file: File | Buffer;
    fileName: string;
    contentType: string;
    userId: string;
    folder?: string;
}

/**
 * Uploads a file to Supabase storage with specified parameters
 */
export async function uploadFileToSupabase({
    supabase,
    file,
    fileName,
    contentType,
    userId,
    folder = 'documents'
}: StorageUploadParams): Promise<string> {
    console.log('[uploadFileToSupabase] Starting upload...');
    console.log('[uploadFileToSupabase] Params:', { fileName, contentType, userId, folder });

    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "-");
    const filePath = `${userId}/${folder}/${timestamp}-${cleanFileName}`;

    console.log('[uploadFileToSupabase] File path:', filePath);
    console.log('[uploadFileToSupabase] Attempting upload to bucket: documents');

    // Determine if file is Buffer or File and handle accordingly
    const body = file instanceof File ? file : file;

    const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, body, {
            contentType,
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('[uploadFileToSupabase] ❌ UPLOAD ERROR:', error);
        console.error('[uploadFileToSupabase] Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('[uploadFileToSupabase] ✅ Upload successful:', data);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

    console.log('[uploadFileToSupabase] Public URL:', publicUrl);
    return publicUrl;
}
