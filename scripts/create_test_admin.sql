-- Create a test admin user "rudy"
-- Login Mobile: 9999999999
-- Password: Hellothere112@
--
-- NOTE: The app uses email auth in background with format: {mobile}@sahayog.app

BEGIN;

-- 1. Ensure pgcrypto is ready
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert into auth.users if not exists
-- Use fixed UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- Email: 9999999999@sahayog.app (This allows login with mobile 9999999999)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role,
    phone
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '00000000-0000-0000-0000-000000000000',
    '9999999999@sahayog.app',
    crypt('Hellothere112@', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Rudy Admin", "mobile": "9999999999"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    '9999999999'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 3. Ensure user_profile exists and is admin
DO $$
DECLARE
    v_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
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
END $$;

-- 4. Assign SUPER_ADMIN role
DO $$
DECLARE
    v_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_role_id UUID;
BEGIN
    -- Get SUPER_ADMIN role id
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'SUPER_ADMIN';

    -- Insert if role exists
    IF v_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, assigned_by)
        VALUES (v_user_id, v_role_id, v_user_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
END $$;

COMMIT;

-- Verify
SELECT * FROM public.user_profiles WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
