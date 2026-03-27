-- Add completion tracking for life events popup
ALTER TABLE IF EXISTS public.user_profiles
ADD COLUMN IF NOT EXISTS life_events_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_life_event_update TIMESTAMP WITH TIME ZONE;

-- Force update for any existing users who might already have milestones but the flag is null
UPDATE public.user_profiles 
SET life_events_completed = TRUE 
WHERE user_id IN (SELECT DISTINCT user_id FROM public.user_life_events);
