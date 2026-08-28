-- PHASE 16: Expanded life-event taxonomy for better scheme discovery.
-- Run in Supabase before deploying UI that can save these values.

ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'MASTERS';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'PHD';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'DIPLOMA';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'UNMARRIED';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'SINGLE_PARENT';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'SINGLE_CHILD';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'GIRL_CHILD';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'ORPHAN';
ALTER TYPE life_event_type ADD VALUE IF NOT EXISTS 'SEPARATION';

NOTIFY pgrst, 'reload schema';
