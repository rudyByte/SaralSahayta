-- FIX SCRIPT FOR ADMIN LOGIN
-- 1. Reload Schema Cache (Fixes "Database error querying schema")
NOTIFY pgrst, 'reload schema';

-- 2. Ensure Admin User Exists Correctly
DO $$
DECLARE
    v_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    -- Update User Profile if exists, else insert
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        UPDATE public.user_profiles 
        SET 
            is_admin = true, 
            full_name = 'Rudy Admin',
            mobile = '9999999999',
            email = '9999999999@sahayog.app'
        WHERE user_id = v_user_id;
        
        IF NOT FOUND THEN
             INSERT INTO public.user_profiles (user_id, full_name, is_admin, mobile, email)
             VALUES (v_user_id, 'Rudy Admin', true, '9999999999', '9999999999@sahayog.app');
        END IF;
    END IF;
END $$;

-- 3. Verify Roles
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    id, 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
FROM public.roles 
WHERE name = 'SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;
