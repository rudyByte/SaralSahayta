import RazorpaySDK from 'razorpay';
import crypto from 'crypto';

// Lazy initialization — do NOT create the instance at module load time
// because Next.js static analysis evaluates modules at build time,
// and throwing/warning here crashes the build.
let _instance: RazorpaySDK | null = null;

function getRazorpayInstance(): RazorpaySDK {
    if (_instance) return _instance;
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    _instance = new RazorpaySDK({ key_id: keyId, key_secret: keySecret });
    return _instance;
}

export const razorpay = new Proxy({} as RazorpaySDK, {
    get(_target, prop) {
        return getRazorpayInstance()[prop as keyof RazorpaySDK];
    }
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
