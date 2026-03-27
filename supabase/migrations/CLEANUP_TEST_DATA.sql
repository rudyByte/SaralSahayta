-- ===============================================
-- CLEANUP_TEST_DATA.sql
-- Reset database for fresh user testing
-- ===============================================

-- 1. DELETE ALL APPLICATION DATA
TRUNCATE public.applications CASCADE;
TRUNCATE public.documents CASCADE;
TRUNCATE public.admin_audit_logs CASCADE;

-- 2. DELETE ALL USER PROFILES
TRUNCATE public.user_profiles CASCADE;

-- 3. DELETE ALL AUTH USERS (MANAGED BY SUPABASE)
DELETE FROM auth.users;

-- 4. VERIFY CLEANUP
SELECT count(*) as profile_count FROM public.user_profiles;
SELECT count(*) as auth_user_count FROM auth.users;
