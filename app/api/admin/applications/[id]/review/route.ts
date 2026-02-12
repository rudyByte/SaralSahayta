export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin-auth';

/**
 * PUT - Review an Application (Approve/Reject)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await requireAdminPermission('applications.review');
        const supabase = createClient();

        const body = await request.json();
        const { action, remarks } = body; // action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'

        if (!['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid review action' },
                { status: 400 }
            );
        }

        const appId = params.id;

        // 1. Fetch current application to verify state
        const { data: application, error: fetchError } = await supabase
            .from('applications')
            .select('status, user_id')
            .eq('id', appId)
            .single();

        if (fetchError || !application) {
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404 }
            );
        }

        // 2. Determine new status
        let newStatus = application.status;
        if (action === 'APPROVE') newStatus = 'APPROVED';
        else if (action === 'REJECT') newStatus = 'REJECTED';
        else if (action === 'REQUEST_CHANGES') newStatus = 'CHANGES_REQUESTED';

        // 3. Update Application Status
        const { data: updatedApp, error: updateError } = await supabase
            .from('applications')
            .update({
                status: newStatus,
                reviewed_by: admin.id,
                reviewed_at: new Date().toISOString(),
                rejection_reason: action === 'REJECT' ? remarks : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', appId)
            .select()
            .single();

        if (updateError) {
            throw new Error(updateError.message);
        }

        // 4. Log to Audit Trail
        await logAdminAction(admin.id, `APPLICATION_${action}`, 'applications', appId, {
            previous_status: application.status,
            new_status: newStatus,
            remarks
        });

        // 5. Create History Entry (via API or rely on DB Trigger)
        // Since we have a DB trigger `log_app_status_change`, we might not need to manually insert into history
        // BUT, the trigger might not capture the *remarks* if they are not in the apps table in a way the trigger expects.
        // Our trigger uses `NEW.remarks`? Let's check the trigger logic later.
        // For now, we update the application, which fires the trigger. 
        // If we want remarks in history, we should ensure the trigger captures it or insert manually.
        // The `applications` table doesn't usually store "remarks" for the *current* state except maybe rejection_reason.

        // Let's manually add a remark entry if the trigger doesn't handle "remarks" column on app table well.
        // Checking previous context: `log_app_status_change` uses `NEW.status`.

        // Explicitly add history for admin review to be safe and include rich remarks
        await supabase.from('application_history').insert({
            application_id: appId,
            status: newStatus,
            remarks: remarks || `Application ${action.toLowerCase()} by admin`,
            changed_by: admin.id
        });

        return NextResponse.json({
            success: true,
            application: updatedApp,
            message: `Application ${newStatus.toLowerCase()} successfully`
        });

    } catch (error: any) {
        console.error('Review Error:', error);
        return NextResponse.json(
            { error: error.message || 'Review processing failed' },
            { status: 500 }
        );
    }
}
