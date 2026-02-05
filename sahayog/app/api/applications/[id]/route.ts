import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { applyDefaultValues } from '@/lib/form-autofill'

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

        // Fetch application with relations
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

        // Verify ownership
        if (application.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Apply auto-fill to form template
        const formTemplate = application.scheme.applicationFormTemplate
        const processedTemplate = await applyDefaultValues(formTemplate, userId)

        // Extract required document codes from template
        const requiredDocuments: string[] = []
        if (processedTemplate.sections) {
            for (const section of processedTemplate.sections) {
                for (const field of section.fields || []) {
                    if (field.fieldType === 'document-checklist' && field.documentCodes) {
                        requiredDocuments.push(...field.documentCodes)
                    }
                }
            }
        }

        // Fetch linked documents with signed URLs
        const linkedDocuments = await Promise.all(
            application.documents.map(async (appDoc) => {
                const userDoc = appDoc.userDocument

                // Generate signed URL
                let signedUrl = null
                if (userDoc.fileUrl) {
                    const { data } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(userDoc.fileUrl.replace(/^.*\/documents\//, ''), 3600)

                    signedUrl = data?.signedUrl || null
                }

                return {
                    id: userDoc.id,
                    fileName: userDoc.fileName,
                    fileType: userDoc.fileType,
                    fileSize: userDoc.fileSize,
                    uploadedAt: userDoc.uploadedAt,
                    verificationStatus: userDoc.verificationStatus,
                    signedUrl,
                    document: {
                        documentCode: userDoc.document.documentCode,
                        documentName: userDoc.document.documentName,
                        category: userDoc.document.category
                    }
                }
            })
        )

        return NextResponse.json({
            application: {
                id: application.id,
                status: application.status,
                formData: application.formData,
                documentStatus: application.documentStatus,
                submittedAt: application.submittedAt,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt
            },
            scheme: {
                id: application.scheme.id,
                schemeName: application.scheme.schemeName,
                department: application.scheme.department,
                description: application.scheme.description
            },
            formTemplate: processedTemplate,
            linkedDocuments,
            requiredDocuments
        })

    } catch (error) {
        console.error('Failed to fetch application:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
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
        const { formData, documentIds, action } = body

        // Fetch application
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                scheme: true,
                documents: true
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Verify ownership
        if (application.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Cannot modify submitted applications
        if (application.status !== 'DRAFT' && action === 'submit') {
            return NextResponse.json(
                { error: 'Cannot modify submitted application' },
                { status: 403 }
            )
        }

        if (action === 'save') {
            // Save draft
            const updated = await prisma.application.update({
                where: { id: applicationId },
                data: {
                    formData,
                    updatedAt: new Date()
                }
            })

            // Link documents if provided
            if (documentIds && documentIds.length > 0) {
                // Remove existing links
                await prisma.applicationDocument.deleteMany({
                    where: { applicationId }
                })

                // Create new links
                await prisma.applicationDocument.createMany({
                    data: documentIds.map((docId: string) => ({
                        applicationId,
                        userDocumentId: docId
                    }))
                })

                // Update document status
                const requiredDocs = await getRequiredDocumentCodes(application.scheme.applicationFormTemplate)
                const uploadedDocs = await prisma.userDocument.findMany({
                    where: {
                        id: { in: documentIds },
                        userId
                    },
                    select: { document: { select: { documentCode: true } } }
                })

                const uploadedCodes = uploadedDocs.map(d => d.document.documentCode)
                const allUploaded = requiredDocs.every(code => uploadedCodes.includes(code))

                await prisma.application.update({
                    where: { id: applicationId },
                    data: {
                        documentStatus: allUploaded ? 'COMPLETE' : 'INCOMPLETE'
                    }
                })
            }

            return NextResponse.json({
                success: true,
                application: updated
            })

        } else if (action === 'submit') {
            // Validate all required fields
            const template = application.scheme.applicationFormTemplate
            const validationResult = validateFormData(formData, template)

            if (!validationResult.valid) {
                return NextResponse.json(
                    { error: 'Please fill all required fields', errors: validationResult.errors },
                    { status: 400 }
                )
            }

            // Validate all required documents are uploaded
            const requiredDocs = await getRequiredDocumentCodes(template)
            const uploadedDocs = await prisma.userDocument.findMany({
                where: {
                    userId,
                    document: {
                        documentCode: { in: requiredDocs }
                    }
                },
                select: { document: { select: { documentCode: true } } }
            })

            const uploadedCodes = uploadedDocs.map(d => d.document.documentCode)
            const missingDocs = requiredDocs.filter(code => !uploadedCodes.includes(code))

            if (missingDocs.length > 0) {
                return NextResponse.json(
                    { error: 'Please upload all required documents', missingDocuments: missingDocs },
                    { status: 400 }
                )
            }

            // Submit application
            const submitted = await prisma.application.update({
                where: { id: applicationId },
                data: {
                    formData,
                    status: 'SUBMITTED',
                    submittedAt: new Date(),
                    documentStatus: 'COMPLETE',
                    updatedAt: new Date()
                }
            })

            // Create history record
            await prisma.applicationHistory.create({
                data: {
                    applicationId,
                    status: 'SUBMITTED',
                    remarks: 'Application submitted by user',
                    createdAt: new Date()
                }
            })

            // Link documents
            if (documentIds && documentIds.length > 0) {
                await prisma.applicationDocument.deleteMany({
                    where: { applicationId }
                })

                await prisma.applicationDocument.createMany({
                    data: documentIds.map((docId: string) => ({
                        applicationId,
                        userDocumentId: docId
                    }))
                })
            }

            return NextResponse.json({
                success: true,
                application: submitted,
                message: 'Application submitted successfully'
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('Failed to update application:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper function to extract required document codes from template
async function getRequiredDocumentCodes(template: any): Promise<string[]> {
    const codes: string[] = []

    if (template.sections) {
        for (const section of template.sections) {
            for (const field of section.fields || []) {
                if (field.fieldType === 'document-checklist' && field.documentCodes) {
                    codes.push(...field.documentCodes)
                }
            }
        }
    }

    return codes
}

// Helper function to validate form data
function validateFormData(formData: any, template: any): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (!template.sections) {
        return { valid: true, errors }
    }

    for (const section of template.sections) {
        const sectionData = formData[section.sectionId] || {}

        for (const field of section.fields || []) {
            if (field.required && !sectionData[field.fieldId]) {
                errors[`${section.sectionId}.${field.fieldId}`] = `${field.label} is required`
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}
