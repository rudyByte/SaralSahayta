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

/**
 * Client-side quality check for images
 * Checks resolution and provides feedback before upload
 */
export async function checkImageQualityClient(file: File): Promise<{
    passed: boolean;
    score: number;
    issues: string[];
    warnings: string[];
}> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const issues: string[] = [];
            const warnings: string[] = [];
            let score = 100;

            // Resolution check
            if (img.width < 800 || img.height < 800) {
                issues.push('Image resolution is low. Clear text might be hard to read.');
                score -= 30;
            }

            // Aspect ratio check (Documents are usually portrait or landscape)
            const ratio = img.width / img.height;
            if (ratio > 3 || ratio < 0.3) {
                warnings.push('Image aspect ratio looks unusual for a document.');
                score -= 10;
            }

            // File size check as quality proxy for client-side
            if (file.size < 100 * 1024) { // < 100KB
                warnings.push('Small file size might indicate high compression or low detail.');
                score -= 10;
            }

            URL.revokeObjectURL(img.src);
            resolve({
                passed: score >= 60,
                score: Math.max(0, score),
                issues,
                warnings
            });
        };

        img.onerror = () => {
            resolve({
                passed: false,
                score: 0,
                issues: ['Failed to process image for quality check'],
                warnings: []
            });
        };
    });
}
