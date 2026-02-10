/**
 * This script helps to check the RLS policies on the user_roles table.
 * 
 * Usage:
 * 1. Copy the generated SQL and run it in the Supabase SQL Editor
 * 2. Check the results to see if the RLS policies are properly set up
 */

// SQL to execute - this is the format that works with Supabase
const SQL = `
-- Check if RLS is enabled on the user_roles table
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM
  pg_tables
WHERE
  tablename = 'user_roles';

-- List all policies on the user_roles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'user_roles';

-- Create a policy to allow all users to read from the user_roles table
CREATE POLICY "Allow all users to read user_roles"
ON user_roles
FOR SELECT
USING (true);

-- Enable RLS on the user_roles table if it's not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'user_roles';
`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(SQL);
