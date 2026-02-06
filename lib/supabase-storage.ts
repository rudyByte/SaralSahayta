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
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "-");
    const filePath = `${userId}/${folder}/${timestamp}-${cleanFileName}`;

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
        console.error('Supabase Storage Error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

    return publicUrl;
}
