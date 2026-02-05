import { createServerClient } from './supabase'

/**
 * Replace template placeholders with user data
 * Supports syntax: {{user.fieldName}}
 */
export function replaceTemplatePlaceholders(
    template: string,
    userData: Record<string, any>
): string {
    return template.replace(/\{\{user\.(\w+)\}\}/g, (match, fieldName) => {
        return userData[fieldName] || ''
    })
}

/**
 * Fetch user profile data from Supabase
 */
export async function getUserProfileData(userId: string): Promise<Record<string, any>> {
    const supabase = await createServerClient()

    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error || !profile) {
        console.error('Failed to fetch user profile:', error)
        return {}
    }

    // Map database fields to template field names
    return {
        fullName: profile.full_name || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        dateOfBirth: profile.date_of_birth || '',
        gender: profile.gender || '',
        phoneNumber: profile.phone_number || '',
        email: profile.email || '',
        aadhaarNumber: profile.aadhaar_number || '',
        state: profile.state || '',
        district: profile.district || '',
        pincode: profile.pincode || '',
        address: profile.address || '',
        annualIncome: profile.annual_income || '',
        casteCategory: profile.caste_category || '',
        religion: profile.religion || '',
        occupation: profile.occupation || '',
        educationLevel: profile.education_level || '',
        maritalStatus: profile.marital_status || '',
        bankAccount: profile.bank_account_number || '',
        bankIFSC: profile.bank_ifsc_code || '',
        bankName: profile.bank_name || '',
        bankBranch: profile.bank_branch || ''
    }
}

/**
 * Apply default values to form template
 * Replaces {{user.field}} placeholders with actual user data
 */
export async function applyDefaultValues(
    template: any,
    userId: string
): Promise<any> {
    const userData = await getUserProfileData(userId)

    // Deep clone template to avoid mutation
    const processedTemplate = JSON.parse(JSON.stringify(template))

    // Process each section
    if (processedTemplate.sections) {
        for (const section of processedTemplate.sections) {
            if (section.fields) {
                for (const field of section.fields) {
                    // Replace defaultValue placeholders
                    if (field.defaultValue && typeof field.defaultValue === 'string') {
                        field.defaultValue = replaceTemplatePlaceholders(field.defaultValue, userData)
                    }

                    // Replace placeholder in placeholder text
                    if (field.placeholder && typeof field.placeholder === 'string') {
                        field.placeholder = replaceTemplatePlaceholders(field.placeholder, userData)
                    }
                }
            }
        }
    }

    return processedTemplate
}

/**
 * Extract initial form data from template with default values
 */
export function extractInitialFormData(template: any): Record<string, Record<string, any>> {
    const formData: Record<string, Record<string, any>> = {}

    if (template.sections) {
        for (const section of template.sections) {
            formData[section.sectionId] = {}

            if (section.fields) {
                for (const field of section.fields) {
                    if (field.defaultValue !== undefined && field.defaultValue !== '') {
                        formData[section.sectionId][field.fieldId] = field.defaultValue
                    }
                }
            }
        }
    }

    return formData
}

/**
 * Merge saved form data with template defaults
 * Saved data takes precedence over defaults
 */
export function mergeFormData(
    savedData: Record<string, any>,
    templateDefaults: Record<string, any>
): Record<string, any> {
    const merged: Record<string, any> = {}

    // Get all section IDs from both sources
    const allSectionIds = new Set([
        ...Object.keys(savedData || {}),
        ...Object.keys(templateDefaults || {})
    ])

    for (const sectionId of allSectionIds) {
        merged[sectionId] = {
            ...(templateDefaults[sectionId] || {}),
            ...(savedData[sectionId] || {})
        }
    }

    return merged
}

/**
 * Get user data for auto-fill (client-side version)
 * This fetches from API instead of directly from Supabase
 */
export async function getUserDataForAutofill(): Promise<Record<string, any>> {
    try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
            throw new Error('Failed to fetch profile')
        }

        const { profile } = await response.json()

        return {
            fullName: profile.fullName || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            dateOfBirth: profile.dateOfBirth || '',
            gender: profile.gender || '',
            phoneNumber: profile.phoneNumber || '',
            email: profile.email || '',
            aadhaarNumber: profile.aadhaarNumber || '',
            state: profile.state || '',
            district: profile.district || '',
            pincode: profile.pincode || '',
            address: profile.address || '',
            annualIncome: profile.annualIncome || '',
            casteCategory: profile.casteCategory || '',
            religion: profile.religion || '',
            occupation: profile.occupation || '',
            educationLevel: profile.educationLevel || '',
            maritalStatus: profile.maritalStatus || '',
            bankAccount: profile.bankAccountNumber || '',
            bankIFSC: profile.bankIFSC || '',
            bankName: profile.bankName || '',
            bankBranch: profile.bankBranch || ''
        }
    } catch (error) {
        console.error('Failed to fetch user data for autofill:', error)
        return {}
    }
}
