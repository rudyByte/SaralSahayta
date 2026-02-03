import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validation = profileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { fullName, dateOfBirth, gender, email } = validation.data;
        const phone = session.user.phone; // Assuming phone is in session

        // Update User
        const updatedUser = await prisma.user.update({
            where: { phone },
            data: {
                fullName,
                dateOfBirth: new Date(dateOfBirth),
                gender,
                email: email || undefined,
            }
        });

        // Initialize empty UserProfile if not exists
        await prisma.userProfile.create({
            data: {
                userId: updatedUser.id,
                casteCategory: "GENERAL", // Default, user to update later
                annualIncome: 0,
                state: "",
                district: "",
                educationLevel: "BELOW_10TH",
                occupation: "OTHER",
                disabilityStatus: false
            }
        }).catch(() => {
            // Ignore if profile already exists (race condition or re-submission)
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Complete Profile Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
