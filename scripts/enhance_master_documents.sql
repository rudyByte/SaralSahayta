-- Updating Document Master Schema for Categories and Office Addresses

-- 1. Add columns to 'documents' table
ALTER TABLE "documents" 
ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "is_common" BOOLEAN DEFAULT false;

-- 2. Create Document Office Addresses table
CREATE TABLE IF NOT EXISTS "document_office_addresses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "state" TEXT NOT NULL,
    "office_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact_number" TEXT,
    "working_hours" TEXT,
    "location_url" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update existing master data with categories
UPDATE "documents" SET category = 'IDENTITY', is_common = true WHERE document_code IN ('AADHAAR', 'PAN', 'VOTER_ID');
UPDATE "documents" SET category = 'ELIGIBILITY', is_common = true WHERE document_code IN ('INCOME_CERT', 'CASTE_CERT', 'DOMICILE');
UPDATE "documents" SET category = 'EDUCATION', is_common = false WHERE document_code IN ('MARK_SHEET_10', 'MARK_SHEET_12');
UPDATE "documents" SET category = 'FINANCIAL', is_common = true WHERE document_code IN ('PASSBOOK');

-- 4. Enable RLS on office addresses
ALTER TABLE "document_office_addresses" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read office addresses" ON "document_office_addresses";
CREATE POLICY "Anyone can read office addresses" 
ON "document_office_addresses" FOR SELECT 
TO authenticated 
USING (true);
