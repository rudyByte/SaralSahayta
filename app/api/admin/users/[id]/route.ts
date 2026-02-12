export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const userId = params.id;

        // Get user profile with roles
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
                *,
                user_roles (
                    roles (
                        name,
                        description
                    )
                )
            `)
            .eq('user_id', userId)
            .single();

        if (profileError) throw profileError;

        // Get user's applications
        const { data: applications } = await supabase
            .from('applications')
            .select(`
                *,
                schemes (
                    schemeName,
                    category
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Get user's documents
        const { data: documents } = await supabase
            .from('UserDocument')
            .select('*')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false });

        return NextResponse.json({
            profile,
            applications: applications || [],
            documents: documents || [],
        });
    } catch (error: any) {
        console.error('Fetch user details error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user details' },
            { status: 500 }
        );
    }
}
