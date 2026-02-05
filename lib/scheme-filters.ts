import { Prisma, SchemeType, SchemeCategory } from '@prisma/client';

export interface SchemeFilters {
    search?: string;
    category?: SchemeCategory[];
    schemeType?: SchemeType;
    state?: string;
    minBenefit?: number;
    maxBenefit?: number;
    deadline?: 'anytime' | '1month' | '3months';
    applicationMode?: string[];
}

/**
 * Builds a Prisma 'where' object for searching and filtering schemes.
 */
export function buildSchemeQuery(filters: SchemeFilters): Prisma.SchemeWhereInput {
    const where: Prisma.SchemeWhereInput = {
        isActive: true,
    };

    const andConditions: Prisma.SchemeWhereInput[] = [];

    // 1. Full-text Search (on name and beneficiary description)
    if (filters.search) {
        andConditions.push({
            OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { benefitDescription: { contains: filters.search, mode: 'insensitive' } },
            ],
        });
    }

    // 2. Category Filter (multi-select)
    if (filters.category && filters.category.length > 0) {
        andConditions.push({
            category: { in: filters.category },
        });
    }

    // 3. Scheme Type Filter
    if (filters.schemeType) {
        andConditions.push({
            schemeType: filters.schemeType,
        });
    }

    // 4. State Filter
    if (filters.state && filters.state !== 'All States') {
        andConditions.push({
            OR: [
                { schemeType: 'CENTRAL' },
                { stateEligible: { has: filters.state } },
            ],
        });
    }

    // 5. Benefit Amount Range
    if (filters.minBenefit !== undefined || filters.maxBenefit !== undefined) {
        andConditions.push({
            benefitAmount: {
                gte: filters.minBenefit ?? 0,
                lte: filters.maxBenefit ?? 10000000,
            },
        });
    }

    // 6. Deadline Filtering
    if (filters.deadline) {
        const now = new Date();
        if (filters.deadline === 'anytime') {
            andConditions.push({ isRolling: true });
        } else if (filters.deadline === '1month') {
            const oneMonth = new Date();
            oneMonth.setMonth(now.getMonth() + 1);
            andConditions.push({
                deadline: {
                    gte: now,
                    lte: oneMonth,
                },
            });
        } else if (filters.deadline === '3months') {
            const threeMonths = new Date();
            threeMonths.setMonth(now.getMonth() + 3);
            andConditions.push({
                deadline: {
                    gte: now,
                    lte: threeMonths,
                },
            });
        }
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    return where;
}
