# How to Fix Database Issues

If you're encountering errors related to missing columns or database structure, follow these steps to fix the issues:

## Option 1: Non-destructive Database Update (Recommended)

This option keeps all your existing data and just adds missing columns:

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the entire content from the `safe_recordings_setup.sql` file
6. Click "Run" to execute the script
7. You should see notices about which columns were added

## Option 2: Clean Setup (Removes Existing Data)

Only use this option if you want to start fresh and don't mind losing existing data:

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the entire content from the `recordings_table_setup.sql` file
6. Click "Run" to execute the script

## Optional: Create Helper Function

To help with database diagnostics, you can create a helper function:

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the entire content from the `create_column_function.sql` file
6. Click "Run" to execute the script

## Verifying Your Setup

After running either SQL script, you can verify that your table has all required columns:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recordings'
ORDER BY ordinal_position;
```

You should see the following columns:
- id (uuid)
- created_at (timestamp with time zone)
- user_id (uuid)
- topic (text)
- audio_url (text)
- transcript (text)
- score (integer)
- ai_feedback (jsonb)

## Common Errors

1. **"Column 'audio_url' does not exist"**:
   - This means the database table is missing columns. Run the SQL setup script.

2. **"Database table 'recordings' not found"**:
   - The table doesn't exist yet. Run the SQL setup script.

3. **"Column 'ai_feedback' does not exist"**:
   - Run the SQL setup script to add the missing column.
