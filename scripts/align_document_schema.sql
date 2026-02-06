-- Aligning Document Schema for Phase 2 API requirements

-- 1. Create Master Documents table (Document Types)
CREATE TABLE IF NOT EXISTS "documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_code" TEXT UNIQUE NOT NULL, -- e.g. 'AADHAAR', 'PAN'
    "document_name" TEXT NOT NULL,
    "is_required" BOOLEAN DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create User Documents table (Linked to Master)
CREATE TABLE IF NOT EXISTS "user_documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "document_id" UUID NOT NULL REFERENCES "documents"(id) ON DELETE CASCADE,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_url" TEXT NOT NULL,
    "verification_status" TEXT DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    "verified_by" UUID REFERENCES auth.users(id),
    "verified_at" TIMESTAMPTZ,
    "expiry_date" TIMESTAMPTZ,
    "uploaded_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'
);

-- 3. Seed initial master data
INSERT INTO "documents" (document_code, document_name, description)
VALUES 
    ('AADHAAR', 'Aadhaar Card', 'Identity and Address Proof'),
    ('PAN', 'PAN Card', 'Income Tax Identification'),
    ('VOTER_ID', 'Voter ID Card', 'Identity and Citizenship Proof'),
    ('INCOME_CERT', 'Income Certificate', 'Proof of Annual Family Income'),
    ('CASTE_CERT', 'Caste Certificate', 'Proof of Caste/Category'),
    ('DOMICILE', 'Domicile Certificate', 'Proof of Residence in State'),
    ('MARK_SHEET_10', '10th Mark Sheet', 'Educational Qualification'),
    ('MARK_SHEET_12', '12th Mark Sheet', 'Educational Qualification'),
    ('PASSBOOK', 'Bank Passbook', 'For Direct Benefit Transfer')
ON CONFLICT (document_code) DO UPDATE 
SET document_name = EXCLUDED.document_name,
    description = EXCLUDED.description;

-- 4. Enable RLS
ALTER TABLE "user_documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own document entries" ON "user_documents";
CREATE POLICY "Users can manage their own document entries" 
ON "user_documents" FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Everyone authenticated can see the master document types
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read master documents" ON "documents";
CREATE POLICY "Authenticated users can read master documents" 
ON "documents" FOR SELECT 
TO authenticated 
USING (true);
