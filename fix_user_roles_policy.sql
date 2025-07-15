-- Fix infinite recursion in the user_roles policy
-- This script fixes the policy that's causing the infinite recursion error

-- First, drop the problematic policy
DROP POLICY IF EXISTS admin_manage_roles_policy ON user_roles;
DROP POLICY IF EXISTS view_own_role_policy ON user_roles;

-- Create a new policy that doesn't cause recursion
-- Allow everyone to view user_roles table (safer approach for development)
CREATE POLICY user_roles_select_policy ON user_roles
    FOR SELECT
    USING (true);

-- Allow users to view their own role
CREATE POLICY user_roles_select_own_policy ON user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Only authenticated users can do anything with their own role
CREATE POLICY user_roles_all_own_policy ON user_roles
    USING (user_id = auth.uid());

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
