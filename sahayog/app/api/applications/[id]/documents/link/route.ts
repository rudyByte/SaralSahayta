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
        const body = await request.json()
        const { userDocumentId } = body

        if (!userDocumentId) {
            return NextResponse.json(
                { error: 'userDocumentId is required' },
                { status: 400 }
            )
        }

        // Verify application ownership
        const application = await prisma.application.findUnique({
            where: { id: applicationId }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        if (application.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Verify document ownership
        const userDocument = await prisma.userDocument.findUnique({
            where: { id: userDocumentId },
            include: {
                document: true
            }
        })

        if (!userDocument) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        if (userDocument.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Check if already linked
        const existingLink = await prisma.applicationDocument.findFirst({
            where: {
                applicationId,
                userDocumentId
            }
        })

        if (existingLink) {
            return NextResponse.json({
                success: true,
                message: 'Document already linked'
            })
        }

        // Create link
        await prisma.applicationDocument.create({
            data: {
                applicationId,
                userDocumentId
            }
        })

        // Update document checklist data
        const documentChecklistData = application.documentChecklistData as any || {}
        documentChecklistData[userDocument.document.documentCode] = {
            uploaded: true,
            userDocumentId,
            uploadedAt: new Date().toISOString(),
            status: userDocument.verificationStatus
        }

        await prisma.application.update({
            where: { id: applicationId },
            data: {
                documentChecklistData,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Document linked successfully'
        })

    } catch (error) {
        console.error('Failed to link document:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
