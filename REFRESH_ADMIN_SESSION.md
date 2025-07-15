# How to Refresh Your Admin Session

If you've been made an admin but don't see the admin dashboard, follow these steps:

## Step 1: Verify Admin Status

1. Go to your dashboard
2. Check the "Debug Information" section
3. Look at "Auth Context isAdmin" and "Direct DB Check" 

If "Direct DB Check" says "Yes" but "Auth Context isAdmin" says "No", you need to refresh your session.

## Step 2: Refresh Your Session

There are multiple ways to refresh your session:

### Method 1: Click Refresh Button
1. On the dashboard page, find the "Refresh Admin Status" button
2. Click this button
3. The admin status should update immediately

### Method 2: Sign Out and Back In
1. Click "Sign out" in the sidebar
2. Log back in with your credentials
3. Your admin status should now be recognized

### Method 3: Clear Browser Cache
1. Open your browser settings
2. Clear cookies and site data for the Elite Speaks site
3. Log back in to the site

## Step 3: Verify Admin Features

Once your session is refreshed:
1. Check if the "Admin Area" section appears in the sidebar
2. You should see a "Manage Topics" link in this section
3. Clicking this link should take you to the admin dashboard

## Still Having Problems?

If you've tried all these steps and still can't access the admin dashboard:

1. Use the "Fix Admin Access Now" button in the debug section of your dashboard
2. This tool will directly set your admin status without going through policies
3. The page will reload automatically after the fix is applied

If you see errors related to "infinite recursion" in the console:

1. Check the `FIX_ADMIN_ACCESS.md` document for detailed solutions
2. Use the SQL scripts provided there to fix the RLS policy issues
3. The most common issue is recursive policies on the user_roles table

As a last resort, you can still run the setup script:

```sql
SELECT * FROM check_and_set_admin('your-email@example.com');
```

Remember to replace 'your-email@example.com' with your actual email address.
