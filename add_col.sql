
    ALTER TABLE IF EXISTS public.applications 
    ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}';
  