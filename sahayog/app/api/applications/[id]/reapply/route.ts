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

        // Fetch original application
        const originalApplication = await prisma.application.findUnique({
            where: { id: applicationId }
        })

        if (!originalApplication) {
            return NextResponse.json({ error: 'Original application not found' }, { status: 404 })
        }

        // Verify ownership
        if (originalApplication.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Can only reapply if REJECTED or WITHDRAWN
        if (originalApplication.status !== 'REJECTED' && originalApplication.status !== 'WITHDRAWN') {
            return NextResponse.json(
                { error: 'Can only reapply for rejected or withdrawn applications' },
                { status: 400 }
            )
        }

        // Create new application based on original
        const newApplication = await prisma.application.create({
            data: {
                userId,
                schemeId: originalApplication.schemeId,
                status: 'DRAFT',
                formData: originalApplication.formData, // Copy data to save user time
                documentStatus: 'INCOMPLETE',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        // History record for new application
        await prisma.applicationHistory.create({
            data: {
                applicationId: newApplication.id,
                status: 'DRAFT',
                remarks: `Re-applied based on previous application ${applicationId}`,
                createdAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            newApplicationId: newApplication.id,
            message: 'New draft created successfully'
        })

    } catch (error) {
        console.error('Failed to reapply:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
