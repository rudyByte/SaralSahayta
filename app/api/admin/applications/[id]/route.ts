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

        // Get application details with Supabase REST over HTTPS
        const { data: application, error } = await supabase
            .from('Application')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (error || !application) throw new Error('Application not found');

        // Fetch related entities manually to bypass PostgREST cache issues
        const { data: user } = await supabase.from('users').select('*').eq('id', application.userId || application.user_id).single();
        const { data: scheme } = await supabase.from('Scheme').select('*').eq('id', application.schemeId || application.scheme_id).single();

        // Fetch user documents (snake_case table from Supabase)
        const { data: documents } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', application.userId || application.user_id);

        // Fetch application history/audit logs
        const { data: history } = await supabase
            .from('application_history') 
            .select('*')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: false });

        const mappedApp = {
            ...application,
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
            .from('Application')
            .select('status')
            .eq('id', applicationId)
            .single();

        // Update application status with Supabase REST
        const { data: updatedApp, error } = await supabase
            .from('Application')
            .update({
                status,
                ...(status === 'APPROVED' ? { approvedAt: new Date().toISOString() } : {}),
                ...(status === 'REJECTED' ? { rejectedAt: new Date().toISOString(), rejectionReason: remarks } : {}),
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) {
            console.error(error);
            throw new Error('Update failed');
        }

        // Log the review in history if the table exists (snake_case via Supabase)
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

        return NextResponse.json({ application: updatedApp });
    } catch (error: any) {
        console.error('Update application error:', error);
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        );
    }
}
