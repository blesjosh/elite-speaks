-- Create the speaking_topics table
CREATE TABLE IF NOT EXISTS speaking_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'expired', 'drafted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for DATE NOT NULL, -- The date this topic becomes active
    expires_at DATE, -- Optional expiration date
    created_by UUID REFERENCES auth.users(id),
    is_generated BOOLEAN DEFAULT false, -- Flag for AI-generated topics
    source TEXT, -- Source of the topic (e.g., 'admin', 'news-api', 'user-suggestion')
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    tags TEXT[] -- Array of tags for categorizing topics
);

-- Create index for faster queries on active topics
CREATE INDEX IF NOT EXISTS idx_speaking_topics_scheduled_for ON speaking_topics(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_speaking_topics_status ON speaking_topics(status);

-- Function to get the current active topic
CREATE OR REPLACE FUNCTION get_active_topic()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    scheduled_for DATE,
    difficulty_level TEXT,
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.scheduled_for, 
        t.difficulty_level, 
        t.tags
    FROM speaking_topics t
    WHERE 
        t.status = 'active' 
        OR (
            t.status = 'scheduled' 
            AND t.scheduled_for <= CURRENT_DATE
            AND (t.expires_at IS NULL OR t.expires_at >= CURRENT_DATE)
        )
    ORDER BY t.scheduled_for DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update topic statuses
CREATE OR REPLACE FUNCTION update_topic_statuses()
RETURNS VOID AS $$
BEGIN
    -- Set scheduled topics to active if their scheduled date has arrived
    UPDATE speaking_topics
    SET status = 'active'
    WHERE 
        status = 'scheduled' 
        AND scheduled_for <= CURRENT_DATE
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE);
    
    -- Set active topics to expired if their expiration date has passed
    UPDATE speaking_topics
    SET status = 'expired'
    WHERE 
        status = 'active' 
        AND expires_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run update_topic_statuses() function daily
CREATE OR REPLACE FUNCTION trigger_update_topic_statuses()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_topic_statuses();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs when any topic is inserted or updated
DROP TRIGGER IF EXISTS topic_status_update_trigger ON speaking_topics;
CREATE TRIGGER topic_status_update_trigger
AFTER INSERT OR UPDATE ON speaking_topics
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_topic_statuses();

-- Add RLS policies
ALTER TABLE speaking_topics ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all topics
CREATE POLICY admin_all_topics_policy ON speaking_topics 
    USING (
        (SELECT is_admin FROM user_roles WHERE user_id = auth.uid()) = true
    );

-- Policy for users to view only active or scheduled topics
CREATE POLICY view_active_topics_policy ON speaking_topics 
    FOR SELECT
    USING (
        status IN ('active', 'scheduled') 
        AND scheduled_for <= CURRENT_DATE
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
    );

-- Create user_roles table if it doesn't exist (for admin role management)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can modify user_roles
CREATE POLICY admin_manage_roles_policy ON user_roles 
    USING (
        (SELECT is_admin FROM user_roles WHERE user_id = auth.uid()) = true
    );

-- Everyone can view their own role
CREATE POLICY view_own_role_policy ON user_roles 
    FOR SELECT
    USING (
        user_id = auth.uid()
    );
