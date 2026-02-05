import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

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

        // Fetch application with scheme and documents
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                scheme: true,
                documents: {
                    include: {
                        userDocument: {
                            include: {
                                document: true
                            }
                        }
                    }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        if (application.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Create PDF
        const doc = new jsPDF() as any
        const schemeName = application.scheme.schemeName
        const appId = application.id.slice(0, 12)

        // Header
        doc.setFontSize(22)
        doc.setTextColor(30, 64, 175) // blue-700
        doc.text('SARAL SAHAYOG', 105, 20, { align: 'center' })

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Application Submission Receipt', 105, 30, { align: 'center' })

        doc.setDrawColor(200, 200, 200)
        doc.line(20, 35, 190, 35)

        // Application Info
        doc.setFontSize(12)
        doc.text(`Scheme: ${schemeName}`, 20, 50)
        doc.text(`Application ID: ${appId}`, 20, 60)
        doc.text(`Status: ${application.status}`, 20, 70)
        doc.text(`Submission Date: ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'N/A'}`, 20, 80)

        // Form Data Section
        doc.setFontSize(14)
        doc.setTextColor(30, 64, 175)
        doc.text('Applicant Information', 20, 100)

        const formData = application.formData as any
        const personal = formData?.personal || {}
        const family = formData?.family || {}

        const infoRows = [
            ['Full Name', personal.applicantName || 'N/A'],
            ['Date of Birth', personal.dob || 'N/A'],
            ['Gender', personal.gender || 'N/A'],
            ['Aadhaar Number', personal.aadhaarNumber ? `XXXX-XXXX-${personal.aadhaarNumber.slice(-4)}` : 'N/A'],
            ['Annual Family Income', `Rs. ${family.annualIncome || 'N/A'}`],
            ['Contact Number', personal.phone || 'N/A']
        ]

        doc.autoTable({
            startY: 105,
            head: [['Field', 'Details']],
            body: infoRows,
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] }
        })

        // Documents Section
        const nextY = (doc as any).lastAutoTable.finalY + 15
        doc.setFontSize(14)
        doc.setTextColor(30, 64, 175)
        doc.text('Submitted Documents', 20, nextY)

        const docRows = application.documents.map((appDoc: any) => [
            appDoc.userDocument.document.documentName,
            appDoc.userDocument.fileName,
            appDoc.userDocument.verificationStatus
        ])

        doc.autoTable({
            startY: nextY + 5,
            head: [['Document Name', 'File Name', 'Status']],
            body: docRows,
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] }
        })

        // Footer/Declaration
        const footerY = (doc as any).lastAutoTable.finalY + 20
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text('Declaration: I hereby declare that the information provided above is true to the best of my knowledge.', 20, footerY)
        doc.text('This is a computer-generated receipt and does not require a physical signature.', 20, footerY + 10)

        // Output PDF
        const pdfBuffer = doc.output('arraybuffer')

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Application_${appId}_${schemeName.replace(/\s+/g, '_')}.pdf"`
            }
        })

    } catch (error) {
        console.error('Failed to generate PDF:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
