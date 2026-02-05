import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Get authenticated user
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Find document and verify ownership
        const userDocument = await prisma.userDocument.findUnique({
            where: { id }
        })

        if (!userDocument) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            )
        }

        if (userDocument.userId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Check if document is verified
        if (userDocument.verificationStatus === 'VERIFIED') {
            return NextResponse.json(
                { error: 'Cannot delete verified document' },
                { status: 400 }
            )
        }

        // Delete from Supabase Storage
        try {
            await deleteFile(userDocument.fileUrl)
        } catch (storageError) {
            console.error('Storage deletion failed:', storageError)
            // Continue with database deletion even if storage deletion fails
        }

        // Delete from database
        await prisma.userDocument.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Document deleted successfully'
        })

    } catch (error) {
        console.error('Document deletion error:', error)
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        )
    }
}
