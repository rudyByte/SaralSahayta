export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabase
            .from('applications')
            .select(`
                id,
                status,
                created_at,
                user_profiles!applications_user_id_fkey (
                    full_name,
                    mobile,
                    state,
                    category
                ),
                schemes (
                    schemeName,
                    category,
                    benefitAmount
                )
            `)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data: applications, error } = await query;

        if (error) throw error;

        // Generate CSV content
        const headers = [
            'Application ID',
            'Applicant Name',
            'Mobile',
            'State',
            'Applicant Category',
            'Scheme Name',
            'Scheme Category',
            'Benefit Amount',
            'Status',
            'Applied Date'
        ].join(',');

        const rows = (applications || []).map((app: any) => {
            return [
                app.id,
                `"${app.user_profiles?.full_name || ''}"`,
                app.user_profiles?.mobile || '',
                `"${app.user_profiles?.state || ''}"`,
                app.user_profiles?.category || '',
                `"${app.schemes?.schemeName || ''}"`,
                app.schemes?.category || '',
                app.schemes?.benefitAmount || 0,
                app.status,
                new Date(app.created_at).toISOString().split('T')[0]
            ].join(',');
        });

        const csvContent = [headers, ...rows].join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="applications_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export applications data' },
            { status: 500 }
        );
    }
}
