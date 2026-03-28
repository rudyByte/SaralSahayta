export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
    try {
        const supabaseAdmin = createAdminClient();
        const body = await request.text(); // Raw body for signature verification
        const signature = request.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return NextResponse.json({ error: 'Verification headers missing' }, { status: 400 });
        }

        const isValid = verifyWebhookSignature(body, signature, secret);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(body);
        const event = payload.event;

        if (event === 'payment.captured') {
            const payment = payload.payload.payment.entity;
            const notes = payment.notes;
            const userId = notes.userId;
            const type = notes.type;
            const schemeId = notes.schemeId;
            const orderId = payment.order_id;
            const amount = payment.amount / 100; // in INR

            // 1. Log Transaction
            const { error: txError } = await supabaseAdmin
                .from('PremiumTransaction')
                .insert({
                    id: nanoid(),
                    userId: userId,
                    amount: amount,
                    status: 'COMPLETED',
                    provider: 'RAZORPAY',
                    orderId: orderId,
                    paymentId: payment.id,
                });

            if (txError) throw txError;

            // 2. Handle Plan Types
            if (type === 'monthly') {
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 1);

                await supabaseAdmin
                    .from('user_profiles')
                    .update({
                        is_premium: true,
                        premium_expires_at: expiresAt.toISOString(),
                    })
                    .eq('user_id', userId);
            } 
            else if (type === 'per_scheme' && schemeId) {
                // Determine applicationId first (assuming there's an existing application)
                // In a robust system, we would have passed applicationId in notes
                // For now, let's find the current draft/submitted application for this user and scheme
                const { data: application } = await supabaseAdmin
                    .from('applications')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('scheme_id', schemeId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (application) {
                    await supabaseAdmin
                        .from('application_premium')
                        .upsert({
                            application_id: application.id,
                            service_type: 'FAST_TRACK',
                            status: 'ACTIVE'
                        });
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[Razorpay Webhook] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
