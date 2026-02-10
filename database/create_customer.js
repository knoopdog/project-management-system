/**
 * This script helps to create a customer user in Supabase.
 * 
 * Usage:
 * 1. Update the customer details below
 * 2. Copy the generated SQL and run it in the Supabase SQL Editor
 * 3. The script will create a customer record and assign the customer role to the user
 */

// Load environment variables from .env file
require('dotenv').config();

// Note: This script generates SQL to run in the Supabase SQL Editor
// The SQL should be executed in the SQL Editor at https://jyzoyfozkxukomylwrjd.supabase.co

// Replace with your customer details
const CUSTOMER = {
  email: 'customer@example.com',
  password: 'securepassword123', // This will be used to create the auth user
  company_name: 'Example Company',
  first_name: 'John',
  last_name: 'Doe',
  address: '123 Main St, City, Country',
  hourly_rate: 100.00
};

// SQL to execute - this is the format that works with Supabase
const SQL = `
-- Create a new user in auth.users
DO $$
DECLARE
  new_user_id uuid;
  new_customer_id uuid;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = '${CUSTOMER.email}') THEN
    RAISE EXCEPTION 'User with email % already exists', '${CUSTOMER.email}';
  END IF;

  -- Create the user in auth.users
  INSERT INTO auth.users (
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    email_confirmed_at
  ) VALUES (
    '${CUSTOMER.email}',
    jsonb_build_object('first_name', '${CUSTOMER.first_name}', 'last_name', '${CUSTOMER.last_name}'),
    jsonb_build_object('provider', 'email'),
    now()
  )
  RETURNING id INTO new_user_id;

  -- Set the user's password
  UPDATE auth.users
  SET encrypted_password = crypt('${CUSTOMER.password}', gen_salt('bf'))
  WHERE id = new_user_id;

  -- Create customer record
  INSERT INTO customers (
    company_name,
    first_name,
    last_name,
    address,
    email,
    hourly_rate
  ) VALUES (
    '${CUSTOMER.company_name}',
    '${CUSTOMER.first_name}',
    '${CUSTOMER.last_name}',
    '${CUSTOMER.address}',
    '${CUSTOMER.email}',
    ${CUSTOMER.hourly_rate}
  )
  RETURNING id INTO new_customer_id;

  -- Assign customer role
  INSERT INTO user_roles (user_id, role)
  VALUES (new_user_id, 'customer');

  RAISE NOTICE 'Customer created successfully with ID: %', new_customer_id;
  RAISE NOTICE 'User created with ID: %', new_user_id;
  RAISE NOTICE 'Customer can login with email: % and password: %', '${CUSTOMER.email}', '${CUSTOMER.password}';
END $$;
`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(SQL);
