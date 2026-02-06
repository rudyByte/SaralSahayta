import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET - Fetch detailed application information including linked documents
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch application joined with scheme and application_documents
        const { data: application, error } = await supabase
            .from('applications')
            .select(`
                *,
                scheme:schemes(*),
                linked_documents:application_documents(
                    *,
                    user_document:user_documents(
                        *,
                        master_doc:documents(*)
                    )
                )
            `)
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (error || !application) {
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404 }
            );
        }

        // Extract required documents from scheme
        const requiredDocuments = (application.scheme as any)?.requiredDocuments || [];

        return NextResponse.json({
            application,
            scheme: application.scheme,
            formTemplate: (application.scheme as any)?.applicationFormTemplate,
            linkedDocuments: application.linked_documents?.map((ld: any) => ld.user_document) || [],
            requiredDocuments,
        });

    } catch (error: any) {
        console.error('Fetch Application Detail Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch application' },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update application (Save Draft or Submit)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { formData, documentIds, action } = body;

        // Verify ownership and fetch current state
        const { data: application, error: fetchError } = await supabase
            .from('applications')
            .select('*, scheme:schemes(requiredDocuments)')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !application) {
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404 }
            );
        }

        // Cannot modify submitted/processed applications
        if (application.status !== 'DRAFT' && action !== 'submit') {
            return NextResponse.json(
                { error: 'Cannot modify submitted application' },
                { status: 403 }
            );
        }

        const requiredDocs = (application.scheme as any)?.requiredDocuments || [];

        if (action === 'save') {
            // Calculate document status based on current documentIds
            const docStatus = (documentIds?.length === requiredDocs.length && requiredDocs.length > 0)
                ? 'COMPLETE'
                : (documentIds?.length > 0)
                    ? 'INCOMPLETE'
                    : 'NOT_STARTED';

            const { data: updated, error: updateError } = await supabase
                .from('applications')
                .update({
                    form_data: formData,
                    document_checklist_data: {
                        required: requiredDocs,
                        uploaded: documentIds || [],
                        missing: requiredDocs.filter((doc: string) => !(documentIds || []).includes(doc)),
                    },
                    document_status: docStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)
                .select()
                .single();

            if (updateError) {
                console.error('Save Draft Error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to save application draft' },
                    { status: 500 }
                );
            }

            // Link documents sequentially or via transaction (here we simple re-link)
            if (documentIds && Array.isArray(documentIds)) {
                // Remove old links
                await supabase
                    .from('application_documents')
                    .delete()
                    .eq('application_id', params.id);

                // Insert new links
                if (documentIds.length > 0) {
                    const links = documentIds.map((docId: string) => ({
                        application_id: params.id,
                        user_document_id: docId,
                    }));
                    await supabase.from('application_documents').insert(links);
                }
            }

            return NextResponse.json({
                success: true,
                application: updated,
                message: 'Draft saved successfully',
            });
        }

        if (action === 'submit') {
            // Validation: Ensure form is not empty
            if (!formData || Object.keys(formData).length === 0) {
                return NextResponse.json(
                    { error: 'Please complete the application form before submitting' },
                    { status: 400 }
                );
            }

            // Validation: Ensure all documents are uploaded
            const uploadedCount = documentIds?.length || 0;
            if (uploadedCount < requiredDocs.length) {
                return NextResponse.json(
                    { error: `Missing required documents. ${requiredDocs.length - uploadedCount} left.` },
                    { status: 400 }
                );
            }

            // Submit Application
            const { data: submitted, error: submitError } = await supabase
                .from('applications')
                .update({
                    form_data: formData,
                    status: 'SUBMITTED',
                    submitted_at: new Date().toISOString(),
                    document_status: 'COMPLETE',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)
                .select()
                .single();

            if (submitError) {
                console.error('Submit Application Error:', submitError);
                return NextResponse.json(
                    { error: 'Failed to submit application' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                application: submitted,
                message: 'Application submitted successfully!',
            });
        }

        return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });

    } catch (error: any) {
        console.error('Update Application Error:', error);
        return NextResponse.json(
            { error: error.message || 'Operation failed' },
            { status: 500 }
        );
    }
}
