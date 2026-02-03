import { z } from 'zod';

// User Registration Schema
export const registerSchema = z.object({
    mobile: z.string()
        .regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
    dateOfBirth: z.date()
        .max(new Date(), 'Date of birth cannot be in the future'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    category: z.enum(['GENERAL', 'SC', 'ST', 'OBC', 'EWS']),
    state: z.string()
        .min(1, 'State is required'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

// User Login Schema
export const loginSchema = z.object({
    mobile: z.string()
        .regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
    password: z.string()
        .min(1, 'Password is required'),
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .optional(),
    email: z.string()
        .email('Invalid email address')
        .optional(),
    district: z.string().optional(),
    pincode: z.string()
        .regex(/^\d{6}$/, 'Invalid pincode')
        .optional(),
    annualIncome: z.number()
        .min(0, 'Income cannot be negative')
        .optional(),
    education: z.enum([
        'BELOW_10TH',
        'CLASS_10TH',
        'CLASS_12TH',
        'UNDERGRADUATE',
        'GRADUATE',
        'POSTGRADUATE',
        'DOCTORATE'
    ]).optional(),
    occupation: z.string().optional(),
    disability: z.boolean().optional(),
    disabilityType: z.string().optional(),
});

// Scheme Filter Schema
export const schemeFilterSchema = z.object({
    category: z.string().optional(),
    schemeType: z.string().optional(),
    state: z.string().optional(),
    minBenefit: z.number().optional(),
    maxBenefit: z.number().optional(),
    search: z.string().optional(),
});

// Application Schema
export const applicationSchema = z.object({
    schemeId: z.string(),
    formData: z.record(z.any()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SchemeFilterInput = z.infer<typeof schemeFilterSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
