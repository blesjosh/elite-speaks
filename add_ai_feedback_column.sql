-- Add the ai_feedback column to the recordings table if it doesn't exist

DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'recordings' 
        AND column_name = 'ai_feedback'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE recordings 
        ADD COLUMN ai_feedback JSONB;
        
        RAISE NOTICE 'Added ai_feedback column to recordings table';
    ELSE
        RAISE NOTICE 'ai_feedback column already exists in recordings table';
    END IF;
END $$;

-- Verify the structure of the recordings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recordings'
ORDER BY ordinal_position;
