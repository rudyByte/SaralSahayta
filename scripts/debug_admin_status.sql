-- DEBUG ADMIN STATUS
-- Check if the user is properly set as admin

-- 1. Check auth.users
SELECT 
    id,
    email,
    phone,
    created_at
FROM auth.users 
WHERE email = '9999999999@sahayog.app';

-- 2. Check user_profiles
SELECT 
    user_id,
    full_name,
    mobile,
    is_admin,
    created_at
FROM public.user_profiles 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = '9999999999@sahayog.app'
);

-- 3. Check user_roles
SELECT 
    ur.user_id,
    r.name as role_name,
    r.permissions
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id IN (
    SELECT id FROM auth.users WHERE email = '9999999999@sahayog.app'
);

-- 4. Check if is_admin column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'is_admin';
