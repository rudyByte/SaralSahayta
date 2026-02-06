import sharp from 'sharp';

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
];

/**
 * Validates file size and mime type
 */
export function validateFile(file: File): FileValidationResult {
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed' };
    }

    return { valid: true };
}

/**
 * Optimizes an image file for storage
 * Reduces quality and converts to webp if it's a large image
 */
export async function optimizeImage(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If it's an image, optimize it
    if (file.type.startsWith('image/')) {
        return await sharp(buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer();
    }

    return buffer;
}
