export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API Route to fetch documents for the authenticated user
 * Supports filtering by verification status
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Query joined with master document types
        let query = supabase
            .from('user_documents')
            .select(`
                *,
                document:documents(*)
            `)
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false });

        // Apply status filter if provided (PENDING, VERIFIED, REJECTED)
        if (status) {
            query = query.eq('verification_status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch Documents Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch documents' },
                { status: 500 }
            );
        }

        return NextResponse.json({ documents: data || [] });

    } catch (error: any) {
        console.error('Fetch Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
