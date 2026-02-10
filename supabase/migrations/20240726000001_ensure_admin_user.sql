-- Ensure the user with email hello@karlknoop.com has admin privileges
UPDATE users
SET is_admin = true
WHERE email = 'hello@karlknoop.com';
