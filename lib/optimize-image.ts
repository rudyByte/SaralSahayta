import sharp from 'sharp';

/**
 * Optimizes an image file for storage
 * Reduces quality and converts to webp if it's a large image
 * SERVER-SIDE ONLY
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
