-- PHASE17: SCORE SYNC COMPATIBILITY
-- Keeps the live document-driven scoring APIs working across older databases
-- that still have quoted legacy application/requirement columns.

DO $$
BEGIN
    IF to_regclass('public.scheme_document_requirements') IS NULL THEN
        CREATE TABLE public.scheme_document_requirements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            scheme_id TEXT NOT NULL,
            document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
            is_mandatory BOOLEAN DEFAULT true,
            help_text TEXT,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT scheme_document_requirements_unique UNIQUE (scheme_id, document_id)
        );
    END IF;

    IF to_regclass('public."SchemeDocumentRequirement"') IS NOT NULL THEN
        INSERT INTO public.scheme_document_requirements (
            scheme_id,
            document_id,
            is_mandatory,
            help_text,
            display_order,
            created_at
        )
        SELECT
            legacy."schemeId",
            legacy."documentId",
            COALESCE(legacy."isMandatory", true),
            legacy."helpText",
            COALESCE(legacy."displayOrder", 0),
            COALESCE(legacy."createdAt", NOW())
        FROM public."SchemeDocumentRequirement" legacy
        ON CONFLICT (scheme_id, document_id) DO UPDATE SET
            is_mandatory = EXCLUDED.is_mandatory,
            help_text = EXCLUDED.help_text,
            display_order = EXCLUDED.display_order;
    END IF;

    IF to_regclass('public.applications') IS NOT NULL THEN
        ALTER TABLE public.applications
            ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE,
            ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS attached_documents JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS reviewed_by UUID,
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'trackingId'
        ) THEN
            UPDATE public.applications
            SET tracking_id = COALESCE(tracking_id, "trackingId")
            WHERE tracking_id IS NULL AND "trackingId" IS NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'createdAt'
        ) THEN
            UPDATE public.applications
            SET created_at = COALESCE(created_at, "createdAt")
            WHERE "createdAt" IS NOT NULL;
        END IF;
    END IF;

    IF to_regclass('public.user_scheme_matches') IS NOT NULL THEN
        ALTER TABLE public.user_scheme_matches
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
