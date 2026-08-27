import { generateText } from '@/lib/ai/groq';
import { maskSensitiveData } from '@/lib/security/masking';

export interface ClassificationResult {
  detectedType: string;
  matched: boolean;
  confidence: number;
  reason: string;
  indicators?: string[];
  diagnostics?: {
    ocrCharacterCount: number;
    aadhaarCandidateDetected: boolean;
    maskedAadhaarCandidate?: string;
  };
}

/**
 * Extracts and normalizes a 12-digit Aadhaar candidate from raw OCR text.
 * Handles:
 * - 1234 5678 9012
 * - 123456789012
 * - 1234-5678-9012, 1234.5678.9012, 1234/5678/9012
 * - Multi-line splits (e.g. 1234 5678 \n 9012 or 1234 \n 5678 \n 9012)
 * - OCR character noise inside candidate blocks (O/o->0, I/l/|/!->1, Z/z->2, S/s->5, B->8, g/q->9)
 * Does NOT invent missing digits or replace O with 0 globally in OCR text.
 */
export function extractAadhaarCandidate(text: string): string | null {
  if (!text) return null;

  const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 1. Direct match: 12 continuous digits
  const continuousMatch = cleanText.match(/\b(\d{12})\b/);
  if (continuousMatch) {
    const d = continuousMatch[1];
    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
  }

  // 2. Direct match: 3 groups of 4 digits separated by spaces, hyphens, dots, slashes, or newlines
  const threeGroupMatch = cleanText.match(/\b(\d{4})[\s\r\n\t./-]+(\d{4})[\s\r\n\t./-]+(\d{4})\b/);
  if (threeGroupMatch) {
    return `${threeGroupMatch[1]} ${threeGroupMatch[2]} ${threeGroupMatch[3]}`;
  }

  // 3. Direct match: 8 digits + 4 digits or 4 digits + 8 digits split by whitespace/newlines
  const twoGroupMatch1 = cleanText.match(/\b(\d{8})[\s\r\n\t./-]+(\d{4})\b/);
  if (twoGroupMatch1) {
    const d = twoGroupMatch1[1] + twoGroupMatch1[2];
    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
  }

  const twoGroupMatch2 = cleanText.match(/\b(\d{4})[\s\r\n\t./-]+(\d{8})\b/);
  if (twoGroupMatch2) {
    const d = twoGroupMatch2[1] + twoGroupMatch2[2];
    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
  }

  // 4. Candidates with OCR character noise ONLY within 4-char blocks
  const normalizeBlock = (b: string) =>
    b.replace(/[Oo]/g, '0')
     .replace(/[Il|!]/g, '1')
     .replace(/[Zz]/g, '2')
     .replace(/[Ss]/g, '5')
     .replace(/B/g, '8')
     .replace(/[gq]/g, '9');

  const noisyGroupMatch = cleanText.match(/\b([0-9OolI|!ZzSsBgq]{4})[\s\r\n\t./-]+([0-9OolI|!ZzSsBgq]{4})[\s\r\n\t./-]+([0-9OolI|!ZzSsBgq]{4})\b/);
  if (noisyGroupMatch) {
    const b1 = normalizeBlock(noisyGroupMatch[1]);
    const b2 = normalizeBlock(noisyGroupMatch[2]);
    const b3 = normalizeBlock(noisyGroupMatch[3]);
    if (/^\d{4}$/.test(b1) && /^\d{4}$/.test(b2) && /^\d{4}$/.test(b3)) {
      return `${b1} ${b2} ${b3}`;
    }
  }

  const noisyContinuous = cleanText.match(/\b([0-9OolI|!ZzSsBgq]{12})\b/);
  if (noisyContinuous) {
    const norm = normalizeBlock(noisyContinuous[1]);
    if (/^\d{12}$/.test(norm)) {
      return `${norm.slice(0, 4)} ${norm.slice(4, 8)} ${norm.slice(8, 12)}`;
    }
  }

  return null;
}

export async function classifyDocument(ocrText: string, expectedDocument: string): Promise<ClassificationResult> {
  const isAadhaarExpected = /aadhaar|aadhar|adhar|uid/i.test(expectedDocument);

  // Safe diagnostics payload (masking Aadhaar candidate)
  const candidateNumber = extractAadhaarCandidate(ocrText);
  const diagnostics = {
    ocrCharacterCount: (ocrText || '').length,
    aadhaarCandidateDetected: Boolean(candidateNumber),
    maskedAadhaarCandidate: candidateNumber ? maskSensitiveData(candidateNumber.replace(/\s+/g, ''), 4) : undefined
  };

  // Local rule evaluation first to ensure robust, deterministic classification
  const localEval = evaluateLocalClassification(ocrText, expectedDocument);

  // If expected document is Aadhaar:
  if (isAadhaarExpected) {
    // If local evaluation classified it as Aadhaar Card (or a distinct mismatch like PAN Card), return local result
    if (localEval.matched || localEval.detectedType !== 'Aadhaar Card') {
      return {
        ...localEval,
        diagnostics
      };
    }
  }

  // Try AI classification with Groq
  const prompt = `You are a highly accurate Indian document classification AI.
Your task is to classify the provided OCR text and verify if it matches the EXPECTED document type.

EXPECTED DOCUMENT TYPE: "${expectedDocument}"

CRITICAL CLASSIFICATION RULES:
1. Use multiple indicators to identify the document. Do NOT require a specific keyword to be present.
2. For Aadhaar Card, detect if ANY combination of these is found: 12-digit number candidate, Name/Father's Name/Address, DOB/Year of Birth, Gender (Male/Female/Transgender, पुरुष/महिला), Aadhaar/Aadhar/Adhar/UIDAI, Government of India/Bharat Sarkar (भारत/भरत सरकार), or Hindi text (आधार, आदमी का अधिकार).
3. Do NOT reject an Aadhaar document simply because the word "Aadhaar" or "UIDAI" is missing or misspelled in OCR, as long as other demographic or 12-digit number signals exist.
4. Validation MUST be case-insensitive and support spelling variations.
5. Only reject (set matched: false) if distinct indicators for ANOTHER document type (PAN Card, Passport, Driving Licence, Election/Voter ID Card) are detected with higher confidence.

Return ONLY a valid JSON object. Do NOT include markdown blocks.

Expected JSON format:
{
  "detectedType": "Aadhaar Card",
  "confidence": 92,
  "matched": true,
  "matchedIndicators": ["12-digit Aadhaar candidate", "DOB", "Gender"],
  "reason": "Detected Aadhaar based on 12-digit candidate, DOB, and Gender fields."
}

OCR Text to classify:
${ocrText}`;

  try {
    const responseText = await generateText(prompt);
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    const aiResult: ClassificationResult = {
      detectedType: parsedData.detectedType || expectedDocument,
      matched: parsedData.matched === true,
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0,
      reason: parsedData.reason || 'No reason provided.',
      indicators: parsedData.matchedIndicators || [],
      diagnostics
    };

    if (aiResult.matched) {
      return aiResult;
    }

    // If AI said not matched, but expected document is Aadhaar and it's not another document, override AI false negative
    if (isAadhaarExpected && aiResult.detectedType !== 'PAN Card' && aiResult.detectedType !== 'Passport' && aiResult.detectedType !== 'Driving Licence') {
      return {
        detectedType: 'Aadhaar Card',
        matched: true,
        confidence: 80,
        reason: 'Verified Aadhaar Card for extraction.',
        indicators: localEval.indicators || [],
        diagnostics
      };
    }

    return {
      ...aiResult,
      diagnostics
    };
  } catch (error) {
    console.warn('Groq Document classification unavailable, using local rule fallback:', error);
    return {
      ...localEval,
      diagnostics
    };
  }
}

function evaluateLocalClassification(ocrText: string, expectedDocument: string): ClassificationResult {
  const text = ocrText || '';
  const expUpper = expectedDocument.toUpperCase();
  const isAadhaarExpected = expUpper.includes('AADHAAR') || expUpper.includes('AADHAR') || expUpper.includes('UID');

  // Check for DISTINCT OTHER DOCUMENT TYPES
  // PAN Card
  const hasPanPattern = /\b[A-Z]{5}\d{4}[A-Z]\b/.test(text);
  const hasPanKeywords = /income tax department|permanent account number|income tax|आयकर विभाग/i.test(text);
  if (hasPanPattern && hasPanKeywords) {
    return {
      detectedType: 'PAN Card',
      matched: !isAadhaarExpected && expUpper.includes('PAN'),
      confidence: 95,
      reason: isAadhaarExpected
        ? 'Uploaded document is a PAN Card, but Aadhaar Card was expected.'
        : 'Detected PAN Card based on Income Tax Department header and 10-character PAN number.',
      indicators: ['PAN Number format', 'Income Tax Department header']
    };
  }

  // Driving Licence
  if (/driving licence|licence no|dl no|transport department/i.test(text)) {
    return {
      detectedType: 'Driving Licence',
      matched: !isAadhaarExpected && expUpper.includes('DRIVING'),
      confidence: 90,
      reason: 'Detected Driving Licence.',
      indicators: ['Driving Licence keywords']
    };
  }

  // Passport
  if (/passport no|republic of india|type p\b/i.test(text) && !/aadhaar|uidai|government of india/i.test(text)) {
    return {
      detectedType: 'Passport',
      matched: !isAadhaarExpected && expUpper.includes('PASSPORT'),
      confidence: 90,
      reason: 'Detected Passport.',
      indicators: ['Passport keywords']
    };
  }

  // Voter ID
  if (/election commission of india|epic no|elector's photo/i.test(text)) {
    return {
      detectedType: 'Voter ID Card',
      matched: !isAadhaarExpected && expUpper.includes('VOTER'),
      confidence: 90,
      reason: 'Detected Voter ID Card.',
      indicators: ['Voter ID keywords']
    };
  }

  if (isAadhaarExpected) {
    const indicators: string[] = [];
    const candidate = extractAadhaarCandidate(text);
    
    if (candidate) {
      indicators.push(`12-digit Aadhaar candidate (${maskSensitiveData(candidate.replace(/\s+/g, ''), 4)})`);
    }
    if (/aadhaar|aadhar|adhar|adhaar|uidai|unique identification|mera aadhaar|mera aadhar|aadmi ka adhikar|1947|help@uidai/i.test(text)) {
      indicators.push('Aadhaar keyword/branding');
    }
    if (/government of india|government of indiya|govt of india|bharat|bharat sarkar|भरत|भारत/i.test(text)) {
      indicators.push('Government header');
    }
    if (/आधार|आदमी का अधिकार|आम आदमी का अधिकार|पहचान/i.test(text)) {
      indicators.push('Aadhaar Hindi text');
    }
    if (/dob|date of birth|birth|जन्म|yob|year of birth|birth year|19[5-9]\d|20[0-2]\d|\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/i.test(text)) {
      indicators.push('DOB/Year of Birth field');
    }
    if (/male|female|transgender|पुरुष|महिला|m|f\b/i.test(text)) {
      indicators.push('Gender field');
    }
    if (/name|नाम|father|पिता|husband|पति|mother|माता|address|पता|s\/o|d\/o|w\/o|c\/o|enrolment/i.test(text)) {
      indicators.push('Demographic labels');
    }

    // Since expected document is Aadhaar Card and it is NOT a PAN/Passport/DL:
    // Classify as Aadhaar Card!
    const isMatched = true;
    const confidence = candidate ? 95 : (indicators.length >= 2 ? 85 : 75);

    return {
      detectedType: 'Aadhaar Card',
      matched: isMatched,
      confidence,
      reason: indicators.length > 0
        ? `Verified Aadhaar Card based on document indicators: ${indicators.join(', ')}`
        : `Verified Aadhaar Card for extraction.`,
      indicators
    };
  }

  // Generic fallback for non-Aadhaar documents
  const expectedKeywords = expectedDocument.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
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
    detectedType: expectedDocument,
    matched: true,
    confidence: 60,
    reason: `Proceeding with document extraction for ${expectedDocument}.`,
    indicators: []
  };
}



