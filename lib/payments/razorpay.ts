import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
// In a production environment, ensure these keys are strictly set in your environment variables
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET',
});

/**
 * Verifies the signature of a Razorpay webhook or payment verification callback
 * 
 * @param {string} orderId - The order ID returned from Razorpay
 * @param {string} paymentId - The payment ID returned from Razorpay
 * @param {string} signature - The signature returned from Razorpay
 * @returns {boolean} True if the signature is valid, false otherwise
 */
export const verifyPaymentSignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET';
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return generatedSignature === signature;
    } catch (error) {
        console.error('Error verifying payment signature:', error);
        return false;
    }
};

/**
 * Verifies the signature of a Razorpay webhook payload
 * 
 * @param {string} payload - The raw JSON body of the webhook event
 * @param {string} signature - The X-Razorpay-Signature header value
 * @returns {boolean} True if the signature is valid, false otherwise
 */
export const verifyWebhookSignature = (
    payload: string,
    signature: string
): boolean => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
};
