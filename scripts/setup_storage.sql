-- dedicated_storage_setup.sql

-- 1. Create 'documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'profile-pictures' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for 'documents'
-- Drop existing policies to ensure clean state (optional, but good for idempotency if policy names match)
DROP POLICY IF EXISTS "Users can manage their own documents" ON storage.objects;

CREATE POLICY "Users can manage their own documents" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. RLS Policies for 'profile-pictures'
DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own profile pictures" ON storage.objects;

CREATE POLICY "Public can view profile pictures" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can manage their own profile pictures" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
