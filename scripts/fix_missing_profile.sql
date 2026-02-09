-- FIX MISSING USER PROFILE AND SET ADMIN
-- This creates the user_profile if missing and sets admin status

-- First, let's see what we have
SELECT 'AUTH USER:' as info, id, email FROM auth.users WHERE email = '9999999999@sahayog.app';

-- Check if profile exists
SELECT 'USER PROFILE:' as info, user_id, full_name, is_admin FROM public.user_profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = '9999999999@sahayog.app');

-- Create or update the user profile
INSERT INTO public.user_profiles (
    user_id,
    full_name,
    mobile,
    email,
    is_admin,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', 'Admin User'),
    COALESCE(raw_user_meta_data->>'mobile', '9999999999'),
    email,
    true,
    now(),
    now()
FROM auth.users 
WHERE email = '9999999999@sahayog.app'
ON CONFLICT (user_id) 
DO UPDATE SET 
    is_admin = true,
    updated_at = now();

-- Assign SUPER_ADMIN role
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
SELECT 
    u.id,
    r.id,
    u.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.email = '9999999999@sahayog.app'
AND r.name = 'SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify the result
SELECT 
    'VERIFICATION:' as info,
    u.email,
    up.full_name,
    up.mobile,
    up.is_admin,
    r.name as role_name
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = '9999999999@sahayog.app';
