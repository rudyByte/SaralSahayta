-- Make the documents bucket public so files can be accessed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Verify the change
SELECT id, name, public FROM storage.buckets WHERE id = 'documents';
