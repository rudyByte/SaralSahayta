import { Prisma } from "@prisma/client";

export function buildSchemeQuery(filters: any) {
    const where: Prisma.SchemeWhereInput = {
        activeStatus: true,
    };

    // Search
    if (filters.search) {
        where.OR = [
            { schemeName: { contains: filters.search, mode: "insensitive" } },
            { targetBeneficiary: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    // Categories
    if (filters.category && filters.category.length > 0) {
        where.category = { in: filters.category };
    }

    // Scheme Type
    if (filters.schemeType && filters.schemeType !== "ALL") {
        where.schemeType = filters.schemeType;
    }

    // State
    if (filters.state && filters.state !== "ALL") {
        where.OR = [
            { state: filters.state },
            { state: null }, // Central schemes usually have no state
            { schemeType: "CENTRAL" }
        ];
    }

    // Benefit Amount
    if (filters.minBenefit !== undefined || filters.maxBenefit !== undefined) {
        where.benefitAmount = {
            gte: filters.minBenefit || 0,
            lte: filters.maxBenefit || 10000000,
        };
    }

    // Application Mode
    if (filters.applicationMode && filters.applicationMode.length > 0) {
        where.applicationMode = { in: filters.applicationMode };
    }

    // Deadline Filter
    if (filters.deadline) {
        const now = new Date();
        if (filters.deadline === "1month") {
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(now.getMonth() + 1);
            where.applicationDeadline = {
                gte: now,
                lte: oneMonthLater,
            };
        } else if (filters.deadline === "3months") {
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(now.getMonth() + 3);
            where.applicationDeadline = {
                gte: now,
                lte: threeMonthsLater,
            };
        } else if (filters.deadline === "anytime") {
            where.applicationDeadline = null;
        }
    }

    return where;
}
