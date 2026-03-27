-- Promote specific user to Admin based on mobile number in user_profiles
UPDATE public.user_profiles
SET is_admin = TRUE
WHERE mobile = '9638103104';

-- Alternative: Promote based on auth.users link
UPDATE public.user_profiles
SET is_admin = TRUE
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data ->> 'mobile' = '9638103104' 
    OR phone = '9638103104'
    OR email = 'adminam@sahayog.app' -- backup if they registered with this
);
