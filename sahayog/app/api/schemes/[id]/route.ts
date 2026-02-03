import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateMatchScore, getEligibilityBreakdown } from "@/lib/matching-algorithm";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    const id = params.id;

    try {
        const scheme = await prisma.scheme.findUnique({
            where: { id },
        });

        if (!scheme) {
            return NextResponse.json({ success: false, error: "Scheme not found" }, { status: 404 });
        }

        let matchData: any = { matchScore: null, breakdown: null };

        if (session?.user) {
            const user = await prisma.user.findUnique({
                where: { phone: (session.user as any).phone },
                include: { userProfile: true },
            });

            if (user && user.userProfile) {
                const score = calculateMatchScore(scheme, user, user.userProfile);
                const breakdown = getEligibilityBreakdown(scheme, user, user.userProfile);
                matchData = {
                    matchScore: score,
                    breakdown,
                    isProfileComplete: user.userProfile.profileCompletionPercentage >= 80
                };
            }
        }

        return NextResponse.json({
            success: true,
            scheme,
            ...matchData
        });
    } catch (error) {
        console.error("Fetch Scheme Detail Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
