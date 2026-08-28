/**
 * AI Confidence Calculator
 * Statistical model for scheme approval probability.
 */

export interface ImprovementSuggestion {
    text: string;
    impact: number;
}

export interface ConfidenceBreakdown {
    historicalRate: number;
    docsComplete: number;
}

export interface ConfidenceResult {
    score: number;
    breakdown: ConfidenceBreakdown;
    suggestions: ImprovementSuggestion[];
}

/**
 * Calculate approval confidence score and generate suggestions.
 * Formula: (HistoricalRate * 0.7 + DocsComplete * 0.3) * 100
 */
export function calculateConfidence(
    historicalRate: number,
    requiredDocs: string[],
    userDocs: string[]
): ConfidenceResult {
    const W_HIST = 0.7;
    const W_DOCS = 0.3;

    const normalizedUserDocs = userDocs.map((doc) => doc.trim().toUpperCase());

    const isDocUploaded = (reqCode: string) => {
        const reqNorm = reqCode.trim().toUpperCase();
        return normalizedUserDocs.some((code) => code === reqNorm || code.includes(reqNorm) || reqNorm.includes(code));
    };

    const docsComplete = requiredDocs.length > 0
        ? requiredDocs.filter((reqCode) => isDocUploaded(reqCode)).length / requiredDocs.length
        : 1;

    const score = Math.round((historicalRate * W_HIST + docsComplete * W_DOCS) * 100);
    const suggestions: ImprovementSuggestion[] = [];

    if (requiredDocs.length > 0 && docsComplete < 1) {
        const missingDocs = requiredDocs.filter((doc) => !isDocUploaded(doc));
        const perDocImpact = Math.round((1 / Math.max(1, requiredDocs.length)) * W_DOCS * 100);

        missingDocs.slice(0, 2).forEach((doc) => {
            suggestions.push({
                text: `Upload ${doc} to increase odds`,
                impact: perDocImpact,
            });
        });
    }

    if (historicalRate < 0.6) {
        suggestions.push({
            text: 'High verification standards apply here',
            impact: 5,
        });
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        breakdown: {
            historicalRate,
            docsComplete,
        },
        suggestions: suggestions.sort((a, b) => b.impact - a.impact),
    };
}
