import { createClient } from '@/lib/supabase-server';

function normalizeCode(value: unknown): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isUsableDocument(doc: any) {
  const verification = String(doc.verification_status || '').toUpperCase();
  const status = String(doc.status || '').toUpperCase();
  const isExpiredByDate = doc.expiry_date && new Date(doc.expiry_date).getTime() < Date.now();
  return verification !== 'REJECTED' && status !== 'REJECTED' && status !== 'EXPIRED' && !isExpiredByDate;
}

export async function analyzeDocumentReadiness(userId: string) {
  const supabase = createClient();

  const { data: matches } = await supabase
    .from('user_scheme_matches')
    .select('scheme_id, match_score')
    .eq('user_id', userId)
    .gte('match_score', 50);

  const schemeIds = Array.from(new Set((matches || []).map((match: any) => match.scheme_id).filter(Boolean)));
  if (schemeIds.length === 0) {
    return { schemeReadiness: [], missingAnalysis: [], overallReadiness: 100 };
  }

  const [{ data: schemes }, { data: requirements }, { data: userDocs }] = await Promise.all([
    supabase
      .from('schemes')
      .select('id, name, required_documents')
      .in('id', schemeIds),
    supabase
      .from('scheme_document_requirements')
      .select('scheme_id, document_id, is_mandatory, documents(id, document_code, document_name)')
      .in('scheme_id', schemeIds),
    supabase
      .from('user_documents')
      .select('document_id, verification_status, status, expiry_date, documents(id, document_code, document_name)')
      .eq('user_id', userId),
  ]);

  const schemeById = new Map((schemes || []).map((scheme: any) => [scheme.id, scheme]));
  const matchScoreByScheme = new Map((matches || []).map((match: any) => [match.scheme_id, match.match_score]));

  const uploadedKeys = new Set<string>();
  (userDocs || []).filter(isUsableDocument).forEach((doc: any) => {
    if (doc.document_id) uploadedKeys.add(String(doc.document_id).toLowerCase());
    if (doc.documents?.id) uploadedKeys.add(String(doc.documents.id).toLowerCase());
    if (doc.documents?.document_code) uploadedKeys.add(normalizeCode(doc.documents.document_code));
    if (doc.documents?.document_name) uploadedKeys.add(normalizeCode(doc.documents.document_name));
  });

  const requirementsByScheme = new Map<string, any[]>();
  (requirements || []).forEach((req: any) => {
    if (!req.is_mandatory) return;
    const list = requirementsByScheme.get(req.scheme_id) || [];
    list.push(req);
    requirementsByScheme.set(req.scheme_id, list);
  });

  const allRequiredGroups = new Map<string, string[]>();

  const readinessData = schemeIds.map((schemeId: string) => {
    const scheme = schemeById.get(schemeId) as any;
    const relationalRequirements = requirementsByScheme.get(schemeId) || [];
    const required = relationalRequirements.map((req) => {
      const documentName = req.documents?.document_name || req.documents?.document_code || req.document_id;
      const keys = [
        String(req.document_id || '').toLowerCase(),
        normalizeCode(req.documents?.document_code),
        normalizeCode(req.documents?.document_name),
      ].filter(Boolean);
      return { documentName, keys };
    });

    const missing = required.filter((req) => !req.keys.some((key) => uploadedKeys.has(key)));

    missing.forEach((doc) => {
      const code = normalizeCode(doc.documentName);
      const prev = allRequiredGroups.get(code) || [];
      allRequiredGroups.set(code, [...prev, scheme?.name || 'Scheme']);
    });

    return {
      schemeId,
      schemeName: scheme?.name || 'Scheme',
      matchScore: matchScoreByScheme.get(schemeId) || 0,
      totalRequired: required.length,
      missingCount: missing.length,
      isReady: missing.length === 0,
    };
  });

  const missingAnalysis = Array.from(allRequiredGroups.entries())
    .map(([docType, blockingSchemes]) => ({
      documentType: docType,
      blockingCount: blockingSchemes.length,
      blockingSchemes,
    }))
    .sort((a, b) => b.blockingCount - a.blockingCount);

  return {
    schemeReadiness: readinessData.sort((a, b) => a.missingCount - b.missingCount),
    missingAnalysis,
    overallReadiness: readinessData.length > 0
      ? Math.round((readinessData.filter((row) => row.isReady).length / readinessData.length) * 100)
      : 100,
  };
}
