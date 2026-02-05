-- Extension for Document Intelligence
-- Adding fields to master_documents for samples
-- Adding pg_cron schedule

ALTER TABLE documents ADD COLUMN IF NOT EXISTS sample_image_url TEXT;

-- Example of setting a sample image
-- UPDATE documents SET sample_image_url = 'https://example.com/samples/aadhaar.jpg' WHERE document_code = 'AADHAAR';

-- Schedule the expiry check cron via pg_cron (Supabase)
-- Note: This requires the net extension and a valid project URL
/*
select cron.schedule(
  'document-expiry-reminder',
  '0 0 * * *', -- Midnight every day
  $$
    select
      net.http_get(
        url:='https://[YOUR_PROJECT_REF].supabase.co/api/cron/check-expiring-documents',
        headers:=jsonb_build_object('Authorization', 'Bearer [YOUR_CRON_SECRET]')
      );
  $$
);
*/
