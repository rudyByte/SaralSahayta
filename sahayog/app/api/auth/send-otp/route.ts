import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, sendOTP } from "@/lib/sms";
import { phoneSchema } from "@/lib/validations";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = phoneSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { phone } = validation.data;

        // Rate Limiting: Max 3 OTPs in 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const otpCount = await prisma.otpVerification.count({
            where: {
                phone,
                createdAt: { gt: fifteenMinutesAgo },
            },
        });

        if (otpCount >= 3) {
            return NextResponse.json(
                { success: false, error: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to DB
        await prisma.otpVerification.create({
            data: {
                phone,
                otp,
                expiresAt,
            },
        });

        // Send SMS
        const smsSent = await sendOTP(phone, otp);

        if (!smsSent) {
            return NextResponse.json(
                { success: false, error: "Failed to send SMS" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("Send OTP Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
