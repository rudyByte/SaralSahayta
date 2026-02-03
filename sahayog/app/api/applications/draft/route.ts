import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { schemeId } = await req.json();
        const phone = (session.user as any).phone;

        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Check for existing application
        const existing = await prisma.application.findFirst({
            where: {
                userId: user.id,
                schemeId,
            },
        });

        if (existing) {
            if (existing.status === "DRAFT") {
                return NextResponse.json({ success: true, applicationId: existing.id, message: "Continuing existing draft" });
            } else {
                return NextResponse.json({ success: false, error: "You have already applied for this scheme" }, { status: 400 });
            }
        }

        // Create new DRAFT application
        const application = await prisma.application.create({
            data: {
                userId: user.id,
                schemeId,
                status: "DRAFT",
                appliedDate: new Date(),
            },
        });

        return NextResponse.json({ success: true, applicationId: application.id });
    } catch (error) {
        console.error("Create Draft Application Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
