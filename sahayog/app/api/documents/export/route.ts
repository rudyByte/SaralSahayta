import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import JSZip from 'jszip'

/**
 * Exports user's verified documents as a ZIP file
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all verified documents for the user
        const userDocuments = await prisma.userDocument.findMany({
            where: {
                userId: user.id,
                verificationStatus: 'VERIFIED'
            },
            include: {
                document: true
            }
        })

        if (userDocuments.length === 0) {
            return NextResponse.json({ error: 'No verified documents found to export' }, { status: 404 })
        }

        const zip = new JSZip()

        // Fetch each file and add to ZIP
        for (const doc of userDocuments) {
            try {
                const response = await fetch(doc.fileUrl)
                if (!response.ok) continue

                const blob = await response.arrayBuffer()
                const extension = doc.fileType === 'application/pdf' ? 'pdf' : 'jpg'
                zip.file(`${doc.document.documentName}.${extension}`, blob)
            } catch (err) {
                console.error(`Failed to fetch file for export: ${doc.fileName}`, err)
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="Sahayog_Documents_${user.id.slice(0, 8)}.zip"`,
            },
        })

    } catch (error) {
        console.error('Document export error:', error)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}
