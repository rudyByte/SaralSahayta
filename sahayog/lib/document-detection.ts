import { extractTextFromImage } from './document-intelligence';

interface DetectionResult {
    detectedType: string | null;
    confidence: number;
    suggestedDocumentCode: string | null;
}

/**
 * Detects document type based on OCR text keywords
 */
export async function detectDocumentType(buffer: Buffer): Promise<DetectionResult> {
    const text = await extractTextFromImage(buffer);
    const lowercaseText = text.toLowerCase();

    const detectionRules = [
        {
            keywords: ['aadhaar', 'uidai', 'unique identification', 'government of india'],
            documentCode: 'AADHAAR',
            confidence: 0.9,
        },
        {
            keywords: ['permanent account number', 'income tax department', 'pan card', 'taxpayer'],
            documentCode: 'PAN',
            confidence: 0.85,
        },
        {
            keywords: ['income certificate', 'tehsildar', 'annual income', 'revenue department'],
            documentCode: 'INCOME_CERT',
            confidence: 0.8,
        },
        {
            keywords: ['caste certificate', 'scheduled caste', 'scheduled tribe', 'obc', 'social justice'],
            documentCode: 'CASTE_CERT',
            confidence: 0.8,
        },
        {
            keywords: ['domicile certificate', 'resident of', 'native of', 'bonafide'],
            documentCode: 'DOMICILE',
            confidence: 0.75,
        },
        {
            keywords: ['ration card', 'food security', 'public distribution', 'department of food'],
            documentCode: 'RATION_CARD',
            confidence: 0.8,
        }
    ];

    let bestMatch = { code: null as string | null, confidence: 0 };

    for (const rule of detectionRules) {
        const matches = rule.keywords.filter(kw => lowercaseText.includes(kw));
        if (matches.length >= 1) {
            const matchConfidence = rule.confidence * (matches.length / rule.keywords.length + 0.5);
            if (matchConfidence > bestMatch.confidence) {
                bestMatch = { code: rule.documentCode, confidence: Math.min(0.99, matchConfidence) };
            }
        }
    }

    return {
        detectedType: bestMatch.code,
        confidence: bestMatch.confidence,
        suggestedDocumentCode: bestMatch.code,
    };
}
