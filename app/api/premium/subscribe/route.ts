import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/payments/razorpay';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, schemeId } = body; // type is 'monthly' or 'per_scheme'

        const amount = type === 'monthly' ? 199 : 99;
        const currency = 'INR';

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency,
            receipt: `receipt_${nanoid()}`,
            notes: {
                userId: user.id,
                type,
                schemeId: schemeId || null,
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error: any) {
        console.error('[Subscribe API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create subscription order' },
            { status: 500 }
        );
    }
}
