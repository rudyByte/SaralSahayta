import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function POST(
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

        // Fetch application
        const application = await prisma.application.findUnique({
            where: { id: applicationId }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Verify ownership
        if (application.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Can only withdraw if SUBMITTED or UNDER_REVIEW
        if (application.status !== 'SUBMITTED' && application.status !== 'UNDER_REVIEW') {
            return NextResponse.json(
                { error: `Cannot withdraw application in ${application.status} status` },
                { status: 400 }
            )
        }

        // Update status to WITHDRAWN
        const withdrawn = await prisma.application.update({
            where: { id: applicationId },
            data: {
                status: 'WITHDRAWN',
                updatedAt: new Date()
            }
        })

        // Create history entry (Trigger will also do this, but manual entry allows custom remarks)
        await prisma.applicationHistory.create({
            data: {
                applicationId,
                status: 'WITHDRAWN',
                remarks: 'Application withdrawn by user',
                createdAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Application withdrawn successfully',
            application: withdrawn
        })

    } catch (error) {
        console.error('Failed to withdraw application:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
