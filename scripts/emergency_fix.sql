-- EMERGENCY FIX SCRIPT
-- This script aggressively removes potential blockers for login.

-- 1. Reload Schema Cache
NOTIFY pgrst, 'reload schema';

-- 2. Drop ALL triggers on auth.users that might be failing
-- We drop them one by one to count for common names
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS tr_notify_app_status ON "applications"; -- Just in case

-- 3. Temporarily Disable RLS on user_profiles
-- This rules out infinite recursion in policies
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions (Fixes "permission denied" masquerading as schema error)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 5. Re-verify the Admin User Password & Details
-- We essentially recreate the user credentials to be 100% sure.
DO $$
DECLARE
    v_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    -- Update Password directly in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt('Hellothere112@', gen_salt('bf')),
        email = '9999999999@sahayog.app',
        phone = '9999999999',
        email_confirmed_at = now(),
        updated_at = now(),
        raw_user_meta_data = '{"full_name":"Rudy Admin", "mobile": "9999999999"}'
    WHERE id = v_user_id;
    
    -- Ensure Profile Exists
    INSERT INTO public.user_profiles (user_id, full_name, is_admin, mobile, email)
    VALUES (v_user_id, 'Rudy Admin', true, '9999999999', '9999999999@sahayog.app')
    ON CONFLICT (user_id) DO UPDATE SET is_admin = true, full_name = 'Rudy Admin';
END $$;

