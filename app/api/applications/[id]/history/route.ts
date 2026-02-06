import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET - Fetch activity history for a specific application
 * Includes status changes and remarks logged by triggers or admins
 */
export async function GET(
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

        // Verify application ownership
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select('status, user_id')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (appError || !application) {
            return NextResponse.json(
                { error: 'Application not found or access denied' },
                { status: 404 }
            );
        }

        // Fetch history ordered by newest first
        const { data: history, error: historyError } = await supabase
            .from('application_history')
            .select('*')
            .eq('application_id', params.id)
            .order('created_at', { ascending: false });

        if (historyError) {
            console.error('Fetch History Error:', historyError);
            return NextResponse.json(
                { error: 'Failed to fetch application history' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            history: history || [],
            currentStatus: application.status,
        });

    } catch (error: any) {
        console.error('Fetch Application History Error:', error);
        return NextResponse.json(
            { error: error.message || 'Operation failed' },
            { status: 500 }
        );
    }
}
