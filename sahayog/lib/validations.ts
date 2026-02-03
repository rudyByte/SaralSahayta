import { z } from "zod";
import { Gender, CasteCategory, EducationLevel, Occupation } from "@prisma/client";

// Phone Validation
export const phoneSchema = z.object({
    phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
});

// OTP Validation
export const otpSchema = z.object({
    phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

// Profile Completion Validation
export const profileBasicSchema = z.object({
    fullName: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date",
    }),
    gender: z.nativeEnum(Gender),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const profileEligibilitySchema = z.object({
    casteCategory: z.nativeEnum(CasteCategory),
    annualIncome: z.number().min(0).max(5000000),
    state: z.string().min(1, "State is required"),
    district: z.string().min(1, "District is required"),
    educationLevel: z.nativeEnum(EducationLevel),
    occupation: z.nativeEnum(Occupation),
    disabilityStatus: z.boolean(),
    disabilityType: z.string().optional().or(z.literal("")),
});

export const profileBankSchema = z.object({
    bankAccount: z.string().regex(/^\d{9,18}$/, "Account number must be 9-18 digits").optional().or(z.literal("")),
    bankIFSC: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format").optional().or(z.literal("")),
});
