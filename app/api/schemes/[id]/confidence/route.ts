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
            .select('id, name, category, requiredDocuments')
            .eq('id', schemeId)
            .single();

        if (schemeError || !scheme) {
            return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
        }

        // 3. Fetch User Documents
        const { data: userDocs } = await supabase
            .from('Document')
            .select('documentType')
            .eq('userId', user.id);

        const userDocTypes = (userDocs || []).map(d => d.documentType);

        // 4. Fetch Historical Stats (RPC or Fallback)
        // For now, let's use a robust fallback logic with some randomness based on category
        // in a real app, this would be: await supabase.rpc('get_scheme_stats', { target_scheme_id: schemeId })
        const { data: statsData } = await supabase.rpc('get_scheme_stats', { target_scheme_id: schemeId });

        let historicalRate = 0.75; // Default fallback
        if (statsData && statsData.length > 0) {
            historicalRate = statsData[0].historical_rate;
        } else {
            // Mocked logic for demo purposes if RPC fails or returns nothing
            const categorySeeds: Record<string, number> = {
                'EDUCATION': 0.85,
                'AGRICULTURE': 0.70,
                'HEALTHCARE': 0.90,
                'HOUSING': 0.45,
                'ENTREPRENEURSHIP': 0.55,
            };
            historicalRate = categorySeeds[scheme.category] || 0.65;
        }

        // 5. Calculate Match Score (Mocking based on session for now or fetching from application if exists)
        // In a real scenario, we might want to pass this or re-calculate
        const { data: application } = await supabase
            .from('Application')
            .select('eligibilityScore')
            .eq('userId', user.id)
            .eq('schemeId', schemeId)
            .single();

        const matchScore = application?.eligibilityScore || 85; // Default dummy match if no application

        // 6. Final Calculation
        const confidence = calculateConfidence(
            historicalRate,
            matchScore,
            scheme.requiredDocuments || [],
            userDocTypes
        );

        return NextResponse.json(confidence);

    } catch (error: any) {
        console.error('[Confidence API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
