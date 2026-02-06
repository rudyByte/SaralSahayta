-- Phase 8: Document Management & Advanced Architecture Setup

-- 1. STORAGE BUCKETS
-- Create buckets for documents and profile pictures
-- Note: Requires service_role or admin privileges in Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE RLS POLICIES
-- Policy: Only owners can upload/read/delete their own documents
CREATE POLICY "Users can manage their own documents" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Everyone can view profile pictures, owners can manage
CREATE POLICY "Public can view profile pictures" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can manage their own profile pictures" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 3. ENUMS & DROPS (To ensure clean state if re-run)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAYMENT_PROCESSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
    END IF;
END $$;


-- 4. APPLICATION TABLES
-- Scheme Applications
CREATE TABLE IF NOT EXISTS "SchemeApplication" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "schemeId" UUID NOT NULL REFERENCES "Scheme"(id) ON DELETE CASCADE,
    "status" application_status DEFAULT 'DRAFT',
    "formData" JSONB NOT NULL DEFAULT '{}',
    "remarks" TEXT,
    "appliedAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'
);

-- Application History (For triggers)
CREATE TABLE IF NOT EXISTS "ApplicationHistory" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "applicationId" UUID NOT NULL REFERENCES "SchemeApplication"(id) ON DELETE CASCADE,
    "status" application_status NOT NULL,
    "remarks" TEXT,
    "changedBy" UUID REFERENCES auth.users(id),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- User Documents
CREATE TABLE IF NOT EXISTS "UserDocument" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "documentType" TEXT NOT NULL, -- e.g. 'AADHAAR', 'INCOME_CERT'
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" document_status DEFAULT 'PENDING',
    "ocrData" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);


-- 5. TRIGGER FOR HISTORY
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        INSERT INTO "ApplicationHistory" ("applicationId", "status", "remarks")
        VALUES (NEW.id, NEW.status, NEW.remarks);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_status_change ON "SchemeApplication";
CREATE TRIGGER tr_log_status_change
AFTER INSERT OR UPDATE ON "SchemeApplication"
FOR EACH ROW
EXECUTE FUNCTION log_application_status_change();


-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_application_user_id ON "SchemeApplication"("userId");
CREATE INDEX IF NOT EXISTS idx_application_scheme_id ON "SchemeApplication"("schemeId");
CREATE INDEX IF NOT EXISTS idx_application_status ON "SchemeApplication"("status");
CREATE INDEX IF NOT EXISTS idx_document_user_id ON "UserDocument"("userId");


-- 7. ENABLE RLS ON NEW TABLES
ALTER TABLE "SchemeApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationHistory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own applications" 
ON "SchemeApplication" FOR SELECT 
TO authenticated 
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own applications" 
ON "SchemeApplication" FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can see their own documents" 
ON "UserDocument" FOR SELECT 
TO authenticated 
USING (auth.uid() = "userId");
