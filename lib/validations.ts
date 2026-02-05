import { z } from 'zod';
// We'll update the Schema to match the new comprehensive requirements

// Re-export common schemas
export const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number');

/* -------------------------------------------------------------------------- */
/*                            Tab 1: Basic Details                            */
/* -------------------------------------------------------------------------- */
export const profileBasicSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    mobile: z.string().optional(), // Read-only in form but part of schema
    dateOfBirth: z.string().optional().refine((date) => {
        if (!date) return true;
        return new Date(date) <= new Date();
    }, 'Date of birth cannot be in the future'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

/* -------------------------------------------------------------------------- */
/*                         Tab 2: Eligibility Details                         */
/* -------------------------------------------------------------------------- */
// Base Object (for merging)
const profileEligibilityBase = z.object({
    category: z.enum(['GENERAL', 'SC', 'ST', 'OBC', 'EWS']),
    annualIncome: z.coerce.number()
        .min(0, 'Income cannot be negative')
        .max(5000000, 'Income cannot exceed ₹50,00,000'),
    state: z.string().min(1, 'State is required'),
    district: z.string().min(1, 'District is required'),
    education: z.enum([
        'BELOW_10TH', 'CLASS_10TH', 'CLASS_12TH',
        'UNDERGRADUATE', 'GRADUATE', 'POSTGRADUATE', 'DOCTORATE'
    ]),
    occupation: z.enum([
        'STUDENT', 'FARMER', 'ENTREPRENEUR',
        'SALARIED', 'UNEMPLOYED', 'OTHER'
    ]),
    disability: z.boolean().default(false),
    disabilityType: z.string().optional(),
});

// Refined Schema (for independent validation)
export const profileEligibilitySchema = profileEligibilityBase.refine((data) => {
    if (data.disability && !data.disabilityType) {
        return false;
    }
    return true;
}, {
    message: "Disability type is required when disability status is Yes",
    path: ["disabilityType"],
});

/* -------------------------------------------------------------------------- */
/*                             Tab 3: Bank Details                            */
/* -------------------------------------------------------------------------- */
export const profileBankSchema = z.object({
    bankAccount: z.string()
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot exceed 18 digits')
        .regex(/^\d+$/, 'Account number must contain only digits')
        .optional()
        .or(z.literal('')),
    ifscCode: z.string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (e.g., SBIN0001234)')
        .optional()
        .or(z.literal('')),
    bankName: z.string().optional(), // Populated by API
    branch: z.string().optional(),   // Populated by API
});

/* -------------------------------------------------------------------------- */
/*                            Full Profile Update                             */
/* -------------------------------------------------------------------------- */
// Combine all for API validation
// We use the BASE object for merging, because .refine() returns a ZodEffects which cannot be merged
export const fullProfileUpdateSchema = profileBasicSchema
    .merge(profileEligibilityBase)
    .merge(profileBankSchema.partial()) // Bank details can be partial/empty initially
    .partial(); // API allows partial updates

export type ProfileBasicInput = z.infer<typeof profileBasicSchema>;
export type ProfileEligibilityInput = z.infer<typeof profileEligibilitySchema>;
export type ProfileBankInput = z.infer<typeof profileBankSchema>;
export type FullProfileUpdateInput = z.infer<typeof fullProfileUpdateSchema>;
