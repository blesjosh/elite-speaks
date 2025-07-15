-- First check if the user_roles table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    RAISE NOTICE 'The user_roles table does not exist. Creating it...';
    
    -- Create the user_roles table
    CREATE TABLE user_roles (
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
  END IF;
END $$;

-- Function to check and set an admin user
CREATE OR REPLACE FUNCTION check_and_set_admin(admin_email TEXT)
RETURNS TABLE (
  email TEXT,
  user_id UUID,
  is_admin BOOLEAN,
  status TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Check if the user exists
  SELECT au.id, EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) 
  INTO v_user_id, v_exists 
  FROM auth.users au
  WHERE au.email = admin_email;
  
  -- If user doesn't exist, return with error
  IF NOT v_exists THEN
    RETURN QUERY SELECT 
      admin_email, 
      NULL::UUID, 
      FALSE, 
      'ERROR: User not found' AS status;
    RETURN;
  END IF;
  
  -- Check if user already has an entry in user_roles
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id) THEN
    -- User exists in user_roles, check if they're an admin
    IF (SELECT is_admin FROM user_roles WHERE user_id = v_user_id) THEN
      -- User is already an admin
      RETURN QUERY SELECT 
        admin_email, 
        v_user_id, 
        TRUE, 
        'User is already an admin' AS status;
    ELSE
      -- Update user to be an admin
      UPDATE user_roles 
      SET is_admin = TRUE, updated_at = NOW() 
      WHERE user_id = v_user_id;
      
      RETURN QUERY SELECT 
        admin_email, 
        v_user_id, 
        TRUE, 
        'User updated to admin' AS status;
    END IF;
  ELSE
    -- User doesn't have an entry in user_roles, create one
    INSERT INTO user_roles (user_id, is_admin)
    VALUES (v_user_id, TRUE);
    
    RETURN QUERY SELECT 
      admin_email, 
      v_user_id, 
      TRUE, 
      'Admin role assigned successfully' AS status;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To check and set a user as admin, run:
-- SELECT * FROM check_and_set_admin('your-email@example.com');
