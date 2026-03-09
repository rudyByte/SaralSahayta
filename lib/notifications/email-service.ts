/**
 * Brevo (formerly Sendinblue) Email Service integration.
 * Handles transactional emails for deadlines, expiries, and updates.
 */
export class EmailService {
    private static readonly BREVO_API_KEY = process.env.BREVO_API_KEY;
    private static readonly BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
    private static readonly SENDER_EMAIL = process.env.SENDER_EMAIL || "notifications@saralsahayta.in";
    private static readonly SENDER_NAME = process.env.SENDER_NAME || "Saral Sahayta";

    /**
     * Sends a transactional email via Brevo REST API
     */
    private static async sendEmail(to: string, subject: string, htmlContent: string) {
        if (!this.BREVO_API_KEY) {
            console.warn("⚠️ BREVO_API_KEY not set. Email skipped in development.");
            return { success: true, mock: true };
        }

        try {
            const response = await fetch(this.BREVO_API_URL, {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": this.BREVO_API_KEY,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    sender: { name: this.SENDER_NAME, email: this.SENDER_EMAIL },
                    to: [{ email: to }],
                    subject: subject,
                    htmlContent: htmlContent
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to send email");
            }

            return { success: true };
        } catch (error) {
            console.error("❌ Email Service Error:", error);
            return { success: false, error };
        }
    }

    /**
     * Notification for upcoming scheme deadline
     */
    static async sendDeadlineReminder(email: string, userName: string, schemeName: string, daysLeft: number) {
        const subject = `⚠️ Deadline Alert: ${schemeName} is Closing Soon!`;
        const content = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>Hello ${userName},</h2>
                <p>This is a reminder that the application deadline for <strong>${schemeName}</strong> is in <strong>${daysLeft} days</strong>.</p>
                <p>Ensure you have all documents ready and submit your application before it closes.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/discover" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">Complete Application</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Best regards,<br>The Saral Sahayta Team</p>
            </div>
        `;
        return this.sendEmail(email, subject, content);
    }

    /**
     * Notification for document expiry
     */
    static async sendDocumentExpiryAlert(email: string, userName: string, documentName: string, daysToExpiry: number) {
        const subject = `📄 Document Action Required: ${documentName}`;
        const content = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>Hello ${userName},</h2>
                <p>Your document <strong>${documentName}</strong> is set to expire in <strong>${daysToExpiry} days</strong>.</p>
                <p>Please update or re-upload a valid document to ensure your scheme eligibility remains active.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/documents" style="background: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">Update Documents</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Best regards,<br>The Saral Sahayta Team</p>
            </div>
        `;
        return this.sendEmail(email, subject, content);
    }

    /**
     * New scheme match notification
     */
    static async sendNewSchemeMatch(email: string, userName: string, schemeName: string, matchScore: number) {
        const subject = `✨ New Scheme Match: ${schemeName} (${matchScore}%)`;
        const content = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>Hello ${userName},</h2>
                <p>We found a new scheme that matches your profile with a <strong>${matchScore}%</strong> probability of success!</p>
                <h3>${schemeName}</h3>
                <p>Check the details and apply now to secure your benefits.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/discover" style="background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">View Scheme</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Best regards,<br>The Saral Sahayta Team</p>
            </div>
        `;
        return this.sendEmail(email, subject, content);
    }
}
