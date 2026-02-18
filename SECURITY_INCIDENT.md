# Security Incident Report: Supabase Credential Exposure

## ⚠️ Summary of Exposure
During a code audit triggered by a GitGuardian warning, several sensitive credentials were found to be exposed in the repository's current state and Git history.

### Exposed Secrets:
1.  **`SUPABASE_SERVICE_ROLE_KEY`**: Found hardcoded in `.env.local.example` and present in historical commits. This is a highly sensitive key that bypasses all Row Level Security (RLS).
2.  **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Found hardcoded in `.env.local.example` and historical commits.
3.  **Supabase Project URL**: Exposed in configuration files.

## 🛠️ Actions Taken
- [x] **Scrubbed `.env.local.example`**: Replaced all hardcoded keys with placeholders.
- [x] **Verified current codebase**: Scanned for any other hardcoded secrets.
- [x] **Identified leak source**: Traced the leak to specific commits.
- [x] **Rotated Keys**: New secure keys provided by the user have been updated in `.env.local` and `.env`.

## 🚨 Required Recovery Steps (UPDATE)

### 1. Rotate Keys (COMPLETED)
The `anon` and `service_role` keys have been rotated and the project is now updated.

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project -> **Settings** -> **API**.
3.  In the **Project API keys** section:
    -   Click **Rotate key** for both the `anon` and `service_role` keys.
4.  Update your local `.env.local` with the new keys.

### 2. Clean Git History (Recommended)
Even though the keys are removed from the current code, they still exist in the Git history. To remove them permanently:
1.  Install [git-filter-repo](https://github.com/newren/git-filter-repo).
2.  Run the following commands (replace `<KEY_STRING>` with the actual leaked keys):
    ```bash
    git filter-repo --replace-text <(echo "<OLD_ANON_KEY>==>REDACTED")
    git filter-repo --replace-text <(echo "<OLD_SERVICE_ROLE_KEY>==>REDACTED")
    ```
3.  **Warning**: This will rewrite your Git history. All collaborators will need to re-clone the repository.

### 3. Change Database Passwords
As a precaution, if you suspect your database password was also in `.env`, please change it in the Supabase Database settings.

## ✅ Next Steps
Once you have rotated the keys, your project will be secure again. Always ensure `.env.local` is listed in your `.gitignore` and never include real keys in `.example` files.
