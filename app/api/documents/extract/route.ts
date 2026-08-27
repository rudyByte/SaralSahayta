import { NextRequest, NextResponse } from 'next/server';
import { extractDataWithAI } from '@/lib/ocr/ai-extractor';
import { createClient } from '@/lib/supabase-server';
import { classifyDocument } from '@/lib/documents/groq-document-classifier';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse JSON Data
        const { ocrText, documentType } = await request.json();

        if (!ocrText) {
            return NextResponse.json({ error: 'No OCR text provided' }, { status: 400 });
        }

        // 3. Look up actual document name from code
        const { data: document } = await supabase
            .from('documents')
            .select('document_name')
            .eq('document_code', documentType)
            .single();

        const expectedDocumentName = document?.document_name || documentType;

        // 4. Strict Validation BEFORE Extraction
        const classification = await classifyDocument(ocrText, expectedDocumentName);
        
        console.log(`\n--- DOCUMENT CLASSIFICATION ---`);
        console.log(`Expected: ${expectedDocumentName}`);
        console.log(`Detected: ${classification.detectedType}`);
        console.log(`Confidence: ${classification.confidence}%`);
        
        if (classification.indicators && classification.indicators.length > 0) {
            console.log(`Matched Indicators:`);
            classification.indicators.forEach(ind => console.log(`✓ ${ind}`));
        } else {
            console.log(`Matched Indicators: None`);
        }
        
        console.log(`Reason: ${classification.reason}`);
        console.log(`Diagnostics:`, JSON.stringify(classification.diagnostics));
        console.log(`Validation: ${classification.matched ? 'Passed' : 'Failed'}`);
        console.log(`-------------------------------\n`);

        // Reject ONLY if it is distinctly detected as another known document type (e.g., PAN Card uploaded under Aadhaar)
        const isDistinctMismatch = !classification.matched && 
            ['PAN Card', 'Passport', 'Driving Licence', 'Voter ID Card'].includes(classification.detectedType);

        if (isDistinctMismatch) {
            return NextResponse.json({
                success: false,
                error: "Wrong document uploaded.",
                expected: expectedDocumentName,
                detected: classification.detectedType,
                classification,
                diagnostics: classification.diagnostics,
                message: `You have uploaded a ${classification.detectedType} in the ${expectedDocumentName} upload section. Please upload your ${expectedDocumentName}.`
            }, { status: 400 });
        }

        // 5. Extract Data with AI Text (Groq Text Model instead of Vision)
        console.log(`[AI Extraction] Processing ${expectedDocumentName} from OCR text for user ${user.id}...`);
        const result = await extractDataWithAI(ocrText, expectedDocumentName);

        return NextResponse.json({
            success: true,
            extractedData: result.data,
            classification,
            diagnostics: classification.diagnostics,
            confidence: result.confidence,
            text: result.text || ocrText
        });

    } catch (error: any) {
        console.error('[AI Extraction API] Error:', error);
        return NextResponse.json({ 
            error: 'AI Extraction failed',
            message: error.message 
        }, { status: 500 });
    }
}
