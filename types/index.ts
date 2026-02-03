import { Prisma } from '@prisma/client';

// User Types
export type UserWithProfile = Prisma.UserGetPayload<{
    include: { profile: true };
}>;

export type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        profile: true;
        familyMembers: true;
        documents: true;
    };
}>;

// Scheme Types
export type SchemeWithApplications = Prisma.SchemeGetPayload<{
    include: { applications: true };
}>;

export interface SchemeMatch {
    scheme: Prisma.SchemeGetPayload<{}>;
    eligibilityScore: number;
    matchedCriteria: string[];
    missingCriteria: string[];
}

// Application Types
export type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
    include: {
        user: true;
        scheme: true;
    };
}>;

// Document Types
export interface DocumentGuide {
    documentType: string;
    displayName: string;
    description: string;
    onlineSteps: DocumentStep[];
    offlineSteps: DocumentStep[];
    requiredDocuments: string[];
    estimatedTime: string;
    fees: number;
}

export interface DocumentStep {
    stepNumber: number;
    title: string;
    description: string;
    link?: string;
    address?: string;
    contactNumber?: string;
}

// Filter Types
export interface SchemeFilters {
    category?: string;
    schemeType?: string;
    state?: string;
    minBenefit?: number;
    maxBenefit?: number;
    search?: string;
    sortBy?: 'relevance' | 'benefit' | 'deadline' | 'successRate';
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Form Types
export interface ProfileFormData {
    name: string;
    email?: string;
    dateOfBirth: Date;
    gender: string;
    category: string;
    state: string;
    district?: string;
    pincode?: string;
    annualIncome?: number;
    education?: string;
    occupation?: string;
    disability: boolean;
    disabilityType?: string;
}

// Navigation Types
export interface NavItem {
    title: string;
    href: string;
    icon?: any;
    disabled?: boolean;
    external?: boolean;
}

// Dashboard Stats
export interface DashboardStats {
    totalSchemes: number;
    matchedSchemes: number;
    applications: {
        total: number;
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
    };
    documents: {
        total: number;
        verified: number;
        pending: number;
    };
}

// Indian States
export const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
] as const;

export type IndianState = typeof INDIAN_STATES[number];
