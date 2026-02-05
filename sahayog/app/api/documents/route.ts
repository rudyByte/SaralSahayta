import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { generateSignedUrl } from '@/lib/storage'

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | null

        // Build where clause
        const where: any = {
            userId: user.id
        }

        if (status) {
            where.verificationStatus = status
        }

        // Fetch user documents
        const documents = await prisma.userDocument.findMany({
            where,
            include: {
                document: true
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        })

        // Generate signed URLs for documents
        const documentsWithSignedUrls = await Promise.all(
            documents.map(async (doc) => {
                try {
                    const signedUrl = await generateSignedUrl(doc.fileUrl, 3600)
                    return {
                        ...doc,
                        signedUrl
                    }
                } catch (error) {
                    console.error('Failed to generate signed URL:', error)
                    return {
                        ...doc,
                        signedUrl: null
                    }
                }
            })
        )

        return NextResponse.json({
            documents: documentsWithSignedUrls
        })

    } catch (error) {
        console.error('Fetch documents error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        )
    }
}
