import { Scheme, UserProfile, User } from "@prisma/client";

/**
 * Calculates a match score (0-100) between a scheme and a user profile
 * based on the predefined scoring logic.
 */
export function calculateMatchScore(
    scheme: any,
    user: any,
    profile: any
): number {
    const breakdown = getEligibilityBreakdown(scheme, user, profile);
    if (!breakdown) return 50;

    let score = 0;
    if (breakdown.age.match) score += 20;
    if (breakdown.caste.match) score += 20;
    if (breakdown.income.match) score += 15;
    if (breakdown.location.match) score += 15;
    if (breakdown.education.match) score += 10;
    if (breakdown.gender.match) score += 10;
    if (breakdown.occupation.match) score += 10;

    return Math.min(score, 100);
}

export function getEligibilityBreakdown(scheme: any, user: any, profile: any) {
    if (!profile || !user) return null;

    const criteria = scheme.eligibilityCriteria as any;
    if (!criteria) return null;

    const userAge = calculateAge(user.dateOfBirth);

    return {
        age: {
            label: "Age",
            value: `${userAge} years`,
            requirement: criteria.ageMin || criteria.ageMax ? `${criteria.ageMin || 0}-${criteria.ageMax || 100} years` : "No restriction",
            match: (criteria.ageMin || criteria.ageMax)
                ? (userAge >= (criteria.ageMin || 0) && userAge <= (criteria.ageMax || 100))
                : true
        },
        caste: {
            label: "Caste Category",
            value: profile.casteCategory,
            requirement: criteria.casteCategories ? criteria.casteCategories.join("/") : "All Categories",
            match: criteria.casteCategories ? criteria.casteCategories.includes(profile.casteCategory) : true
        },
        income: {
            label: "Annual Income",
            value: `₹${profile.annualIncome.toLocaleString('en-IN')}`,
            requirement: criteria.incomeMax ? `Up to ₹${criteria.incomeMax.toLocaleString('en-IN')}` : "No restriction",
            match: criteria.incomeMax ? profile.annualIncome <= criteria.incomeMax : true
        },
        location: {
            label: "Resident State",
            value: profile.state,
            requirement: scheme.schemeType === "CENTRAL" ? "All India" : (scheme.state || (criteria.states ? criteria.states.join("/") : "Specific States")),
            match: scheme.schemeType === "CENTRAL" || (scheme.state === profile.state) || (criteria.states?.includes(profile.state)) || (!scheme.state && !criteria.states)
        },
        education: {
            label: "Education",
            value: profile.educationLevel.replace("_", " "),
            requirement: criteria.educationLevels ? criteria.educationLevels.join("/") : "No restriction",
            match: criteria.educationLevels ? criteria.educationLevels.includes(profile.educationLevel) : true
        },
        gender: {
            label: "Gender",
            value: user.gender,
            requirement: criteria.gender ? (Array.isArray(criteria.gender) ? criteria.gender.join("/") : criteria.gender) : "All Genders",
            match: criteria.gender ? (Array.isArray(criteria.gender) ? criteria.gender.includes(user.gender) : criteria.gender === user.gender) : true
        },
        occupation: {
            label: "Occupation",
            value: profile.occupation,
            requirement: criteria.occupation ? criteria.occupation.join("/") : "No restriction",
            match: criteria.occupation ? criteria.occupation.includes(profile.occupation) : true
        }
    };
}

function calculateAge(dob: Date): number {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
