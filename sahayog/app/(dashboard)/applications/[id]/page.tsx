'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { ProgressIndicator } from '@/components/application/progress-indicator'
import { FormRenderer } from '@/components/application/form-renderer'
import { DocumentChecklist } from '@/components/application/document-checklist'
import { ReviewStep } from '@/components/application/review-step'
import { validateSection } from '@/lib/application-validation'
import { extractInitialFormData, mergeFormData } from '@/lib/form-autofill'

interface ApplicationFormPageProps {
    params: { id: string }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function ApplicationFormPage({ params }: ApplicationFormPageProps) {
    const router = useRouter()
    const applicationId = params.id

    const [loading, setLoading] = useState(true)
    const [application, setApplication] = useState<any>(null)
    const [scheme, setScheme] = useState<any>(null)
    const [formTemplate, setFormTemplate] = useState<any>(null)
    const [formData, setFormData] = useState<Record<string, Record<string, any>>>({})
    const [currentStep, setCurrentStep] = useState(1)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedDocumentCodes, setUploadedDocumentCodes] = useState<string[]>([])

    useEffect(() => {
        fetchApplication()
    }, [applicationId])

    // Auto-save effect
    useEffect(() => {
        if (!hasUnsavedChanges || !formTemplate) return

        const timer = setTimeout(async () => {
            await saveDraft()
        }, 30000) // 30 seconds

        return () => clearTimeout(timer)
    }, [formData, hasUnsavedChanges])

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    const fetchApplication = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/applications/${applicationId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch application')
            }

            const data = await response.json()
            setApplication(data.application)
            setScheme(data.scheme)
            setFormTemplate(data.formTemplate)

            // Merge saved data with template defaults
            const templateDefaults = extractInitialFormData(data.formTemplate)
            const merged = mergeFormData(data.application.formData, templateDefaults)
            setFormData(merged)

        } catch (error) {
            console.error('Failed to fetch application:', error)
            alert('Failed to load application')
        } finally {
            setLoading(false)
        }
    }

    const saveDraft = async () => {
        try {
            setSaveStatus('saving')

            const response = await fetch(`/api/applications/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData,
                    action: 'save'
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save draft')
            }

            setSaveStatus('saved')
            setHasUnsavedChanges(false)

            setTimeout(() => setSaveStatus('idle'), 3000)

        } catch (error) {
            console.error('Failed to save draft:', error)
            setSaveStatus('error')
        }
    }

    const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [fieldId]: value
            }
        }))
        setHasUnsavedChanges(true)

        // Clear error for this field
        setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[fieldId]
            return newErrors
        })
    }

    const handleNext = () => {
        // Validate current step
        const currentSection = formTemplate.sections.find(
            (s: any) => s.stepNumber === currentStep
        )

        if (currentSection && currentSection.sectionId !== 'documents') {
            const sectionData = formData[currentSection.sectionId] || {}
            const validation = validateSection(sectionData, currentSection.fields)

            if (!validation.valid) {
                setErrors(validation.errors)
                return
            }
        }

        // For documents step, check if all required documents are uploaded
        if (currentSection?.sectionId === 'documents') {
            const requiredCodes = currentSection.fields
                .find((f: any) => f.fieldType === 'document-checklist')
                ?.documentCodes || []

            const missingDocs = requiredCodes.filter(
                (code: string) => !uploadedDocumentCodes.includes(code)
            )

            if (missingDocs.length > 0) {
                alert('Please upload all required documents before proceeding')
                return
            }
        }

        setErrors({})
        setCurrentStep(prev => Math.min(prev + 1, formTemplate.sections.length))
    }

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleSaveAndExit = async () => {
        await saveDraft()
        router.push('/applications')
    }

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            const response = await fetch(`/api/applications/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData,
                    action: 'submit'
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit application')
            }

            // Success
            alert('Application submitted successfully!')
            router.push(`/applications/${applicationId}/tracking`)

        } catch (error: any) {
            console.error('Failed to submit application:', error)
            alert(error.message || 'Failed to submit application')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditFromReview = (stepNumber: number) => {
        setCurrentStep(stepNumber)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        )
    }

    if (!formTemplate || !application) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Failed to load application</p>
                </div>
            </div>
        )
    }

    const steps = formTemplate.sections.map((section: any) => ({
        number: section.stepNumber,
        name: section.sectionName,
        percentage: Math.round((1 / formTemplate.sections.length) * 100)
    }))

    const currentSection = formTemplate.sections.find(
        (s: any) => s.stepNumber === currentStep
    )

    const isLastStep = currentStep === formTemplate.sections.length
    const isFirstStep = currentStep === 1

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{scheme.schemeName}</h1>
                        <p className="text-gray-600 mt-1">{scheme.department}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Application ID</p>
                        <p className="font-mono text-sm font-medium">{application.id.slice(0, 12)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        {application.status}
                    </span>

                    {saveStatus !== 'idle' && (
                        <span className={`inline-flex items-center gap-2 text-sm ${saveStatus === 'saving' ? 'text-gray-600' :
                                saveStatus === 'saved' ? 'text-green-600' :
                                    'text-red-600'
                            }`}>
                            {saveStatus === 'saving' && <Clock className="h-4 w-4 animate-spin" />}
                            {saveStatus === 'saved' && <CheckCircle className="h-4 w-4" />}
                            {saveStatus === 'error' && <XCircle className="h-4 w-4" />}
                            {saveStatus === 'saving' ? 'Saving...' :
                                saveStatus === 'saved' ? 'All changes saved' :
                                    'Failed to save'}
                        </span>
                    )}

                    <button
                        onClick={saveDraft}
                        disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                        className="ml-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        Save Draft
                    </button>
                </div>
            </div>

            {/* Progress Indicator */}
            <ProgressIndicator currentStep={currentStep} steps={steps} />

            {/* Form Content */}
            <div className="bg-white rounded-lg shadow-sm border p-8 my-8 min-h-[500px]">
                {currentSection?.sectionId === 'documents' ? (
                    <DocumentChecklist
                        requiredDocumentCodes={
                            currentSection.fields.find((f: any) => f.fieldType === 'document-checklist')
                                ?.documentCodes || []
                        }
                        applicationId={applicationId}
                        onDocumentsChange={setUploadedDocumentCodes}
                    />
                ) : isLastStep ? (
                    <ReviewStep
                        formData={formData}
                        template={formTemplate}
                        onEdit={handleEditFromReview}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <FormRenderer
                        section={currentSection}
                        formData={formData[currentSection.sectionId] || {}}
                        onChange={(fieldId, value) =>
                            handleFieldChange(currentSection.sectionId, fieldId, value)
                        }
                        errors={errors}
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Previous
                </button>

                <button
                    onClick={handleSaveAndExit}
                    className="px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                    Save & Exit
                </button>

                {!isLastStep && (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Next
                        <ArrowRight className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    )
}
