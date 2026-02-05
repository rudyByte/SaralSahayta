'use client'

import { FormField, validateField } from '@/lib/application-validation'
import { formatCurrency, parseCurrency } from '@/lib/application-validation'
import { useState } from 'react'
import { Calendar, HelpCircle } from 'lucide-react'

interface FormRendererProps {
    section: {
        sectionId: string
        sectionName: string
        fields: FormField[]
    }
    formData: Record<string, any>
    onChange: (fieldId: string, value: any) => void
    errors: Record<string, string>
}

export function FormRenderer({ section, formData, onChange, errors }: FormRendererProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {section.sectionName}
            </h2>

            <div className="space-y-5">
                {section.fields.map((field) => (
                    <FormFieldRenderer
                        key={field.fieldId}
                        field={field}
                        value={formData[field.fieldId]}
                        onChange={(value) => onChange(field.fieldId, value)}
                        error={errors[field.fieldId]}
                    />
                ))}
            </div>
        </div>
    )
}

interface FormFieldRendererProps {
    field: FormField
    value: any
    onChange: (value: any) => void
    error?: string
}

function FormFieldRenderer({ field, value, onChange, error }: FormFieldRendererProps) {
    const [showHelp, setShowHelp] = useState(false)

    const renderField = () => {
        switch (field.fieldType) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                )

            case 'currency':
                return (
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            ₹
                        </span>
                        <input
                            type="number"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                            placeholder={field.placeholder}
                            className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                    </div>
                )

            case 'date':
                return (
                    <div className="relative">
                        <input
                            type="date"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                )

            case 'select':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )

            case 'radio':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name={field.fieldId}
                                    value={option}
                                    checked={value === option}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">{option}</span>
                            </label>
                        ))}
                    </div>
                )

            case 'checkbox':
                return (
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-gray-700">{field.label}</span>
                    </label>
                )

            default:
                return null
        }
    }

    // For checkbox type, label is part of the field
    const showLabel = field.fieldType !== 'checkbox'

    return (
        <div className="space-y-2">
            {showLabel && (
                <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.helpText && (
                        <button
                            type="button"
                            onClick={() => setShowHelp(!showHelp)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <HelpCircle className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {showHelp && field.helpText && (
                <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    {field.helpText}
                </div>
            )}

            {renderField()}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}
