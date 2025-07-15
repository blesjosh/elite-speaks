-- Create function to get the current active topic
CREATE OR REPLACE FUNCTION get_active_topic()
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  scheduled_for TEXT,
  expires_at TEXT,
  difficulty_level TEXT,
  is_generated BOOLEAN,
  source TEXT,
  tags TEXT[],
  created_at TEXT
) AS $$
BEGIN
  -- First try to get an active topic
  RETURN QUERY
  SELECT 
    st.id::TEXT,
    st.title,
    st.description,
    st.status,
    st.scheduled_for::TEXT,
    st.expires_at::TEXT,
    st.difficulty_level,
    st.is_generated,
    st.source,
    st.tags,
    st.created_at::TEXT
  FROM speaking_topics st
  WHERE st.status = 'active'
    AND st.scheduled_for <= CURRENT_DATE
    AND (st.expires_at IS NULL OR st.expires_at >= CURRENT_DATE)
  ORDER BY st.scheduled_for DESC
  LIMIT 1;
  
  -- If no active topic found, try to get a scheduled topic for today
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      st.id::TEXT,
      st.title,
      st.description,
      st.status,
      st.scheduled_for::TEXT,
      st.expires_at::TEXT,
      st.difficulty_level,
      st.is_generated,
      st.source,
      st.tags,
      st.created_at::TEXT
    FROM speaking_topics st
    WHERE st.status = 'scheduled'
      AND st.scheduled_for = CURRENT_DATE
    ORDER BY st.scheduled_for DESC
    LIMIT 1;
  END IF;
  
  -- If still no topic found, get the most recent non-expired topic
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      st.id::TEXT,
      st.title,
      st.description,
      st.status,
      st.scheduled_for::TEXT,
      st.expires_at::TEXT,
      st.difficulty_level,
      st.is_generated,
      st.source,
      st.tags,
      st.created_at::TEXT
    FROM speaking_topics st
    WHERE (st.expires_at IS NULL OR st.expires_at >= CURRENT_DATE)
    ORDER BY st.scheduled_for DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_topic() TO authenticated;
