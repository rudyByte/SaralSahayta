/**
 * AI Confidence Calculator
 * Statistical model for scheme approval probability
 */

export interface ImprovementSuggestion {
    text: string;
    impact: number;
}

export interface ConfidenceBreakdown {
    historicalRate: number;
    docsComplete: number;
    matchScore: number;
}

export interface ConfidenceResult {
    score: number;
    breakdown: ConfidenceBreakdown;
    suggestions: ImprovementSuggestion[];
}

/**
 * Calculate approval confidence score and generate suggestions
 * Formula: (HistoricalRate * 0.5 + DocsComplete * 0.3 + MatchScore * 0.2) * 100
 */
export function calculateConfidence(
    historicalRate: number,
    matchScore: number,
    requiredDocs: string[],
    userDocs: string[]
): ConfidenceResult {
    // Weights: 50% Historical, 30% Documents, 20% Matching
    const W_HIST = 0.5;
    const W_DOCS = 0.3;
    const W_MATCH = 0.2;

    // 1. Calculate document completeness
    const docsComplete = requiredDocs.length > 0
        ? requiredDocs.filter(doc => userDocs.includes(doc)).length / requiredDocs.length
        : 1.0;

    // 2. Final Score
    const score = Math.round(
        (historicalRate * W_HIST + docsComplete * W_DOCS + (matchScore / 100) * W_MATCH) * 100
    );

    // 3. Generate Suggestions
    const suggestions: ImprovementSuggestion[] = [];

    // Document suggestions (Impact = (1/total_docs) * W_DOCS)
    if (docsComplete < 1) {
        const missingDocs = requiredDocs.filter(doc => !userDocs.includes(doc));
        const perDocImpact = Math.round((1 / Math.max(1, requiredDocs.length)) * W_DOCS * 100);
        
        missingDocs.slice(0, 2).forEach(doc => {
            suggestions.push({
                text: `Upload ${doc} to increase odds`,
                impact: perDocImpact
            });
        });
    }

    // Profile suggestions (Impact = (remaining_match) * W_MATCH)
    if (matchScore < 95) {
        const profileImpact = Math.round(((100 - matchScore) / 100) * W_MATCH * 100);
        if (profileImpact > 0) {
            suggestions.push({
                text: "Complete profile details for a better match",
                impact: profileImpact
            });
        }
    }

    // Historical note (No direct action, but good for context)
    if (historicalRate < 0.6) {
        suggestions.push({
            text: "High verification standards apply here",
            impact: 5
        });
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        breakdown: {
            historicalRate,
            docsComplete,
            matchScore: matchScore / 100
        },
        suggestions: suggestions.sort((a, b) => b.impact - a.impact)
    };
}
