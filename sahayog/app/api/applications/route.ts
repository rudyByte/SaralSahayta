import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient()

        // Check authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // Build filter
        const where: any = { userId }
        if (status && status !== 'all') {
            where.status = status.toUpperCase()
        }

        // Fetch applications
        const applications = await prisma.application.findMany({
            where,
            include: {
                scheme: {
                    select: {
                        id: true,
                        schemeName: true,
                        department: true,
                        category: true
                    }
                },
                _count: {
                    select: {
                        documents: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return NextResponse.json({
            applications: applications.map(app => ({
                id: app.id,
                status: app.status,
                submittedAt: app.submittedAt,
                createdAt: app.createdAt,
                updatedAt: app.updatedAt,
                documentStatus: app.documentStatus,
                scheme: app.scheme,
                documentCount: app._count.documents
            }))
        })

    } catch (error) {
        console.error('Failed to fetch applications:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
