import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️ Razorpay keys are missing from environment variables');
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Verify Razorpay Webhook Signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    return expectedSignature === signature;
}

/**
 * Verify Payment Signature (Client side verify)
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string
): boolean {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');
    
    return expectedSignature === signature;
}
