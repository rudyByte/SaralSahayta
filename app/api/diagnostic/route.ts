import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createAdminClient();
        
        // Check Schemes
        const { data: schemes, error: sError } = await supabase
            .from('schemes')
            .select('*')
            .limit(1);

        // Check Applications
        const { data: apps, error: aError } = await supabase
            .from('applications')
            .select('*')
            .limit(1);

        // Check Documents
        const { data: docs, error: dError } = await supabase
            .from('documents')
            .select('*')
            .limit(1);

        // Check User Profiles
        const { data: profiles, error: pError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        // Check Document Requirements
        const { data: reqs, error: rError } = await supabase
            .from('scheme_document_requirements')
            .select('*')
            .limit(1);

        return NextResponse.json({
            schemes: schemes?.[0] ? Object.keys(schemes[0]) : [],
            applications: apps?.[0] ? Object.keys(apps[0]) : [],
            user_profiles: profiles?.[0] ? Object.keys(profiles[0]) : [],
            documents: docs?.[0] ? Object.keys(docs[0]) : [],
            scheme_document_requirements: reqs?.[0] ? Object.keys(reqs[0]) : [],
            errors: {
                schemes: sError?.message,
                applications: aError?.message,
                user_profiles: pError?.message,
                documents: dError?.message,
                requirements: rError?.message
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
