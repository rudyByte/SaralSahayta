-- ================================================================
-- V3: FINAL ROBUST PHASE 4 CONSOLIDATED SETUP
-- Fixes: relation "User" error AND column "updatedAt" error
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. ENUMS (Matches Prisma schema)
DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "Category" AS ENUM ('GENERAL', 'SC', 'ST', 'OBC', 'EWS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "SchemeType" AS ENUM ('CENTRAL', 'STATE', 'PRIVATE', 'NGO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "SchemeCategory" AS ENUM ('EDUCATION', 'AGRICULTURE', 'HEALTHCARE', 'HOUSING', 'ENTREPRENEURSHIP', 'WOMEN_CHILD', 'SENIOR_CITIZEN', 'DISABILITY', 'EMPLOYMENT', 'SKILL_DEVELOPMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. SCHEMA ALIGNMENT (Ensuring columns exist)
-- Align "Scheme" table (Fixing the "updatedAt" error)
ALTER TABLE IF EXISTS "Scheme" ADD COLUMN IF NOT EXISTS "eligibilityCriteria" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS "Scheme" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS "Scheme" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

-- Align "Document" table
ALTER TABLE IF EXISTS "Document" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE IF EXISTS "Document" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMPTZ DEFAULT NULL;

-- Align "user_profiles" table
ALTER TABLE IF EXISTS user_profiles ADD COLUMN IF NOT EXISTS "is_premium" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS user_profiles ADD COLUMN IF NOT EXISTS "premium_expires_at" TIMESTAMPTZ DEFAULT NULL;

-- 4. PHASE 4 & 5 TABLES
-- Referencing auth.users directly to avoid "User" relation errors

-- Premium Transactions
CREATE TABLE IF NOT EXISTS "PremiumTransaction" (
    "id" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'INR',
    "status" TEXT DEFAULT 'PENDING',
    "provider" TEXT DEFAULT 'RAZORPAY',
    "orderId" TEXT UNIQUE,
    "paymentId" TEXT UNIQUE,
    "signature" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Application Premium Services
CREATE TABLE IF NOT EXISTS "ApplicationPremium" (
    "id" TEXT PRIMARY KEY,
    "applicationId" UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "serviceType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "id" TEXT PRIMARY KEY,
    "userId" UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "smsEnabled" BOOLEAN DEFAULT TRUE,
    "emailEnabled" BOOLEAN DEFAULT TRUE,
    "whatsappEnabled" BOOLEAN DEFAULT FALSE,
    "pushEnabled" BOOLEAN DEFAULT TRUE,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUTOMATED FUNCTIONS (pg_cron)
CREATE OR REPLACE FUNCTION auto_expire_documents()
RETURNS void AS $$
BEGIN
  -- Update documents that have passed their expiry date
  UPDATE "Document"
  SET "status" = 'EXPIRED',
      "isVerified" = false
  WHERE "expiryDate" < CURRENT_DATE
  AND "status" != 'EXPIRED';
END;
$$ LANGUAGE plpgsql;

-- Reset and Schedule daily jobs
DO $$ BEGIN
    PERFORM cron.unschedule('auto-expire-docs-daily');
EXCEPTION WHEN others THEN NULL; END $$;

SELECT cron.schedule('auto-expire-docs-daily', '0 8 * * *', 'SELECT auto_expire_documents()');

-- 6. SCHEME SEEDING (15 Major Schemes)
-- We omit "updatedAt" and let the database handle it with the default NOW()
INSERT INTO "Scheme" (
    id, "schemeId", name, description, ministry, "schemeType", category, 
    "benefitType", "benefitAmount", "benefitDescription", 
    "requiredDocuments", "applicationLink", "isActive", "eligibilityCriteria"
) VALUES 
('scheme_pmmvy', 'PMMVY-001', 'Pradhan Mantri Matru Vandana Yojana', 'Financial assistance for pregnant women and lactating mothers to support nutrition and healthcare.', 'Ministry of Women and Child Development', 'CENTRAL', 'HEALTHCARE', 'DIRECT_TRANSFER', 5000, '₹5,000 for first child in 2 installments; ₹6,000 for second girl child.', ARRAY['AADHAAR', 'MCP_CARD', 'BANK_PASSBOOK', 'BIRTH_CERTIFICATE'], 'https://pmmvy.nic.in/', true, '{}'::jsonb),
('scheme_jjm', 'JJM-001', 'Jal Jeevan Mission (Har Ghar Nal)', 'Provide safe and adequate drinking water through individual household tap connections by 2024 to all households in rural India.', 'Ministry of Jal Shakti', 'CENTRAL', 'HOUSING', 'SERVICE', 0, 'Functional household tap connection for every rural home.', ARRAY['AADHAAR', 'VOTER_ID', 'RATION_CARD', 'RESIDENCE_PROOF'], 'https://jaljeevanmission.gov.in/', true, '{}'::jsonb),
('scheme_apy', 'APY-001', 'Atal Pension Yojana', 'Social security scheme for workers in the unorganized sector to provide a guaranteed monthly pension after age 60.', 'Ministry of Finance', 'CENTRAL', 'EMPLOYMENT', 'PENSION', 5000, 'Monthly pension of ₹1,000 to ₹5,000 based on contributions.', ARRAY['AADHAAR', 'BANK_PASSBOOK'], 'https://www.npscra.nsdl.co.in/scheme-details.php', true, '{}'::jsonb),
('scheme_pmkisan', 'PMKISAN-001', 'Pradhan Mantri Kisan Samman Nidhi', 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.', 'Ministry of Agriculture and Farmers Welfare', 'CENTRAL', 'AGRICULTURE', 'DIRECT_TRANSFER', 6000, '₹6,000 annually in three installments of ₹2,000 each.', ARRAY['AADHAAR', 'LAND_RECORDS', 'BANK_PASSBOOK'], 'https://pmkisan.gov.in/', true, '{}'::jsonb),
('scheme_ayushman', 'PMJAY-001', 'Ayushman Bharat (PM-JAY)', 'World’s largest health insurance scheme providing ₹5 lakh per family per year for secondary and tertiary care hospitalization.', 'Ministry of Health and Family Welfare', 'CENTRAL', 'HEALTHCARE', 'INSURANCE', 500000, 'Cashless treatment up to ₹5 Lakh per year per family.', ARRAY['AADHAAR', 'RATION_CARD'], 'https://pmjay.gov.in/', true, '{}'::jsonb),
('scheme_ssy', 'SSY-001', 'Sukanya Samriddhi Yojana', 'Small deposit scheme for the girl child to build a fund for her education and marriage expenses.', 'Ministry of Women and Child Development', 'CENTRAL', 'EDUCATION', 'SAVINGS', 0, 'High interest savings account with tax benefits under 80C.', ARRAY['AADHAAR', 'BIRTH_CERTIFICATE', 'GUARDIAN_AADHAAR'], 'https://www.indiapost.gov.in/', true, '{}'::jsonb),
('scheme_agnipath', 'AGNIPATH-001', 'Agnipath Scheme', 'Recruitment scheme for youth to serve in the Armed Forces for a period of four years as Agniveers.', 'Ministry of Defence', 'CENTRAL', 'EMPLOYMENT', 'SALARY', 1171000, 'Monthly salary + ₹11.71 Lakh Seva Nidhi package after 4 years.', ARRAY['AADHAAR', 'EDUCATIONAL_CERTIFICATE', 'DOMICILE'], 'https://joinindianarmy.nic.in/', true, '{}'::jsonb),
('scheme_pmfby', 'PMFBY-001', 'Pradhan Mantri Fasal Bima Yojana', 'Accidental insurance for crops against failure due to natural calamities, pests & diseases.', 'Ministry of Agriculture and Farmers Welfare', 'CENTRAL', 'AGRICULTURE', 'INSURANCE', 0, 'Insurance coverage for crop loss with very low premiums for farmers.', ARRAY['AADHAAR', 'LAND_RECORDS', 'BANK_PASSBOOK'], 'https://pmfby.gov.in/', true, '{}'::jsonb),
('scheme_svamitva', 'SVAMITVA-001', 'SVAMITVA Scheme', 'Mapping of residential land in villages using drones to provide "Record of Rights" and property cards to rural owners.', 'Ministry of Panchayati Raj', 'CENTRAL', 'HOUSING', 'SERVICE', 0, 'Legal property card (Svamitva Card) and access to bank loans.', ARRAY['AADHAAR', 'RESIDENCE_PROOF'], 'https://svamitva.nic.in/', true, '{}'::jsonb),
('scheme_pmmsy', 'PMMSY-001', 'PM Matsya Sampada Yojana', 'Flagship scheme for focused and sustainable development of the fisheries sector and income of fishermen.', 'Ministry of Fisheries, Animal Husbandry and Dairying', 'CENTRAL', 'AGRICULTURE', 'SUBSIDY', 0, 'Subsidies up to 60% for women/SC/ST and 40% for others for fishing infrastructure.', ARRAY['AADHAAR', 'FISHERIES_LICENSE', 'BANK_PASSBOOK'], 'https://pmmsy.dof.gov.in/', true, '{}'::jsonb),
('scheme_csss', 'CSSS-001', 'Central Sector Scheme of Scholarship (CSSS)', 'Scholarship for meritorious students from low-income families for pursuing higher education.', 'Ministry of Education', 'CENTRAL', 'EDUCATION', 'SCHOLARSHIP', 20000, '₹12,000 to ₹20,000 per year depending on the course level.', ARRAY['AADHAAR', 'MARKSHEET_12TH', 'INCOME_CERTIFICATE', 'BONAFIDE_CERTIFICATE'], 'https://scholarships.gov.in/', true, '{}'::jsonb),
('scheme_nmmss', 'NMMSS-001', 'National Means-cum-Merit Scholarship', 'Scholarship for meritorious students of economically weaker sections to reduce dropouts at class 8.', 'Ministry of Education', 'CENTRAL', 'EDUCATION', 'SCHOLARSHIP', 12000, '₹12,000 per year from class 9 to 12.', ARRAY['AADHAAR', 'INCOME_CERTIFICATE', 'SCHOOL_ID'], 'https://scholarships.gov.in/', true, '{}'::jsonb),
('scheme_pmsby', 'PMSBY-001', 'Pradhan Mantri Suraksha Bima Yojana', 'Accidental death and disability insurance scheme available to people in the age group 18 to 70 years.', 'Ministry of Finance', 'CENTRAL', 'HEALTHCARE', 'INSURANCE', 200000, '₹2 Lakh for accidental death/total disability; ₹1 Lakh for partial disability.', ARRAY['AADHAAR', 'BANK_PASSBOOK'], 'https://www.jansuraksha.gov.in/', true, '{}'::jsonb),
('scheme_pmjjby', 'PMJJBY-001', 'Pradhan Mantri Jeevan Jyoti Bima Yojana', 'One-year life insurance scheme renewable from year to year, offering coverage for death due to any reason.', 'Ministry of Finance', 'CENTRAL', 'HEALTHCARE', 'INSURANCE', 200000, '₹2 Lakh life cover for death due to any reason.', ARRAY['AADHAAR', 'BANK_PASSBOOK'], 'https://www.jansuraksha.gov.in/', true, '{}'::jsonb),
('scheme_pmposhan', 'PMPOSHAN-001', 'PM Poshan Shakti Nirman', 'Nutrition support to children in government and government-aided schools to improve nutritional status and school attendance.', 'Ministry of Education', 'CENTRAL', 'EDUCATION', 'NUTRITION', 0, 'Hot cooked meals every school day for students in classes 1-8.', ARRAY['AADHAAR'], 'https://pmposhan.education.gov.in/', true, '{}'::jsonb)
ON CONFLICT ("schemeId") DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    ministry = EXCLUDED.ministry,
    "schemeType" = EXCLUDED."schemeType",
    category = EXCLUDED.category,
    "benefitType" = EXCLUDED."benefitType",
    "benefitAmount" = EXCLUDED."benefitAmount",
    "benefitDescription" = EXCLUDED."benefitDescription",
    "requiredDocuments" = EXCLUDED."requiredDocuments",
    "applicationLink" = EXCLUDED."applicationLink",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 7. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
