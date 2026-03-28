export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const applicationId = params.id;

        // Get application details with correct schema mapping
        const { data: application, error } = await supabase
            .from('Application')
            .select(`
                *,
                user:users (
                    *
                ),
                scheme:Scheme (
                    *
                )
            `)
            .eq('id', applicationId)
            .single();

        if (error) throw error;

        // Fetch documents separately since they might not have a direct relation in Supabase's auto-generated context
        const { data: documents } = await supabase
            .from('Document')
            .select('*')
            .eq('userId', application.userId);

        // Fetch application history/audit logs
        const { data: history } = await supabase
            .from('ApplicationStatusHistory') // Assuming a more descriptive name or fallback
            .select('*')
            .eq('applicationId', applicationId)
            .order('createdAt', { ascending: false });

        return NextResponse.json({
            application: {
                ...application,
                application_documents: documents || []
            },
            history: history || [],
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
        const supabase = createClient();
        const applicationId = params.id;
        const body = await request.json();
        const { status, remarks, reviewedBy } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Update application status with correct fields
        const { data, error } = await supabase
            .from('Application')
            .update({
                status,
                updatedAt: new Date().toISOString(),
                ...(status === 'APPROVED' ? { approvedAt: new Date().toISOString() } : {}),
                ...(status === 'REJECTED' ? { rejectedAt: new Date().toISOString(), rejectionReason: remarks } : {}),
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;

        // Log the review in history if the table exists
        try {
            await supabase.from('ApplicationStatusHistory').insert({
                applicationId: applicationId,
                oldStatus: 'UNKNOWN', // Ideally fetch current first
                newStatus: status,
                remarks: remarks || null,
                changedBy: reviewedBy || 'admin',
                createdAt: new Date().toISOString()
            });
        } catch (historyError) {
            console.warn('Could not log application history:', historyError);
        }

        return NextResponse.json({ application: data });
    } catch (error: any) {
        console.error('Update application error:', error);
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        );
    }
}
