import sharp from 'sharp';
import Tesseract from 'tesseract.js';

interface QualityCheckResult {
    passed: boolean;
    score: number; // 0-100
    issues: string[];
    warnings: string[];
}

/**
 * Performs server-side document quality checks using Sharp
 */
export async function checkDocumentQuality(buffer: Buffer, fileType: string): Promise<QualityCheckResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // For images only
    if (fileType.startsWith('image/')) {
        try {
            const metadata = await sharp(buffer).metadata();
            const stats = await sharp(buffer).stats();

            // Check 1: Minimum resolution
            if ((metadata.width || 0) < 800 || (metadata.height || 0) < 600) {
                issues.push('Image resolution too low. Minimum 800x600 pixels required.');
                score -= 40;
            }

            // Check 2: File size (buffer length)
            if (buffer.length < 51200) { // 50KB
                warnings.push('File size is very small. Ensure document is clearly visible.');
                score -= 10;
            }

            // Check 3: Blur detection using variance (stdev^2)
            const stdev = stats.channels[0].stdev;
            const variance = stdev * stdev;
            if (variance < 100) {
                warnings.push('Image appears blurry. Please upload a clearer photo.');
                score -= 20;
            }

            // Check 4: Brightness/Exposure
            const mean = stats.channels[0].mean;
            if (mean < 40) {
                warnings.push('Image is too dark. Please use better lighting.');
                score -= 15;
            } else if (mean > 220) {
                warnings.push('Image is too bright/washed out.');
                score -= 15;
            }

        } catch (error) {
            console.error('Sharp processing error:', error);
            issues.push('Failed to process image for quality check.');
            score = 0;
        }
    }

    // For PDFs - Basic size check for now
    if (fileType === 'application/pdf') {
        if (buffer.length < 10240) { // 10KB
            warnings.push('PDF file seems unusually small.');
            score -= 20;
        }
    }

    const passed = score >= 50 && issues.length === 0;

    return {
        passed,
        score: Math.max(0, score),
        issues,
        warnings
    };
}

/**
 * Extracts text from image using Tesseract OCR
 */
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
    try {
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        return text;
    } catch (error) {
        console.error('OCR error:', error);
        return '';
    }
}
