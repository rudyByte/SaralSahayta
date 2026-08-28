import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function normalizeCode(value: unknown): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const schemeId = searchParams.get('schemeId');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!schemeId) {
      return NextResponse.json({ error: 'Missing schemeId' }, { status: 400 });
    }

    const { data: requirementRows, error: reqError } = await supabaseAdmin
      .from('scheme_document_requirements')
      .select('id, scheme_id, document_id, is_mandatory, display_order, help_text')
      .eq('scheme_id', schemeId)
      .order('display_order', { ascending: true });

    if (reqError) throw reqError;

    const documentIds = Array.from(new Set((requirementRows || []).map((req: any) => req.document_id).filter(Boolean)));
    const { data: masterDocs, error: masterDocError } = documentIds.length > 0
      ? await supabaseAdmin
        .from('documents')
        .select('id, document_code, document_name, description, category')
        .in('id', documentIds)
      : { data: [], error: null };

    if (masterDocError) throw masterDocError;

    const masterDocMap = new Map((masterDocs || []).map((doc: any) => [doc.id, doc]));

    const requirements = (requirementRows || []).map((req: any) => {
      const doc = masterDocMap.get(req.document_id) || {};
      return {
        id: req.id,
        schemeId: req.scheme_id,
        documentId: req.document_id,
        isMandatory: req.is_mandatory ?? true,
        displayOrder: req.display_order ?? 0,
        helpText: req.help_text || '',
        documents: {
          id: req.document_id,
          document_code: doc.document_code || normalizeCode(doc.document_name || req.document_id),
          document_name: doc.document_name || 'Required Document',
          description: doc.description || '',
          category: doc.category || 'GENERAL',
        },
      };
    });

    const { data: userDocs, error: userDocError } = await supabaseAdmin
      .from('user_documents')
      .select('document_id, verification_status, status, expiry_date, documents(id, document_code, document_name)')
      .eq('user_id', user.id)
      .in('verification_status', ['VERIFIED', 'PENDING']);

    if (userDocError) throw userDocError;

    const userKeys = new Set<string>();
    (userDocs || []).forEach((doc: any) => {
      const status = String(doc.status || '').toUpperCase();
      if (status === 'EXPIRED' || status === 'REJECTED') return;
      if (doc.expiry_date && new Date(doc.expiry_date).getTime() < Date.now()) return;
      if (doc.document_id) userKeys.add(String(doc.document_id).toLowerCase());
      if (doc.documents?.id) userKeys.add(String(doc.documents.id).toLowerCase());
      if (doc.documents?.document_code) userKeys.add(normalizeCode(doc.documents.document_code));
      if (doc.documents?.document_name) userKeys.add(normalizeCode(doc.documents.document_name));
    });

    const isUploaded = (req: any) => {
      const doc = req.documents || {};
      return [
        String(req.documentId || '').toLowerCase(),
        String(doc.id || '').toLowerCase(),
        normalizeCode(doc.document_code),
        normalizeCode(doc.document_name),
      ].filter(Boolean).some((key) => userKeys.has(key));
    };

    const attached = requirements
      .filter(isUploaded)
      .map((req: any) => req.documentId);

    const missing = requirements
      .filter((req: any) => req.isMandatory && !isUploaded(req))
      .map((req: any) => req.documentId);

    return NextResponse.json({
      requirements,
      attached,
      missing,
      isReady: missing.length === 0,
    });
  } catch (error: any) {
    console.error('Error in check-documents API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
