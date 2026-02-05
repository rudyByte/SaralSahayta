import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ documentCode: string }> }
) {
    try {
        const { documentCode } = await params

        // Get authenticated user
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get document by code
        const document = await prisma.masterDocument.findUnique({
            where: { documentCode }
        })

        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            )
        }

        // Get user's state and district for office addresses
        const userProfile = await prisma.userProfile.findUnique({
            where: { userId: user.id },
            select: { state: true, district: true }
        })

        // Fetch office addresses for user's state
        let officeAddresses: any[] = []

        if (userProfile?.state) {
            officeAddresses = await prisma.documentOfficeAddress.findMany({
                where: {
                    documentId: document.id,
                    state: userProfile.state
                },
                orderBy: [
                    { district: 'asc' },
                    { officeName: 'asc' }
                ]
            })
        }

        return NextResponse.json({
            document: {
                id: document.id,
                documentName: document.documentName,
                documentCode: document.documentCode,
                category: document.category,
                description: document.description,
                isCommon: document.isCommon,
                stateSpecific: document.stateSpecific,
                sampleImageUrl: document.sample_image_url
            },
            procurementGuideOnline: document.procurementGuideOnline,
            procurementGuideOffline: document.procurementGuideOffline,
            officeAddresses,
            userState: userProfile?.state || null,
            userDistrict: userProfile?.district || null
        })

    } catch (error) {
        console.error('Fetch procurement guide error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch procurement guide' },
            { status: 500 }
        )
    }
}
