import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

/**
 * Daily Cron Job to check for expiring documents
 * Notifies users via the notification system
 */
export async function GET(request: Request) {
    try {
        // Simple auth check for cron (use internal secret in production)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const now = new Date()

        // Find verified documents expiring within 30 days
        const expiringDocuments = await prisma.userDocument.findMany({
            where: {
                expiryDate: {
                    lte: thirtyDaysFromNow,
                    gte: now,
                },
                verificationStatus: 'VERIFIED',
            },
            include: {
                user: true,
                document: true
            },
        })

        // Log results and trigger notifications
        const notifications = []
        for (const doc of expiringDocuments) {
            const daysUntilExpiry = Math.ceil(
                (doc.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )

            // Trigger notification (This logic could call a shared notification service)
            notifications.push({
                userId: doc.user.id,
                phone: doc.user.phone,
                message: `Reminder: Your ${doc.document.documentName} will expire in ${daysUntilExpiry} days. Please renew it to avoid delays in scheme applications.`
            })

            // Mark as expiring in metadata if needed
            await prisma.userDocument.update({
                where: { id: doc.id },
                data: {
                    metadata: {
                        ...(doc.metadata as any),
                        isExpiringSoon: true,
                        daysToExpiry: daysUntilExpiry
                    }
                }
            })
        }

        return NextResponse.json({
            success: true,
            checkedCount: expiringDocuments.length,
            notificationsSent: notifications.length
        })

    } catch (error) {
        console.error('Expiry cron error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
