-- DELETE BROKEN ADMIN USER
-- This removes the manually created admin user that has schema issues

-- 1. Delete from user_roles first (foreign key constraint)
DELETE FROM public.user_roles WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 2. Delete from user_profiles
DELETE FROM public.user_profiles WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 3. Delete from auth.users (this will cascade to other tables)
DELETE FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
