import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'
import { validateFile, optimizeImage, isImage } from '@/lib/file-validation'
import { checkDocumentQuality } from '@/lib/document-intelligence'
import { detectDocumentType } from '@/lib/document-detection'

export async function POST(request: NextRequest) {
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

        // Parse form data
        const formData = await request.formData()
        const file = formData.get('file') as File
        const documentCode = formData.get('documentCode') as string
        const expiryDateStr = formData.get('expiryDate') as string | null

        if (!file || !documentCode) {
            return NextResponse.json(
                { error: 'File and documentCode are required' },
                { status: 400 }
            )
        }

        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            )
        }

        // Get master document
        const masterDocument = await prisma.masterDocument.findUnique({
            where: { documentCode }
        })

        if (!masterDocument) {
            return NextResponse.json(
                { error: 'Invalid document code' },
                { status: 400 }
            )
        }

        // Check for existing document
        const existingDocument = await prisma.userDocument.findUnique({
            where: {
                userId_documentId: {
                    userId: user.id,
                    documentId: masterDocument.id
                }
            }
        })

        if (existingDocument?.verificationStatus === 'VERIFIED') {
            return NextResponse.json(
                { error: 'Document already verified. Cannot re-upload.' },
                { status: 400 }
            )
        }

        // Optimization & Intelligence
        const buffer = Buffer.from(await file.arrayBuffer())

        // 1. Quality Check
        const qualityResult = await checkDocumentQuality(buffer, file.type)
        if (!qualityResult.passed && qualityResult.issues.length > 0) {
            return NextResponse.json(
                { error: `Quality Check Failed: ${qualityResult.issues.join(', ')}` },
                { status: 400 }
            )
        }

        // 2. Auto-Detection
        let detectionResult = null
        if (isImage(file.type)) {
            detectionResult = await detectDocumentType(buffer)
        }

        // Optimize image if applicable
        const optimizedBuffer = await optimizeImage(file)

        // Upload to Supabase Storage
        const fileUrl = await uploadFile({
            file: optimizedBuffer,
            fileName: file.name,
            contentType: file.type,
            userId: user.id,
            folder: 'documents'
        })

        const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null

        // Prepare metadata
        const metadata = {
            qualityScore: qualityResult.score,
            qualityWarnings: qualityResult.warnings,
            detectedType: detectionResult?.detectedType,
            detectionConfidence: detectionResult?.confidence,
            isTypeMismatch: detectionResult?.detectedType && detectionResult.detectedType !== documentCode,
            processedAt: new Date().toISOString()
        }

        // Create or update user document record
        const userDocument = await prisma.userDocument.upsert({
            where: {
                userId_documentId: {
                    userId: user.id,
                    documentId: masterDocument.id
                }
            },
            update: {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileUrl,
                uploadedAt: new Date(),
                verificationStatus: 'PENDING',
                verifiedBy: null,
                verifiedAt: null,
                expiryDate,
                metadata: metadata as any
            },
            create: {
                userId: user.id,
                documentId: masterDocument.id,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileUrl,
                verificationStatus: 'PENDING',
                expiryDate,
                metadata: metadata as any
            },
            include: {
                document: true
            }
        })

        return NextResponse.json({
            success: true,
            document: userDocument,
            intelligence: {
                quality: qualityResult,
                detection: detectionResult
            }
        })

    } catch (error) {
        console.error('Document upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        )
    }
}
