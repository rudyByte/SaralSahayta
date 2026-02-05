-- RLS Policies for application_history
-- Users can view their own application history but cannot insert/update/delete (reserved for system/triggers)

ALTER TABLE application_history ENABLE ROW LEVEL SECURITY;

-- Policy for viewing history
CREATE POLICY "Users can view history of their own applications"
ON application_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_history.application_id
    AND applications.user_id = auth.uid()
  )
);

-- Service role has full access
CREATE POLICY "Service role has full access to history"
ON application_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
