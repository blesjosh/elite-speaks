-- SQL script to fix the specific issue with the recordings table
-- This script diagnoses and fixes problems with the recordings table

-- First, let's see if the table exists and what columns it has
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'recordings'
) as table_exists;

-- Check what columns actually exist in the recordings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recordings'
ORDER BY ordinal_position;

-- Try to insert a test record to see if it works
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user ID (you can replace this with your actual user ID)
  SELECT auth.uid() INTO current_user_id;
  
  -- Log what we're doing
  RAISE NOTICE 'Attempting to insert test record for user %', current_user_id;
  
  -- Insert a test record
  INSERT INTO recordings (user_id, audio_url, transcript, score, ai_feedback)
  VALUES (
    current_user_id,
    'https://example.com/test-audio.mp3',
    'This is a test transcript from SQL',
    90,
    '{"confidence": "high", "fillerWords": {"count": 1, "words": ["um"]}, "grammarFeedback": "Good structure"}'::jsonb
  );
  
  RAISE NOTICE 'Test record inserted successfully';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error inserting test record: %', SQLERRM;
    
    -- Try to diagnose the issue
    RAISE NOTICE 'Attempting to diagnose the problem...';
    
    -- If the table doesn't exist, create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recordings') THEN
      RAISE NOTICE 'The recordings table does not exist. Creating it now...';
      
      CREATE TABLE recordings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_id UUID NOT NULL,
        audio_url TEXT,
        transcript TEXT,
        score INTEGER,
        ai_feedback JSONB
      );
      
      RAISE NOTICE 'The recordings table has been created.';
    ELSE
      -- If the table exists, check for missing columns and add them
      RAISE NOTICE 'The recordings table exists. Checking columns...';
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recordings' AND column_name = 'audio_url') THEN
        ALTER TABLE recordings ADD COLUMN audio_url TEXT;
        RAISE NOTICE 'Added audio_url column';
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recordings' AND column_name = 'transcript') THEN
        ALTER TABLE recordings ADD COLUMN transcript TEXT;
        RAISE NOTICE 'Added transcript column';
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recordings' AND column_name = 'score') THEN
        ALTER TABLE recordings ADD COLUMN score INTEGER;
        RAISE NOTICE 'Added score column';
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recordings' AND column_name = 'ai_feedback') THEN
        ALTER TABLE recordings ADD COLUMN ai_feedback JSONB;
        RAISE NOTICE 'Added ai_feedback column';
      END IF;
      
      -- Fix any constraints or references if needed
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recordings' AND column_name = 'user_id') THEN
        BEGIN
          -- Try to add the foreign key constraint if it doesn't exist
          ALTER TABLE recordings 
          ADD CONSTRAINT recordings_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES auth.users(id) ON DELETE CASCADE;
          
          RAISE NOTICE 'Added foreign key constraint for user_id';
        EXCEPTION
          WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key constraint already exists';
          WHEN others THEN
            RAISE NOTICE 'Error adding foreign key constraint: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- Try the insert again
    BEGIN
      INSERT INTO recordings (user_id, audio_url, transcript, score, ai_feedback)
      VALUES (
        current_user_id,
        'https://example.com/test-audio-retry.mp3',
        'This is a retry test transcript from SQL',
        85,
        '{"confidence": "medium", "fillerWords": {"count": 2, "words": ["um", "like"]}, "grammarFeedback": "Good overall"}'::jsonb
      );
      
      RAISE NOTICE 'Retry insert successful';
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Retry insert failed: %', SQLERRM;
    END;
END $$;
