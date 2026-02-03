import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    profileBasicSchema,
    profileEligibilitySchema,
    profileBankSchema
} from "@/lib/validations";

// Helper to calculate profile completion percentage
function calculateCompletion(user: any, profile: any) {
    let score = 0;

    // Basic Info (30% total, 5 fields ~6% each)
    const basicFields = [user.fullName, user.email, user.dateOfBirth, user.gender, user.phone];
    const basicFilled = basicFields.filter(f => !!f).length;
    score += (basicFilled / basicFields.length) * 30;

    // Eligibility Details (50% total, 8 fields ~6.25% each)
    const eligFields = [
        profile?.casteCategory,
        profile?.annualIncome !== undefined,
        profile?.state,
        profile?.district,
        profile?.educationLevel,
        profile?.occupation,
        profile?.disabilityStatus !== undefined
    ];
    const eligFilled = eligFields.filter(f => !!f).length;
    score += (eligFilled / 8) * 50; // 8th field is disabilityType (conditionally required)

    // Bank Details (20% total, 2 fields 10% each)
    const bankFields = [profile?.bankAccount, profile?.bankIFSC];
    const bankFilled = bankFields.filter(f => !!f).length;
    score += (bankFilled / bankFields.length) * 20;

    return Math.round(score);
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { phone: (session.user as any).phone },
        include: { userProfile: true },
    });

    if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const completionPercent = calculateCompletion(user, user.userProfile);

    return NextResponse.json({
        success: true,
        user: {
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
        },
        profile: user.userProfile,
        completionPercentage: completionPercent,
    });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const phone = (session.user as any).phone;

        // Determine which part of the profile is being updated
        // For simplicity, we can try to validate against all if present, or split
        // Here we'll handle a partial merge update

        const userUpdate: any = {};
        if (body.fullName) userUpdate.fullName = body.fullName;
        if (body.email !== undefined) userUpdate.email = body.email;
        if (body.dateOfBirth) userUpdate.dateOfBirth = new Date(body.dateOfBirth);
        if (body.gender) userUpdate.gender = body.gender;

        const profileUpdate: any = {};
        const allowedProfileFields = [
            "casteCategory", "annualIncome", "state", "district",
            "educationLevel", "occupation", "disabilityStatus",
            "disabilityType", "bankAccount", "bankIFSC"
        ];

        allowedProfileFields.forEach(field => {
            if (body[field] !== undefined) {
                profileUpdate[field] = body[field];
            }
        });

        // Special logic: If disabilityStatus is false, clear disabilityType
        if (profileUpdate.disabilityStatus === false) {
            profileUpdate.disabilityType = "";
        }

        // Perform Update
        const updatedUser = await prisma.user.update({
            where: { phone },
            data: {
                ...userUpdate,
                userProfile: {
                    update: profileUpdate,
                },
            },
            include: { userProfile: true },
        });

        // Recalculate completion
        const completionPercentage = calculateCompletion(updatedUser, updatedUser.userProfile);

        // Update completion in DB
        await prisma.userProfile.update({
            where: { userId: updatedUser.id },
            data: { profileCompletionPercentage: completionPercentage }
        });

        return NextResponse.json({
            success: true,
            user: {
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                dateOfBirth: updatedUser.dateOfBirth,
                gender: updatedUser.gender,
            },
            profile: updatedUser.userProfile,
            completionPercentage,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
