-- Complete SQL script for setting up the recordings table in Supabase

-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS recordings;

-- Create the recordings table with all required columns
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT,
  audio_url TEXT,
  transcript TEXT,
  score INTEGER,
  ai_feedback JSONB,
  
  -- Add a constraint to check that the score is between 0 and 100
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 100)
);

-- Set up row-level security (RLS) policies
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to only see their own recordings
CREATE POLICY "Users can view their own recordings" 
  ON recordings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own recordings
CREATE POLICY "Users can insert their own recordings" 
  ON recordings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own recordings
CREATE POLICY "Users can update their own recordings" 
  ON recordings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own recordings
CREATE POLICY "Users can delete their own recordings" 
  ON recordings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS recordings_user_id_idx ON recordings(user_id);

-- Verify the structure of the recordings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recordings'
ORDER BY ordinal_position;
