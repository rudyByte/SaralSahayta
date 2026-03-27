-- ============================================
-- PHASE 11: ADMIN MANAGEMENT EXTENSIONS
-- ============================================

-- 1. Add Status and Suspension fields to user_profiles
ALTER TABLE IF EXISTS user_profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ACTIVE';

-- 2. Add Activity Logging table for Admin Actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'PROMOTE', 'DEMOTE', 'SUSPEND', 'ACTIVATE', 'VERIFY_DOC', 'REJECT_DOC'
    entity_type TEXT NOT NULL, -- 'USER', 'APPLICATION', 'SCHEME'
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Admins can see all audit logs
CREATE POLICY "Admins can view all audit logs" 
ON admin_audit_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND is_admin = TRUE
    )
);

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
