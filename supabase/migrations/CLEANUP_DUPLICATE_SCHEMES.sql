-- ================================================================
-- CLEANUP: REMOVE DUPLICATE SCHEMES (PHASE 8)
-- This script identifies schemes with the same name, updates 
-- references in other tables to a single "Master" ID, and deletes 
-- the duplicates.
-- ================================================================

-- 1. CHECK FOR DUPLICATES (Run this first to see what will be affected)
/*
SELECT name, COUNT(*), array_agg(id) as ids, array_agg("schemeId") as internal_ids
FROM "Scheme"
GROUP BY name
HAVING COUNT(*) > 1;
*/

-- 2. THE CLEANUP PROCESS
DO $$
DECLARE
    r RECORD;
    master_id TEXT;
BEGIN
    -- STEP 0: Fix the type mismatch once and for all
    -- Convert applications.scheme_id from UUID to TEXT to match the "Scheme" table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'scheme_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE applications ALTER COLUMN scheme_id TYPE TEXT USING scheme_id::text;
    END IF;

    -- Iterate through each name that has duplicates
    FOR r IN (
        SELECT name
        FROM "Scheme"
        GROUP BY name
        HAVING COUNT(*) > 1
    ) LOOP
        -- Select a "Master ID" for this scheme name
        SELECT id INTO master_id
        FROM "Scheme"
        WHERE name = r.name
        ORDER BY 
            CASE WHEN id LIKE 'scheme_%' THEN 0 ELSE 1 END,
            id ASC
        LIMIT 1;

        -- Update Applications (if any)
        UPDATE applications
        SET scheme_id = master_id
        WHERE scheme_id IN (SELECT id FROM "Scheme" WHERE name = r.name AND id <> master_id);

        -- Update requirements
        DELETE FROM "SchemeDocumentRequirement"
        WHERE "schemeId" IN (SELECT id FROM "Scheme" WHERE name = r.name AND id <> master_id);

        -- Delete the duplicate schemes
        DELETE FROM "Scheme"
        WHERE name = r.name AND id <> master_id;

        RAISE NOTICE 'Consolidated scheme: % to Master ID: %', r.name, master_id;
    END LOOP;
END $$;

-- 3. VERIFICATION QUERY
SELECT name, COUNT(*) 
FROM "Scheme" 
GROUP BY name 
ORDER BY count DESC;
