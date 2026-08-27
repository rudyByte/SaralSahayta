import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient as getServerClient } from '@/lib/supabase-server';
import { calculateConfidence } from '@/lib/ai/confidence-calculator';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const schemeId = params.id;
        const supabase = getServerClient();
        const adminSupabase = createAdminClient();

        // 1. Auth Check (Server Client for Session - optional for confidence endpoint)
        let userId: string | null = null;
        try {
            const { data: authData } = await supabase.auth.getUser();
            userId = authData?.user?.id || null;
        } catch (authErr) {
            console.warn('Auth check skipped in confidence route:', authErr);
        }

        // 2. Fetch Scheme Details
        const { data: scheme, error: schemeError } = await adminSupabase
            .from('schemes')
            .select('id, name, category, requiredDocuments')
            .eq('id', schemeId)
            .single();

        if (schemeError || !scheme) {
            return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
        }

        // 3. Document Requirements (Fetch from relational table first, fallback to scheme field)
        let requiredDocCodes: string[] = [];
        try {
            const { data: docReqRows } = await adminSupabase
                .from('scheme_document_requirements')
                .select(`
                    document_id,
                    is_mandatory,
                    documents (
                        document_code,
                        document_name
                    )
                `)
                .eq('scheme_id', schemeId);

            if (docReqRows && docReqRows.length > 0) {
                requiredDocCodes = docReqRows
                    .filter((r: any) => r.is_mandatory !== false && r.documents?.document_code)
                    .map((r: any) => r.documents.document_code.trim().toUpperCase());
            }
        } catch (reqErr) {
            console.warn('Could not fetch scheme_document_requirements:', reqErr);
        }

        if (requiredDocCodes.length === 0 && Array.isArray(scheme.requiredDocuments) && scheme.requiredDocuments.length > 0) {
            requiredDocCodes = scheme.requiredDocuments.map((code: string) => code.trim().toUpperCase());
        }


        // 4. Fetch User's Uploaded Documents (if logged in)
        let userDocRows: any[] = [];
        if (userId) {
            const { data: docRows } = await adminSupabase
                .from('user_documents')
                .select(`
                    verification_status,
                    document_id,
                    documents (
                        document_code,
                        document_name
                    )
                `)
                .eq('user_id', userId);
            userDocRows = docRows || [];
        }

        const userUploadedCodes = (userDocRows || [])
            .map((d: any) => d.documents?.document_code?.trim().toUpperCase())
            .filter(Boolean);
        
        const userUploadedNames = (userDocRows || [])
            .map((d: any) => d.documents?.document_name?.trim().toLowerCase())
            .filter(Boolean);


        // 5. Historical Stats (Using RPC - assumed snake_case in SQL already)
        const { data: statsData } = await adminSupabase.rpc('get_scheme_stats', { target_scheme_id: schemeId });

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

        // 6. Fetch profile match score (if user is logged in)
        let matchScore = 75;
        if (userId) {
            const { data: matchRow } = await adminSupabase
                .from('user_scheme_matches')
                .select('match_score')
                .eq('user_id', userId)
                .eq('scheme_id', schemeId)
                .single();
            if (matchRow?.match_score) {
                matchScore = matchRow.match_score;
            }
        }


        // 7. Calculate Confidence
        const confidence = calculateConfidence(
            historicalRate,
            matchScore,
            requiredDocCodes,
            userUploadedCodes
        );

        // 8. Enrich suggestions
        const enrichedSuggestions = confidence.suggestions.filter(s => {
            const text = s.text.toLowerCase();
            const isDocSuggestion = text.startsWith('upload ');
            if (!isDocSuggestion) return true;

            return !userUploadedCodes.some(code => text.includes(code.toLowerCase())) &&
                   !userUploadedNames.some(name => text.includes(name));
        });

        return NextResponse.json({
            ...confidence,
            suggestions: enrichedSuggestions,
            _debug: {
                requiredDocCodes,
                userUploadedCodes,
                matchScore
            }
        });

    } catch (error: any) {
        console.error('[Confidence API] Error:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            message: error.message 
        }, { status: 500 });
    }
}
