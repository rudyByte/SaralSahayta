'use client'

import { useState } from 'react'
import { Edit2, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/application-validation'

interface ReviewStepProps {
    formData: Record<string, Record<string, any>>
    template: {
        sections: Array<{
            sectionId: string
            sectionName: string
            stepNumber: number
            fields: Array<{
                fieldId: string
                fieldType: string
                label: string
            }>
        }>
    }
    onEdit: (stepNumber: number) => void
    onSubmit: () => void
    isSubmitting: boolean
}

export function ReviewStep({
    formData,
    template,
    onEdit,
    onSubmit,
    isSubmitting
}: ReviewStepProps) {
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [declarations, setDeclarations] = useState({
        declaration1: false,
        declaration2: false
    })

    const handleSubmit = () => {
        if (!declarations.declaration1 || !declarations.declaration2) {
            alert('Please accept all declarations before submitting')
            return
        }
        setShowConfirmModal(true)
    }

    const confirmSubmit = () => {
        setShowConfirmModal(false)
        onSubmit()
    }

    const formatValue = (value: any, fieldType: string): string => {
        if (value === null || value === undefined || value === '') return '-'

        switch (fieldType) {
            case 'currency':
                return formatCurrency(value)
            case 'date':
                return new Date(value).toLocaleDateString()
            case 'checkbox':
                return value ? 'Yes' : 'No'
            default:
                return String(value)
        }
    }

    const maskSensitiveData = (value: string, fieldId: string): string => {
        if (fieldId.toLowerCase().includes('account')) {
            // Mask account number: show last 4 digits
            return value.replace(/\d(?=\d{4})/g, 'X')
        }
        if (fieldId.toLowerCase().includes('aadhaar')) {
            // Mask Aadhaar: show last 4 digits
            return value.replace(/\d(?=\d{4})/g, 'X')
        }
        return value
    }

    // Filter out document section and declaration section
    const reviewSections = template.sections.filter(
        section => section.sectionId !== 'documents' && section.sectionId !== 'declaration'
    )

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Review Your Application
                </h2>
                <p className="text-gray-600">
                    Please review all information carefully before submitting
                </p>
            </div>

            {/* Review Sections */}
            <div className="space-y-6">
                {reviewSections.map((section) => {
                    const sectionData = formData[section.sectionId] || {}

                    return (
                        <div key={section.sectionId} className="border rounded-lg p-6 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {section.sectionName}
                                </h3>
                                <button
                                    onClick={() => onEdit(section.stepNumber)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.fields.map((field) => {
                                    const value = sectionData[field.fieldId]
                                    const displayValue = formatValue(value, field.fieldType)
                                    const maskedValue = maskSensitiveData(displayValue, field.fieldId)

                                    return (
                                        <div key={field.fieldId}>
                                            <p className="text-sm text-gray-600 mb-1">{field.label}</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {maskedValue}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Declarations */}
            <div className="border rounded-lg p-6 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Declaration
                </h3>
                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={declarations.declaration1}
                            onChange={(e) =>
                                setDeclarations({ ...declarations, declaration1: e.target.checked })
                            }
                            className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-gray-700">
                            I hereby declare that all the information provided in this application is true and correct to the best of my knowledge.
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={declarations.declaration2}
                            onChange={(e) =>
                                setDeclarations({ ...declarations, declaration2: e.target.checked })
                            }
                            className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-gray-700">
                            I understand that providing false information may lead to rejection of my application and legal action.
                        </span>
                    </label>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !declarations.declaration1 || !declarations.declaration2}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg transition-colors"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
                            <CheckCircle className="h-6 w-6 text-yellow-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                            Confirm Submission
                        </h3>

                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to submit this application? Once submitted, you will not be able to edit the information.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmit}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Confirm & Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
