    -- DEBUG SCRIPT FOR LOGIN ISSUES
    -- This script isolates potential causes for "Database error querying schema"

    -- 1. Force Schema Reload (Critical for PostgREST)
    NOTIFY pgrst, 'reload schema';

    -- 2. Drop the New User Trigger temporarily
    -- If the error stops after this, the trigger code is the issue.
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- 3. Ensure permissions are correct (sometimes lost on schema changes)
    GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
    GRANT ALL ON TABLE public.user_profiles TO postgres, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;

    -- 4. Check if 'is_admin' exists (by attempting to utilize it strictly in SQL)
    -- If this block fails, the column is missing.
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'is_admin'
        ) THEN
            ALTER TABLE public.user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
        END IF;
    END $$;
