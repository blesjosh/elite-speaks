# Supabase Bucket Setup Instructions

## Issue: Upload failing with authentication errors

The upload is failing because the bucket needs proper policies set up. Here's how to fix it:

## Option 1: Make bucket truly public for uploads (recommended for development)

1. Go to your Supabase Dashboard
2. Navigate to Storage > Policies
3. Create a new policy for the `recordings` bucket
4. Set up an INSERT policy:
   - Name: "Anyone can upload to recordings"
   - Policy: `true` (allows anyone to upload)
   - Operation: INSERT

## Option 2: Allow authenticated users only

1. Go to Storage > Policies
2. Create a new policy:
   - Name: "Authenticated users can upload"
   - Policy: `auth.role() = 'authenticated'`
   - Operation: INSERT

## Option 3: SQL commands to run in the SQL Editor

```sql
-- Allow anyone to upload to recordings bucket (public uploads)
CREATE POLICY "Anyone can upload to recordings" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'recordings');

-- Allow anyone to read from recordings bucket (public access)
CREATE POLICY "Anyone can view recordings" ON storage.objects
FOR SELECT USING (bucket_id = 'recordings');
```

## Current Error
The error suggests that authentication is required even for a public bucket. This is because uploads require explicit policies even for public buckets.

## Test the fix
After setting up the policies, try uploading a file again through the dashboard.
