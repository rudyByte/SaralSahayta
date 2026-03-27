-- ============================================
-- PHASE 15: SCHEME DATA FIXES + DOCUMENT REQUIREMENTS
-- Run in Supabase SQL Editor
-- ============================================

-- 1. DELETE FAKE SCHEMES THAT DON'T EXIST
DELETE FROM "SchemeDocumentRequirement"
WHERE "schemeId" IN (
    SELECT id FROM "Scheme" WHERE "schemeId" IN ('MH-PROF-001', 'TR-ARTISAN-001')
);
DELETE FROM "Scheme" WHERE "schemeId" IN ('MH-PROF-001', 'TR-ARTISAN-001');
DELETE FROM "Scheme" WHERE name IN ('Maharashtra Professional Excellence Grant', 'Tribal Artisans Equipment Grant');

-- 2. FIX PM-USP SCHEME NAME (CSSS)
UPDATE "Scheme"
SET 
    name = 'PM-USP Central Sector Scheme of Scholarship',
    description = 'Pradhan Mantri Uchchatar Shiksha Protsahan (PM-USP) scholarship for meritorious students from economically weaker families to meet day-to-day expenses during higher studies.',
    ministry = 'Department of Higher Education, Ministry of Education'
WHERE "schemeId" = 'PMUSP-001' OR name ILIKE '%Central Sector Scheme%' OR name ILIKE '%CSSS%';

-- 3. REMOVE DUPLICATE SCHEMES (keep first occurrence)
-- Find and delete duplicates by scheme name, keeping the one with more data
DELETE FROM "SchemeDocumentRequirement"
WHERE "schemeId" IN (
    SELECT id FROM "Scheme" s1
    WHERE EXISTS (
        SELECT 1 FROM "Scheme" s2
        WHERE s2.name = s1.name
        AND s2.id < s1.id
    )
);
DELETE FROM "Scheme" s1
WHERE EXISTS (
    SELECT 1 FROM "Scheme" s2
    WHERE s2.name = s1.name
    AND s2.id < s1.id
);

-- 4. SEED SCHEME DOCUMENT REQUIREMENTS
-- Clear existing requirements (they may be stale/incorrect)
DELETE FROM "SchemeDocumentRequirement";

-- =========================================================
-- HELPER: Insert requirements by scheme name (safer than ID)
-- =========================================================

-- PMMVY - Pradhan Mantri Matru Vandana Yojana
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code
        WHEN 'AADHAAR' THEN true
        WHEN 'BANK_PASSBOOK' THEN true
        WHEN 'MCP_CARD' THEN true
        ELSE false
    END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar mapped bank/post office account required for DBT'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account details for Direct Benefit Transfer'
        WHEN 'MCP_CARD' THEN 'Mother and Child Protection card tracking ANC visits and vaccinations'
        WHEN 'INCOME_CERTIFICATE' THEN 'For families with income less than ₹8 Lakh per annum'
        WHEN 'MGNREGA' THEN 'MGNREGA job card holders eligible'
        WHEN 'ESHRAM' THEN 'Women holding e-Shram card eligible'
        WHEN 'IMMUNIZATION_CARD' THEN 'Child immunization details required for 2nd installment'
        WHEN 'BIRTH_CERTIFICATE' THEN 'Child birth certificate for registration'
        ELSE 'Supporting document'
    END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 1
        WHEN 'BANK_PASSBOOK' THEN 2
        WHEN 'MCP_CARD' THEN 3
        WHEN 'IMMUNIZATION_CARD' THEN 4
        WHEN 'BIRTH_CERTIFICATE' THEN 5
        WHEN 'INCOME_CERTIFICATE' THEN 6
        WHEN 'MGNREGA' THEN 7
        WHEN 'ESHRAM' THEN 8
        ELSE 9
    END
FROM "Scheme" s, documents d
WHERE s.name ILIKE '%Matru Vandana%'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK','MCP_CARD','INCOME_CERTIFICATE','MGNREGA','ESHRAM','IMMUNIZATION_CARD','BIRTH_CERTIFICATE')
ON CONFLICT DO NOTHING;

-- Kanya Sumangala Yojana (MKSY)
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code
        WHEN 'AADHAAR' THEN true
        WHEN 'BIRTH_CERTIFICATE' THEN true
        WHEN 'BANK_PASSBOOK' THEN true
        ELSE false
    END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar card for identity verification'
        WHEN 'BIRTH_CERTIFICATE' THEN 'Girl child birth certificate (mandatory at Phase 1)'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account linked to Aadhaar for DBT payments across 6 phases'
        WHEN 'DOMICILE' THEN 'Uttar Pradesh domicile/residence certificate required'
        WHEN 'IMMUNIZATION_CARD' THEN 'Immunization card required for Phase 2 (vaccination proof)'
        WHEN 'MARKSHEET' THEN '10th/12th certificate required for Phase 6 (graduation admission)'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'BIRTH_CERTIFICATE' THEN 2 WHEN 'BANK_PASSBOOK' THEN 3 WHEN 'DOMICILE' THEN 4 WHEN 'IMMUNIZATION_CARD' THEN 5 WHEN 'MARKSHEET' THEN 6 ELSE 7 END
FROM "Scheme" s, documents d
WHERE s.name ILIKE '%Kanya Sumangala%'
AND d.document_code IN ('AADHAAR','BIRTH_CERTIFICATE','BANK_PASSBOOK','DOMICILE','IMMUNIZATION_CARD','MARKSHEET')
ON CONFLICT DO NOTHING;

-- NULM - National Urban Livelihood Mission
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'BANK_PASSBOOK' THEN true WHEN 'INCOME_CERTIFICATE' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Identity proof for application'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account details for loan disbursement'
        WHEN 'INCOME_CERTIFICATE' THEN 'Family income below ₹3 lakh. Can also use ₹10 self-declaration affidavit'
        WHEN 'RATION_CARD' THEN 'Ration card as address proof'
        ELSE 'Address or supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'INCOME_CERTIFICATE' THEN 2 WHEN 'BANK_PASSBOOK' THEN 3 WHEN 'RATION_CARD' THEN 4 ELSE 5 END
FROM "Scheme" s, documents d
WHERE s.name ILIKE '%Urban Livelihood%' OR s."schemeId" = 'NULM-001'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK','INCOME_CERTIFICATE','RATION_CARD')
ON CONFLICT DO NOTHING;

-- NMMSS - National Means-cum-Merit Scholarship
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'MARKSHEET' THEN true WHEN 'INCOME_CERTIFICATE' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar for e-KYC and DBT bank account seeding'
        WHEN 'MARKSHEET' THEN 'Class 7th marksheet (55% minimum, 50% for SC/ST) to appear in selection test'
        WHEN 'INCOME_CERTIFICATE' THEN 'Parental income not more than ₹3.5 Lakh per annum'
        WHEN 'CASTE_CERTIFICATE' THEN 'Caste certificate for SC/ST reservation benefits (5% mark relaxation)'
        WHEN 'DOMICILE' THEN 'State domicile certificate for state quota eligibility'
        WHEN 'DISABILITY_CERT' THEN 'Disability certificate if applicable'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'MARKSHEET' THEN 2 WHEN 'INCOME_CERTIFICATE' THEN 3 WHEN 'CASTE_CERTIFICATE' THEN 4 WHEN 'DOMICILE' THEN 5 WHEN 'DISABILITY_CERT' THEN 6 ELSE 7 END
FROM "Scheme" s, documents d
WHERE s.name ILIKE '%Means-cum-Merit%' OR s."schemeId" = 'NMMSS-001'
AND d.document_code IN ('AADHAAR','MARKSHEET','INCOME_CERTIFICATE','CASTE_CERTIFICATE','DOMICILE','DISABILITY_CERT')
ON CONFLICT DO NOTHING;

-- APY - Atal Pension Yojana
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id, true,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'KYC is done through Aadhaar OTP verification. Age 18-40 years only.'
        WHEN 'BANK_PASSBOOK' THEN 'Active savings bank account required for auto-debit of premium'
        ELSE 'KYC document'
    END, ROW_NUMBER() OVER (ORDER BY d.document_code)
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'APY-001'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK')
ON CONFLICT DO NOTHING;

-- PMJAY - Ayushman Bharat
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar or any Government ID for identity verification at hospital'
        WHEN 'RATION_CARD' THEN 'Ration card or family ID for family identification (alternative)'
        WHEN 'VOTER_ID' THEN 'Voter ID as alternate identity proof'
        WHEN 'INCOME_CERTIFICATE' THEN 'Income/category proof for eligibility verification'
        WHEN 'CASTE_CERTIFICATE' THEN 'Caste certificate for SC/ST households'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'RATION_CARD' THEN 2 WHEN 'VOTER_ID' THEN 3 WHEN 'INCOME_CERTIFICATE' THEN 4 WHEN 'CASTE_CERTIFICATE' THEN 5 ELSE 6 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMJAY-001'
AND d.document_code IN ('AADHAAR','RATION_CARD','VOTER_ID','INCOME_CERTIFICATE','CASTE_CERTIFICATE')
ON CONFLICT DO NOTHING;

-- PMSBY - Pradhan Mantri Suraksha Bima Yojana
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id, true,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar linked to bank account for enrollment via auto-debit'
        WHEN 'BANK_PASSBOOK' THEN 'Active savings bank account. Premium ₹20/year deducted automatically.'
        ELSE 'Identity document'
    END, ROW_NUMBER() OVER (ORDER BY d.document_code)
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMSBY-001'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK')
ON CONFLICT DO NOTHING;

-- PMJJBY - Pradhan Mantri Jeevan Jyoti Bima Yojana
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id, true,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar for identity verification at bank/post office'
        WHEN 'BANK_PASSBOOK' THEN 'Bank/Post Office savings account for auto-debit of ₹436/year premium'
        ELSE 'Identity document'
    END, ROW_NUMBER() OVER (ORDER BY d.document_code)
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMJJBY-001'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK')
ON CONFLICT DO NOTHING;

-- PM-KISAN
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'BANK_PASSBOOK' THEN true WHEN 'LAND_RECORDS' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar for DBT and identity authentication'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account Aadhaar-linked for ₹2000 installments via DBT'
        WHEN 'LAND_RECORDS' THEN 'Land holding papers (Survey/Khata No., Khasra No., area)'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'LAND_RECORDS' THEN 2 WHEN 'BANK_PASSBOOK' THEN 3 ELSE 4 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMKISAN-001'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK','LAND_RECORDS')
ON CONFLICT DO NOTHING;

-- SSY - Sukanya Samriddhi Yojana
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'BIRTH_CERTIFICATE' THEN true WHEN 'AADHAAR' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'BIRTH_CERTIFICATE' THEN 'Girl child birth certificate — mandatory age proof (account must open before age 10)'
        WHEN 'AADHAAR' THEN 'Identity proof of parent/guardian (Aadhaar, PAN, Voter ID, or Passport)'
        WHEN 'PAN' THEN 'PAN card of guardian (optional, for tax records)'
        WHEN 'DOMICILE' THEN 'Address proof of guardian (utility bill, ration card, or Aadhaar)'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'BIRTH_CERTIFICATE' THEN 1 WHEN 'AADHAAR' THEN 2 WHEN 'PAN' THEN 3 WHEN 'DOMICILE' THEN 4 ELSE 5 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'SSY-001'
AND d.document_code IN ('BIRTH_CERTIFICATE','AADHAAR','PAN','DOMICILE')
ON CONFLICT DO NOTHING;

-- SVAMITVA
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Identity proof of property owner for property card issuance'
        WHEN 'VOTER_ID' THEN 'Alternate identity proof for property ownership verification'
        WHEN 'DOMICILE' THEN 'Residence proof for rural inhabited area property claim'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'VOTER_ID' THEN 2 WHEN 'DOMICILE' THEN 3 ELSE 4 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'SVAM-001'
AND d.document_code IN ('AADHAAR','VOTER_ID','DOMICILE')
ON CONFLICT DO NOTHING;

-- PMMSY - Pradhan Mantri Matsya Sampada
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'PAN' THEN true WHEN 'BANK_PASSBOOK' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar for identity verification'
        WHEN 'PAN' THEN 'PAN Card for financial transactions and subsidy processing'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account details for subsidy/credit-linked assistance'
        WHEN 'LAND_RECORDS' THEN 'Land lease agreement or land ownership documents if project requires land'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'PAN' THEN 2 WHEN 'BANK_PASSBOOK' THEN 3 WHEN 'LAND_RECORDS' THEN 4 ELSE 5 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMMSY-001'
AND d.document_code IN ('AADHAAR','PAN','BANK_PASSBOOK','LAND_RECORDS')
ON CONFLICT DO NOTHING;

-- JJM - Jal Jeevan Mission
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id, false,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Any proof of identity is sufficient to apply for water connection'
        WHEN 'VOTER_ID' THEN 'Voter ID as alternate identity proof'
        WHEN 'RATION_CARD' THEN 'Ration card as alternate household identity proof'
        ELSE 'Any government identity proof'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'VOTER_ID' THEN 2 WHEN 'RATION_CARD' THEN 3 ELSE 4 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'JJM-001'
AND d.document_code IN ('AADHAAR','VOTER_ID','RATION_CARD')
ON CONFLICT DO NOTHING;

-- PMAY Urban
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'INCOME_CERTIFICATE' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar number required on the PMAY-Urban application form'
        WHEN 'INCOME_CERTIFICATE' THEN 'Income certificate or self-certificate/affidavit as proof of income (EWS/LIG/MIG category)'
        WHEN 'PAN' THEN 'PAN card as identity and nationality proof'
        WHEN 'VOTER_ID' THEN 'Voter ID as identity and residential proof'
        WHEN 'BANK_PASSBOOK' THEN 'Bank details and account statement for loan/subsidy processing'
        WHEN 'CASTE_CERTIFICATE' THEN 'Minority community proof if applicable'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'INCOME_CERTIFICATE' THEN 2 WHEN 'PAN' THEN 3 WHEN 'VOTER_ID' THEN 4 WHEN 'BANK_PASSBOOK' THEN 5 WHEN 'CASTE_CERTIFICATE' THEN 6 ELSE 7 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMAYU-001'
AND d.document_code IN ('AADHAAR','INCOME_CERTIFICATE','PAN','VOTER_ID','BANK_PASSBOOK','CASTE_CERTIFICATE')
ON CONFLICT DO NOTHING;

-- PM Poshan Shakti Nirman
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id, false,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Child Aadhaar card (optional — for transparent school record-keeping)'
        WHEN 'BIRTH_CERTIFICATE' THEN 'Date of birth proof for school admission (required for enrollment, not for meals)'
        WHEN 'RATION_CARD' THEN 'Residence proof required for school admission'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'BIRTH_CERTIFICATE' THEN 1 WHEN 'AADHAAR' THEN 2 WHEN 'RATION_CARD' THEN 3 ELSE 4 END
FROM "Scheme" s, documents d
WHERE s.name ILIKE '%Poshan%'
AND d.document_code IN ('AADHAAR','BIRTH_CERTIFICATE','RATION_CARD')
ON CONFLICT DO NOTHING;

-- Post Matric Scholarship SC Students
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'CASTE_CERTIFICATE' THEN true WHEN 'INCOME_CERTIFICATE' THEN true WHEN 'MARKSHEET' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar for e-KYC on National Scholarship Portal and DBT disbursement'
        WHEN 'CASTE_CERTIFICATE' THEN 'SC community certificate — mandatory (scheme is exclusively for Scheduled Caste students)'
        WHEN 'INCOME_CERTIFICATE' THEN 'Parents/guardian income below ₹2,50,000 per annum required'
        WHEN 'MARKSHEET' THEN 'Academic marksheet (10th/12th) as proof of passing matriculation'
        WHEN 'DOMICILE' THEN 'Domicile certificate of the state to which the applicant belongs'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account details for Direct Benefit Transfer of scholarship amount'
        WHEN 'DISABILITY_CERT' THEN 'Disability certificate if applicable (10% extra allowance for Divyang students)'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'CASTE_CERTIFICATE' THEN 2 WHEN 'INCOME_CERTIFICATE' THEN 3 WHEN 'MARKSHEET' THEN 4 WHEN 'DOMICILE' THEN 5 WHEN 'BANK_PASSBOOK' THEN 6 WHEN 'DISABILITY_CERT' THEN 7 ELSE 8 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMSC-001'
AND d.document_code IN ('AADHAAR','CASTE_CERTIFICATE','INCOME_CERTIFICATE','MARKSHEET','DOMICILE','BANK_PASSBOOK','DISABILITY_CERT')
ON CONFLICT DO NOTHING;

-- PM-USP / CSSS Scholarship
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'MARKSHEET' THEN true WHEN 'INCOME_CERTIFICATE' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Aadhaar-seeded bank account required for DBT scholarship disbursement'
        WHEN 'MARKSHEET' THEN '12th marksheet — must be above 80th percentile in relevant stream'
        WHEN 'INCOME_CERTIFICATE' THEN 'Family income not exceeding ₹4,50,000 per annum'
        WHEN 'CASTE_CERTIFICATE' THEN 'Category/caste certificate for reserved category students'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account linked to Aadhaar for scholarship transfer'
        WHEN 'DISABILITY_CERT' THEN 'Disability certificate if applicable'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'MARKSHEET' THEN 2 WHEN 'INCOME_CERTIFICATE' THEN 3 WHEN 'CASTE_CERTIFICATE' THEN 4 WHEN 'BANK_PASSBOOK' THEN 5 WHEN 'DISABILITY_CERT' THEN 6 ELSE 7 END
FROM "Scheme" s, documents d
WHERE s."schemeId" = 'PMUSP-001'
AND d.document_code IN ('AADHAAR','MARKSHEET','INCOME_CERTIFICATE','CASTE_CERTIFICATE','BANK_PASSBOOK','DISABILITY_CERT')
ON CONFLICT DO NOTHING;

-- PMFBY - Pradhan Mantri Fasal Bima Yojana (if it exists in DB)
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText", "displayOrder")
SELECT s.id, d.id,
    CASE d.document_code WHEN 'AADHAAR' THEN true WHEN 'BANK_PASSBOOK' THEN true WHEN 'LAND_RECORDS' THEN true ELSE false END,
    CASE d.document_code
        WHEN 'AADHAAR' THEN 'Identity proof for farmer registration'
        WHEN 'BANK_PASSBOOK' THEN 'Bank account for premium payment and claim settlement'
        WHEN 'LAND_RECORDS' THEN 'Land ownership/possession certificate (RoR, LPC) or lease agreement'
        WHEN 'VOTER_ID' THEN 'Alternate identity proof (Voter ID / PAN / NREGA Job Card)'
        ELSE 'Supporting document'
    END,
    CASE d.document_code WHEN 'AADHAAR' THEN 1 WHEN 'LAND_RECORDS' THEN 2 WHEN 'BANK_PASSBOOK' THEN 3 WHEN 'VOTER_ID' THEN 4 ELSE 5 END
FROM "Scheme" s, documents d
WHERE s.name ILIKE '%Fasal Bima%'
AND d.document_code IN ('AADHAAR','BANK_PASSBOOK','LAND_RECORDS','VOTER_ID')
ON CONFLICT DO NOTHING;

-- 5. VERIFY RESULTS
SELECT 
    s.name AS scheme_name,
    COUNT(r.id) AS doc_requirements
FROM "Scheme" s
LEFT JOIN "SchemeDocumentRequirement" r ON r."schemeId" = s.id
WHERE s."isActive" = true
GROUP BY s.name
ORDER BY COUNT(r.id) DESC;

SELECT COUNT(*) AS total_requirements FROM "SchemeDocumentRequirement";
SELECT COUNT(*) AS total_active_schemes FROM "Scheme" WHERE "isActive" = true;
