-- Make specific user an admin
UPDATE users
SET is_admin = true
WHERE email = 'hello@karlknoop.com';
