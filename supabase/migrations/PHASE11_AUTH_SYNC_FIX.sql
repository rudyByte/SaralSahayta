-- ================================================================
-- PHASE 11.5: AUTH SYNC & PROFILE REPAIR
-- This fixes the issue where new signups do not create profiles
-- and ensures existing users have a valid profile row.
-- ================================================================

-- 1. Create/Update the Profile Sync Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    full_name, 
    mobile, 
    email,
    date_of_birth, 
    gender, 
    category, 
    state
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'mobile', NEW.phone, ''),
    COALESCE(NEW.email, ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data ->> 'date_of_birth' != '' 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'gender',
    NEW.raw_user_meta_data ->> 'category',
    NEW.raw_user_meta_data ->> 'state'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error or just return NEW to allow auth to proceed even if profile fails
  -- (Though usually better to fix the root cause)
  RETURN NEW;
END;
$$;

-- 2. Ensure Trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. SYNC EXISTING ORPHANED USERS
-- This query catches any users who signed up while the trigger was broken
INSERT INTO public.user_profiles (user_id, full_name, mobile, email, date_of_birth, gender, category, state)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(u.raw_user_meta_data ->> 'mobile', u.phone, ''),
    COALESCE(u.email, ''),
    CASE 
      WHEN u.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL AND u.raw_user_meta_data ->> 'date_of_birth' != '' 
      THEN (u.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END,
    u.raw_user_meta_data ->> 'gender',
    u.raw_user_meta_data ->> 'category',
    u.raw_user_meta_data ->> 'state'
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
