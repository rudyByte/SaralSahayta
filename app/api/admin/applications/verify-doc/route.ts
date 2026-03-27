export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { applicationId, documentId, status, remarks } = body;

        if (!applicationId || !documentId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify the admin current user
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        if (!adminUser) throw new Error('Unauthorized');

        // Update document verification status
        const { data, error } = await supabase
            .from('application_documents')
            .update({
                verification_status: status,
                remarks: remarks || null,
                verified_at: new Date().toISOString(),
                verified_by: adminUser.id
            })
            .eq('application_id', applicationId)
            .eq('document_id', documentId)
            .select()
            .single();

        if (error) {
            // If the record doesn't exist, we might need to insert it (lazy migration)
            // But usually, they are linked during application submission/fetch
            throw error;
        }

        // Create Audit Log
        await supabase.from('admin_audit_logs').insert({
            admin_id: adminUser.id,
            action: 'VERIFY_DOC',
            entity_type: 'DOCUMENT',
            entity_id: documentId,
            target_user_id: null, // Hard to get without extra query, can be added later
            details: { applicationId, status, remarks }
        });

        return NextResponse.json({ success: true, document: data });
    } catch (error: any) {
        console.error('Verify document error:', error);
        return NextResponse.json(
            { error: 'Failed to verify document' },
            { status: 500 }
        );
    }
}
