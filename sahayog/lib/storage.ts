import { createClient } from './supabase'

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'documents'

interface UploadParams {
    file: File | Buffer
    fileName: string
    contentType: string
    userId: string
    folder: 'documents' | 'profile-pictures'
}

/**
 * Upload a file to Supabase Storage
 * Files are stored with path: userId/folder/timestamp-filename
 */
export async function uploadFile(params: UploadParams): Promise<string> {
    const supabase = createClient()

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${params.userId}/${params.folder}/${timestamp}-${sanitizedFileName}`

    // Convert File to ArrayBuffer if needed
    const fileData = params.file instanceof File
        ? await params.file.arrayBuffer()
        : params.file

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileData, {
            contentType: params.contentType,
            upsert: false,
        })

    if (error) {
        throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

    return publicUrl
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    const supabase = createClient()

    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    const filePath = pathParts[1]

    if (!filePath) {
        throw new Error('Invalid file URL')
    }

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

    if (error) {
        throw new Error(`Delete failed: ${error.message}`)
    }
}

/**
 * Generate a signed URL for temporary access (default 1 hour)
 */
export async function generateSignedUrl(
    fileUrl: string,
    expiresIn: number = 3600
): Promise<string> {
    const supabase = createClient()

    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    const filePath = pathParts[1]

    if (!filePath) {
        throw new Error('Invalid file URL')
    }

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn)

    if (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`)
    }

    return data.signedUrl
}

/**
 * Get public URL for a file (if bucket is public)
 */
export function getPublicUrl(filePath: string): string {
    const supabase = createClient()

    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

    return data.publicUrl
}
