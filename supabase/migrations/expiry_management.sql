-- Expiry Management Migrations
-- Run this in Supabase SQL Editor or via CI/CD

-- 1. Ensure the status column exists on Document table
ALTER TABLE IF EXISTS "Document" 
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';

-- 2. Function to automatically expire documents
CREATE OR REPLACE FUNCTION auto_expire_documents()
RETURNS void AS $$
BEGIN
  -- Update documents that have passed their expiry date
  UPDATE "Document"
  SET "status" = 'EXPIRED',
      "isVerified" = false -- Re-verification required for expired docs
  WHERE "expiryDate" < CURRENT_DATE
  AND "status" != 'EXPIRED';
  
  -- Update documents that are expiring soon (within 30 days)
  UPDATE "Document"
  SET "status" = 'EXPIRING_SOON'
  WHERE "expiryDate" >= CURRENT_DATE 
  AND "expiryDate" <= (CURRENT_DATE + INTERVAL '30 days')
  AND "status" = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- 3. Function to notify users about expiring documents
CREATE OR REPLACE FUNCTION notify_expiring_documents()
RETURNS void AS $$
BEGIN
  -- Notify for 30 days
  INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
  SELECT 
    gen_random_uuid(),
    "userId",
    'Document Expiring Soon',
    'Your ' || "documentType" || ' will expire in 30 days. Please plan for renewal.',
    'EXPIRY',
    '/documents/renew/' || lower(replace("documentType", ' ', '_')),
    NOW()
  FROM "Document"
  WHERE "expiryDate" = (CURRENT_DATE + INTERVAL '30 days');

  -- Notify for 15 days
  INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
  SELECT 
    gen_random_uuid(),
    "userId",
    'Action Required: Document Expiring',
    'Your ' || "documentType" || ' expires in 15 days. Start the renewal process now.',
    'EXPIRY',
    '/documents/renew/' || lower(replace("documentType", ' ', '_')),
    NOW()
  FROM "Document"
  WHERE "expiryDate" = (CURRENT_DATE + INTERVAL '15 days');

  -- Notify for 7 days
  INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
  SELECT 
    gen_random_uuid(),
    "userId",
    'Urgent: Document Expiring',
    'Your ' || "documentType" || ' will expire in 7 days. Critical for benefits.',
    'EXPIRY',
    '/documents/renew/' || lower(replace("documentType", ' ', '_')),
    NOW()
  FROM "Document"
  WHERE "expiryDate" = (CURRENT_DATE + INTERVAL '7 days');

  -- Notify once EXPIRED
  INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
  SELECT 
    gen_random_uuid(),
    "userId",
    'Document Expired',
    'Your ' || "documentType" || ' has expired. Benefits may be suspended until renewed.',
    'EXPIRY',
    '/documents/renew/' || lower(replace("documentType", ' ', '_')),
    NOW()
  FROM "Document"
  WHERE "expiryDate" = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 4. Schedule the jobs with pg_cron
-- Daily at 8:00 AM
SELECT cron.schedule('auto-expire-docs-daily', '0 8 * * *', 'SELECT auto_expire_documents()');
-- Daily at 8:30 AM
SELECT cron.schedule('notify-expiry-daily', '30 8 * * *', 'SELECT notify_expiring_documents()');
