/**
 * Client-side OCR utility using Tesseract.js
 * Runs in browser - NO server cost, unlimited usage
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
    text: string;                // Raw extracted text
    confidence: number;          // 0-100 overall confidence
    words: Array<{
        text: string;
        confidence: number;
        bbox: {
            x0: number;
            y0: number;
            x1: number;
            y1: number;
        };
    }>;
    language: string;
    processingTime: number;      // Milliseconds
}

export interface OCRProgress {
    status: string;
    progress: number;            // 0-1
}

/**
 * Extract text from image using Tesseract OCR
 * @param imageFile - File object from input
 * @param language - Language code: 'eng', 'hin', 'eng+hin'
 * @param onProgress - Optional callback for progress updates
 * @returns OCRResult with extracted text and metadata
 */
export async function extractTextFromImage(
    imageFile: File | Blob,
    language: 'eng' | 'hin' | 'eng+hin' = 'eng',
    onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
    const startTime = Date.now();

    try {
        // Initialize Tesseract worker with reliable CDN (jsdelivr)
        // Note: Using the -simd version is usually faster and better supported in modern browsers
        const worker = await Tesseract.createWorker(language, 1, {
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
            corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-simd.js',
            langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-tessdata@1.0.1/',
            logger: (m) => {
                if (onProgress && m.status) {
                    onProgress({
                        status: m.status,
                        progress: m.progress || 0
                    });
                }
            }
        });

        // Perform OCR
        const { data } = await worker.recognize(imageFile);

        // Terminate worker to free memory
        await worker.terminate();

        const processingTime = Date.now() - startTime;

        return {
            text: data.text,
            confidence: data.confidence,
            words: (data as any).words?.map((word: any) => ({
                text: word.text,
                confidence: word.confidence,
                bbox: word.bbox
            })) || [],
            language,
            processingTime
        };

    } catch (error: any) {
        console.error('OCR Error Detail:', error);
        // Extract string message or stringify the error
        const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown OCR initialization error';
        throw new Error(`OCR failed: ${errorMessage}`);
    }
}

/**
 * Preprocess image for better OCR accuracy
 * - Resize if too large (>2000px)
 * - Convert to grayscale
 * - Increase contrast
 */
export async function preprocessImage(imageFile: File): Promise<File> {
    // Only preprocess images, not PDFs
    if (imageFile.type === 'application/pdf') {
        return imageFile;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Resize if larger than 2000px
            let width = img.width;
            let height = img.height;
            const maxDim = 2000;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = (height / width) * maxDim;
                    width = maxDim;
                } else {
                    width = (width / height) * maxDim;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image
            ctx!.drawImage(img, 0, 0, width, height);

            // Convert to grayscale and increase contrast
            const imageData = ctx!.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                // Grayscale
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                // Increase contrast
                const contrast = ((gray - 128) * 1.2) + 128;
                data[i] = data[i + 1] = data[i + 2] = contrast;
            }

            ctx!.putImageData(imageData, 0, 0);

            // Convert canvas to File
            canvas.toBlob((blob) => {
                if (blob) {
                    const processedFile = new File([blob], imageFile.name, {
                        type: 'image/jpeg'
                    });
                    resolve(processedFile);
                } else {
                    reject(new Error('Image preprocessing failed'));
                }
            }, 'image/jpeg', 0.9);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(imageFile);
    });
}

/**
 * Estimate OCR quality before processing
 * Returns score 0-100
 */
export async function estimateImageQuality(imageFile: File): Promise<{
    score: number;
    issues: string[];
    warnings: string[];
}> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check file size
    if (imageFile.size < 50000) { // Less than 50KB
        warnings.push('File size is small. Image may be low quality.');
        score -= 10;
    }

    if (imageFile.size > 10000000) { // Greater than 10MB
        warnings.push('File size is large. Upload may be slow.');
        score -= 5;
    }

    // Load image to check dimensions
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            // Check resolution
            if (img.width < 800 || img.height < 600) {
                issues.push('Image resolution too low. Minimum 800x600 required.');
                score -= 30;
            }

            // Check aspect ratio (documents are usually portrait or landscape)
            const aspectRatio = img.width / img.height;
            if (aspectRatio < 0.5 || aspectRatio > 2.5) {
                warnings.push('Unusual aspect ratio. Ensure entire document is visible.');
                score -= 10;
            }

            resolve({ score, issues, warnings });
        };

        img.onerror = () => {
            issues.push('Failed to load image');
            resolve({ score: 0, issues, warnings });
        };

        img.src = URL.createObjectURL(imageFile);
    });
}
