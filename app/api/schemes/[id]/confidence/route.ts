import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { calculateConfidence } from '@/lib/ai/confidence-calculator';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const schemeId = params.id;
        const supabase = createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Scheme Details
        const { data: scheme, error: schemeError } = await supabase
            .from('Scheme')
            .select('id, name, category')
            .eq('id', schemeId)
            .single();

        if (schemeError || !scheme) {
            return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
        }

        // 3. Fetch Required Doc Codes from SchemeDocumentRequirement table
        // This is the proper normalised source, joined with master documents table
        const { data: docReqs } = await supabase
            .from('SchemeDocumentRequirement')
            .select(`
                documentId,
                isMandatory,
                documents (document_code, document_name)
            `)
            .eq('schemeId', schemeId);

        const requiredDocCodes: string[] = (docReqs || [])
            .filter((r: any) => r.isMandatory && r.documents?.document_code)
            .map((r: any) => r.documents.document_code as string);

        // Also get optional doc codes for full list
        const allDocCodes: string[] = (docReqs || [])
            .filter((r: any) => r.documents?.document_code)
            .map((r: any) => r.documents.document_code as string);

        // 4. Fetch User's Uploaded Documents (from user_documents joined with master)
        // We check both PENDING and VERIFIED to give credit; filter by doc codes for this scheme
        const { data: userDocRows } = await supabase
            .from('user_documents')
            .select(`
                verification_status,
                documents (document_code)
            `)
            .eq('user_id', user.id);

        // Collect the document codes the user has uploaded (any status counts for readiness)
        const userUploadedCodes: string[] = (userDocRows || [])
            .filter((d: any) => d.documents?.document_code)
            .map((d: any) => d.documents.document_code as string);

        // Also for suggestion text - only count VERIFIED docs as truly "complete"
        const userVerifiedCodes: string[] = (userDocRows || [])
            .filter((d: any) => d.documents?.document_code && d.verification_status === 'VERIFIED')
            .map((d: any) => d.documents.document_code as string);

        // 5. Historical Stats (RPC with fallback)
        const { data: statsData } = await supabase.rpc('get_scheme_stats', { target_scheme_id: schemeId });

        let historicalRate = 0.75;
        if (statsData && statsData.length > 0) {
            historicalRate = statsData[0].historical_rate;
        } else {
            const categorySeeds: Record<string, number> = {
                'EDUCATION': 0.85,
                'AGRICULTURE': 0.70,
                'HEALTHCARE': 0.90,
                'WOMEN_CHILD': 0.80,
                'HOUSING': 0.55,
                'EMPLOYMENT': 0.65,
            };
            historicalRate = categorySeeds[scheme.category] || 0.65;
        }

        // 6. Fetch profile match score from pre-computed user_scheme_matches table
        const { data: matchRow } = await supabase
            .from('user_scheme_matches')
            .select('match_score')
            .eq('user_id', user.id)
            .eq('scheme_id', schemeId)
            .single();

        const matchScore = matchRow?.match_score ?? 60;

        // 7. Calculate Confidence using uploaded codes (any status = readiness)
        const confidence = calculateConfidence(
            historicalRate,
            matchScore,
            requiredDocCodes,      // Only mandatory docs count for readiness
            userUploadedCodes      // Use uploaded (not just verified) for display readiness
        );

        // 8. Enrich suggestions — filter out documents the user already has
        const enrichedSuggestions = confidence.suggestions.filter(s => {
            // Remove document suggestions for already-uploaded docs
            const isDocSuggestion = s.text.startsWith('Upload ');
            if (!isDocSuggestion) return true;
            // Extract doc code from suggestion (format: "Upload AADHAAR to increase...")
            const code = s.text.split(' ')[1];
            return !userUploadedCodes.includes(code);
        });

        return NextResponse.json({
            ...confidence,
            suggestions: enrichedSuggestions,
            // Extra debug context for devs
            _debug: {
                requiredDocCodes,
                userUploadedCodes,
                matchScore
            }
        });

    } catch (error: any) {
        console.error('[Confidence API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
