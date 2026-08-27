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
 * Uploads a file to Supabase storage with specified parameters.
 * Falls back to base64 Data URL if storage bucket or JWT auth is unconfigured/invalid.
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

    try {
        const body = file instanceof File ? file : file;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, body, {
                contentType,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.warn('[uploadFileToSupabase] ⚠️ Storage upload error:', error.message);
            console.warn('[uploadFileToSupabase] Falling back to Data URL encoding...');
            return await createFallbackDataUrl(file, contentType);
        }

        console.log('[uploadFileToSupabase] ✅ Upload successful:', data);

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(data.path);

        console.log('[uploadFileToSupabase] Public URL:', publicUrl);
        return publicUrl;
    } catch (err: any) {
        console.warn('[uploadFileToSupabase] ⚠️ Storage upload exception:', err.message || err);
        console.warn('[uploadFileToSupabase] Falling back to Data URL encoding...');
        return await createFallbackDataUrl(file, contentType);
    }
}

async function createFallbackDataUrl(file: File | Buffer, contentType: string): Promise<string> {
    if (Buffer.isBuffer(file)) {
        return `data:${contentType};base64,${file.toString('base64')}`;
    }
    if (typeof file.arrayBuffer === 'function') {
        const arrayBuffer = await (file as File).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    }
    return `data:${contentType};base64,`;
}

