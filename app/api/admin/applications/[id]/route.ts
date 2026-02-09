import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const applicationId = params.id;

        // Get application details
        const { data: application, error } = await supabase
            .from('applications')
            .select(`
                *,
                user_profiles!applications_user_id_fkey (
                    *
                ),
                schemes (
                    *
                ),
                application_documents (
                    *,
                    UserDocument (
                        *
                    )
                )
            `)
            .eq('id', applicationId)
            .single();

        if (error) throw error;

        // Get application history
        const { data: history } = await supabase
            .from('ApplicationHistory')
            .select('*')
            .eq('application_id', applicationId)
            .order('changed_at', { ascending: false });

        return NextResponse.json({
            application,
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

        // Update application status
        const { data, error } = await supabase
            .from('applications')
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;

        // Log the review in history
        await supabase.from('ApplicationHistory').insert({
            application_id: applicationId,
            old_status: data.status,
            new_status: status,
            changed_by: reviewedBy,
            remarks: remarks || null,
        });

        return NextResponse.json({ application: data });
    } catch (error: any) {
        console.error('Update application error:', error);
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        );
    }
}
