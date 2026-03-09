/**
 * MSG91 SMS Service integration for India.
 * Handles transactional SMS for premium users.
 */
export class SMSService {
    private static readonly MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    private static readonly MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || "SAHAYG";
    private static readonly MSG91_API_URL = "https://api.msg91.com/api/v5/flow/";

    /**
     * Sends a transactional SMS via MSG91 Flow API
     * Only sends if user is premium and SMS is enabled
     */
    static async sendSMS(
        mobile: string,
        templateId: string,
        params: Record<string, string>,
        isPremium: boolean = false
    ) {
        if (!isPremium) {
            console.warn(`⏭️ SMS skipped for non-premium user: ${mobile}`);
            return { success: true, reason: "NOT_PREMIUM" };
        }

        if (!this.MSG91_AUTH_KEY) {
            console.warn("⚠️ MSG91_AUTH_KEY not set. SMS skipped in development.");
            return { success: true, mock: true };
        }

        try {
            const response = await fetch(this.MSG91_API_URL, {
                method: "POST",
                headers: {
                    "authkey": this.MSG91_AUTH_KEY,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    template_id: templateId,
                    short_url: "0",
                    recipients: [
                        {
                            mobiles: mobile.startsWith('91') ? mobile : `91${mobile}`,
                            ...params
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to send SMS");
            }

            return { success: true };
        } catch (error) {
            console.error("❌ SMS Service Error:", error);
            return { success: false, error };
        }
    }

    /**
     * Reminder for scheme deadline
     */
    static async sendDeadlineReminder(mobile: string, schemeName: string, daysLeft: number, isPremium: boolean) {
        return this.sendSMS(mobile, "65e2b...deadline_template_id", {
            scheme: schemeName,
            days: daysLeft.toString()
        }, isPremium);
    }

    /**
     * Notification for document expiry
     */
    static async sendDocumentExpiryAlert(mobile: string, documentName: string, days: number, isPremium: boolean) {
        return this.sendSMS(mobile, "65e2b...expiry_template_id", {
            document: documentName,
            days: days.toString()
        }, isPremium);
    }
}
