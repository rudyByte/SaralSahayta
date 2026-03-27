-- ============================================
-- PHASE14: RESTORE MASTER DOCUMENTS TABLE
-- Fix the Documents section on the UI
-- ============================================

-- Step 1: Ensure the document_category enum covers all needed categories
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
        CREATE TYPE document_category AS ENUM (
            'IDENTITY','FINANCIAL','RESIDENCE','CASTE','EDUCATION',
            'HEALTH','EMPLOYMENT','AGRICULTURE','OTHER'
        );
    ELSE
        -- Add missing values if enum already exists
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'IDENTITY'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'FINANCIAL'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'RESIDENCE'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'CASTE'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'EDUCATION'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'HEALTH'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'EMPLOYMENT'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'AGRICULTURE'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'OTHER'; EXCEPTION WHEN others THEN NULL; END;
    END IF;
END $$;

-- Step 2: Create/enhance the master documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code TEXT UNIQUE NOT NULL,
    document_name TEXT NOT NULL,
    category document_category DEFAULT 'IDENTITY',
    description TEXT,
    is_common BOOLEAN DEFAULT true,
    procurement_guide JSONB DEFAULT NULL,
    portal_url TEXT DEFAULT NULL
);

-- Step 3: Ensure the user_documents table also exists with correct schema
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    file_url TEXT NOT NULL,
    verification_status TEXT DEFAULT 'PENDING',
    rejection_reason TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Step 4: Add missing columns to documents table if they don't exist
ALTER TABLE documents 
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_common BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS procurement_guide JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS portal_url TEXT DEFAULT NULL;

ALTER TABLE user_documents
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS file_type TEXT,
    ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Step 5: Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Authenticated users can read master documents" ON documents;
CREATE POLICY "Authenticated users can read master documents"
    ON documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage their own document entries" ON user_documents;
CREATE POLICY "Users can manage their own document entries"
    ON user_documents FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Also allow admin service role full access
DROP POLICY IF EXISTS "Service role full access documents" ON documents;
CREATE POLICY "Service role full access documents"
    ON documents FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access user_documents" ON user_documents;
CREATE POLICY "Service role full access user_documents"
    ON user_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 6: Seed master document data (Safe INSERT with ON CONFLICT DO NOTHING)
INSERT INTO documents (document_code, document_name, category, is_common, description, portal_url, procurement_guide) VALUES
('AADHAAR', 'Aadhaar Card', 'IDENTITY', true,
 'Unique 12-digit government-issued identity number for Indian residents.',
 'https://myaadhaar.uidai.gov.in/',
 '{"steps": [{"title": "Visit UIDAI Portal", "description": "Go to myaadhaar.uidai.gov.in and login with your Aadhaar number."}, {"title": "Book an Appointment", "description": "For updates or corrections, book an appointment at your nearest Aadhaar Seva Kendra."}, {"title": "Submit Biometrics", "description": "Visit the center with your supporting documents for biometric verification."}, {"title": "Download e-Aadhaar", "description": "Download your e-Aadhaar instantly from the portal after registration."}]}'),

('PAN', 'PAN Card', 'FINANCIAL', true,
 '10-character alphanumeric identity issued by the Income Tax Department.',
 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
 '{"steps": [{"title": "Apply Online", "description": "Visit NSDL or UTIITSL portal and click Apply for New PAN."}, {"title": "Fill Form 49A", "description": "Complete the form with personal details and Document Upload."}, {"title": "Pay Fees", "description": "Pay ₹107 for Indian addresses online (Net banking/cards)."}, {"title": "Submit & Track", "description": "Download acknowledgement and track status after 15 days."}]}'),

('BANK_PASSBOOK', 'Bank Passbook / Cancelled Cheque', 'FINANCIAL', true,
 'Proof of bank account ownership for Direct Benefit Transfer (DBT).',
 null,
 '{"steps": [{"title": "Visit Your Bank", "description": "Go to your nearest bank branch with Aadhaar and PAN."}, {"title": "Open Savings Account", "description": "Fill the account opening form for a basic savings account (zero balance options available under Jan Dhan Yojana)."}, {"title": "Get Passbook", "description": "Bank will issue a passbook immediately with your account details."}, {"title": "Link to Aadhaar", "description": "Link your bank account to Aadhaar at the branch for DBT benefits."}]}'),

('VOTER_ID', 'Voter ID Card (EPIC)', 'IDENTITY', true,
 'Identity and citizenship proof issued by the Election Commission of India.',
 'https://voters.eci.gov.in/',
 '{"steps": [{"title": "Check Enrollment", "description": "Visit voters.eci.gov.in to check if you are already enrolled."}, {"title": "Apply via Voter Portal", "description": "Click New Registration (Form 6) and fill your details with a photo and address proof."}, {"title": "Verification", "description": "BLO will verify your application at your address."}, {"title": "Download e-EPIC", "description": "Download your Voter ID card (e-EPIC) from the portal within 30 days."}]}'),

('RATION_CARD', 'Ration Card', 'RESIDENCE', true,
 'Proof of address and entitlement for subsidized food grains under PDS.',
 null,
 '{"steps": [{"title": "Visit nearby Food Department Office", "description": "Contact your District Food & Civil Supplies Department."}, {"title": "Submit Application", "description": "Fill the ration card application form and attach Aadhaar, photo, and residence proof."}, {"title": "Verification", "description": "An officer will verify your family composition and household details."}, {"title": "Collect Card", "description": "Collect your ration card from the office after approval (typically 15-30 days)."}]}'),

('INCOME_CERTIFICATE', 'Income Certificate', 'FINANCIAL', true,
 'Official document certifying annual family income, issued by state government.',
 null,
 '{"steps": [{"title": "Visit Tehsil / CSC", "description": "Go to your nearest Tehsil office or Common Service Centre (CSC/Jan Seva Kendra)."}, {"title": "Submit Application", "description": "Fill form with details of all earning members and attach Aadhaar, PAN, and salary slips."}, {"title": "Affidavit", "description": "Submit a self-declaration affidavit of family income notarized on stamp paper."}, {"title": "Pay & Collect", "description": "Pay nominal fee and collect certificate within 7-15 working days."}]}'),

('CASTE_CERTIFICATE', 'Caste / Community Certificate', 'CASTE', true,
 'Proof of SC/ST/OBC/EWS category for reservation and scheme benefits.',
 null,
 '{"steps": [{"title": "Visit SDM / Tehsil Office", "description": "Go to Sub-Divisional Magistrate office or nearest CSC with required documents."}, {"title": "Fill Application", "description": "Submit application with Aadhaar, address proof, and an affidavit on stamp paper."}, {"title": "Verification Process", "description": "Documents will be verified by the local revenue official / patwari."}, {"title": "Collect Certificate", "description": "Caste certificate is typically issued within 7-30 days."}]}'),

('DOMICILE', 'Domicile / Residence Certificate', 'RESIDENCE', true,
 'Proof of permanent residence in a particular state, issued by the state authority.',
 null,
 '{"steps": [{"title": "Apply at SDM / CSC", "description": "Visit Sub-Divisional Magistrate or Common Service Centre."}, {"title": "Submit Documents", "description": "Fill form and attach Aadhaar, voter ID, ration card, and proof of residence for 15+ years."}, {"title": "SDM Verification", "description": "Revenue officer verifies the documents and residence claim."}, {"title": "Collect Domicile Certificate", "description": "Certificate is issued within 7-21 days."}]}'),

('BIRTH_CERTIFICATE', 'Birth Certificate', 'IDENTITY', true,
 'Official proof of date and place of birth, issued by the local municipal body.',
 'https://crsorgi.gov.in/',
 '{"steps": [{"title": "Hospital Registration", "description": "For newborns, hospital automatically reports birth. Collect certificate within 21 days."}, {"title": "Late Registration (Nearby Area Office)", "description": "Visit Municipal office / Gram Panchayat with hospital discharge summary and parents Aadhaar."}, {"title": "Apply Online", "description": "Many states also allow online application at crsorgi.gov.in or state portal."}, {"title": "Collect Certificate", "description": "Birth certificate is issued within 7-15 days."}]}'),

('MARKSHEET', 'Marksheet (10th / 12th)', 'EDUCATION', true,
 'Educational qualification proof from Board examinations.',
 null,
 '{"steps": [{"title": "Apply via School / Board", "description": "Contact your school for original marksheet after results."}, {"title": "Apply for Duplicate (If Lost)", "description": "Apply at the respective Board (CBSE/State Board) with application fee and affidavit."}, {"title": "DigiLocker", "description": "Download verified digital copy from DigiLocker (digilocker.gov.in) linked to Aadhaar."}, {"title": "Collect Original", "description": "Collect original marksheet from school or board office."}]}'),

('ESHRAM', 'e-Shram Card', 'EMPLOYMENT', true,
 'National database of unorganized sector workers for welfare schemes.',
 'https://eshram.gov.in/',
 '{"steps": [{"title": "Visit eshram.gov.in", "description": "Go to the official e-Shram portal or nearest CSC."}, {"title": "Register with Aadhaar", "description": "Click Self Registration and verify with your Aadhaar OTP."}, {"title": "Fill Details", "description": "Enter employment details, bank account information (for PMSBY accidental cover)."}, {"title": "Download e-Shram Card", "description": "Download your e-Shram card with UAN number immediately."}]}'),

('MGNREGA', 'MGNREGA Job Card', 'EMPLOYMENT', false,
 'Proof of registration under MGNREGA scheme for 100 days guaranteed employment.',
 null,
 '{"steps": [{"title": "Apply at Gram Panchayat", "description": "Visit your local Gram Panchayat with Aadhaar and 2 passport photos."}, {"title": "Submit Application", "description": "Fill Form with household details. All adult members can be registered."}, {"title": "Get Job Card", "description": "Job card is issued within 15 days of application by the Gram Rozgar Sewak."}, {"title": "Demand Work", "description": "Register demand for work in writing at the GP. Work must be provided within 15 days."}]}'),

('DISABILITY_CERT', 'Disability Certificate (UDID)', 'HEALTH', true,
 'Certificate for persons with disabilities issued under RPWD Act 2016.',
 'https://swavlambancard.gov.in/',
 '{"steps": [{"title": "Apply Online via UDID Portal", "description": "Visit swavlambancard.gov.in and register for a Unique Disability ID."}, {"title": "Medical Assessment", "description": "Visit the designated Government Medical Authority for disability assessment."}, {"title": "Certificate & UDID Card", "description": "Medical board approves and issues the Disability Certificate along with a UDID card."}, {"title": "Benefits", "description": "Use UDID card for all government scheme benefits and reservations."}]}'),

('MCP_CARD', 'MCP Card (Mother and Child Protection)', 'HEALTH', false,
 'Tracking card for maternal and child health services (vaccinations, check-ups).',
 null,
 '{"steps": [{"title": "Register at ASHA / Anganwadi", "description": "Register your pregnancy at your nearest Anganwadi or with the ASHA worker."}, {"title": "Receive MCP Card", "description": "You will receive a Mother and Child Protection (MCP) card recording all health milestones."}, {"title": "Attend Antenatal Check-ups", "description": "Attend all scheduled ANC visits; details are recorded in the card."}, {"title": "Post-Natal Visits", "description": "After delivery, use card to track child vaccination schedule."}]}'),

('IMMUNIZATION_CARD', 'Immunization / Vaccination Card', 'HEALTH', false,
 'Record of vaccines administered to a child (required for various schemes).',
 'https://evin.in/',
 '{"steps": [{"title": "Visit Health Sub-Centre / Anganwadi", "description": "Register your child at the local health center after birth."}, {"title": "Receive Vaccination Card", "description": "A vaccination booklet/card is issued tracking all immunizations (BCG, DPT, Polio, etc.)."}, {"title": "Keep Card Updated", "description": "Bring the card to every vaccination session. Vaccines are free under Universal Immunization Programme."}, {"title": "Digital Record", "description": "eVIN (Electronic Vaccine Intelligence Network) maintains digital records."}]}'),

('LAND_RECORDS', 'Land Records / Khasra-Khatauni (7/12 Utara)', 'AGRICULTURE', false,
 'Official record of land ownership and cultivation rights (Patwari records).',
 null,
 '{"steps": [{"title": "Visit Patwari / Tehsil", "description": "Contact your local Patwari or Tehsil office for Khasra-Khatauni extract."}, {"title": "Online State Portal", "description": "Many states provide online land records: UP (upbhulekh.gov.in), MP (landrecords.mp.gov.in), etc."}, {"title": "Verify Details", "description": "Ensure your name, survey number, and area are correctly recorded."}, {"title": "Mutation (Intkal)", "description": "If land was inherited or purchased, apply for mutation (Intkal) at the Tehsil."}]}')

ON CONFLICT (document_code) DO UPDATE SET
    document_name = EXCLUDED.document_name,
    category = EXCLUDED.category,
    is_common = EXCLUDED.is_common,
    description = EXCLUDED.description,
    portal_url = EXCLUDED.portal_url,
    procurement_guide = EXCLUDED.procurement_guide;

-- Final check
SELECT COUNT(*) AS total_documents FROM documents;
