import { Scheme, Gender, Category, Education } from '@prisma/client';

export interface EligibilityCriteria {
    ageMin?: number;
    ageMax?: number;
    casteCategories?: Category[];
    incomeMax?: number;
    states?: string[];
    educationLevels?: Education[];
    gender?: Gender[];
    occupation?: string[];
}

export interface UserProfileForMatching {
    age?: number;
    gender: Gender;
    category: Category;
    annualIncome?: number;
    state: string;
    education?: Education | null;
    occupation?: string | null;
    profileCompletionPercentage: number;
}

/**
 * Calculates a match score between a scheme and a user profile.
 * Returns null if the user profile is incomplete (< 80%).
 * Returns 50 if eligibility criteria is missing.
 */
export function calculateMatchScore(
    scheme: Scheme,
    userProfile: UserProfileForMatching
): number | null {
    // 1. Check for incomplete profile
    if (userProfile.profileCompletionPercentage < 80) {
        return null;
    }

    const criteria = scheme.eligibilityCriteria as unknown as EligibilityCriteria;

    // 2. Default if no criteria
    if (!criteria || Object.keys(criteria).length === 0) {
        return 50;
    }

    let score = 0;

    // 1. Age (20 points)
    if (userProfile.age !== undefined) {
        const ageMin = criteria.ageMin ?? 0;
        const ageMax = criteria.ageMax ?? 150;
        if (userProfile.age >= ageMin && userProfile.age <= ageMax) {
            score += 20;
        }
    } else {
        // If scheme has no age restriction, give points
        if (criteria.ageMin === undefined && criteria.ageMax === undefined) {
            score += 20;
        }
    }

    // 2. Caste Category (20 points)
    if (criteria.casteCategories && criteria.casteCategories.length > 0) {
        if (criteria.casteCategories.includes(userProfile.category)) {
            score += 20;
        }
    } else {
        score += 20; // No restriction
    }

    // 3. Income (15 points)
    if (criteria.incomeMax !== undefined && userProfile.annualIncome !== undefined) {
        if (userProfile.annualIncome <= criteria.incomeMax) {
            score += 15;
        }
    } else {
        score += 15; // No restriction
    }

    // 4. State (15 points)
    if (scheme.schemeType === 'CENTRAL') {
        score += 15;
    } else if (criteria.states && criteria.states.length > 0) {
        if (criteria.states.includes(userProfile.state)) {
            score += 15;
        }
    } else {
        score += 15; // Central or no specific state list
    }

    // 5. Education (10 points)
    if (criteria.educationLevels && criteria.educationLevels.length > 0) {
        if (userProfile.education && criteria.educationLevels.includes(userProfile.education)) {
            score += 10;
        }
    } else {
        score += 10; // No restriction
    }

    // 6. Gender (10 points)
    if (criteria.gender && criteria.gender.length > 0) {
        if (criteria.gender.includes(userProfile.gender)) {
            score += 10;
        }
    } else {
        score += 10; // No restriction
    }

    // 7. Occupation (10 points)
    if (criteria.occupation && criteria.occupation.length > 0) {
        if (userProfile.occupation && criteria.occupation.includes(userProfile.occupation)) {
            score += 10;
        }
    } else {
        score += 10; // No restriction
    }

    return Math.min(100, score);
}
