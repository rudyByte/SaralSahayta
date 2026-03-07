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
    // 1. Calculate document completeness
    const docsComplete = requiredDocs.length > 0
        ? requiredDocs.filter(doc => userDocs.includes(doc)).length / requiredDocs.length
        : 1.0;

    // 2. Final Score
    const score = Math.round(
        (historicalRate * 0.5 + docsComplete * 0.3 + (matchScore / 100) * 0.2) * 100
    );

    // 3. Generate Suggestions
    const suggestions: ImprovementSuggestion[] = [];

    // Document suggestions
    if (docsComplete < 1) {
        const missingDocs = requiredDocs.filter(doc => !userDocs.includes(doc));
        missingDocs.slice(0, 2).forEach(doc => {
            suggestions.push({
                text: `Upload ${doc} to increase approval odds`,
                impact: Math.round(30 / Math.max(1, requiredDocs.length))
            });
        });
    }

    // Profile suggestions
    if (matchScore < 95) {
        suggestions.push({
            text: "Complete your profile details for better matching",
            impact: 10
        });
    }

    // Verification suggestions
    if (historicalRate < 0.6) {
        suggestions.push({
            text: "This scheme has high verification standards. Double-check all inputs.",
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
