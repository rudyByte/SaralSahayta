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
2. For Aadhaar Card (including demo/sample cards), detect if ANY combination of these is found: Aadhaar, Aadhar, Unique Identification Authority of India, UIDAI, Government of India, Government of Indiya, Bharat Sarkar (भारत/भरत सरकार), 12-digit Aadhaar number (e.g. 1100 2200 3300), or Hindi text (आधार, आदमी का अधिकार).
3. Validation MUST be case-insensitive and support spelling variations (e.g. aadhar vs aadhaar vs adhar, indiya vs india).
4. Do not reject a document simply because one keyword is missing or misspelled in a demo card. If at least 2 valid indicators are detected, classify the document as the expected type with high confidence.
5. Only reject (set matched: false) if confidence is genuinely low (< 50%) or another distinct document type (PAN, Passport, Driving Licence, etc.) is detected with much higher confidence.

Return ONLY a valid JSON object. Do NOT include markdown blocks.

Expected JSON format:
{
  "detectedType": "Aadhaar Card",
  "confidence": 97,
  "matched": true,
  "matchedIndicators": ["UIDAI", "Government of India", "12-digit Aadhaar Number"],
  "reason": "Detected Aadhaar based on UIDAI, 12-digit Aadhaar number, and Government header."
}

OCR Text to classify:
${ocrText}`;

  try {
    const responseText = await generateText(prompt);
    
    // Clean potential markdown blocks
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);
    
    const result: ClassificationResult = {
      detectedType: parsedData.detectedType || expectedDocument,
      matched: parsedData.matched === true,
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0,
      reason: parsedData.reason || 'No reason provided.',
      indicators: parsedData.matchedIndicators || []
    };

    if (result.matched) {
      return result;
    }

    // If AI did not match, try local fallback before giving up
    return fallbackLocalClassifier(ocrText, expectedDocument);
  } catch (error) {
    console.warn('Groq Document classification unavailable, using local rule fallback:', error);
    return fallbackLocalClassifier(ocrText, expectedDocument);
  }
}

function fallbackLocalClassifier(ocrText: string, expectedDocument: string): ClassificationResult {
  const textLower = ocrText.toLowerCase();
  const expUpper = expectedDocument.toUpperCase();

  const isAadhaarExpected = expUpper.includes('AADHAAR') || expUpper.includes('AADHAR') || expUpper.includes('UID');

  if (isAadhaarExpected) {
    const indicators: string[] = [];
    
    if (/\b\d{4}\s?\d{4}\s?\d{4}\b/.test(ocrText)) {
      indicators.push('12-digit Aadhaar Number format');
    }
    if (/aadhaar|aadhar|adhar|uidai/i.test(ocrText)) {
      indicators.push('Aadhaar keyword');
    }
    if (/government of india|government of indiya|govt of india|bharat|bharat sarkar|भरत|भारत/i.test(ocrText)) {
      indicators.push('Government header');
    }
    if (/आधार|आदमी का अधिकार|आम आदमी का अधिकार/i.test(ocrText)) {
      indicators.push('Aadhaar Hindi text');
    }
    if (/dob|birth|जन्म|male|female|पुरुष|महिला|name|नाम/i.test(ocrText)) {
      indicators.push('Demographic fields (DOB/Gender/Name)');
    }

    if (indicators.length >= 2 || (indicators.length >= 1 && /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(ocrText))) {
      return {
        detectedType: 'Aadhaar Card',
        matched: true,
        confidence: 90,
        reason: `Detected Aadhaar Card based on indicators: ${indicators.join(', ')}`,
        indicators
      };
    }
  }

  // Generic fallback: check expected keywords
  const expectedKeywords = expectedDocument.toLowerCase().split(/\s+/);
  const matchCount = expectedKeywords.filter(kw => kw.length > 2 && textLower.includes(kw)).length;

  if (matchCount > 0) {
    return {
      detectedType: expectedDocument,
      matched: true,
      confidence: 75,
      reason: `Detected keywords matching ${expectedDocument}`,
      indicators: [`Matched ${matchCount} expected keywords`]
    };
  }

  return {
    detectedType: 'UNKNOWN',
    matched: false,
    confidence: 0,
    reason: `Could not verify document as ${expectedDocument}.`,
    indicators: []
  };
}

