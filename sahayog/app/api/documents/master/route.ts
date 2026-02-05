import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { DocumentCategory } from '@prisma/client'

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
        const category = searchParams.get('category') as DocumentCategory | null
        const commonOnly = searchParams.get('common') === 'true'

        // Build where clause
        const where: any = {}

        if (category) {
            where.category = category
        }

        if (commonOnly) {
            where.isCommon = true
        }

        // Fetch master documents
        const documents = await prisma.masterDocument.findMany({
            where,
            orderBy: [
                { category: 'asc' },
                { documentName: 'asc' }
            ]
        })

        // Get user's state for office addresses
        const userProfile = await prisma.userProfile.findUnique({
            where: { userId: user.id },
            select: { state: true, district: true }
        })

        // Fetch office addresses for user's state if available
        let officeAddresses: any[] = []

        if (userProfile?.state) {
            officeAddresses = await prisma.documentOfficeAddress.findMany({
                where: {
                    state: userProfile.state,
                    ...(userProfile.district ? { district: userProfile.district } : {})
                },
                include: {
                    document: {
                        select: {
                            documentCode: true,
                            documentName: true
                        }
                    }
                }
            })
        }

        return NextResponse.json({
            documents,
            officeAddresses,
            userState: userProfile?.state || null
        })

    } catch (error) {
        console.error('Fetch master documents error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        )
    }
}
