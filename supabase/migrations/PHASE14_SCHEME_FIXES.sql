-- Phase 14: Scheme Tracking & Loading Fixes
-- Run this in Supabase SQL Editor

-- 1. Ensure Scheme table has tracking columns
ALTER TABLE IF EXISTS "Scheme" 
ADD COLUMN IF NOT EXISTS "views_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "applications_count" INTEGER DEFAULT 0;

-- 2. Create the increment_scheme_views RPC
CREATE OR REPLACE FUNCTION public.increment_scheme_views(target_scheme_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "Scheme"
  SET "views_count" = COALESCE("views_count", 0) + 1
  WHERE "id" = target_scheme_id OR "schemeId" = target_scheme_id;
END;
$$;

-- 3. Ensure permissions
GRANT EXECUTE ON FUNCTION public.increment_scheme_views(TEXT) TO authenticated, anon, service_role;
