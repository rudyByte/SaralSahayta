import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/payments/razorpay';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { planType, schemeId, applicationId } = body;

        // 2. Validate input
        if (!planType || !['monthly', 'per_scheme'].includes(planType)) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        if (planType === 'per_scheme' && (!schemeId || !applicationId)) {
            return NextResponse.json({ error: 'Scheme ID and Application ID required for per-scheme premium' }, { status: 400 });
        }

        // 3. Determine amount based on plan type (Amounts are in paise, so multiply by 100)
        let amount = 0;
        let notes: any = {
            userId: user.id,
            planType: planType
        };

        if (planType === 'monthly') {
            amount = 19900; // ₹199
            notes.description = 'Monthly Premium Subscription';
        } else if (planType === 'per_scheme') {
            amount = 9900; // ₹99
            notes.schemeId = schemeId;
            notes.applicationId = applicationId;
            notes.description = `Priority Processing for Application ${applicationId}`;
        }

        // 4. Create Razorpay Order
        const receiptId = `rcpt_${crypto.randomBytes(8).toString('hex')}`;

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: receiptId,
            notes: notes
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
        }

        // 5. Create Pending Transaction Record in Database
        const { error: dbError } = await supabase.from('PremiumTransaction').insert({
            userId: user.id,
            amount: amount / 100, // Store in actual INR, not paise
            currency: order.currency,
            status: 'PENDING',
            orderId: order.id,
            provider: 'RAZORPAY'
        });

        if (dbError) {
            console.error('Failed to record pending transaction:', dbError);
            // We can still return the order to the user even if the pending record fails to insert, 
            // as the webhook will be the ultimate source of truth. But ideally, it shouldn't fail.
        }

        // 6. Return order details
        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID // Send publishable key to client
        });

    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
