import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpSchema } from "@/lib/validations";
import jwt from "jsonwebtoken";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = otpSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { phone, otp } = validation.data;

        // Verify OTP
        const verification = await prisma.otpVerification.findFirst({
            where: {
                phone,
                otp,
                verified: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!verification) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired OTP" },
                { status: 400 }
            );
        }

        // Mark as verified
        await prisma.otpVerification.update({
            where: { id: verification.id },
            data: { verified: true },
        });

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { phone },
        });

        const isNewUser = !user;

        // If new user, we don't create the full user yet, just a provisional one or pass a flag
        // But for NextAuth Credentials flow, we typically need a user record to persist session.
        // Strategy: Create a partial user record or handle registration later.
        // Requirement says: "If new user: create user record with phone only"

        if (isNewUser) {
            // Create basic user
            // Note: Password is required in schema, so we set a dummy hash or make it optional.
            // Assuming we update schema to make password optional OR use a specific flag/dummy.
            // Schema definition says password String (required).
            // Let's modify logic: Schema update required IF password is strictly mandatory.
            // However, for OTP login, passwordless is common.
            // Let's assume we set a random string as password since they log in via OTP.

            user = await prisma.user.create({
                data: {
                    phone,
                    password: "OTP-LOGIN-NO-PASSWORD", // Not usable for password login
                    fullName: "New User", // Placeholder
                    dateOfBirth: new Date(), // Placeholder
                    gender: "OTHER", // Placeholder
                }
            });
        }

        // Generate JWT token for NextAuth to consume
        const token = jwt.sign(
            { userId: user!.id, phone: user!.phone, isNewUser },
            SECRET,
            { expiresIn: "1h" }
        );

        return NextResponse.json({
            success: true,
            token,
            isNewUser,
        });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
