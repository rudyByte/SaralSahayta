-- PHASE 3: ADMIN PANEL, ANALYTICS & NOTIFICATIONS SETUP

-- ==========================================
-- 1. ROLE-BASED ACCESS CONTROL (RBAC)
-- ==========================================

-- Create ENUM for standard roles if not exists
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'SCHEME_MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Roles Table
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL, -- e.g. 'SUPER_ADMIN', 'VERIFIER'
    "description" TEXT,
    "permissions" JSONB DEFAULT '[]', -- Array of permission strings e.g. ["apps.view", "apps.approve"]
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Linking Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "role_id" UUID NOT NULL REFERENCES "roles"(id) ON DELETE CASCADE,
    "assigned_at" TIMESTAMPTZ DEFAULT NOW(),
    "assigned_by" UUID REFERENCES auth.users(id),
    UNIQUE("user_id", "role_id")
);

-- Update user_profiles to have a quick check flag (denormalized for performance)
ALTER TABLE "user_profiles" 
ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN DEFAULT false;

-- ==========================================
-- 2. NOTIFICATIONS SYSTEM
-- ==========================================

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('SYSTEM', 'APPLICATION_UPDATE', 'DOCUMENT_STATUS', 'DEADLINE', 'ACTION_REQUIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "type" notification_type DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT, -- Deep link to app page
    "is_read" BOOLEAN DEFAULT false,
    "priority" notification_priority DEFAULT 'NORMAL',
    "metadata" JSONB DEFAULT '{}', -- Store related IDs e.g. { "application_id": "..." }
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast retrieval of user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON "notifications"("user_id") WHERE is_read = false;

-- ==========================================
-- 3. ADMIN ACTIVITY LOGGING (AUDIT TRAIL)
-- ==========================================

CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL REFERENCES auth.users(id),
    "action" TEXT NOT NULL, -- e.g. 'APPLICATION_APPROVED'
    "target_table" TEXT NOT NULL, -- e.g. 'applications'
    "target_id" UUID NOT NULL,
    "details" JSONB DEFAULT '{}', -- Capture changes or snapshot
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ANALYTICS (MATERIALIZED VIEWS)
-- ==========================================

-- Daily Snapshot View
-- Note: Materialized views need to be refreshed periodically (e.g. via pg_cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics_daily_snapshot" AS
SELECT
    CURRENT_DATE as snapshot_date,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM "applications") as total_applications,
    (SELECT COUNT(*) FROM "applications" WHERE status = 'SUBMITTED') as pending_applications,
    (SELECT COUNT(*) FROM "applications" WHERE status = 'APPROVED') as approved_applications,
    (SELECT COUNT(*) FROM "applications" WHERE created_at > NOW() - INTERVAL '24 hours') as new_apps_24h;

-- Create index for analytics queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshot_date ON "analytics_daily_snapshot"("snapshot_date");

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_analytics_snapshot()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY "analytics_daily_snapshot";
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. RLS POLICIES
-- ==========================================

-- Roles: Read-only for everyone authenticated (to check their own permissions)
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read roles" ON "roles" FOR SELECT TO authenticated USING (true);

-- User Roles: Users can see their own, Admins can manage
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON "user_roles" FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Note: Admin write policies depend on a function `is_admin()` which we define next

-- Notifications: Users manage their own
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own notifications" ON "notifications" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin Logs: Insert by system/admins, View by super admins
ALTER TABLE "admin_activity_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View logs" ON "admin_activity_logs" FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- ==========================================
-- 6. HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify user on application status change
-- This is a backup/direct DB approach. Phase 3 also suggests Edge Functions.
-- We'll keep this simple one for immediate "In-App" notifications.
CREATE OR REPLACE FUNCTION notify_app_status_change()
RETURNS TRIGGER AS $$
DECLARE
    app_scheme_name TEXT;
BEGIN
    -- Only trigger if status changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Get scheme name for better message
        SELECT "schemeName" INTO app_scheme_name FROM "schemes" WHERE id = NEW.scheme_id;
        
        -- Insert notification
        INSERT INTO "notifications" (user_id, type, title, message, link, priority)
        VALUES (
            NEW.user_id, 
            'APPLICATION_UPDATE', 
            'Application Status Update', 
            'Your application for ' || COALESCE(app_scheme_name, 'Scheme') || ' has been moved to ' || NEW.status, 
            '/applications/' || NEW.id,
            'HIGH'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_app_status ON "applications";
CREATE TRIGGER tr_notify_app_status
AFTER UPDATE ON "applications"
FOR EACH ROW
EXECUTE FUNCTION notify_app_status_change();
