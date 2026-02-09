-- PROMOTE USER TO ADMIN
-- This promotes the user with mobile 9999999999 to admin

-- Update user_profiles to set is_admin = true
UPDATE public.user_profiles 
SET is_admin = true 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = '9999999999@sahayog.app'
);

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

-- Verify the update
SELECT 
    u.email,
    up.full_name,
    up.is_admin,
    r.name as role_name
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = '9999999999@sahayog.app';
