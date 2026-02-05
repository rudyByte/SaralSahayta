# Supabase Row Level Security (RLS) Policies

This document contains the SQL statements needed to set up Row Level Security policies for the document storage system.

## Prerequisites

1. Ensure you have created the `documents` storage bucket in Supabase
2. Run these SQL commands in the Supabase SQL Editor
3. Make sure your database schema has the `user_documents` table

---

## Storage Bucket Policies

### 1. Enable RLS on Storage Objects

```sql
-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 2. Allow Authenticated Users to Upload to Their Own Folder

```sql
-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Allow Users to Read Their Own Files

```sql
-- Policy: Users can read their own files
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. Allow Users to Delete Unverified Files

```sql
-- Policy: Users can delete their own unverified files
CREATE POLICY "Users can delete own unverified files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  NOT EXISTS (
    SELECT 1 
    FROM public.user_documents
    WHERE file_url LIKE '%' || name || '%'
    AND verification_status = 'VERIFIED'
  )
);
```

---

## Database Table Policies (user_documents)

### 1. Enable RLS on user_documents Table

```sql
-- Enable RLS on user_documents table
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
```

### 2. Allow Users to Read Their Own Documents

```sql
-- Policy: Users can read their own documents
CREATE POLICY "Users can read own documents"
ON public.user_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 3. Allow Users to Insert Their Own Documents

```sql
-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents"
ON public.user_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 4. Allow Users to Update Their Own Unverified Documents

```sql
-- Policy: Users can update their own unverified documents
CREATE POLICY "Users can update own unverified documents"
ON public.user_documents
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND
  verification_status != 'VERIFIED'
)
WITH CHECK (
  auth.uid() = user_id AND
  verification_status != 'VERIFIED'
);
```

### 5. Allow Users to Delete Their Own Unverified Documents

```sql
-- Policy: Users can delete their own unverified documents
CREATE POLICY "Users can delete own unverified documents"
ON public.user_documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id AND
  verification_status != 'VERIFIED'
);
```

---

## Admin/Service Role Policies

### Allow Service Role Full Access to Storage

```sql
-- Policy: Service role has full access to storage
CREATE POLICY "Service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Allow Service Role Full Access to user_documents

```sql
-- Policy: Service role has full access to user_documents
CREATE POLICY "Service role full access to user_documents"
ON public.user_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## Verification

After applying these policies, verify them with:

```sql
-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check user_documents policies
SELECT * FROM pg_policies WHERE tablename = 'user_documents' AND schemaname = 'public';
```

---

## Testing RLS Policies

### Test as Authenticated User

```sql
-- Set the user context (replace with actual user ID)
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to select documents (should only see own documents)
SELECT * FROM public.user_documents;

-- Try to select storage objects (should only see own files)
SELECT * FROM storage.objects WHERE bucket_id = 'documents';
```

### Reset Context

```sql
-- Reset to default
RESET request.jwt.claim.sub;
```

---

## Important Notes

1. **Folder Structure**: Files are stored as `{userId}/{folder}/{timestamp}-{filename}`
2. **Verification Status**: Users cannot delete or update documents with `VERIFIED` status
3. **Service Role**: Admin operations should use the service role key, not the anon key
4. **Bucket Configuration**: Ensure the `documents` bucket is created and configured properly
5. **User ID Mapping**: Ensure Supabase Auth user IDs match the `user_id` in `user_documents`

---

## Troubleshooting

### If users can't upload files:
- Check that the bucket exists and is named `documents`
- Verify the user is authenticated
- Check that the folder path starts with the user's ID

### If users can see other users' files:
- Verify RLS is enabled on both `storage.objects` and `user_documents`
- Check that policies are correctly filtering by `auth.uid()`

### If verified documents can be deleted:
- Ensure the deletion policy checks `verification_status != 'VERIFIED'`
- Verify the `user_documents` table has the correct status values
