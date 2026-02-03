import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildSchemeQuery } from "@/lib/scheme-filters";
import { calculateMatchScore } from "@/lib/matching-algorithm";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    // Extract filters from searchParams
    const filters = {
        search: searchParams.get("search"),
        category: searchParams.getAll("category"),
        schemeType: searchParams.get("schemeType"),
        state: searchParams.get("state"),
        minBenefit: searchParams.get("minBenefit") ? parseInt(searchParams.get("minBenefit")!) : undefined,
        maxBenefit: searchParams.get("maxBenefit") ? parseInt(searchParams.get("maxBenefit")!) : undefined,
        deadline: searchParams.get("deadline"),
        applicationMode: searchParams.getAll("applicationMode"),
        sortBy: searchParams.get("sortBy") || "relevance",
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "20"),
    };

    try {
        const where = buildSchemeQuery(filters);
        const skip = (filters.page - 1) * filters.limit;

        // Determine sorting
        let orderBy: any = { createdAt: "desc" };
        if (filters.sortBy === "deadline") orderBy = { applicationDeadline: "asc" };
        if (filters.sortBy === "benefit") orderBy = { benefitAmount: "desc" };
        if (filters.sortBy === "recent") orderBy = { createdAt: "desc" };

        // Fetch Schemes
        const [schemes, total] = await Promise.all([
            prisma.scheme.findMany({
                where,
                skip,
                take: filters.limit,
                orderBy,
            }),
            prisma.scheme.count({ where }),
        ]);

        // Handle Match Scores if User is logged in and profile is ready
        let schemesWithScores = schemes.map(s => ({ ...s, matchScore: null }));

        if (session?.user) {
            const user = await prisma.user.findUnique({
                where: { phone: (session.user as any).phone },
                include: { userProfile: true },
            });

            if (user && user.userProfile && user.userProfile.profileCompletionPercentage >= 80) {
                // Calculate and optionally store scores
                schemesWithScores = schemes.map(scheme => {
                    const score = calculateMatchScore(scheme, user, user.userProfile);
                    return { ...scheme, matchScore: score };
                });

                // Re-sort by match score if relevance is selected
                if (filters.sortBy === "relevance" || filters.sortBy === "matchScore") {
                    schemesWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                }

                // Logic to store/update matches in DB periodically could go here
            }
        }

        return NextResponse.json({
            success: true,
            schemes: schemesWithScores,
            total,
            page: filters.page,
            totalPages: Math.ceil(total / filters.limit),
        });
    } catch (error) {
        console.error("Fetch Schemes Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
