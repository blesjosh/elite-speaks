# Admin Setup for Elite Speaks

This guide explains how to set up an admin user in Elite Speaks.

## Background

Elite Speaks uses a role-based permission system. Admin users have access to:
- Topic management in the admin dashboard
- User role management
- Other admin-only features

## Setting Up an Admin User

### Option 1: Using the setup script (Recommended)

1. Make sure you have PostgreSQL client installed (for the `psql` command)
2. Run the setup script:

```bash
./setup_admin.sh your-email@example.com
```

This script will:
- Check if the user exists
- Add or update their admin status
- Show the result of the operation

### Option 2: Using Supabase SQL Editor

If you prefer to use the Supabase SQL Editor:

1. Go to your Supabase project
2. Open the SQL Editor
3. Copy the content from `check_and_set_admin.sql`
4. Run the SQL code
5. Then execute:

```sql
SELECT * FROM check_and_set_admin('your-email@example.com')
```

## Verifying Admin Status

After setting up an admin user:

1. Log out and log back in to Elite Speaks
2. Navigate to `/dashboard`
3. You should see an "Admin" section in the navigation
4. Click on it to access the admin dashboard

## Common Issues

### Admin Status Not Recognized

If your admin status is not being recognized:

1. Check the SQL output to verify the admin role was set
2. Log out and log back in to refresh your session
3. Make sure the `user_roles` table exists with proper data
4. Check browser console for any errors related to admin status checking

### Access Denied to Admin Pages

If you still can't access admin pages:

1. Verify your email address matches exactly what's in your account
2. Check for typos or case sensitivity issues
3. Re-run the setup script to ensure admin status is properly set

## Database Schema

The admin system uses the following table:

```sql
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Each user has at most one record in this table.
