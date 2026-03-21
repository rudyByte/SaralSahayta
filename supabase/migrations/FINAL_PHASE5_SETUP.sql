-- ================================================================
-- FINAL PHASE 5 DATABASE SETUP: LIFE EVENTS & SMART DISCOVERY
-- This script initializes all Phase 5 intelligent matching structures
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE life_event_category AS ENUM (
        'EDUCATION', 'EMPLOYMENT', 'FAMILY', 'ECONOMIC', 
        'HOUSING', 'HEALTH', 'SENIOR_CITIZEN'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE life_event_type AS ENUM (
        'TENTH_PASS', 'TWELFTH_PASS', 'COLLEGE_ADMISSION', 'GRADUATION', 'POST_GRADUATION',
        'FIRST_JOB', 'JOB_LOSS', 'UNEMPLOYED', 'SKILL_UPGRADE', 'RETIREMENT',
        'MARRIAGE', 'CHILDBIRTH', 'WIDOWHOOD', 'DIVORCE',
        'STARTING_BUSINESS', 'FARMING_INITIATED', 'LOW_INCOME', 'CROP_LOSS',
        'BUYING_HOUSE', 'BUILDING_HOUSE', 'HOMELESS',
        'DISABILITY', 'SERIOUS_ILLNESS',
        'TURNED_60', 'TURNED_70'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. LIFE EVENTS TABLE
CREATE TABLE IF NOT EXISTS user_life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type life_event_type NOT NULL,
  event_category life_event_category NOT NULL,
  event_date DATE NOT NULL,
  event_details JSONB, -- Additional context
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_event UNIQUE(user_id, event_type, event_date)
);

CREATE INDEX IF NOT EXISTS idx_user_life_events_user ON user_life_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_life_events_type ON user_life_events(event_type);

-- 4. LIFE EVENT TO SCHEME MAPPING
-- References "Scheme" table (using quoted PascalCase if it exists, matching Phase 4 V3)
-- If your table name is lowercase "schemes", adjust accordingly.
CREATE TABLE IF NOT EXISTS life_event_scheme_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type life_event_type NOT NULL,
  scheme_id TEXT NOT NULL, -- Using TEXT to match Prisma ID type (cuid)
  priority INTEGER DEFAULT 5, -- 1-10, higher = more relevant
  recommendation_text TEXT, -- Custom message
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_event_scheme UNIQUE(event_type, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_event_scheme_mapping ON life_event_scheme_mapping(event_type);

-- 5. MISSED BENEFITS TRACKING
CREATE TABLE IF NOT EXISTS missed_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id TEXT NOT NULL,
  was_eligible_on DATE NOT NULL,
  missed_amount DECIMAL(12, 2), -- Potential benefit amount
  reason TEXT, -- Why they missed it
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missed_benefits_user ON missed_benefits(user_id, created_at DESC);

-- 6. SCHEME MATCH HISTORY (Track changes)
CREATE TABLE IF NOT EXISTS scheme_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id TEXT NOT NULL,
  match_score INTEGER NOT NULL,
  changed_reason TEXT, -- "Document uploaded", "Life event added", "Profile updated"
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheme_match_history ON scheme_match_history(user_id, changed_at DESC);

-- 7. FUTURE OPPORTUNITIES
CREATE TABLE IF NOT EXISTS future_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL, -- "TURNING_18", "RETIREMENT_ELIGIBLE", etc.
  predicted_date DATE NOT NULL,
  schemes_available JSONB, -- Array of scheme IDs
  preparation_steps JSONB, -- What to prepare
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_future_opportunities ON future_opportunities(user_id, predicted_date);

-- 8. ENHANCE user_profiles FOR LIFE EVENTS
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS life_events_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_life_event_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS family_members JSONB;

-- 9. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION recalculate_scheme_matches_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark that user's matches need recalculation
  UPDATE user_profiles
  SET last_life_event_update = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Create notification (Table: Notification from Phase 4)
  INSERT INTO "Notification" (id, "userId", type, title, message, createdAt)
  VALUES (
    gen_random_uuid()::text,
    NEW.user_id::text,
    'NEW_SCHEME_MATCH',
    '✨ New Schemes Available!',
    'Based on your recent life event, we found new schemes you''re eligible for.',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for life events
DROP TRIGGER IF EXISTS trigger_recalc_on_life_event ON user_life_events;
CREATE TRIGGER trigger_recalc_on_life_event
  AFTER INSERT ON user_life_events
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_scheme_matches_on_event();

-- 10. PREDICT FUTURE OPPORTUNITIES FUNCTION
CREATE OR REPLACE FUNCTION predict_future_opportunities()
RETURNS void AS $$
BEGIN
  -- Users turning 18 soon
  INSERT INTO future_opportunities (user_id, opportunity_type, predicted_date, preparation_steps)
  SELECT 
    user_id,
    'TURNING_18',
    date_of_birth + INTERVAL '18 years',
    jsonb_build_object(
      'message', 'You will become eligible for many government schemes when you turn 18.',
      'prepare', jsonb_build_array('Get Aadhaar card ready', 'Prepare bank account', 'Keep certificates handy')
    )
  FROM user_profiles
  WHERE 
    date_of_birth + INTERVAL '18 years' BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM future_opportunities 
      WHERE user_id = user_profiles.user_id AND opportunity_type = 'TURNING_18'
    );
END;
$$ LANGUAGE plpgsql;

-- Reset and Schedule daily jobs
DO $$ BEGIN
    PERFORM cron.unschedule('predict-future-opportunities');
EXCEPTION WHEN others THEN NULL; END $$;

SELECT cron.schedule('predict-future-opportunities', '0 6 * * *', 'SELECT predict_future_opportunities()');

-- 11. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
