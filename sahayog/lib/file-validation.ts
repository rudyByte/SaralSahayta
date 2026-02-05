const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
}

export interface ValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validate file size, type, and extension
 */
export function validateFile(file: File): ValidationResult {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: 'File size must be less than 10MB'
        }
    }

    // Check file type
    if (!ALLOWED_TYPES[file.type]) {
        return {
            valid: false,
            error: 'Only PDF, JPEG, PNG, and WebP files are allowed'
        }
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ALLOWED_TYPES[file.type].includes(extension)) {
        return {
            valid: false,
            error: 'File extension does not match file type'
        }
    }

    return { valid: true }
}

/**
 * Optimize image before upload (resize and compress)
 * Only processes images, returns PDFs unchanged
 */
export async function optimizeImage(file: File): Promise<Buffer> {
    // Only optimize images, not PDFs
    if (!file.type.startsWith('image/')) {
        return Buffer.from(await file.arrayBuffer())
    }

    try {
        const sharp = (await import('sharp')).default
        const buffer = Buffer.from(await file.arrayBuffer())

        // Resize if larger than 2000px on any side, compress to 85% quality
        return await sharp(buffer)
            .resize(2000, 2000, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toBuffer()
    } catch (error) {
        console.error('Image optimization failed:', error)
        // Return original if optimization fails
        return Buffer.from(await file.arrayBuffer())
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
}

/**
 * Check if file is a PDF
 */
export function isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf'
}
