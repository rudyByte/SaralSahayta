import { analyzeImage } from '@/lib/ai/groq';

export interface ExtractedDocumentData {
    name?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    fatherName?: string;
    annualIncome?: number;
    issueDate?: string;
    certificateNumber?: string;
}

export async function checkImageQualityWithAI(imageBase64: string): Promise<{ isGoodQuality: boolean; reason: string }> {
    try {
        const prompt = "You are an image quality inspector. Check if the provided document image is blurred, cropped, too dark, rotated, or unreadable. Return a JSON object exactly with these two fields: 'isGoodQuality' (boolean) and 'reason' (string explaining why if it's bad, or 'Image is clear' if good).";

        const responseText = await analyzeImage(prompt, imageBase64);

        const parsed = JSON.parse(responseText);
        return {
            isGoodQuality: parsed.isGoodQuality ?? true,
            reason: parsed.reason || 'Image is clear'
        };
    } catch (e: any) {
        console.warn("Quality check failed, proceeding anyway", e);
        return { isGoodQuality: true, reason: '' };
    }
}

/**
 * AI-powered document extraction using Groq Vision
 */
export async function extractDataWithAI(
    ocrText: string,
    documentType: string
): Promise<{ data: ExtractedDocumentData; confidence: number; text?: string }> {
    try {
        const finalPrompt = getPromptForDocument(documentType) + "\n\nOCR TEXT TO PARSE:\n" + ocrText;
        
        const { generateText } = await import('@/lib/ai/groq');
        const responseText = await generateText(finalPrompt);
        // Clean markdown backticks if present
        const cleanedText = responseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        return {
            data: parsed,
            confidence: 95,
            text: responseText
        };
    } catch (error: any) {
        console.warn("Groq AI Extraction unavailable or failed, using local rule fallback:", error.message || error);
        
        const fallbackData = fallbackLocalExtractor(ocrText, documentType);

        return {
            data: fallbackData,
            confidence: 85,
            text: ocrText
        };
    }
}

function fallbackLocalExtractor(
    ocrText: string,
    documentType: string
): ExtractedDocumentData {
    const data: ExtractedDocumentData = {};
    const text = ocrText || '';

    // Aadhaar number match (12 digits, optional spaces or dashes)
    const aadhaarMatch = text.match(/\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/);
    if (aadhaarMatch) {
        data.aadhaarNumber = aadhaarMatch[1];
    }

    // Date of Birth match (DD-MM-YYYY or DD/MM/YYYY)
    const dobMatch = text.match(/(?:DOB|Date of Birth|जन्म\s*तारीख)?\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})/i);
    if (dobMatch) {
        data.dateOfBirth = dobMatch[1];
    }

    // Gender match
    if (/\b(?:Male|MALE|पुरुष)\b/i.test(text)) {
        data.gender = 'Male';
    } else if (/\b(?:Female|FEMALE|महिला)\b/i.test(text)) {
        data.gender = 'Female';
    } else if (/\b(?:Transgender|TG)\b/i.test(text)) {
        data.gender = 'Other';
    }

    // Name match: e.g. "Name: john loyal" or "नाम / Name: john loyal"
    const nameMatch = text.match(/(?:Name|नाम|नाम\s*\/\s*Name)\s*[:\-]?\s*([A-Za-z\s]+?)(?=\r|\n|DOB|जन्म|Male|Female|\d{4}|$)/i);
    if (nameMatch && nameMatch[1].trim()) {
        const rawName = nameMatch[1].trim();
        if (!/aadhaar|adhikar|government|indya|india|bharat|sarkar/i.test(rawName)) {
            data.name = rawName;
        }
    }

    // PAN match
    const panMatch = text.match(/\b([A-Z]{5}\d{4}[A-Z]{1})\b/);
    if (panMatch) {
        data.panNumber = panMatch[1];
    }

    return data;
}

function getPromptForDocument(type: string): string {
    const basePrompt = "You are a professional Indian document parser. " +
        "Extract fields from the text into a JSON object. " +
        "CRITICAL: DO NOT extract any tagline, slogan, or footer text. " +
        "Example of WHAT NOT TO EXTRACT: 'Aadhaar - Aadmi Ka Adhikar', 'Mera Aadhaar Meri Pehchan', etc. " +
        "The NAME is usually located near the photo or at the top center. " +
        "CRITICAL RULES FOR JSON OUTPUT:\n" +
        "1. All JSON fields MUST be primitive values (strings, numbers, or null).\n" +
        "2. NEVER return nested objects or arrays. For example, the 'name' field must ALWAYS be a simple string (e.g., 'name': 'Aditi Singh'), NEVER an object like { english: '...', hindi: '...' }.\n" +
        "3. If a name or text appears in multiple languages, extract ONLY the English version.\n" +
        "Only return valid JSON. If a field is missing, use null.";

    switch (type.toUpperCase()) {
        case 'AADHAAR':
        case 'AADHAR':
            return `${basePrompt} Return JSON: { "name": string, "aadhaarNumber": string, "dateOfBirth": string, "gender": string, "address": string }. Note: Aadhaar name is NOT the tagline at the bottom.`;
        case 'PAN':
            return `${basePrompt} Return JSON: { "name": string, "panNumber": string, "fatherName": string, "dateOfBirth": string }`;
        default:
            return `${basePrompt} Return a JSON object with all identifying information found.`;
    }
}
