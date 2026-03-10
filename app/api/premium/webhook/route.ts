import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature || !verifyWebhookSignature(bodyText, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const body = JSON.parse(bodyText);

        // Handle only payment.captured events
        if (body.event !== 'payment.captured') {
            return NextResponse.json({ success: true, message: 'Event ignored' });
        }

        const payment = body.payload.payment.entity;
        const supabase = createClient();

        // Find the transaction using the order_id
        const orderId = payment.order_id;
        if (!orderId) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
        }

        // We can use prisma directly since it's a backend operation without RLS context
        const transaction = await prisma.premiumTransaction.findUnique({
            where: { orderId: orderId }
        });

        if (!transaction) {
            console.error(`Transaction not found for Order ID: ${orderId}`);
            // If not found in Prisma, try fetching order details directly from Razorpay to figure out context
            return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
        }

        if (transaction.status === 'COMPLETED') {
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // Use a transaction to ensure atomic updates
        await prisma.$transaction(async (tx) => {
            // 1. Update Transaction Status
            await tx.premiumTransaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    paymentId: payment.id,
                    signature: signature
                }
            });

            // Retrieve Context Notes (we should have stored these when creating the order, 
            // but Razorpay also sends them back in the webhook if attached to the order or payment)
            const notes = payment.notes || {};
            const planType = notes.planType;
            const userId = transaction.userId;

            // 2. Apply Premium Benefits Based on Plan Type
            if (planType === 'monthly') {
                // Grant global premium status for 30 days
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);

                await tx.userProfile.update({
                    where: { userId: userId },
                    data: {
                        isPremium: true,
                        premiumExpiresAt: expiryDate
                    }
                });

                // Optionally create an in-app notification
                await tx.notification.create({
                    data: {
                        userId: userId,
                        title: 'Premium Subscription Active!',
                        message: 'Your monthly premium subscription plan is now active.',
                        type: 'SYSTEM',
                        isRead: false
                    }
                });

            } else if (planType === 'per_scheme') {
                const applicationId = notes.applicationId;
                if (applicationId) {
                    // Create ApplicationPremium record to fast-track
                    await tx.applicationPremium.create({
                        data: {
                            applicationId: applicationId,
                            serviceType: 'FAST_TRACK',
                            status: 'ACTIVE'
                        }
                    });

                    // Optionally create an in-app notification
                    await tx.notification.create({
                        data: {
                            userId: userId,
                            title: 'Application Fast-Tracked!',
                            message: 'Your application has been fast-tracked for priority processing.',
                            type: 'SYSTEM',
                            link: `/applications/${applicationId}`,
                            isRead: false
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Error processing webhook' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
