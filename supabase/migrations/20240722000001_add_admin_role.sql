-- Create admin flag in users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Enable realtime for users table
alter publication supabase_realtime add table users;
