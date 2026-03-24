import { supabase } from '@/lib/supabase';

export async function autoAttachUserDocuments(
  applicationId: string,
  userId: string,
  schemeId: string
) {
  try {
    // 1. Get required documents for the scheme
    const { data: requirements, error: reqError } = await supabase
      .from('SchemeDocumentRequirement')
      .select('Document(documentType, id), documentId, isMandatory')
      .eq('schemeId', schemeId);

    if (reqError) throw reqError;
    if (!requirements || requirements.length === 0) return { attached: [], missing: [] };

    // 2. Get user's verified documents
    const { data: userDocs, error: userDocError } = await supabase
      .from('Document')
      .select('id, documentType')
      .eq('userId', userId)
      .eq('isVerified', true);

    if (userDocError) throw userDocError;

    const attached: string[] = [];
    const missing: string[] = [];

    // 3. Match
    requirements.forEach((req: any) => {
      const matchingDoc = userDocs?.find(ud => ud.documentType === req.Document.documentType);
      if (matchingDoc) {
        attached.push(req.documentId);
      } else if (req.isMandatory) {
        missing.push(req.documentId);
      }
    });

    // 4. Update Application in background
    await supabase
      .from('applications')
      .update({ 
        "attachedDocuments": attached,
        metadata: { missing_documents: missing } 
      })
      .eq('id', applicationId);

    return { attached, missing };
  } catch (error) {
    console.error('Error in autoAttachUserDocuments:', error);
    throw error;
  }
}
