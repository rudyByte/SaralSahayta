export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();
        const applicationId = params.id;

        // Get application details with actual snake_case schema mapping
        const { data: application, error } = await supabase
            .from('applications')
            .select(`
                *,
                user:users (
                    *
                ),
                scheme:schemes (
                    *
                )
            `)
            .eq('id', applicationId)
            .single();

        if (error) throw error;

        // Fetch user documents (snake_case table)
        const { data: documents } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', application.user_id);

        // Fetch application history/audit logs (Assuming snake_case table)
        const { data: history } = await supabase
            .from('application_history') 
            .select('*')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: false });

        const mappedApp = {
            ...application,
            userId: application.user_id,
            trackingId: application.tracking_id,
            createdAt: application.created_at,
            updatedAt: application.updated_at,
            schemeId: application.scheme_id,
            application_documents: (documents || []).map((doc: any) => ({
                ...doc,
                userId: doc.user_id,
                createdAt: doc.created_at
            }))
        };

        const mappedHistory = (history || []).map((h: any) => ({
            ...h,
            applicationId: h.application_id,
            createdAt: h.created_at,
            oldStatus: h.old_status,
            newStatus: h.new_status
        }));

        return NextResponse.json({
            application: mappedApp,
            history: mappedHistory,
        });
    } catch (error: any) {
        console.error('Fetch application details error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch application details' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();
        const applicationId = params.id;
        const body = await request.json();
        const { status, remarks, reviewedBy } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Get current application to log old status
        const { data: currentApp } = await supabase
            .from('applications')
            .select('status')
            .eq('id', applicationId)
            .single();

        // Update application status with actual snake_case fields
        const { data, error } = await supabase
            .from('applications')
            .update({
                status,
                updated_at: new Date().toISOString(),
                ...(status === 'APPROVED' ? { approved_at: new Date().toISOString() } : {}),
                ...(status === 'REJECTED' ? { rejected_at: new Date().toISOString(), rejection_reason: remarks } : {}),
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;

        // Log the review in history if the table exists (snake_case)
        try {
            await supabase.from('application_history').insert({
                application_id: applicationId,
                old_status: currentApp?.status || 'UNKNOWN',
                new_status: status,
                remarks: remarks || null,
                changed_by: reviewedBy || 'admin',
                created_at: new Date().toISOString()
            });
        } catch (historyError) {
            console.warn('Could not log application history:', historyError);
        }

        const mappedUpdate = {
            ...data,
            userId: data.user_id,
            trackingId: data.tracking_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        return NextResponse.json({ application: mappedUpdate });
    } catch (error: any) {
        console.error('Update application error:', error);
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        );
    }
}
