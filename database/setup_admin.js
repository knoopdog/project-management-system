/**
 * This script helps to set up the initial admin user in Supabase.
 * 
 * Usage:
 * 1. Create a user in Supabase Auth (via sign-up or admin panel)
 * 2. Update the ADMIN_EMAIL below with the email of the user
 * 3. Copy the generated SQL and run it in the Supabase SQL Editor
 */

// Load environment variables from .env file
require('dotenv').config();

// Get the admin email from the .env file or use a default
const ADMIN_EMAIL = 'knoop@x-filedist.de';

// Note: This script generates SQL to run in the Supabase SQL Editor
// The SQL should be executed in the SQL Editor at https://jyzoyfozkxukomylwrjd.supabase.co

// SQL to execute - this is the format that works with Supabase
const SQL = `
-- Replace with your admin user's email
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_user_id FROM auth.users WHERE email = '${ADMIN_EMAIL}';
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users', '${ADMIN_EMAIL}';
  END IF;

  -- Check if the user already has a role
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id) THEN
    RAISE NOTICE 'User % already has a role assigned', '${ADMIN_EMAIL}';
  ELSE
    -- Insert admin role for the user
    INSERT INTO user_roles (user_id, role) VALUES (admin_user_id, 'admin');
    RAISE NOTICE 'Admin role assigned to user %', '${ADMIN_EMAIL}';
  END IF;
END $$;
`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(SQL);
