-- Enable pg_cron if available
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Scheduled task to check for document expiry
-- Runs every day at midnight
SELECT cron.schedule('check-document-expiry', '0 0 * * *', $$
  -- Find documents expiring in 7 days
  CREATE TEMP TABLE expiring_docs AS
  SELECT user_id, document_name, expiry_date
  FROM user_documents
  WHERE expiry_date = CURRENT_DATE + INTERVAL '7 days';

  -- Trigger notifications (via a trigger or another edge function)
  -- For now, just logging or marking status
  UPDATE user_documents
  SET status = 'EXPIRING_SOON'
  WHERE id IN (SELECT id FROM expiring_docs);
$$);
