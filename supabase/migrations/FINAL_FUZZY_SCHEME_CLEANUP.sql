-- ================================================================
-- FINAL CLEANUP: REMOVE FUZZY DUPLICATES (PHASE 8)
-- Targets schemes with slight naming variations that weren't 
-- caught by the exact name match.
-- ================================================================

DO $$
DECLARE
    master_id TEXT;
BEGIN
    -- 1. CONSOLIDATE: Ayushman Bharat
    SELECT id INTO master_id FROM "Scheme" WHERE name = 'Ayushman Bharat (PM-JAY)' LIMIT 1;
    IF master_id IS NOT NULL THEN
        UPDATE applications SET scheme_id = master_id WHERE scheme_id IN (SELECT id FROM "Scheme" WHERE name = 'Ayushman Bharat PM-JAY');
        DELETE FROM "SchemeDocumentRequirement" WHERE "schemeId" IN (SELECT id FROM "Scheme" WHERE name = 'Ayushman Bharat PM-JAY');
        DELETE FROM "Scheme" WHERE name = 'Ayushman Bharat PM-JAY';
    END IF;

    -- 2. CONSOLIDATE: NULM
    SELECT id INTO master_id FROM "Scheme" WHERE name = 'National Urban Livelihood Mission (NULM)' LIMIT 1;
    IF master_id IS NOT NULL THEN
        UPDATE applications SET scheme_id = master_id WHERE scheme_id IN (SELECT id FROM "Scheme" WHERE name = 'National Urban Livelihood Mission');
        DELETE FROM "SchemeDocumentRequirement" WHERE "schemeId" IN (SELECT id FROM "Scheme" WHERE name = 'National Urban Livelihood Mission');
        DELETE FROM "Scheme" WHERE name = 'National Urban Livelihood Mission';
    END IF;

    -- 3. CONSOLIDATE: PM-KISAN
    SELECT id INTO master_id FROM "Scheme" WHERE name = 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)' LIMIT 1;
    IF master_id IS NOT NULL THEN
        UPDATE applications SET scheme_id = master_id WHERE scheme_id IN (SELECT id FROM "Scheme" WHERE name = 'Pradhan Mantri Kisan Samman Nidhi');
        DELETE FROM "SchemeDocumentRequirement" WHERE "schemeId" IN (SELECT id FROM "Scheme" WHERE name = 'Pradhan Mantri Kisan Samman Nidhi');
        DELETE FROM "Scheme" WHERE name = 'Pradhan Mantri Kisan Samman Nidhi';
    END IF;

    -- 4. CLEANUP: Other non-standard Demo/Legacy schemes
    -- These are likely leftover from early development or testing
    DELETE FROM "Scheme" 
    WHERE name IN (
        'Maharashtra Professional Excellence Grant',
        'Bihar SC/ST Startup Fund',
        'Tribal Artisans Equipment Grant',
        'Stand Up India Scheme',
        'Pradhan Mantri Vaya Vandana Yojana' -- Corrected check if this is meant to be PMMVY (Matru Vandana)
    );

    RAISE NOTICE 'Fuzzy duplicates and legacy demo data consolidated successfully.';
END $$;

-- VERIFICATION
SELECT name, COUNT(*) 
FROM "Scheme" 
GROUP BY name 
ORDER BY name ASC;
