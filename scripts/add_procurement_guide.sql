-- 1. Add procurement guide columns to 'documents' master table
ALTER TABLE "documents" 
ADD COLUMN IF NOT EXISTS "procurement_guide" JSONB DEFAULT '{"steps": []}',
ADD COLUMN IF NOT EXISTS "portal_url" TEXT;

-- 2. Enhance document_office_addresses to link to documents
-- We need to link addresses to specific documents (e.g. Income Tax Office -> Income Certificate)
ALTER TABLE "document_office_addresses"
ADD COLUMN IF NOT EXISTS "document_id" UUID REFERENCES "documents"(id) ON DELETE CASCADE;

-- Ensure all necessary columns exist (in case table was created with an older schema)
ALTER TABLE "document_office_addresses"
ADD COLUMN IF NOT EXISTS "working_hours" TEXT,
ADD COLUMN IF NOT EXISTS "contact_number" TEXT,
ADD COLUMN IF NOT EXISTS "location_url" TEXT,
ADD COLUMN IF NOT EXISTS "office_type" TEXT DEFAULT 'GOVT'; -- Default to GOVT if not provided

-- If document_id is null, it might be a general office, or we can update it. 
-- For now, let's clear existing addresses to avoid confusion as we are in dev/setup phase
TRUNCATE TABLE "document_office_addresses";

-- 3. Seed Data for Income Certificate (Test Case 23)
-- First get the ID for Income Certificate
DO $$ 
DECLARE 
    income_cert_id UUID;
BEGIN 
    SELECT id INTO income_cert_id FROM "documents" WHERE document_code = 'INCOME_CERT';

    IF income_cert_id IS NOT NULL THEN
        -- Update Procurement Guide
        UPDATE "documents" 
        SET 
            portal_url = 'https://edistrict.up.gov.in/',
            procurement_guide = '{
                "steps": [
                    { "title": "Visit e-District Portal", "description": "Go to the official e-District portal of your state." },
                    { "title": "Register/Login", "description": "Create an account or login if you already have one." },
                    { "title": "Apply for Service", "description": "Select ''Income Certificate'' under Revenue Department services." },
                    { "title": "Fill Application", "description": "Complete the form with personal and income details." },
                    { "title": "Upload Documents", "description": "Upload scan of Aadhaar, Photo, and Self-declaration." },
                    { "title": "Pay Fee", "description": "Pay the required processing fee online." },
                    { "title": "Download", "description": "Once approved (usually 7-15 days), download the digitally signed certificate." }
                ]
            }'
        WHERE id = income_cert_id;

        -- Insert Office Addresses for UP (Example)
        INSERT INTO "document_office_addresses" (document_id, state, office_name, address, working_hours, office_type)
        VALUES 
        (income_cert_id, 'Uttar Pradesh', 'Tehsil Office - Lucknow', 'Tehsil Sadar, Lucknow, Uttar Pradesh 226001', '10:00 AM - 5:00 PM', 'GOVT'),
        (income_cert_id, 'Uttar Pradesh', 'Common Service Center (CSC)', 'Any authorized Jan Seva Kendra in your locality', '9:00 AM - 8:00 PM', 'CSC');
        
        -- Insert Office Addresses for Delhi (Example)
        INSERT INTO "document_office_addresses" (document_id, state, office_name, address, working_hours, office_type)
        VALUES 
        (income_cert_id, 'Delhi', 'Revenue Department HQ', '5, Sham Nath Marg, Delhi - 110054', '10:00 AM - 5:00 PM', 'GOVT');

    END IF;
END $$;
