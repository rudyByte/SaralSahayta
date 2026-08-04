import { generateText } from '@/lib/ai/groq';

export interface ClassificationResult {
  detectedType: string;
  matched: boolean;
  confidence: number;
  reason: string;
  indicators?: string[];
}

export async function classifyDocument(ocrText: string, expectedDocument: string): Promise<ClassificationResult> {
  const prompt = `You are a highly accurate document classification AI.
Your task is to classify the provided OCR text and verify if it matches the EXPECTED document type.

EXPECTED DOCUMENT TYPE: "${expectedDocument}"

CRITICAL CLASSIFICATION RULES:
1. Use multiple indicators to identify the document. Do not rely on only one keyword.
2. For Aadhaar Card, detect if ANY combination of these is found: Aadhaar, Aadhar, Unique Identification Authority of India, UIDAI, Government of India, 12-digit Aadhaar number, or Hindi text (आधार).
3. Validation MUST be case-insensitive and support spelling variations (e.g. aadhar vs aadhaar).
4. Do not reject a document simply because one keyword is missing. If at least 2-3 valid indicators are detected, classify the document as the expected type with high confidence.
5. Only reject (set matched: false) if confidence is genuinely low (< 50%) or another distinct document type (PAN, Passport, Driving Licence, etc.) is detected with much higher confidence.

Return ONLY a valid JSON object. Do NOT include markdown blocks.

Expected JSON format:
{
  "detectedType": "Aadhaar Card",
  "confidence": 97,
  "matched": true,
  "matchedIndicators": ["UIDAI", "Government of India", "12-digit Aadhaar Number"],
  "reason": "Detected Aadhaar based on UIDAI, 12-digit Aadhaar number, and Government of India seal."
}

OCR Text to classify:
${ocrText}`;

  try {
    const responseText = await generateText(prompt);
    
    // Clean potential markdown blocks
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);
    
    return {
      detectedType: parsedData.detectedType || 'UNKNOWN',
      matched: parsedData.matched === true,
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0,
      reason: parsedData.reason || 'No reason provided.',
      indicators: parsedData.matchedIndicators || []
    };
  } catch (error) {
    console.error('Document classification failed:', error);
    
    return {
      detectedType: 'UNKNOWN',
      matched: false,
      confidence: 0,
      reason: 'Unable to classify document.'
    };
  }
}
