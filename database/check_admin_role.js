/**
 * This script helps to check if the admin role is properly set up in Supabase.
 * 
 * Usage:
 * 1. Update the ADMIN_EMAIL below with the email of the admin user
 * 2. Copy the generated SQL and run it in the Supabase SQL Editor
 * 3. Check the results to see if the admin role is properly set up
 */

// Load environment variables from .env file
require('dotenv').config();

// Replace with your admin user's email
const ADMIN_EMAIL = 'knoop@x-filedist.de';

// Note: This script generates SQL to run in the Supabase SQL Editor
// The SQL should be executed in the SQL Editor at https://jyzoyfozkxukomylwrjd.supabase.co

// SQL to execute - this is the format that works with Supabase
const SQL = `
-- Check if the admin user exists in auth.users
SELECT 
  id, 
  email,
  'User exists in auth.users' as status
FROM 
  auth.users 
WHERE 
  email = '${ADMIN_EMAIL}';

-- Check if the admin user has a role in user_roles
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  'User has role in user_roles' as status
FROM 
  user_roles ur
JOIN 
  auth.users u ON ur.user_id = u.id
WHERE 
  u.email = '${ADMIN_EMAIL}';

-- If no results are returned from the second query, the admin role is not set up properly
`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(SQL);
