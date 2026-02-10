# Troubleshooting Guide

This guide provides solutions for common issues you might encounter when working with the project management application.

## "Failed to fetch" Error

If you see a "Failed to fetch" error when trying to create a customer or perform other operations, it could be due to several issues:

### 1. Check Supabase Connection

First, test your connection to Supabase:

```bash
node database/test_connection.js
```

If the connection is successful, you'll see:
- "Connection successful!"
- Information about the number of customers and user roles

If the connection fails, check:
- Your internet connection
- The Supabase URL and anon key in the `.env` file
- The Supabase service status

### 2. Check Database Setup

If the connection is successful but you see "Number of customers: 0" and "Number of user roles: 0", your database might not be properly set up:

1. Run the schema script:
   ```bash
   # Copy the SQL from database/schema.sql
   # Paste it into the Supabase SQL Editor and run it
   ```

2. Set up the admin user:
   ```bash
   node database/setup_admin.js
   # Copy the generated SQL and run it in the Supabase SQL Editor
   ```

3. Fix RLS policies:
   ```bash
   node database/fix_rls_policies.js
   # Copy the generated SQL and run it in the Supabase SQL Editor
   ```

### 3. Check Admin Role

If you're trying to create a customer but getting a "Failed to fetch" error, check if your user has the admin role:

```bash
node database/check_admin_role.js
# Copy the generated SQL and run it in the Supabase SQL Editor
```

If your user doesn't have the admin role, fix it:

```bash
node database/fix_admin_role.js
# Copy the generated SQL and run it in the Supabase SQL Editor
```

### 4. Check Browser Console

Open your browser's developer tools (F12) and check the console for more detailed error messages. Look for:
- Network errors
- CORS issues
- Authentication errors

### 5. Check Supabase Dashboard

Log in to your Supabase dashboard and check:
- The SQL Editor for any errors in your queries
- The Authentication section for your user
- The Table Editor to see if your tables are properly set up
- The Policies section to see if your RLS policies are properly set up

## Other Common Issues

### "Permission denied for table users"

This error occurs when the RLS policy for the auth.users table is not set up correctly. To fix it:

```bash
node database/fix_rls_policies.js
# Copy the generated SQL and run it in the Supabase SQL Editor
```

### "New row violates row-level security policy for table customers"

This error occurs when trying to create a customer without proper admin permissions. To fix it:

1. Fix RLS policies:
   ```bash
   node database/fix_rls_policies.js
   # Copy the generated SQL and run it in the Supabase SQL Editor
   ```

2. Fix admin role:
   ```bash
   node database/fix_admin_role.js
   # Copy the generated SQL and run it in the Supabase SQL Editor
   ```

### "User not found" or "User has no role"

This error occurs when your user is not properly set up in the database. To fix it:

```bash
node database/setup_admin.js
# Copy the generated SQL and run it in the Supabase SQL Editor
```

## Still Having Issues?

If you're still experiencing problems after trying these solutions, try:

1. Restarting the application:
   ```bash
   npm start
   ```

2. Clearing your browser cache and cookies

3. Checking for any error messages in the terminal where you're running the application

4. Checking the Supabase logs in the dashboard
