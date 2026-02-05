# Supabase RLS Policies for Applications

This document contains the SQL statements needed to set up Row Level Security policies for the applications system.

## Prerequisites

1. Ensure your database schema has the `applications` and `application_history` tables
2. Run these SQL commands in the Supabase SQL Editor
3. Verify Supabase Auth is properly configured

---

## Applications Table Policies

### 1. Enable RLS on Applications Table

```sql
-- Enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
```

### 2. Users Can View Their Own Applications

```sql
-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 3. Users Can Create Applications

```sql
-- Policy: Users can create applications
CREATE POLICY "Users can create applications"
ON applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 4. Users Can Update DRAFT Applications Only

```sql
-- Policy: Users can update draft applications
CREATE POLICY "Users can update draft applications"
ON applications FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND
  status = 'DRAFT'
)
WITH CHECK (
  auth.uid() = user_id AND
  status IN ('DRAFT', 'SUBMITTED')
);
```

### 5. Users Cannot Delete Applications

```sql
-- Policy: Users cannot delete applications
-- Applications should be archived, not deleted
-- Only service role can delete
```

---

## Application History Table Policies

### 1. Enable RLS on Application History Table

```sql
-- Enable RLS on application_history table
ALTER TABLE application_history ENABLE ROW LEVEL SECURITY;
```

### 2. Users Can View History of Their Own Applications

```sql
-- Policy: Users can view history of their own applications
CREATE POLICY "Users can view own application history"
ON application_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_history.application_id
    AND applications.user_id = auth.uid()
  )
);
```

### 3. Only Service Role Can Insert History

```sql
-- Policy: Only service role can insert history
-- History is created by the system, not by users
CREATE POLICY "Service role can insert history"
ON application_history FOR INSERT
TO service_role
WITH CHECK (true);
```

---

## Application Documents Table Policies

### 1. Enable RLS on Application Documents Table

```sql
-- Enable RLS on application_documents table
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
```

### 2. Users Can View Documents Linked to Their Applications

```sql
-- Policy: Users can view documents linked to their applications
CREATE POLICY "Users can view own application documents"
ON application_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_documents.application_id
    AND applications.user_id = auth.uid()
  )
);
```

### 3. Users Can Link Documents to Their DRAFT Applications

```sql
-- Policy: Users can link documents to draft applications
CREATE POLICY "Users can link documents to draft applications"
ON application_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_documents.application_id
    AND applications.user_id = auth.uid()
    AND applications.status = 'DRAFT'
  ) AND
  EXISTS (
    SELECT 1 FROM user_documents
    WHERE user_documents.id = application_documents.user_document_id
    AND user_documents.user_id = auth.uid()
  )
);
```

### 4. Users Can Unlink Documents from DRAFT Applications

```sql
-- Policy: Users can unlink documents from draft applications
CREATE POLICY "Users can unlink documents from draft applications"
ON application_documents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_documents.application_id
    AND applications.user_id = auth.uid()
    AND applications.status = 'DRAFT'
  )
);
```

---

## Service Role Policies

### Applications Table - Service Role Full Access

```sql
-- Policy: Service role has full access to applications
CREATE POLICY "Service role full access to applications"
ON applications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Application History - Service Role Full Access

```sql
-- Policy: Service role has full access to application history
CREATE POLICY "Service role full access to application history"
ON application_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Application Documents - Service Role Full Access

```sql
-- Policy: Service role has full access to application documents
CREATE POLICY "Service role full access to application documents"
ON application_documents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## Verification

After applying these policies, verify them with:

```sql
-- Check applications policies
SELECT * FROM pg_policies WHERE tablename = 'applications' AND schemaname = 'public';

-- Check application_history policies
SELECT * FROM pg_policies WHERE tablename = 'application_history' AND schemaname = 'public';

-- Check application_documents policies
SELECT * FROM pg_policies WHERE tablename = 'application_documents' AND schemaname = 'public';
```

---

## Testing RLS Policies

### Test as Authenticated User

```sql
-- Set the user context (replace with actual user ID)
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to select applications (should only see own applications)
SELECT * FROM applications;

-- Try to update a draft application (should succeed)
UPDATE applications SET form_data = '{}' WHERE id = 'app-id' AND status = 'DRAFT';

-- Try to update a submitted application (should fail)
UPDATE applications SET form_data = '{}' WHERE id = 'app-id' AND status = 'SUBMITTED';

-- Try to view application history (should only see own)
SELECT * FROM application_history;
```

### Reset Context

```sql
-- Reset to default
RESET request.jwt.claim.sub;
```

---

## Important Notes

1. **Draft Protection**: Users can only edit applications with `DRAFT` status
2. **Ownership Verification**: All policies verify `user_id = auth.uid()`
3. **History Immutability**: Only service role can create history records
4. **Document Linking**: Users can only link their own documents to their own draft applications
5. **No Deletion**: Users cannot delete applications (use status changes instead)

---

## Troubleshooting

### If users can't view their applications:
- Verify RLS is enabled on the `applications` table
- Check that the user is authenticated
- Verify `user_id` matches `auth.uid()`

### If users can't update draft applications:
- Ensure the application status is `DRAFT`
- Verify ownership (`user_id = auth.uid()`)
- Check that the policy allows the status transition

### If document linking fails:
- Verify both application and document belong to the user
- Ensure application status is `DRAFT`
- Check that the document exists in `user_documents`
