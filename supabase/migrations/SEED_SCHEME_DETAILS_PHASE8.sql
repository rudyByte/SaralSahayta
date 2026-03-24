-- ============================================
-- PHASE 8: SEED DATA - COMPREHENSIVE SCHEMES
-- STEP 2: RUN THIS AFTER PHASE8_ENUM_EXTENSIONS.sql
-- ============================================

-- 1. ENSURE MASTER DOCUMENTS EXIST
-- Using a robust CTE to avoid duplicates on BOTH document_name and document_code
WITH new_docs (document_name, document_code, category, is_common) AS (
  VALUES 
    ('Aadhaar Card', 'AADHAAR', 'IDENTITY'::document_category, true),
    ('PAN Card', 'PAN', 'IDENTITY'::document_category, true),
    ('Bank Passbook', 'BANK_PASSBOOK', 'FINANCIAL'::document_category, true),
    ('Voter ID', 'VOTER_ID', 'IDENTITY'::document_category, true),
    ('Ration Card', 'RATION_CARD', 'RESIDENCE'::document_category, true),
    ('Income Certificate', 'INCOME_CERTIFICATE', 'FINANCIAL'::document_category, true),
    ('Caste Certificate', 'CASTE_CERTIFICATE', 'CASTE'::document_category, true),
    ('Domicile Certificate', 'DOMICILE', 'RESIDENCE'::document_category, true),
    ('Birth Certificate', 'BIRTH_CERTIFICATE', 'IDENTITY'::document_category, true),
    ('Marksheet (10th/12th)', 'MARKSHEET', 'EDUCATION'::document_category, true),
    ('e-Shram Card', 'ESHRAM', 'EMPLOYMENT'::document_category, true),
    ('MGNREGA Job Card', 'MGNREGA', 'EMPLOYMENT'::document_category, true),
    ('Kisan Credit Card', 'KCC', 'AGRICULTURE'::document_category, true),
    ('Disability Certificate', 'DISABILITY_CERT', 'HEALTH'::document_category, true),
    ('MCP Card (Mamta Card)', 'MCP_CARD', 'HEALTH'::document_category, false),
    ('Immunization Card', 'IMMUNIZATION_CARD', 'HEALTH'::document_category, false),
    ('Land Records (7/12)', 'LAND_RECORDS', 'AGRICULTURE'::document_category, false)
)
INSERT INTO documents (id, document_name, document_code, category, is_common)
SELECT gen_random_uuid(), n.document_name, n.document_code, n.category, n.is_common
FROM new_docs n
WHERE NOT EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.document_name = n.document_name 
     OR d.document_code = n.document_code
);

-- 2. SEED THE 19 SCHEMES (ROBUST VERSION)
WITH scheme_data (
  id, "schemeId", name, description, description_full, ministry, "schemeType", category, 
  "benefitType", "benefitAmount", "benefitDescription", 
  benefits_details, eligibility_details, application_process, exclusions,
  "applicationLink", official_website, "isActive"
) AS (
  VALUES 
  ('scheme_pmmvy', 'PMMVY-001', 'Pradhan Mantri Matru Vandana Yojana', 'Financial assistance for pregnant women and lactating mothers.', 'Pradhan Mantri Matru Vandana Yojana (PMMVY) is a Centrally Sponsored flagship scheme... providing maternity benefits for the first two living children.', 'Ministry of Women and Child Development', 'CENTRAL', 'WOMEN_CHILD', 'DIRECT_TRANSFER', 5000, '₹5,000 for 1st child; ₹6,000 for 2nd girl child.', '["₹3,000 on registration + 1 ANC", "₹2,000 after child birth registration & 14-week vaccines", "₹6,000 for 2nd girl child in single instalment"]'::jsonb, '{"min_age": 19, "target": "Pregnant/Lactating Mothers", "income_limit": 800000}'::jsonb, 'Online via Citizen login tab on official website. Choose Beneficiary Registration.', 'Govt employees or those receiving similar benefits are excluded.', 'https://pmmvy.nic.in/', 'https://pmmvy.nic.in/', true),
  ('scheme_mksy', 'MKSY-001', 'Kanya Sumangala Yojana', 'Support for girl child health and education in Uttar Pradesh.', 'To end female feticide, establish equal gender ratio, and encourage education of girls.', 'Dept of Women and Child Development, UP', 'STATE', 'WOMEN_CHILD', 'DIRECT_TRANSFER', 15000, 'Total ₹15,000 in 6 phases from birth to graduation.', '["₹2,000 at birth", "₹1,000 after vaccination", "₹2,000 at Class 1", "₹2,000 at Class 6", "₹3,000 at Class 9", "₹5,000 at Graduation admission"]'::jsonb, '{"state": "Uttar Pradesh", "income_limit": 300000, "max_girls": 2}'::jsonb, 'Online via Citizen Service Portal. Requires Aadhaar and OTP verification.', 'Families outside UP or exceeding income limit.', 'https://mksy.up.gov.in/', 'https://mksy.up.gov.in/', true),
  ('scheme_nulm', 'NULM-001', 'National Urban Livelihood Mission', 'Employment and skill support for urban poor.', 'Under the Self-Employment Programme, beneficiaries are provided loans up to ₹2.00 lakh with interest subsidy.', 'Ministry of Housing and Urban Affairs', 'CENTRAL', 'EMPLOYMENT', 'SUBSIDY', 200000, 'Loan up to ₹2 Lakh with 7% interest cap.', '["Loan up to ₹2,00,000", "Interest subsidy above 7%", "Skill training", "Support for street vendors"]'::jsonb, '{"income_limit": 300000, "target": "Urban Poor"}'::jsonb, 'Offline at Municipal Body office. Scrutiny by Task Force committee.', 'Those already having bank defaults.', 'https://nulm.gov.in/', 'https://nulm.gov.in/', true),
  ('scheme_nmmss', 'NMMSS-001', 'National Means-cum-Merit Scholarship', 'Scholarship for meritorious students of EWS category.', 'To award 1,00,000 scholarships to gifted students to reduce dropout at class 8.', 'Ministry of Education', 'CENTRAL', 'EDUCATION', 'SCHOLARSHIP', 12000, '₹12,000 per annum from Class 9 to 12.', '["₹1,000 per month scholarship", "Direct Benefit Transfer to bank account"]'::jsonb, '{"income_limit": 350000, "marks_class_7": 55, "school_type": "Government/Aided"}'::jsonb, 'Online via National Scholarship Portal (NSP). Requires MAT and SAT test qualification.', 'KV, NVS and private school students are excluded.', 'https://scholarships.gov.in/', 'https://scholarships.gov.in/', true),
  ('scheme_apy', 'APY-001', 'Atal Pension Yojana', 'Guaranteed pension for workers in the unorganized sector.', 'Encourages workers to voluntarily save for their retirement. Age 18-40 years.', 'Ministry of Finance / PFRDA', 'CENTRAL', 'EMPLOYMENT', 'PENSION', 5000, 'Monthly pension of ₹1,000 to ₹5,000 after age 60.', '["Guaranteed minimum pension", "Spouse pension after death", "Return of corpus to nominee"]'::jsonb, '{"min_age": 18, "max_age": 40, "tax_payer": false}'::jsonb, 'Online via Net Banking or e-NPS portal. Offline via banks.', 'Income tax payers since Oct 2022.', 'https://enps.nsdl.com/', 'https://enps.nsdl.com/', true),
  ('scheme_pmjay', 'PMJAY-001', 'Ayushman Bharat (PM-JAY)', 'Free health insurance cover up to ₹5 Lakh per family.', 'Cashless health insurance coverage for secondary and tertiary hospitalization to poor families.', 'Ministry of Health and Family Welfare', 'CENTRAL', 'HEALTHCARE', 'INSURANCE', 500000, '₹5 Lakh per family per year.', '["Cashless treatment", "Pre and post hospitalization cover", "Covers 1,929 procedures"]'::jsonb, '{"eligibility": "SECC 2011 list", "occupational_categories": ["Ragpicker", "Beggar", "Construction Worker"]}'::jsonb, 'Visit empanelled hospital or CSC with PM Letter/Ration Card for e-card issuance.', 'Govt employees, those earning >₹10k/month, or owning 4-wheelers.', 'https://pmjay.gov.in/', 'https://pmjay.gov.in/', true),
  ('scheme_pmsby', 'PMSBY-001', 'Pradhan Mantri Suraksha Bima Yojana', 'Accidental death and disability insurance.', 'Premium of ₹20 per annum for accidental cover.', 'Ministry of Finance', 'CENTRAL', 'HEALTHCARE', 'INSURANCE', 200000, '₹2 Lakh for death; ₹1 Lakh for partial disability.', '["Death cover: ₹2 Lakh", "Total disability: ₹2 Lakh", "Partial disability: ₹1 Lakh"]'::jsonb, '{"min_age": 18, "max_age": 70, "account_required": "Savings Account"}'::jsonb, 'Enrollment via Bank branch or Net banking.', 'Account closure or insufficient balance.', 'https://jansuraksha.gov.in/', 'https://jansuraksha.gov.in/', true),
  ('scheme_pmkisan', 'PMKISAN-001', 'Pradhan Mantri Kisan Samman Nidhi', '₹6,000 income support for all landholding farmers.', 'To supplement financial needs for crop inputs and yields.', 'Ministry of Agriculture and Farmers Welfare', 'CENTRAL', 'AGRICULTURE', 'DIRECT_TRANSFER', 6000, '₹6,000 per year in 3 installments.', '["₹2,000 every 4 months", "Direct payment to bank via DBT"]'::jsonb, '{"land_holding": "Cultivable land in name"}'::jsonb, 'Online registration on PM-Kisan portal or via CSC.', 'Institutional land holders, tax payers, Govt employees.', 'https://pmkisan.gov.in/', 'https://pmkisan.gov.in/', true),
  ('scheme_ssy', 'SSY-001', 'Sukanya Samriddhi Yojana', 'Savings scheme for the education and marriage of a girl child.', 'Government-backed scheme under Beti Bachao Beti Padhao.', 'Ministry of Women and Child Development', 'CENTRAL', 'WOMEN_CHILD', 'SAVINGS', 0, 'High interest rate (8.2%) with tax benefits.', '["8.2% interest", "Tax deduction under 80C", "Tax-free maturity"]'::jsonb, '{"max_age": 10, "max_girls": 2}'::jsonb, 'Open at Post Office or authorized commercial banks.', 'Non-resident girls or those over 10 years.', 'https://www.indiapost.gov.in/', 'https://www.indiapost.gov.in/', true),
  ('scheme_csss', 'PMUSP-001', 'PM-USP Central Sector Scholarship (CSSS)', 'Scholarship for meritorious students from poor families.', 'Assistance to meet day-to-day expenses during higher studies.', 'Department of Higher Education', 'CENTRAL', 'EDUCATION', 'SCHOLARSHIP', 20000, '₹12,000 to ₹20,000 per annum.', '["₹12k p.a. for Graduation", "₹20k p.a. for Post-graduation"]'::jsonb, '{"percentile": 80, "income_limit": 450000}'::jsonb, 'Online via National Scholarship Portal (NSP). Requires e-KYC.', 'Distance mode students or those receiving other scholarships.', 'https://scholarships.gov.in/', 'https://scholarships.gov.in/', true),
  ('scheme_svamitva', 'SVAM-001', 'SVAMITVA Scheme', 'Mapping of rural inhabited land and issuance of property cards.', 'Reformative step towards establishment of clear ownership of property in rural inhabited areas using drone technology.', 'Ministry of Panchayati Raj', 'CENTRAL', 'HOUSING', 'SERVICE', 0, 'Legal ownership (Property Card) and access to loans.', '["Drone mapping of land", "Proprietary rights cards", "Financial asset for loans"]'::jsonb, '{"target": "Rural inhabited property owners"}'::jsonb, 'Offline via Gram Sabha and drone survey. Property cards issued after inquiry.', 'Agricultural lands are excluded.', 'https://svamitva.nic.in/', 'https://svamitva.nic.in/', true),
  ('scheme_pmmsy', 'PMMSY-001', 'Pradhan Mantri Matsya Sampada Yojana', 'Development of the fisheries sector and welfare of fishers.', 'To harness the potential of the fisheries sector in a sustainable and inclusive manner.', 'Ministry of Fisheries, Animal Husbandry and Dairying', 'CENTRAL', 'AGRICULTURE', 'SUBSIDY', 0, 'Subsidies up to 60% for women/SC/ST; 40% for others.', '["Infrastructure assistance", "Credit-linked subsidy", "Support for marketing/export"]'::jsonb, '{"target": "Fishers, Fish Farmers, SHGs"}'::jsonb, 'Submit Detailed Project Report (DPR) to District Fisheries Officer.', 'Varies by project type.', 'https://pmmsy.dof.gov.in/', 'https://pmmsy.dof.gov.in/', true),
  ('scheme_jjm', 'JJM-001', 'Jal Jeevan Mission', 'Safe and adequate drinking water through tap connections.', 'To provide Functional Household Tap Connection (FHTC) to every rural household.', 'Ministry of Jal Shakti', 'CENTRAL', 'HOUSING', 'SERVICE', 0, 'Functional household tap connection.', '["One tap per household funded", "Kitchen/bath/washing delivery points"]'::jsonb, '{"target": "All rural households"}'::jsonb, 'Community approach. Implemented via Gram Panchayat and DWSM.', 'None.', 'https://jaljeevanmission.gov.in/', 'https://jaljeevanmission.gov.in/', true),
  ('scheme_pmay_u', 'PMAYU-001', 'Pradhan Mantri Awas Yojana (Urban)', 'Ensuring "Housing for All" in urban areas.', 'Credit Linked Subsidy Scheme (CLSS) for affordable housing.', 'Ministry of Housing and Urban Affairs', 'CENTRAL', 'HOUSING', 'SUBSIDY', 267000, 'Interest subsidy up to ₹2.67 Lakh.', '["Slum rehabilitation", "CLSS interest subsidy", "Assistance for EWS house construction"]'::jsonb, '{"income_limit": 1800000, "house_ownership": false}'::jsonb, 'Online via PMAY-Urban portal or offline at CSC.', 'Owners of a pucca house are excluded.', 'https://pmay-urban.gov.in/', 'https://pmay-urban.gov.in/', true),
  ('scheme_pm_post_matric_sc', 'PMSC-001', 'Post Matric Scholarship for SC Students', 'Scholarship for SC students for higher education.', 'To increase Gross Enrolment Ratio of SC students by providing financial assistance.', 'Ministry of Social Justice and Empowerment', 'CENTRAL', 'EDUCATION', 'SCHOLARSHIP', 13500, 'Up to ₹13,500 per year.', '["Full tuition waiver", "Yearly academic allowance for hostellers/day scholars"]'::jsonb, '{"category": "SC", "income_limit": 250000}'::jsonb, 'Online via National Scholarship Portal (NSP). Institute verification required.', 'Students receiving other stipends.', 'https://scholarships.gov.in/', 'https://scholarships.gov.in/', true),
  ('scheme_pmjjby', 'PMJJBY-001', 'Pradhan Mantri Jeevan Jyoti Bima Yojana', 'Life insurance cover of ₹2 Lakh.', 'One-year term life cover renewable annually.', 'Ministry of Finance', 'CENTRAL', 'HEALTHCARE', 'INSURANCE', 200000, '₹2 Lakh for death due to any reason.', '["₹2 Lakh life cover", "Premium ₹436/annum"]'::jsonb, '{"min_age": 18, "max_age": 50}'::jsonb, 'Offline at Bank/Post Office via Consent form.', 'Age over 50.', 'https://jansuraksha.gov.in/', 'https://jansuraksha.gov.in/', true),
  ('scheme_pm_poshan', 'PMP-001', 'PM Poshan Shakti Nirman', 'Balanced meals for school children.', 'Provides one hot cooked meal every school day to students.', 'Ministry of Education', 'CENTRAL', 'EDUCATION', 'NUTRITION', 0, 'Hot cooked meals daily.', '["Balanced nutrition (450-700 kcal)", "Encourages school enrollment", "Social harmony"]'::jsonb, '{"target": "Enrolled students of Class 1-8"}'::jsonb, 'Automatic enrollment upon school admission.', 'Non-govt school students.', 'https://pmposhan.education.gov.in/', 'https://pmposhan.education.gov.in/', true)
)
INSERT INTO "Scheme" (
  id, "schemeId", name, description, description_full, ministry, "schemeType", category, 
  "benefitType", "benefitAmount", "benefitDescription", 
  benefits_details, eligibility_details, application_process, exclusions,
  "applicationLink", official_website, "isActive"
)
SELECT id, "schemeId", name, description, description_full, ministry, "schemeType", category, 
  "benefitType", "benefitAmount", "benefitDescription", 
  benefits_details, eligibility_details, application_process, exclusions,
  "applicationLink", official_website, "isActive"
FROM scheme_data s
WHERE NOT EXISTS (
  SELECT 1 FROM "Scheme" x 
  WHERE x.id = s.id OR x."schemeId" = s."schemeId"
);

-- 3. MAP DOCUMENT REQUIREMENTS
-- Note: Mapping by code to match the standard list above
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText")
SELECT s.id, d.id, true, 'Required for identity verification'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_pmmvy' AND d.document_code IN ('AADHAAR', 'MCP_CARD', 'BANK_PASSBOOK')
UNION ALL
SELECT s.id, d.id, true, 'Residence proof'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_mksy' AND d.document_code IN ('AADHAAR', 'DOMICILE', 'BIRTH_CERTIFICATE', 'IMMUNIZATION_CARD')
UNION ALL
SELECT s.id, d.id, true, 'Income verification'
FROM "Scheme" s, documents d
WHERE s.id IN ('scheme_nulm', 'scheme_nmmss', 'scheme_pmkisan') AND d.document_code = 'INCOME_CERTIFICATE'
UNION ALL
SELECT s.id, d.id, true, 'Identity and Bank proof'
FROM "Scheme" s, documents d
WHERE s.id IN ('scheme_apy', 'scheme_pmjay', 'scheme_pmsby', 'scheme_ssy', 'scheme_pmjjby') AND d.document_code IN ('AADHAAR', 'BANK_PASSBOOK')
UNION ALL
SELECT s.id, d.id, true, 'Property and identity proof'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_svamitva' AND d.document_code IN ('AADHAAR', 'DOMICILE')
UNION ALL
SELECT s.id, d.id, true, 'Fisheries and business proof'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_pmmsy' AND d.document_code IN ('AADHAAR', 'BANK_PASSBOOK', 'PAN')
UNION ALL
SELECT s.id, d.id, true, 'Address proof'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_jjm' AND d.document_code IN ('AADHAAR', 'VOTER_ID', 'RATION_CARD')
UNION ALL
SELECT s.id, d.id, true, 'Housing and income proof'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_pmay_u' AND d.document_code IN ('AADHAAR', 'INCOME_CERTIFICATE', 'BANK_PASSBOOK')
UNION ALL
SELECT s.id, d.id, true, 'Educational and caste proof'
FROM "Scheme" s, documents d
WHERE s.id = 'scheme_pm_post_matric_sc' AND d.document_code IN ('AADHAAR', 'CASTE_CERTIFICATE', 'INCOME_CERTIFICATE', 'MARKSHEET')
ON CONFLICT DO NOTHING;
