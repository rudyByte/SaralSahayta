-- Setting up Application History Tracking and Triggers

-- 1. Create application_history table
CREATE TABLE IF NOT EXISTS "application_history" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL REFERENCES "applications"(id) ON DELETE CASCADE,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "changed_by" UUID REFERENCES auth.users(id),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'
);

-- 2. Trigger Function for Automatic History Logging
CREATE OR REPLACE FUNCTION log_app_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log only when status or remarks change
    IF (OLD.status IS NULL OR OLD.status <> NEW.status OR OLD.remarks IS DISTINCT FROM NEW.remarks) THEN
        INSERT INTO "application_history" ("application_id", "status", "remarks")
        VALUES (NEW.id, NEW.status, NEW.remarks);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger to 'applications' table
DROP TRIGGER IF EXISTS tr_log_status_change_apps ON "applications";
CREATE TRIGGER tr_log_status_change_apps
AFTER INSERT OR UPDATE ON "applications"
FOR EACH ROW
EXECUTE FUNCTION log_app_status_change();

-- 4. Enable RLS
ALTER TABLE "application_history" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own application history" ON "application_history";
CREATE POLICY "Users can view their own application history" 
ON "application_history" FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM "applications" 
        WHERE id = application_id AND user_id = auth.uid()
    )
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_app_history_id ON "application_history"("application_id");
