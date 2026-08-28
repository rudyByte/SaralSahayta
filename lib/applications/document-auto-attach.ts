import { supabase } from '@/lib/supabase';

export async function autoAttachUserDocuments(
  applicationId: string,
  userId: string,
  schemeId: string
) {
  try {
    // 1. Get required documents for the scheme
    const { data: requirements, error: reqError } = await supabase
      .from('scheme_document_requirements')
      .select('document_id, is_mandatory')
      .eq('scheme_id', schemeId);

    if (reqError) throw reqError;
    if (!requirements || requirements.length === 0) return { attached: [], missing: [] };

    // 2. Get user's verified documents
    const { data: userDocs, error: userDocError } = await supabase
      .from('user_documents')
      .select('document_id, verification_status, status')
      .eq('user_id', userId);

    if (userDocError) throw userDocError;

    const attached: string[] = [];
    const missing: string[] = [];

    // 3. Match
    requirements.forEach((req: any) => {
      const matchingDoc = userDocs?.find((ud: any) => (
        ud.document_id === req.document_id &&
        String(ud.verification_status || ud.status || '').toUpperCase() !== 'REJECTED' &&
        String(ud.status || '').toUpperCase() !== 'EXPIRED'
      ));
      if (matchingDoc) {
        attached.push(req.document_id);
      } else if (req.is_mandatory) {
        missing.push(req.document_id);
      }
    });

    // 4. Update Application in background
    await supabase
      .from('applications')
      .update({ 
        attached_documents: attached,
        metadata: { missing_documents: missing } 
      })
      .eq('id', applicationId);

    return { attached, missing };
  } catch (error) {
    console.error('Error in autoAttachUserDocuments:', error);
    throw error;
  }
}
