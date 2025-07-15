-- Script to create an admin user and set up the user_roles table

-- Create the user_roles table if it doesn't exist
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

-- Create a function to set up an initial admin user
CREATE OR REPLACE FUNCTION set_initial_admin(admin_email TEXT)
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user_id from the email
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    -- If user exists, make them an admin
    IF FOUND THEN
        -- Insert admin role if not exists
        INSERT INTO user_roles (user_id, is_admin)
        VALUES (user_id, true)
        ON CONFLICT (user_id) 
        DO UPDATE SET is_admin = true, updated_at = NOW();
        
        RAISE NOTICE 'User % has been set as an admin', admin_email;
    ELSE
        RAISE EXCEPTION 'User with email % not found', admin_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To make a user an admin, execute this function with their email:
-- SELECT set_initial_admin('admin@example.com');
