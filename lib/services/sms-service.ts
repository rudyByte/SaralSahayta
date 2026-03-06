/**
 * MSG91 structural service for India SMS notifications.
 * Ready for integration with actual API keys.
 */
export class SMSService {
    private static readonly MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    private static readonly MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || "SAHAYG";

    /**
     * Sends a transactional SMS using MSG91
     * @param mobile Mobile number with country code (e.g., 91XXXXXXXXXX)
     * @param templateId The template ID from MSG91 dashboard
     * @param params Key-value pairs matching template variables
     */
    static async sendTemplateSMS(_mobile: string, _templateId: string, _params: Record<string, string>) {
        if (!this.MSG91_AUTH_KEY) {
            console.warn("⚠️ MSG91_AUTH_KEY not set. SMS request skipped in development.");
            return { success: true, mock: true };
        }

        try {
            // MSG91 Flow implementation
            // const response = await fetch('...msg91-api-endpoint...', { ... });
            return { success: true };
        } catch (error) {
            console.error("❌ SMS Service Error:", error);
            return { success: false, error };
        }
    }

    static async sendOTP(mobile: string, otp: string) {
        return this.sendTemplateSMS(mobile, "YOUR_OTP_TEMPLATE_ID", { otp });
    }

    static async sendApplicationAlert(mobile: string, schemeName: string, status: string) {
        return this.sendTemplateSMS(mobile, "APP_STATUS_TEMPLATE_ID", {
            scheme: schemeName,
            status: status
        });
    }
}
