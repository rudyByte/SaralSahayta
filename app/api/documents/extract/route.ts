import { NextRequest, NextResponse } from 'next/server';
import { extractDataWithAI, checkImageQualityWithAI } from '@/lib/ocr/ai-extractor';
import { createClient } from '@/lib/supabase-server';

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
        const { classifyDocument } = await import('@/lib/documents/groq-document-classifier');
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
        console.log(`Validation: ${classification.matched ? 'Passed' : 'Failed'}`);
        console.log(`-------------------------------\n`);

        if (!classification.matched) {
            return NextResponse.json({
                success: false,
                error: "Wrong document uploaded.",
                expected: expectedDocumentName,
                detected: classification.detectedType,
                classification,
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
