import { z } from 'zod'

// Field validation rules interface
export interface ValidationRules {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    minAge?: number
    maxAge?: number
    matchField?: string
}

// Field definition interface
export interface FormField {
    fieldId: string
    fieldType: string
    label: string
    required: boolean
    validation?: ValidationRules
    options?: string[]
    documentCodes?: string[]
}

// Validation result
export interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}

/**
 * Validate text field
 */
export function validateTextField(
    value: any,
    field: FormField
): string | null {
    if (field.required && (!value || value.trim() === '')) {
        return `${field.label} is required`
    }

    if (!value) return null

    const strValue = String(value).trim()

    // Min length
    if (field.validation?.minLength && strValue.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters`
    }

    // Max length
    if (field.validation?.maxLength && strValue.length > field.validation.maxLength) {
        return `${field.label} must be at most ${field.validation.maxLength} characters`
    }

    // Pattern validation
    if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(strValue)) {
            return `${field.label} format is invalid`
        }
    }

    return null
}

/**
 * Validate number field
 */
export function validateNumberField(
    value: any,
    field: FormField
): string | null {
    if (field.required && (value === null || value === undefined || value === '')) {
        return `${field.label} is required`
    }

    if (value === null || value === undefined || value === '') return null

    const numValue = Number(value)

    if (isNaN(numValue)) {
        return `${field.label} must be a valid number`
    }

    // Min value
    if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`
    }

    // Max value
    if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`
    }

    return null
}

/**
 * Validate currency field (same as number but with formatting)
 */
export function validateCurrencyField(
    value: any,
    field: FormField
): string | null {
    return validateNumberField(value, field)
}

/**
 * Validate date field
 */
export function validateDateField(
    value: any,
    field: FormField
): string | null {
    if (field.required && !value) {
        return `${field.label} is required`
    }

    if (!value) return null

    const date = new Date(value)

    if (isNaN(date.getTime())) {
        return `${field.label} must be a valid date`
    }

    // Age validation
    if (field.validation?.minAge || field.validation?.maxAge) {
        const today = new Date()
        const age = Math.floor((today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

        if (field.validation.minAge && age < field.validation.minAge) {
            return `You must be at least ${field.validation.minAge} years old`
        }

        if (field.validation.maxAge && age > field.validation.maxAge) {
            return `Age must be at most ${field.validation.maxAge} years`
        }
    }

    return null
}

/**
 * Validate select field
 */
export function validateSelectField(
    value: any,
    field: FormField
): string | null {
    if (field.required && !value) {
        return `${field.label} is required`
    }

    if (!value) return null

    // Check if value is in options
    if (field.options && !field.options.includes(value)) {
        return `${field.label} has an invalid value`
    }

    return null
}

/**
 * Validate checkbox field
 */
export function validateCheckboxField(
    value: any,
    field: FormField
): string | null {
    if (field.required && !value) {
        return `${field.label} must be checked`
    }

    return null
}

/**
 * Validate document checklist field
 */
export function validateDocumentChecklistField(
    uploadedDocumentCodes: string[],
    field: FormField
): string | null {
    if (!field.required) return null

    const requiredCodes = field.documentCodes || []
    const missingDocs = requiredCodes.filter(code => !uploadedDocumentCodes.includes(code))

    if (missingDocs.length > 0) {
        return `Please upload all required documents (${missingDocs.length} missing)`
    }

    return null
}

/**
 * Validate field match (e.g., confirm password)
 */
export function validateFieldMatch(
    value: any,
    matchValue: any,
    field: FormField
): string | null {
    if (field.validation?.matchField && value !== matchValue) {
        return `${field.label} does not match`
    }

    return null
}

/**
 * Validate a single field based on its type
 */
export function validateField(
    value: any,
    field: FormField,
    allValues?: Record<string, any>
): string | null {
    switch (field.fieldType) {
        case 'text':
        case 'textarea':
            return validateTextField(value, field)

        case 'number':
            return validateNumberField(value, field)

        case 'currency':
            return validateCurrencyField(value, field)

        case 'date':
            return validateDateField(value, field)

        case 'select':
        case 'radio':
            return validateSelectField(value, field)

        case 'checkbox':
            return validateCheckboxField(value, field)

        default:
            return null
    }
}

/**
 * Validate an entire form section
 */
export function validateSection(
    sectionData: Record<string, any>,
    fields: FormField[],
    allFormData?: Record<string, Record<string, any>>
): ValidationResult {
    const errors: Record<string, string> = {}

    for (const field of fields) {
        const value = sectionData[field.fieldId]

        // Basic field validation
        const error = validateField(value, field)
        if (error) {
            errors[field.fieldId] = error
            continue
        }

        // Field match validation (e.g., confirm account number)
        if (field.validation?.matchField) {
            const matchValue = sectionData[field.validation.matchField]
            const matchError = validateFieldMatch(value, matchValue, field)
            if (matchError) {
                errors[field.fieldId] = matchError
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}

/**
 * Validate entire form (all sections)
 */
export function validateForm(
    formData: Record<string, Record<string, any>>,
    sections: Array<{
        sectionId: string
        fields: FormField[]
    }>
): ValidationResult {
    const errors: Record<string, string> = {}

    for (const section of sections) {
        const sectionData = formData[section.sectionId] || {}
        const sectionResult = validateSection(sectionData, section.fields, formData)

        // Prefix errors with section ID
        Object.entries(sectionResult.errors).forEach(([fieldId, error]) => {
            errors[`${section.sectionId}.${fieldId}`] = error
        })
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    }
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '₹0'

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0
}
