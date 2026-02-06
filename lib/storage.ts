import { supabase } from './supabase';

export interface StorageUploadResult {
    path: string | null;
    url: string | null;
    error: any;
}

/**
 * Uploads a file to a specified Supabase bucket
 * Path structure: {userId}/{folder}/{timestamp}-{filename}
 */
export async function uploadFile(
    file: File,
    bucket: string,
    userId: string,
    folder: string = 'documents'
): Promise<StorageUploadResult> {
    try {
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "-");
        const filePath = `${userId}/${folder}/${timestamp}-${cleanFileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            path: data.path,
            url: publicUrl,
            error: null
        };
    } catch (error: any) {
        console.error('Error uploading file:', error.message);
        return { path: null, url: null, error };
    }
}

/**
 * Deletes a file from Supabase storage
 */
export async function deleteFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        console.error('Error deleting file:', error.message);
        return { success: false, error };
    }
    return { success: true, data };
}

/**
 * Gets a temporary signed URL for private buckets
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        console.error('Error creating signed URL:', error.message);
        return { url: null, error };
    }
    return { url: data.signedUrl, error: null };
}
