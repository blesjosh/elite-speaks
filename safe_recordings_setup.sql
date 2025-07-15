-- Non-destructive SQL script to ensure the recordings table has all required columns
-- This script only adds columns if they don't already exist and won't drop any existing data

-- Enable the pgcrypto extension for UUID generation if it's not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the recordings table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add topic column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recordings' AND column_name = 'topic'
    ) THEN
        ALTER TABLE recordings ADD COLUMN topic TEXT;
        RAISE NOTICE 'Added topic column to recordings table';
    END IF;

    -- Add audio_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recordings' AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE recordings ADD COLUMN audio_url TEXT;
        RAISE NOTICE 'Added audio_url column to recordings table';
    END IF;

    -- Add transcript column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recordings' AND column_name = 'transcript'
    ) THEN
        ALTER TABLE recordings ADD COLUMN transcript TEXT;
        RAISE NOTICE 'Added transcript column to recordings table';
    END IF;

    -- Add score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recordings' AND column_name = 'score'
    ) THEN
        ALTER TABLE recordings ADD COLUMN score INTEGER;
        RAISE NOTICE 'Added score column to recordings table';
    END IF;

    -- Add ai_feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recordings' AND column_name = 'ai_feedback'
    ) THEN
        ALTER TABLE recordings ADD COLUMN ai_feedback JSONB;
        RAISE NOTICE 'Added ai_feedback column to recordings table';
    END IF;
END $$;

-- Add score range constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'score_range' AND conrelid = 'recordings'::regclass
    ) THEN
        ALTER TABLE recordings 
        ADD CONSTRAINT score_range CHECK (score >= 0 AND score <= 100);
        RAISE NOTICE 'Added score_range constraint to recordings table';
    END IF;
EXCEPTION
    -- If the constraint already exists or the table doesn't exist yet
    WHEN others THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Enable row-level security if not already enabled
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Create policies (will replace if they exist)
DO $$
BEGIN
    -- Drop existing policies first to avoid errors
    DROP POLICY IF EXISTS "Users can view their own recordings" ON recordings;
    DROP POLICY IF EXISTS "Users can insert their own recordings" ON recordings;
    DROP POLICY IF EXISTS "Users can update their own recordings" ON recordings;
    DROP POLICY IF EXISTS "Users can delete their own recordings" ON recordings;
    
    -- Create the policies
    CREATE POLICY "Users can view their own recordings" 
      ON recordings 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own recordings" 
      ON recordings 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own recordings" 
      ON recordings 
      FOR UPDATE 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own recordings" 
      ON recordings 
      FOR DELETE 
      USING (auth.uid() = user_id);
      
    RAISE NOTICE 'Created or updated RLS policies for recordings table';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error setting up policies: %', SQLERRM;
END $$;

-- Create an index on user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS recordings_user_id_idx ON recordings(user_id);

-- Verify the structure of the recordings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recordings'
ORDER BY ordinal_position;
