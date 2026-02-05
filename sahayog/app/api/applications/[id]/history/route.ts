import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createServerClient()

        // Check authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const applicationId = params.id
        const userId = session.user.id

        // Fetch application to verify ownership
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { userId: true, status: true }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        if (application.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch history
        const history = await prisma.applicationHistory.findMany({
            where: { applicationId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                remarks: true,
                createdAt: true,
                // adminComment is stored in remarks or a separate field if we extend schema
                // For now, using remarks as the primary communication channel
            }
        })

        return NextResponse.json({
            history,
            currentStatus: application.status
        })

    } catch (error) {
        console.error('Failed to fetch application history:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
