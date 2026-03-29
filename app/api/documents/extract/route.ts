import { NextRequest, NextResponse } from 'next/server';
import { extractDataWithAI } from '@/lib/ocr/ai-extractor';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Form Data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentType = (formData.get('documentType') as string) || 'UNKNOWN';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 3. Convert Image to Base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        // 4. Extract Data with AI (Groq Vision)
        console.log(`[AI Extraction] Processing ${documentType} for user ${user.id}...`);
        const result = await extractDataWithAI(base64Image, documentType);

        return NextResponse.json({
            success: true,
            extractedData: result.data,
            confidence: result.confidence,
            text: result.text
        });

    } catch (error: any) {
        console.error('[AI Extraction API] Error:', error);
        return NextResponse.json({ 
            error: 'AI Extraction failed',
            message: error.message 
        }, { status: 500 });
    }
}
