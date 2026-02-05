-- Trigger function to log status changes
-- This function automatically creates a history record whenever an application's status is updated
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if the status has actually changed
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO application_history (application_id, status, remarks, created_at)
    VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to applications table
-- Drop trigger if it already exists to avoid errors during re-application
DROP TRIGGER IF EXISTS application_status_change_trigger ON applications;

CREATE TRIGGER application_status_change_trigger
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION log_application_status_change();
