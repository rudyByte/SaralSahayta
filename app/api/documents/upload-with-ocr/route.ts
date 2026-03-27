import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { uploadFileToSupabase } from '@/lib/supabase-storage';
import { calculateExpiryDate, getDocumentExpiryStatus } from '@/lib/documents/expiry-calculator';
import { recalculateSchemeMatches } from '@/lib/matching/recalculate-on-profile-update';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentCode = formData.get('documentCode') as string;
        const ocrDataStr = formData.get('ocrData') as string;

        if (!file || !documentCode) {
            return NextResponse.json(
                { error: 'File and documentCode are required' },
                { status: 400 }
            );
        }

        // Parse OCR data
        let ocrData = null;
        try {
            ocrData = JSON.parse(ocrDataStr);
        } catch {
            // OCR data is optional
        }

        // Get document ID from code
        const { data: document } = await supabase
            .from('documents')
            .select('id, document_name')
            .eq('document_code', documentCode)
            .single();

        if (!document) {
            return NextResponse.json(
                { error: 'Invalid document code' },
                { status: 400 }
            );
        }

        // Calculate Expiry Date if issue date is available in OCR data
        let expiryDate: Date | null = null;
        const issueDate = ocrData?.extractedData?.issueDate;

        if (issueDate) {
            try {
                expiryDate = calculateExpiryDate(document.document_name, issueDate);
            } catch (e) {
                console.warn('Failed to calculate expiry date from OCR issueDate:', issueDate);
            }
        }

        const status = getDocumentExpiryStatus(expiryDate);

        // Upload to Supabase Storage using project utility
        const fileUrl = await uploadFileToSupabase({
            supabase: supabaseAdmin, // Use admin client for consistent behavior
            file: file,
            fileName: file.name,
            contentType: file.type,
            userId,
            folder: 'documents',
        });

        // Check if document already exists
        const { data: existing } = await supabase
            .from('user_documents')
            .select('id')
            .eq('user_id', userId)
            .eq('document_id', document.id)
            .single();

        const payload = {
            user_id: userId,
            document_id: document.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrl,
            verification_status: 'PENDING',
            status: status,
            expiry_date: expiryDate ? expiryDate.toISOString() : null,
            metadata: {
                ocr_text: ocrData?.text,
                ocr_confidence: ocrData?.confidence,
                ocr_method: 'tesseract',
                extracted_data: ocrData?.extractedData,
                detected_type: ocrData?.detectedType,
                verified_by_user: true,
                processed_at: new Date().toISOString()
            }
        };

        let resultData;
        if (existing) {
            const { data, error: dbError } = await supabase
                .from('user_documents')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
            if (dbError) throw dbError;
            resultData = data;
        } else {
            const { data, error: dbError } = await supabase
                .from('user_documents')
                .insert(payload)
                .select()
                .single();
            if (dbError) throw dbError;
            resultData = data;
        }

        // Trigger background scheme match recalculation so eligibility % updates immediately
        recalculateSchemeMatches(userId, `Document Uploaded: ${documentCode}`).catch(err => {
            console.warn('Background recalculation failed (non-critical):', err);
        });

        return NextResponse.json({
            success: true,
            document: resultData,
            message: 'Document uploaded successfully with OCR data'
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
