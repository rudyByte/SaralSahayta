-- ============================================
-- PHASE 8: SCHEME APPLICATION SYSTEM (FINAL V5)
-- Corrected for:
-- 1. UUID vs TEXT Incompatibility Fix
-- 2. "Scheme" (quoted PascalCase table)
-- 3. "applications" (lowercase plural unquoted table)
-- 4. "documents" (lowercase plural unquoted master table)
-- ============================================

-- 1. ENHANCE "Scheme" TABLE
ALTER TABLE IF EXISTS "Scheme"
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS description_full TEXT,
ADD COLUMN IF NOT EXISTS benefits_details JSONB,
ADD COLUMN IF NOT EXISTS eligibility_details JSONB,
ADD COLUMN IF NOT EXISTS application_process TEXT,
ADD COLUMN IF NOT EXISTS exclusions TEXT,
ADD COLUMN IF NOT EXISTS application_deadline_text TEXT,
ADD COLUMN IF NOT EXISTS official_website TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Generate UNIQUE slugs
WITH slugified AS (
  SELECT id, name,
         LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) as base_slug
  FROM "Scheme"
  WHERE slug IS NULL
),
ranked AS (
  SELECT id, base_slug,
         ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) as rank
  FROM slugified
)
UPDATE "Scheme" s
SET slug = CASE 
             WHEN r.rank > 1 THEN r.base_slug || '-' || r.rank 
             ELSE r.base_slug 
           END
FROM ranked r
WHERE s.id = r.id;

-- Add UNIQUE constraint safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheme_slug_unique') THEN
        ALTER TABLE "Scheme" ADD CONSTRAINT scheme_slug_unique UNIQUE (slug);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schemes_slug ON "Scheme"(slug);

-- 2. ENHANCE "applications" TABLE
ALTER TABLE IF EXISTS applications
ADD COLUMN IF NOT EXISTS "formDataEncrypted" TEXT,
ADD COLUMN IF NOT EXISTS "attachedDocuments" JSONB,
ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
ADD COLUMN IF NOT EXISTS "submissionSource" TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS "ocrVerified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "manuallyEdited" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "trackingId" TEXT UNIQUE;

-- 3. DOCUMENT REQUIREMENTS MAPPING (Linking Scheme to Master Documents)
-- FIXED: "documentId" is UUID to match "documents" table "id"
CREATE TABLE IF NOT EXISTS "SchemeDocumentRequirement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schemeId" TEXT NOT NULL REFERENCES "Scheme"(id) ON DELETE CASCADE,
  "documentId" UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE, 
  "isMandatory" BOOLEAN DEFAULT true,
  "helpText" TEXT,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_scheme_doc UNIQUE("schemeId", "documentId")
);

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION increment_scheme_views(target_scheme_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE "Scheme"
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_scheme_id;
END;
$$ LANGUAGE plpgsql;

-- 5. TRACKING ID GENERATOR
CREATE SEQUENCE IF NOT EXISTS application_no_seq START 1000;

CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."trackingId" IS NULL THEN
    NEW."trackingId" := 'SARAL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('application_no_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_tracking_id ON applications;
CREATE TRIGGER tr_generate_tracking_id
BEFORE INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION generate_tracking_id();

-- 6. SEED MAPPING (Example for PMMVY)
INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText")
SELECT 
  s.id,
  d.id,
  true,
  'Identity proof'
FROM "Scheme" s
CROSS JOIN documents d
WHERE s.name = 'Pradhan Mantri Matru Vandana Yojana'
AND d.document_code = 'AADHAAR'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "SchemeDocumentRequirement" ("schemeId", "documentId", "isMandatory", "helpText")
SELECT 
  s.id,
  d.id,
  true,
  'Account for benefit transfer'
FROM "Scheme" s
CROSS JOIN documents d
WHERE s.name = 'Pradhan Mantri Matru Vandana Yojana'
AND d.document_code = 'BANK_PASSBOOK'
LIMIT 1
ON CONFLICT DO NOTHING;
