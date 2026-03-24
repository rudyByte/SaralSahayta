import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { } },
            },
        }
    );
};

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const schemeId = searchParams.get('schemeId');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!schemeId) {
      return NextResponse.json({ error: 'Missing schemeId' }, { status: 400 });
    }

    // 1. Get required documents for this scheme
    const { data: requirements, error: reqError } = await supabase
      .from('SchemeDocumentRequirement')
      .select(`
        "documentId",
        "isMandatory",
        documents (
          document_name,
          document_code
        )
      `)
      .eq('schemeId', schemeId)
      .order('displayOrder');

    if (reqError) throw reqError;

    // 2. Get user verified documents
    const { data: userDocs, error: userDocError } = await supabase
      .from('user_documents')
      .select('*, documents(document_code)')
      .eq('user_id', session.user.id)
      .eq('verification_status', 'VERIFIED');

    if (userDocError) throw userDocError;

    // 3. Compare and determine status
    const attached = requirements
      ?.filter((req: any) => userDocs?.some((ud: any) => ud.documents?.document_code === req.documents?.document_code))
      .map((req: any) => req.documentId) || [];

    const missing = requirements
      ?.filter((req: any) => req.isMandatory && !userDocs?.some((ud: any) => ud.documents?.document_code === req.documents?.document_code))
      .map((req: any) => req.documentId) || [];

    return NextResponse.json({
      requirements,
      attached,
      missing,
      isReady: missing.length === 0
    });
  } catch (error: any) {
    console.error('Error in check-documents API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
