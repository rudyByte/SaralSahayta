import { prisma } from "@/lib/prisma";
import { EmailService } from "./email-service";
import { SMSService } from "./sms-service";

export type NotificationType = "DEADLINE" | "EXPIRY" | "MATCH" | "SYSTEM";

export class NotificationManager {
    /**
     * Core method to trigger a notification across all enabled channels
     */
    static async notify(
        userId: string,
        data: {
            title: string;
            message: string;
            type: NotificationType;
            link?: string;
            emailData?: { subject: string; content: string };
            smsData?: { templateId: string; params: Record<string, string> };
        }
    ) {
        try {
            // 1. Fetch user preferences and status
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    notificationPreference: true,
                    profile: { select: { isPremium: true } }
                }
            });

            if (!user) return;

            const prefs = user.notificationPreference || {
                emailEnabled: true,
                smsEnabled: true,
                pushEnabled: true
            };

            // 2. Save In-App Notification
            await prisma.notification.create({
                data: {
                    userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    link: data.link
                }
            });

            // 3. Send Email if enabled
            if (prefs.emailEnabled && user.email) {
                // If specific email data is provided, use it; otherwise, use defaults
                if (data.emailData) {
                    // Manual call to EmailService.sendEmail (private, so we'd need to expose it or add methods)
                    // For now, we assume methods are implemented in EmailService for each type
                }
            }

            // 4. Send SMS if enabled and premium
            if (prefs.smsEnabled && user.profile?.isPremium && data.smsData) {
                await SMSService.sendSMS(
                    user.mobile,
                    data.smsData.templateId,
                    data.smsData.params,
                    true
                );
            }

        } catch (error) {
            console.error("❌ Notification Manager Error:", error);
        }
    }

    /**
     * Specifically for Deadline Reminders
     */
    static async sendDeadlineAlert(userId: string, schemeName: string, daysLeft: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: { select: { isPremium: true } } }
        });
        if (!user) return;

        await this.notify(userId, {
            title: `Deadline Closing: ${schemeName}`,
            message: `The application for ${schemeName} closes in ${daysLeft} days. Don't miss out!`,
            type: "DEADLINE",
            link: "/discover",
            smsData: {
                templateId: "MSG91_DEADLINE_TPL",
                params: { scheme: schemeName, days: daysLeft.toString() }
            }
        });

        if (user.email) {
            await EmailService.sendDeadlineReminder(user.email, user.name, schemeName, daysLeft);
        }
    }

    /**
     * Specifically for Document Expiry
     */
    static async sendExpiryAlert(userId: string, documentName: string, daysLeft: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: { select: { isPremium: true } } }
        });
        if (!user) return;

        await this.notify(userId, {
            title: `Document Expiring: ${documentName}`,
            message: `Your ${documentName} is set to expire in ${daysLeft} days. Please update it.`,
            type: "EXPIRY",
            link: "/documents",
            smsData: {
                templateId: "MSG91_EXPIRY_TPL",
                params: { document: documentName, days: daysLeft.toString() }
            }
        });

        if (user.email) {
            await EmailService.sendDocumentExpiryAlert(user.email, user.name, documentName, daysLeft);
        }
    }
}
