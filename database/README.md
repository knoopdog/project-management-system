# Database Setup and Troubleshooting

This directory contains scripts for setting up and troubleshooting the Supabase database for the project management application.

## Schema

The database schema is defined in two files:

1. `schema.sql` - The original schema file that creates all tables and policies.
2. `schema_safe.sql` - A safer version that uses `IF NOT EXISTS` for all table creations and checks for existing policies before creating them. Use this file if you're getting errors like "relation already exists".

Both files include tables for:

- Customers
- Projects
- Tasks
- Subtasks
- Time entries
- Comments
- User roles

## Row Level Security (RLS) Policies

The application uses Supabase's Row Level Security (RLS) to control access to data. There are two types of users:

1. **Admins**: Can see and modify all data
2. **Customers**: Can only see and modify their own data

## Common Issues and Fixes

### Permission Denied for Table "users"

If you see an error like "permission denied for table users", it means the RLS policy for the auth.users table is not set up correctly. To fix this:

1. Run the `fix_rls_policies.js` script to generate the SQL:
   ```
   node database/fix_rls_policies.js
   ```

2. Copy the generated SQL and run it in the Supabase SQL Editor at https://jyzoyfozkxukomylwrjd.supabase.co.

   Note: The script now handles the case where policies already exist, so you won't get errors if you run it multiple times.

This will create a policy that allows all authenticated users to read from the auth.users table.

### Row-Level Security Policy Violation for Table "customers"

If you see an error like "new row violates row-level security policy for table customers", it means the RLS policy for the customers table is not allowing the insert operation. This could be due to two issues:

1. Missing RLS policy for the customers table:
   ```
   node database/fix_rls_policies.js
   ```
   Copy the generated SQL and run it in the Supabase SQL Editor.

2. Missing admin role for your user:
   ```
   node database/check_admin_role.js
   ```
   Copy the generated SQL and run it in the Supabase SQL Editor to check if your user has the admin role.

   If your user doesn't have the admin role, run:
   ```
   node database/fix_admin_role.js
   ```
   Copy the generated SQL and run it in the Supabase SQL Editor to assign the admin role to your user.

After running both scripts, you should be able to insert into the customers table.

## Other Scripts

- `setup_admin.js`: Sets up an admin user
- `create_customer.js`: Creates a new customer
- `check_admin_role.js`: Checks if a user has the admin role
- `fix_admin_role.js`: Fixes the admin role for a user
- `check_rls_policies.js`: Checks the RLS policies on the user_roles table
- `email_notifications.js`: Sends email notifications for new comments
- `test_connection.js`: Tests the connection to Supabase

## Testing the Supabase Connection

If you're experiencing issues with Supabase, you can test the connection using the `test_connection.js` script:

```
node database/test_connection.js
```

This script will:
1. Test the connection to Supabase
2. Check if the Supabase URL and anon key are properly set
3. Try to query the customers and user_roles tables

If the script runs successfully but shows "Number of customers: 0" and "Number of user roles: 0", it means that your database is empty. You'll need to:

1. Create an admin user:
   ```
   node database/setup_admin.js
   ```
   Copy the generated SQL and run it in the Supabase SQL Editor.

2. Assign the admin role to your user:
   ```
   node database/fix_admin_role.js
   ```
   Copy the generated SQL and run it in the Supabase SQL Editor.
