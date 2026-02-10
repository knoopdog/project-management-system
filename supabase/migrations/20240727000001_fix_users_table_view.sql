-- Ensure the users table has the correct structure and permissions
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT false;

-- Make sure RLS is disabled for the users table to allow admin access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Ensure the admin user exists and has admin privileges (without trying to create a duplicate auth user)
-- Update any existing user with this email to have admin privileges
UPDATE public.users
SET is_admin = true
WHERE email = 'hello@karlknoop.com';

-- Create a view to make it easier to see users with their company information
CREATE OR REPLACE VIEW user_company_view AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.is_admin,
  u.is_client,
  u.company_id,
  c.name as company_name
FROM 
  public.users u
LEFT JOIN 
  public.companies c ON u.company_id = c.id;
