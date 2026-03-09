-- SQL Cron Jobs for Automated Notifications
-- Requires pg_cron extension in Supabase

-- 1. Function to check for document expiries
CREATE OR REPLACE FUNCTION check_document_expiries()
RETURNS void AS $$
DECLARE
    doc_record RECORD;
    days_to_expiry INTEGER;
BEGIN
    FOR doc_record IN 
        SELECT d."id", d."userId", d."name", d."expiryDate", u."name" as user_name
        FROM "Document" d
        JOIN "User" u ON d."userId" = u."id"
        WHERE d."expiryDate" IS NOT NULL 
        AND d."expiryDate" > CURRENT_DATE
        AND d."expiryDate" <= CURRENT_DATE + INTERVAL '30 days'
    LOOP
        days_to_expiry := (doc_record."expiryDate" - CURRENT_DATE);
        
        -- Only notify at 30, 15, 7, and 1 day remaining
        IF days_to_expiry IN (30, 15, 7, 1) THEN
            INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
            VALUES (
                gen_random_uuid()::text,
                doc_record."userId",
                'Document Expiring Soon',
                'Your document "' || doc_record."name" || '" will expire in ' || days_to_expiry || ' days. Please update it.',
                'EXPIRY',
                '/documents',
                NOW()
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to check for scheme deadlines
CREATE OR REPLACE FUNCTION check_scheme_deadlines()
RETURNS void AS $$
DECLARE
    scheme_record RECORD;
    days_to_deadline INTEGER;
    user_record RECORD;
BEGIN
    FOR scheme_record IN 
        SELECT "id", "title", "deadline"
        FROM "Scheme"
        WHERE "deadline" IS NOT NULL 
        AND "deadline" > CURRENT_DATE
        AND "deadline" <= CURRENT_DATE + INTERVAL '7 days'
    LOOP
        days_to_deadline := (scheme_record."deadline" - CURRENT_DATE);
        
        -- Notify all users about schemes closing soon (or just those who match)
        -- For simplicity, we can notify users who have at least one document
        -- In a real app, this would use the match score table
        FOR user_record IN SELECT "id" FROM "User" LOOP
            IF days_to_deadline IN (7, 3, 1) THEN
                INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
                VALUES (
                    gen_random_uuid()::text,
                    user_record."id",
                    'Deadline Approaching',
                    'The scheme "' || scheme_record."title" || '" is closing in ' || days_to_deadline || ' days. Apply now!',
                    'DEADLINE',
                    '/discover',
                    NOW()
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the jobs (Run daily at 8:00 AM and 9:00 AM)
-- SELECT cron.schedule('check-document-expiry', '0 8 * * *', 'SELECT check_document_expiries()');
-- SELECT cron.schedule('check-scheme-deadlines', '0 9 * * *', 'SELECT check_scheme_deadlines()');
