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

export interface MatchResult {
    score: number;
    matched: string[];
    missing: string[];
}

/**
 * Calculates a match score between a scheme and a user profile.
 * Returns null if the user profile is incomplete (< 80%).
 * Returns a default score if eligibility criteria is missing.
 */
export function calculateMatchScore(
    scheme: Scheme,
    userProfile: UserProfileForMatching
): MatchResult | null {
    // 1. Check for incomplete profile
    if (userProfile.profileCompletionPercentage < 80) {
        return null;
    }

    const criteria = scheme.eligibilityCriteria as unknown as EligibilityCriteria;

    // 2. Default if no criteria
    if (!criteria || Object.keys(criteria).length === 0) {
        return {
            score: 50,
            matched: ['General Eligibility'],
            missing: []
        };
    }

    let score = 0;
    const matched: string[] = [];
    const missing: string[] = [];

    // 1. State (25 points) - CRITICAL
    if (scheme.schemeType === 'CENTRAL') {
        score += 25;
        matched.push('Central Scheme (Available in Maharashtra)');
    } else if (criteria.states && criteria.states.length > 0) {
        if (criteria.states.includes(userProfile.state)) {
            score += 25;
            matched.push(`${userProfile.state} state matches`);
        } else {
            missing.push(`Restricted to ${criteria.states.join(', ')}`);
        }
    } else {
        score += 25; // No state restriction
        matched.push('Available across India');
    }

    // 2. Gender (15 points) - CRITICAL
    if (criteria.gender && criteria.gender.length > 0) {
        if (criteria.gender.includes(userProfile.gender)) {
            score += 15;
            matched.push(`Gender (${userProfile.gender}) matches`);
        } else {
            missing.push(`Restricted to ${criteria.gender.join(', ')}`);
        }
    } else {
        score += 15;
        matched.push('All genders eligible');
    }

    // 3. Category (20 points) - HIGH
    if (criteria.casteCategories && criteria.casteCategories.length > 0) {
        if (criteria.casteCategories.includes(userProfile.category)) {
            score += 20;
            matched.push(`Category (${userProfile.category}) matches`);
        } else {
            missing.push(`Restricted to ${criteria.casteCategories.join(', ')}`);
        }
    } else {
        score += 20;
        matched.push('All categories eligible');
    }

    // 4. Age (15 points)
    const ageMin = criteria.ageMin ?? 0;
    const ageMax = criteria.ageMax ?? 150;
    if (userProfile.age !== undefined) {
        if (userProfile.age >= ageMin && userProfile.age <= ageMax) {
            score += 15;
            matched.push('Age within required range');
        } else {
            missing.push(`Age ${userProfile.age} is outside ${ageMin}-${ageMax}`);
        }
    } else {
        if (criteria.ageMin === undefined && criteria.ageMax === undefined) {
            score += 15;
            matched.push('No age restrictions');
        } else {
            missing.push('Age not provided in profile');
        }
    }

    // 5. Income (10 points)
    if (criteria.incomeMax !== undefined) {
        if (userProfile.annualIncome !== undefined) {
            if (userProfile.annualIncome <= criteria.incomeMax) {
                score += 10;
                matched.push('Income within eligible limit');
            } else {
                missing.push(`Income ₹${userProfile.annualIncome.toLocaleString()} exceeds ₹${criteria.incomeMax.toLocaleString()}`);
            }
        } else {
            missing.push('Income missing in profile');
        }
    } else {
        score += 10;
        matched.push('No income restrictions');
    }

    // 6. Education & Occupation (15 points total)
    let eduMatch = true;
    if (criteria.educationLevels && criteria.educationLevels.length > 0) {
        if (userProfile.education && criteria.educationLevels.includes(userProfile.education)) {
            score += 10;
            matched.push(`${userProfile.education} education matches`);
        } else {
            eduMatch = false;
            missing.push(`Requires ${criteria.educationLevels.join('/')}`);
        }
    } else {
        score += 10;
        matched.push('No education restrictions');
    }

    if (criteria.occupation && criteria.occupation.length > 0) {
        if (userProfile.occupation && criteria.occupation.includes(userProfile.occupation)) {
            score += 5;
            matched.push(`${userProfile.occupation} occupation matches`);
        } else {
            missing.push(`Requires ${criteria.occupation.join('/')}`);
        }
    } else {
        score += 5;
        matched.push('No occupation restrictions');
    }

    return {
        score: Math.min(100, score),
        matched,
        missing
    };
}
