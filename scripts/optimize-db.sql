-- Database Optimization Script
-- Run this in the Supabase SQL Editor to improve performance

-- 1. Index for Scheme Table (Filtering & Sorting)
CREATE INDEX IF NOT EXISTS idx_scheme_is_active ON "Scheme"("isActive");
CREATE INDEX IF NOT EXISTS idx_scheme_category ON "Scheme"("category");
CREATE INDEX IF NOT EXISTS idx_scheme_type ON "Scheme"("schemeType");
CREATE INDEX IF NOT EXISTS idx_scheme_benefit_amount ON "Scheme"("benefitAmount" DESC);
CREATE INDEX IF NOT EXISTS idx_scheme_created_at ON "Scheme"("created_at" DESC);

-- 2. Index for Search (Requires pg_trgm extension if using ilike)
-- Note: ilike with %...% is slow without trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_scheme_name_trgm ON "Scheme" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_scheme_description_trgm ON "Scheme" USING gin ("description" gin_trgm_ops);

-- 3. Index for User Profiles (Match score lookups)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON "user_profiles"("user_id");

-- 4. Enable Gzip compression optimization for JSON responses (Supabase does this by default via PostgREST)
