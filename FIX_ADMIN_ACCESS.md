# Fixing Admin Access in Elite Speaks

## The Problem

You're seeing "infinite recursion detected in policy for relation 'user_roles'" errors in the console. This is happening because:

1. The RLS (Row Level Security) policies on the `user_roles` table are recursively checking themselves
2. When checking if a user is an admin, it tries to query the `user_roles` table
3. This triggers the policy check again, causing an infinite loop

## Solution 1: Use the Fix Admin Access Tool

The simplest solution is to use the "Fix Admin Access Tool" on your dashboard:

1. Go to the dashboard page
2. Find the "Fix Admin Access Tool" in the debug section
3. Click the "Fix Admin Access Now" button
4. Wait for the page to reload automatically

This tool will:
- Check if you have a record in the `user_roles` table
- Create one with `is_admin = true` if you don't
- Update your existing record to `is_admin = true` if you do
- Reload the page to refresh your session

## Solution 2: Fix the RLS Policies in Supabase

If you prefer to fix the root cause, you need to update the RLS policies:

1. Go to your Supabase project
2. Open the SQL Editor
3. Run the following SQL:

```sql
-- Run this SQL in the Supabase SQL Editor

-- First, drop the problematic policy
DROP POLICY IF EXISTS admin_manage_roles_policy ON user_roles;
DROP POLICY IF EXISTS view_own_role_policy ON user_roles;

-- Create a new policy that doesn't cause recursion
-- Allow everyone to view user_roles table (safer approach for development)
CREATE POLICY user_roles_select_policy ON user_roles
    FOR SELECT
    USING (true);

-- Allow users to view their own role
CREATE POLICY user_roles_select_own_policy ON user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Only authenticated users can do anything with their own role
CREATE POLICY user_roles_all_own_policy ON user_roles
    USING (user_id = auth.uid());
```

## Solution 3: For Development Only - Disable RLS

For development environments only, you can temporarily disable RLS on the `user_roles` table:

```sql
-- WARNING: Only do this in development, never in production
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
```

Remember to re-enable it before deploying to production:

```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

## After Fixing the Policies

After applying any of these solutions:

1. Log out and log back in
2. Check if the admin section now appears in the sidebar
3. Try accessing the admin dashboard at `/dashboard/admin/topics`

If you're still having issues, try clearing your browser cache and cookies for the site.
