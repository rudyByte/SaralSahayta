-- Function to get historical approval rates for a scheme
-- If a specific scheme has no history, it falls back to the average for that scheme's category
CREATE OR REPLACE FUNCTION get_scheme_stats(target_scheme_id UUID)
RETURNS TABLE (
    total_apps BIGINT,
    approved_apps BIGINT,
    historical_rate FLOAT
) AS $$
DECLARE
    scheme_category TEXT;
BEGIN
    -- Get the category of the target scheme
    SELECT category INTO scheme_category FROM "Scheme" WHERE id = target_scheme_id;

    -- Look for stats for the specific scheme
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'APPROVED')
    INTO total_apps, approved_apps
    FROM "Application"
    WHERE "schemeId" = target_scheme_id;

    -- If no history for the specific scheme, fallback to category average
    IF total_apps = 0 THEN
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'APPROVED')
        INTO total_apps, approved_apps
        FROM "Application" a
        JOIN "Scheme" s ON a."schemeId" = s.id
        WHERE s.category = scheme_category;
    END IF;

    -- Calculate rate (default to 0.75 if no history at all for category)
    IF total_apps > 0 THEN
        historical_rate := approved_apps::FLOAT / total_apps::FLOAT;
    ELSE
        historical_rate := 0.75; -- Constant fallback for new categories
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
