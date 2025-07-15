# Setting up Supabase Storage for Audio Recordings

To set up storage for audio recordings in your Supabase project, follow these steps:

## 1. Create a new bucket

1. Go to your Supabase project dashboard
2. Navigate to "Storage" in the left sidebar
3. Click "Create bucket"
4. Name it `recordings` (make sure you use this exact name)
5. Select "Public" for the bucket type to allow easier access to audio files

## 2. Set up bucket policies

After creating the bucket, you need to configure access policies:

1. Click on the newly created `recordings` bucket
2. Go to the "Policies" tab
3. Create the following policies:

### Read access policy

```sql
-- Allow public read access to all files
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recordings');
```

### Insert access policy

```sql
-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload their own recordings"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

### Update/Delete access policy

```sql
-- Allow users to update/delete their own recordings
CREATE POLICY "Users can manage their own recordings"
ON storage.objects
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

## 3. Configure CORS

1. Navigate to "Storage" in the left sidebar
2. Click on "Policies" tab at the top
3. Scroll down to "CORS Configuration"
4. Add the following CORS configuration:

```json
[
  {
    "origin": "*",
    "methods": ["GET", "HEAD"],
    "headers": ["Range", "Content-Type", "Accept", "Content-Length", "Authorization"]
  }
]
```

This will allow audio files to be played from any origin and support proper audio streaming.

## 4. Fix the Audio URL Format

When retrieving audio URLs from Supabase, make sure you're using the public URL format:

```typescript
// Correct way to get a public URL for an audio file
const { data: publicUrl } = supabase
  .storage
  .from('recordings')
  .getPublicUrl('recordings/user-id/filename.mp3');

// Use this URL format for audio playback
const audioUrl = publicUrl?.publicUrl;
```

## Storage Structure

The audio files will be stored with the following path structure:
`recordings/{user_id}/{timestamp}-{filename}`

For example:
`recordings/550e8400-e29b-41d4-a716-446655440000/1626789123456-recording.mp3`

This structure ensures:
- Recordings are organized by user
- Filenames are unique (with timestamp)
- Row-level security can be applied using the folder structure

## Troubleshooting Audio Playback Issues

If you encounter "media resource not suitable" errors:

1. **Check the storage bucket accessibility**:
   - Make sure the bucket is set to "Public"
   - Verify CORS is properly configured

2. **Verify the audio URL format**:
   - Use `getPublicUrl()` instead of directly accessing file paths
   - Check the browser console to see the actual URL being used

3. **Test the URL directly**:
   - Copy the audio URL from the console
   - Paste it into a new browser tab to see if it loads directly

4. **Check file types**:
   - Make sure you're saving files with proper audio extensions (.mp3, .wav, etc.)
