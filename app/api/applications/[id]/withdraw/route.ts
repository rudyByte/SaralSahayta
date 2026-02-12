export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST - Withdraw a submitted or under-review application
 * This action transitions the application status to 'WITHDRAWN'
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch application to verify ownership and current status
        const { data: application, error: fetchError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !application) {
            return NextResponse.json(
                { error: 'Application not found or access denied' },
                { status: 404 }
            );
        }

        // Business Logic: Can only withdraw if it's currently in a state where it's being processed
        // We don't want to allow withdrawing 'DRAFT' (they can just delete/ignore) 
        // or 'APPROVED'/'REJECTED' (processed applications)
        const withdrawableStatuses = ['SUBMITTED', 'UNDER_REVIEW'];
        if (!withdrawableStatuses.includes(application.status)) {
            return NextResponse.json(
                { error: `Cannot withdraw application with status: ${application.status}` },
                { status: 400 }
            );
        }

        // Update status to 'WITHDRAWN'
        const { error: updateError } = await supabase
            .from('applications')
            .update({
                status: 'WITHDRAWN',
                updated_at: new Date().toISOString(),
            })
            .eq('id', params.id);

        if (updateError) {
            console.error('Withdraw Application Error:', updateError);
            return NextResponse.json(
                { error: 'Failed to withdraw application' },
                { status: 500 }
            );
        }

        // Note: The history log entry is automatically created by the 'tr_log_status_change_apps' 
        // trigger on the 'applications' table.

        return NextResponse.json({
            success: true,
            message: 'Application withdrawn successfully',
        });

    } catch (error: any) {
        console.error('Withdraw Operation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Operation failed' },
            { status: 500 }
        );
    }
}
