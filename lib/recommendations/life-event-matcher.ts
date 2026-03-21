import { supabase } from '@/lib/supabase';
import { LifeEventType } from '@/types/life-events';
import { calculateMatchScore, UserProfileForMatching } from '@/lib/matching-algorithm';
import { Scheme } from '@prisma/client';

/**
 * Fetches schemes directly mapped to a life event and calculates their match score.
 */
export async function getSchemeRecommendationsForEvent(
    userId: string,
    eventType: LifeEventType,
    userProfile: UserProfileForMatching
) {
    // 1. Get mappings for this event type
    const { data: mappings, error: mapError } = await supabase
        .from('life_event_scheme_mapping')
        .select('scheme_id, priority, recommendation_text')
        .eq('event_type', eventType)
        .order('priority', { ascending: false });

    if (mapError || !mappings || mappings.length === 0) {
        return [];
    }

    const schemeIds = mappings.map((m: any) => m.scheme_id);

    // 2. Fetch full scheme details
    const { data: schemes, error: schemeError } = await supabase
        .from('Scheme')
        .select('*')
        .in('id', schemeIds);

    if (schemeError || !schemes) {
        console.error('Error fetching mapped schemes:', schemeError);
        return [];
    }

    // 3. Calculate match scores and merge with recommendation text
    const recommendations = (schemes as any[]).map(scheme => {
        const matchResult = calculateMatchScore(scheme as Scheme, userProfile);
        const mapping = mappings.find((m: any) => m.scheme_id === scheme.id);

        return {
            ...scheme,
            matchResult,
            recommendationText: mapping?.recommendation_text || 'Highly recommended for your milestone.'
        };
    });

    // 4. Return sorted by score
    return recommendations.sort((a: any, b: any) => (b.matchResult?.score || 0) - (a.matchResult?.score || 0));
}

/**
 * Gets a quick count of potential schemes for a life event without full calculation.
 * Used for the timeline dashboard.
 */
export async function getSchemeCountForEvent(eventType: LifeEventType) {
    const { count, error } = await supabase
        .from('life_event_scheme_mapping')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType);

    if (error) return 0;
    return count || 0;
}
