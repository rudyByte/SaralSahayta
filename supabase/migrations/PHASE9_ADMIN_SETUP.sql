    -- ============================================
    -- PHASE 9: ADMIN AUTHORIZATION SETUP
    -- ============================================

    -- 1. Add "is_admin" column to user_profiles if it doesn't exist
    ALTER TABLE IF EXISTS user_profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

    -- 2. CREATE A HELPER COMMENT FOR SUPERADMIN CREATION
    /*
    ---------------------------------------------------------
    HOW TO MAKE YOURSELF AN ADMIN
    ---------------------------------------------------------
    After running this script, run the query below in your
    Supabase SQL Editor, replacing 'YOUR_MOBILE_OR_EMAIL' 
    with the exact string you used to register.

    ---------------------------------------------------------
    UPDATE user_profiles
    SET is_admin = TRUE
    WHERE user_id = (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'mobile' = 'YOUR_PHONE'
        OR email = 'YOUR_EMAIL'
        LIMIT 1
    );
    ---------------------------------------------------------
    */

    -- 3. REFRESH SCHEMA CACHE
    NOTIFY pgrst, 'reload schema';
