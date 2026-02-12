export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API Route to fetch the master list of documents
 * Supports filtering by category and common flag
 * also provides state-specific office addresses for authenticated users
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const common = searchParams.get('common');

        let query = supabase
            .from('documents')
            .select('*')
            .order('document_name', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        }

        if (common === 'true') {
            query = query.eq('is_common', true);
        }

        const { data: documents, error } = await query;

        if (error) {
            console.error('Fetch Master Documents Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch documents' },
                { status: 500 }
            );
        }

        // Fetch office addresses based on user's state if authenticated
        let officeAddresses: any[] = [];
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('state')
                .eq('user_id', user.id)
                .single();

            if (profile?.state) {
                const { data: addresses } = await supabase
                    .from('document_office_addresses')
                    .select('*')
                    .eq('state', profile.state);

                officeAddresses = addresses || [];
            }
        }

        return NextResponse.json({
            documents: documents || [],
            officeAddresses,
        });

    } catch (error: any) {
        console.error('Fetch Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch master documents' },
            { status: 500 }
        );
    }
}
