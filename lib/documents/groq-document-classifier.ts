import { generateText } from '@/lib/ai/groq';

export interface ClassificationResult {
  detectedType: string;
  matched: boolean;
  confidence: number;
  reason: string;
}

export async function classifyDocument(ocrText: string, expectedDocument: string): Promise<ClassificationResult> {
  const prompt = `You are a highly accurate document classification AI.
Your task is to classify the provided OCR text from a document into exactly one of the following supported document types:

Supported document types:
- Aadhaar Card
- PAN Card
- Voter ID
- Birth Certificate
- Income Certificate
- Bank Passbook
- Ration Card
- Driving Licence
- Passport
- Disability Certificate
- Caste Certificate
- Domicile Certificate
- e-Shram Card
- Vaccination Card

CRITICAL CLASSIFICATION RULES:
1. You must identify the document using a combination of:
   - Document title
   - Government department
   - Unique document number format
   - Layout indicators
   - Official issuing authority
   - Context of the document
2. You must NEVER classify based on only one keyword. For example, "Government of India" must NOT automatically mean Aadhaar Card.
3. Return a high confidence score ONLY if the document type is strongly identified using multiple signals.

You must NOT output a "matched" field. I will determine that myself.

Return ONLY a valid JSON object. Do NOT include markdown blocks, code formatting, or any extra text.

Expected JSON format:
{
  "detectedType": "Aadhaar Card",
  "confidence": 97,
  "reason": "Detected Aadhaar based on UIDAI, 12-digit Aadhaar number, and Government of India seal."
}

OCR Text to classify:
${ocrText}`;

  try {
    const responseText = await generateText(prompt);
    
    // Clean potential markdown blocks if the AI still returns them
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanedText);
    const detected = parsedData.detectedType || 'UNKNOWN';
    
    const normExpected = (expectedDocument || '').trim().toLowerCase();
    const normDetected = detected.trim().toLowerCase();
    
    let isMatched = false;
    if (detected !== 'UNKNOWN' && normExpected) {
      isMatched = normDetected === normExpected || 
                  normDetected.includes(normExpected) ||
                  normExpected.includes(normDetected);
    }
    
    return {
      detectedType: detected,
      matched: isMatched,
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0,
      reason: parsedData.reason || 'No reason provided.'
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
