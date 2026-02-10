/**
 * This script helps to fix the RLS policies for the auth.users table and customers table.
 * 
 * Usage:
 * 1. Copy the generated SQL and run it in the Supabase SQL Editor
 * 2. Check the results to see if the RLS policies are properly set up
 */

// Load environment variables from .env file
require('dotenv').config();

// Note: This script generates SQL to run in the Supabase SQL Editor
// The SQL should be executed in the SQL Editor at https://jyzoyfozkxukomylwrjd.supabase.co

// SQL to execute - this is the format that works with Supabase
const SQL = `
-- Check if RLS is enabled on the auth.users table
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM
  pg_tables
WHERE
  schemaname = 'auth' AND tablename = 'users';

-- Check if a policy already exists for reading auth.users
SELECT
  policyname
FROM
  pg_policies
WHERE
  schemaname = 'auth' AND tablename = 'users' AND cmd = 'SELECT';

-- Create a policy to allow all authenticated users to read from the auth.users table
-- Using a DO block to handle the case where the policy already exists
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Allow authenticated users to read users"
    ON auth.users
    FOR SELECT
    TO authenticated
    USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Allow authenticated users to read users" already exists on auth.users table';
  END;
END $$;

-- List all policies on the auth.users table
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
  schemaname = 'auth' AND tablename = 'users';

-- Check if there's a policy for admins to insert into the customers table
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
  tablename = 'customers' AND cmd = 'INSERT';

-- Create a policy to allow admins to insert into the customers table
-- Using a DO block to handle the case where the policy already exists
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Allow admins to insert customers"
    ON customers
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    ));
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Allow admins to insert customers" already exists on customers table';
  END;
END $$;

-- List all policies on the customers table
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
  tablename = 'customers';
`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(SQL);
