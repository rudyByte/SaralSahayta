-- ================================================================
-- PHASE 11: ADMIN MANAGEMENT EXTENSIONS & FIXES
-- ================================================================

-- 1. Ensure User Profiles has suspension fields
ALTER TABLE IF EXISTS user_profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ACTIVE'; -- ACTIVE, SUSPENDED, PENDING_VERIFICATION

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'PROMOTE', 'SUSPEND', 'APPROVE_APP', 'VERIFY_DOC'
    entity_type TEXT NOT NULL, -- 'USER', 'APPLICATION', 'DOCUMENT', 'SCHEME'
    entity_id TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT
);

-- 3. Application History (Ensuring it exists as used in API)
CREATE TABLE IF NOT EXISTS "ApplicationHistory" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL, -- 'admin' or system ID
    remarks TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Application Documents (Mapping table for detailed verification)
-- Note: If this already exists but as a column/join, we ensure the table structure
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_id UUID NOT NULL, -- References the master Document/user_documents table
    verification_status TEXT DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED, REQUEST_INFO
    remarks TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(application_id, document_id)
);

-- 5. RLS Policies for Admin Actions
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs" ON admin_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_admin = TRUE)
);

-- 6. Notify schema reload
NOTIFY pgrst, 'reload schema';
