-- Aligning Application Schema for Phase 2 CRUD API requirements

-- 1. Create applications table (aligned with user snippets)
CREATE TABLE IF NOT EXISTS "applications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "scheme_id" UUID NOT NULL REFERENCES "Scheme"(id) ON DELETE CASCADE,
    "status" TEXT DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
    "form_data" JSONB DEFAULT '{}',
    "document_checklist_data" JSONB DEFAULT '{}', -- {required: [], uploaded: [], missing: []}
    "document_status" TEXT DEFAULT 'NOT_STARTED', -- NOT_STARTED, INCOMPLETE, COMPLETE
    "submitted_at" TIMESTAMPTZ,
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'
);

-- 2. Create application_documents (Linking table)
CREATE TABLE IF NOT EXISTS "application_documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL REFERENCES "applications"(id) ON DELETE CASCADE,
    "user_document_id" UUID NOT NULL REFERENCES "user_documents"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "UNIQUE"("application_id", "user_document_id")
);

-- 3. Migration: Move data from SchemeApplication if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SchemeApplication') THEN
        INSERT INTO "applications" (id, user_id, scheme_id, status, form_data, submitted_at, createdAt, updatedAt)
        SELECT id, "userId", "schemeId", status::text, "formData", "appliedAt", "createdAt", "updatedAt"
        FROM "SchemeApplication"
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own applications" ON "applications";
CREATE POLICY "Users can manage their own applications" 
ON "applications" FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own application document links" ON "application_documents";
CREATE POLICY "Users can manage their own application document links" 
ON "application_documents" FOR ALL 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM "applications" WHERE id = application_id AND user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM "applications" WHERE id = application_id AND user_id = auth.uid()
));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_apps_user_id ON "applications"("user_id");
CREATE INDEX IF NOT EXISTS idx_apps_scheme_id ON "applications"("scheme_id");
CREATE INDEX IF NOT EXISTS idx_app_docs_app_id ON "application_documents"("application_id");

-- Note: 'schemes' table is expected to be 'Scheme' from Prisma. 
-- In API code, we can use 'scheme:Scheme(*)' or create a view.
-- The user snippet uses schemes, I'll create a view for smoother API integration.
CREATE OR REPLACE VIEW "schemes" AS SELECT * FROM "Scheme";
