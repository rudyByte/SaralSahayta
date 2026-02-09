-- PROMOTE USER TO ADMIN
-- Run this AFTER registering via the UI
-- Replace 'MOBILE_NUMBER' with the actual mobile number you registered with

DO $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
    v_mobile TEXT := '9999999999'; -- CHANGE THIS to your registered mobile number
BEGIN
    -- Find user by email (mobile@sahayog.app format)
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_mobile || '@sahayog.app';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with mobile % not found. Please register first.', v_mobile;
    END IF;
    
    -- Update user_profiles to set is_admin = true
    UPDATE public.user_profiles 
    SET is_admin = true 
    WHERE user_id = v_user_id;
    
    -- Get SUPER_ADMIN role id
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'SUPER_ADMIN';
    
    -- Assign SUPER_ADMIN role
    IF v_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, assigned_by)
        VALUES (v_user_id, v_role_id, v_user_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'User % promoted to admin successfully', v_mobile;
END $$;
