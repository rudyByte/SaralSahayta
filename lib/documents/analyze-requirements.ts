import { createClient } from '@/lib/supabase-server';

export async function analyzeDocumentReadiness(userId: string) {
  const supabase = createClient();

  // 1. Get user's active scheme matches
  const { data: matches } = await supabase
    .from('user_scheme_matches')
    .select('scheme_id, match_score, schemes(id, name, required_documents)')
    .eq('user_id', userId)
    .gte('match_score', 50);

  // 2. Get user's uploaded documents
  const { data: docs } = await supabase
    .from('documents')
    .select('document_type')
    .eq('user_id', userId);

  const uploadedTypes = new Set(docs?.map(d => d.document_type) || []);
  const allRequiredGroups = new Map<string, string[]>();

  const readinessData = (matches || []).map(match => {
    const s = match.schemes as any;
    const required = s.required_documents || [];
    const missing = required.filter((doc: string) => !uploadedTypes.has(doc));
    
    // Accumulate distinct missing docs
    missing.forEach((doc: string) => {
      const prev = allRequiredGroups.get(doc) || [];
      allRequiredGroups.set(doc, [...prev, s.name]);
    });

    return {
      schemeId: s.id,
      schemeName: s.name,
      matchScore: match.match_score,
      totalRequired: required.length,
      missingCount: missing.length,
      isReady: missing.length === 0
    };
  });

  // Calculate missing documents grouped by how many schemes need them
  const missingAnalysis = Array.from(allRequiredGroups.entries())
    .map(([docType, schemes]) => ({
      documentType: docType,
      blockingCount: schemes.length,
      blockingSchemes: schemes
    }))
    .sort((a, b) => b.blockingCount - a.blockingCount);

  return {
    schemeReadiness: readinessData.sort((a, b) => a.missingCount - b.missingCount),
    missingAnalysis,
    overallReadiness: readinessData.length > 0
        ? Math.round((readinessData.filter(r => r.isReady).length / readinessData.length) * 100)
        : 100
  };
}
