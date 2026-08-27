import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { uploadFileToSupabase } from '@/lib/supabase-storage';
import { calculateExpiryDate, getDocumentExpiryStatus } from '@/lib/documents/expiry-calculator';
import { recalculateSchemeMatches } from '@/lib/matching/recalculate-on-profile-update';
import { classifyDocument } from '@/lib/documents/groq-document-classifier';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const supabaseAdmin = createAdminClient();

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

        // Validate document using Classifier Service if OCR data is present
        if (ocrData && ocrData.text) {
            const startTime = Date.now();
            const classification = await classifyDocument(ocrData.text, document.document_name);
            const processingTimeMs = Date.now() - startTime;
            
            console.log(`Expected document: ${document.document_name}`);
            console.log(`Detected document: ${classification.detectedType}`);
            console.log(`Comparison: ${classification.matched ? 'MATCH' : 'MISMATCH'}`);

            // Log validation result for debugging (excluding sensitive OCR contents)
            console.log(JSON.stringify({
                event: 'DOCUMENT_VALIDATION',
                timestamp: new Date().toISOString(),
                expectedDocument: document.document_name,
                detectedDocument: classification.detectedType,
                confidence: classification.confidence,
                validationResult: classification.matched ? 'PASSED' : 'FAILED',
                processingTimeMs
            }));

            const isDistinctMismatch = !classification.matched && 
                ['PAN Card', 'Passport', 'Driving Licence', 'Voter ID Card'].includes(classification.detectedType);

            if (isDistinctMismatch) {
                console.log(`Upload rejected: Document type mismatch. Detected: ${classification.detectedType}, Expected: ${document.document_name}`);
                return NextResponse.json(
                    {
                        success: false,
                        detectedDocument: classification.detectedType,
                        expectedDocument: document.document_name,
                        message: `This document cannot be uploaded here. Please upload your ${document.document_name}.`
                    },
                    { status: 400 }
                );
            }
        }

        // Check for duplicate document based on OCR text
        if (ocrData && ocrData.text) {
            const { data: previousDocs } = await supabase
                .from('user_documents')
                .select('metadata')
                .eq('user_id', userId);

            if (previousDocs && previousDocs.length > 0) {
                const normNewText = ocrData.text.replace(/\s+/g, '').toLowerCase();
                const isDuplicate = previousDocs.some(doc => {
                    const prevText = doc.metadata?.ocr_text;
                    if (!prevText) return false;
                    const normPrevText = prevText.replace(/\s+/g, '').toLowerCase();
                    return normPrevText === normNewText;
                });

                if (isDuplicate) {
                    return NextResponse.json(
                        { error: 'This document has already been uploaded.' },
                        { status: 400 }
                    );
                }
            }
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

        // When OCR data is present and user confirmed, mark as VERIFIED
        const hasOcrData = ocrData?.extractedData && Object.keys(ocrData.extractedData).length > 0;

        const payload: Record<string, any> = {
            user_id: userId,
            document_id: document.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrl,
            verification_status: hasOcrData ? 'VERIFIED' : 'PENDING',
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
            },
            uploaded_at: new Date().toISOString(),
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

        console.log(`Upload saved: Document ${document.document_name} was successfully uploaded and saved for user ${userId}`);

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
